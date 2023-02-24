import requests_cache
import logging
from requests_cache import RedisCache

from datetime import timedelta

from os import getenv


class Currency:

    def __init__(self, c_sum: int = 0, c_from: str = "RUB", c_to: str = "EUR") -> None:
        self.cache_storage = RedisCache(host='127.0.0.1', port=6379)
        self.session = requests_cache.CachedSession(
            'easydonate_cache', allowable_codes=[200],
            expire_after=timedelta(seconds=120), backend=self.cache_storage
            if getenv("FLASK_ENV") != "development" else "memory"
        )

        self.url = "https://api.exchangerate.host/convert"
        self.params = {
            "from": c_from, "to": c_to
        }

        self.c_sum = c_sum

    @property
    def _response(self) -> float or None:
        resp = self.session.get(self.url, params=self.params)
        json = resp.json() \
            if resp.status_code >= 200 < 400 and len(resp.text) \
            else None
        return json["result"] if (json and json["success"]) else None

    @property
    def get(self) -> float:
        try:
            return self.c_sum * self._response
        except Exception as e:
            logging.warning(e)
            return 0.0
