from requests import get as http_get
from methods import Methods
from os import getenv


class GetPayment:

    def __init__(self, field: str = None, data: str = None) -> None:
        self.field = field
        self.data = data

        self.url = "https://easydonate.ru/api/v3/shop/payments"
        self.headers = {
            "Shop-Key": getenv("SHOP_KEY")
        }

    def _response(self) -> dict or None:
        resp = http_get(self.url, headers=self.headers)
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
                    result.append(r)
        result.reverse()
        return result

    @property
    def sum_enrolled(self) -> dict:
        resp = self._response()
        array = [r for r in resp["response"] if r["status"] == 2]
        return {
            "sum": {
                "clear": Methods.truncate(sum([
                    r["enrolled"] for r in array]), 2),
                "all": Methods.truncate(sum([
                    r["cost"] for r in array]), 2)
            },
            "len": {
                "clear": len(array),
                "all": len(resp["response"])
            }
        }
