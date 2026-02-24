import streamlit as st

from main import fetch_bitcoin_prices


st.title("Bitcoin Price Viewer")

coin_id = st.text_input("Coin ID (CoinGecko ID)", value="bitcoin")
vs_currencies_input = st.text_input(
    "Currencies (comma-separated, e.g. usd,cad,zar)", value="usd,cad,zar"
)

if st.button("Run"):
    try:
        prices = fetch_bitcoin_prices(coin_id.strip(), vs_currencies_input.strip())

        if not prices:
            st.warning("No price data returned. Check the coin ID and currencies.")
        else:
            st.subheader("Results")
            for currency, value in prices.items():
                prefix = ""
                if currency.lower() == "usd":
                    prefix = "USD $"
                elif currency.lower() == "cad":
                    prefix = "CAD $"
                elif currency.lower() == "zar":
                    prefix = "ZAR R"
                else:
                    prefix = currency.upper()

                st.write(f"{prefix} {value}")
    except Exception as e:
        st.error(f"Something went wrong while fetching prices: {e}")

