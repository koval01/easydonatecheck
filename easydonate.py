from os import getenv

import requests_cache
from requests_cache import RedisCache

from methods import Methods

from datetime import datetime, timedelta

from os import getenv


class GetPayment:

    def __init__(self, method: str = "payments", field: str = None, data: str = None) -> None:
        self.field = field
        self.data = data

        self.cache_storage = RedisCache(host='127.0.0.1', port=6379)
        self.session = requests_cache.CachedSession(
            'easydonate_cache', allowable_codes=[200],
            expire_after=timedelta(seconds=90), backend=self.cache_storage
            if getenv("FLASK_ENV") != "development" else "memory"
        )

        self.url = f"https://easydonate.ru/api/v3/shop/{method}"
        self.headers = {
            "Shop-Key": getenv("SHOP_KEY")
        }

    def _response(self) -> dict or None:
        resp = self.session.get(self.url, headers=self.headers)
        return resp.json() \
            if resp.status_code >= 200 < 400 and len(resp.text) \
            else None

    @property
    def results(self) -> list:
        resp = self._response()
        result = []
        if not resp:
            return []
        for r in resp["response"]:
            if r[self.field]:
                if self.data.lower() \
                        in str(r[self.field]).lower():
                    r["enrolled"] = 0 if r["status"] != 2 else r["enrolled"]
                    result.append(r)
        result.reverse()
        return result

    @property
    def raw(self) -> list or dict:
        return self._response()

    @property
    def coupons(self) -> list:
        resp = self._response()
        if not resp:
            return []

        return [{
            "code": c["code"],
            "created_at": c["created_at"],
            "expires_at": c["expires_at"],
            "limit": c["limit"],
            "sale": c["sale"],
            "products": [{
                    "name": p["name"],
                    "price": p["price"]
                } for p in resp["response"]["products"]
            ]
        } for c in resp["response"]]

    def sum_enrolled(self, interval: int) -> dict:
        resp = self._response()

        date_now = datetime.now()
        filter_date = lambda d, e: True \
            if (date_now - datetime.strptime(e["created_at"], "%Y-%m-%d %H:%M:%S")) \
                   .days <= d or d < 0 \
            else False

        resp["response"] = [e for e in resp["response"] if filter_date(interval, e)]

        array = [r for r in resp["response"] if r["status"] == 2]
        enrolled_list = [e["enrolled"] for e in array]
        array = [e for e in array if filter_date(interval, e)]

        return {
            "sum": {
                "clear": Methods.truncate(sum([
                    r["enrolled"] for r in array]), 2),
                "all": Methods.truncate(sum([
                    r["cost"] for r in array]), 2)
            },
            "average": Methods.truncate(sum(enrolled_list) / len(array), 2),
            "last_enrolled": Methods.truncate(array[-1:][0]["enrolled"], 2),
            "len": {
                "clear": len(array),
                "all": len(resp["response"])
            }
        }
