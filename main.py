import requests

url = "https://api.coingecko.com/api/v3/simple/price"
params = {"ids": "bitcoin", "vs_currencies": "cad"}

r = requests.get(url, params=params, timeout=10)
r.raise_for_status()
data = r.json()

print(data["bitcoin"]["cad"])