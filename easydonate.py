from requests import get as http_get
from os import getenv


class GetPayment:

    def __init__(self, field: str, data: str) -> None:
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
            if r[self.field] == self.data:
                result.append(r)
        return result
