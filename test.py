import requests
import streamlit as st

st.title("Peter Petition Viewer (Streamlit)")

api_base = st.text_input("API base URL", value="http://127.0.0.1:8000")
st.markdown("Open the web input at: `" + api_base.rstrip("/") + "/`")

session_id = st.text_input("Session ID (from the web page)", value="")

col1, col2 = st.columns(2)
with col1:
    fetch_now = st.button("Fetch latest")
with col2:
    clear_box = st.button("Clear session id")

if clear_box:
    st.session_state["session_id"] = ""

if session_id and fetch_now:
    try:
        r = requests.get(f"{api_base.rstrip('/')}/api/petition/{session_id}", timeout=5)
        r.raise_for_status()
        payload = r.json()
        st.subheader("Captured petition (real text)")
        st.code(payload.get("text", ""), language="text")
        st.caption(f"Updated at: {payload.get('updated_at')}")
    except Exception:
        st.error("Could not fetch. Make sure the API server is running and the session id is correct.")