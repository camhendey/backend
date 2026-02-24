import requests


def fetch_bitcoin_prices(coin_id: str = "bitcoin", vs_currencies: str = "usd,cad,zar") -> dict:
    """
    Fetch price data for a given coin and comma-separated list of vs_currencies
    from the CoinGecko simple price API.
    """
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": coin_id, "vs_currencies": vs_currencies}

    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    return data.get(coin_id, {})


if __name__ == "__main__":
    prices = fetch_bitcoin_prices()
    print(f"USD $ {prices.get('usd')}")
    print(f"CAD $ {prices.get('cad')}")
    print(f"ZAR R {prices.get('zar')}")