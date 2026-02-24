Peter Answers Terminal Emulator
================================

This project is a **local, single‑user clone of the old “Peter Answers” petition prank**, presented as a Windows‑style terminal emulator.

From the user’s point of view:

- They see a **login prompt**, then an **Access code** and **Query** prompt in a fake CMD window.
- As they type, the Access code field shows a **fake “Access Point: Alpha Omicron Sigma Xi Nu”** string, while secretly capturing what they really type.
- After they submit, dramatic **loading sequences** and **“breach” animations** play, and finally an answer / error appears.

Under the hood, you control exactly what is captured and how it is displayed.

---

How the project is structured
-----------------------------

Top‑level files:

- `peter_server.py`  
  FastAPI backend that:
  - Serves the static HTML/CSS/JS for the terminal UI.
  - Exposes a small JSON API to:
    - Create sessions (`/api/new-session`).
    - Continuously store the petition text as the user types (`/api/petition/{session_id}`).
    - Store the final petition + query when the user “submits” (`/api/submit/{session_id}`).

- `static/peter.html`  
  The **HTML shell** for the fake Windows CMD interface:
  - Login prompts (User ID + password).
  - Post‑login “connecting to secure database” loading view.
  - Main terminal lines: `Access code:`, `Query:`, the multi‑line loading area, `Result:`, and `Submit new Query (yes/no):`.

- `static/peter.css`  
  All styling:
  - Black‑background **Windows cmd‑like look** (Consolas, `C:\>` prompt).
  - Layout of each terminal “line”.
  - Colors for:
    - Normal output (gray),
    - Red errors,
    - Orange connection warnings,
    - Green success,
    - Flashing red background during “breach” sequences.

- `static/peter.js`  
  The main **client‑side logic**, including:
  - Login flow (`osiris` / `thothknowsall`).
  - Post‑login database‑style loading animation.
  - Access code facade logic (shows `Access Point: Alpha Omicron Sigma Xi Nu` while capturing real text).
  - Two‑stage input (Access code → Query → loading).
  - Randomized error / warning messages in the `Result` line.
  - Safety breach sequences:
    - If the hidden access code segment contains `{`, run a breach animation, then “restore” and reset.
    - If it contains `}`, run a breach animation that ends with `SECURITY BREACHED: PROGRAM ABORTED.` and does **not** reset.
  - Reset flow when the user answers `yes` to “Submit new Query (yes/no)”.

- `test.py`  
  A small **Streamlit viewer** that can be used to inspect what the user really typed:
  - You enter the API base URL and a session id.
  - It fetches `/api/petition/{session_id}` and shows the captured petition text and timestamp.

- `requirements.txt`  
  Minimal dependency list for the project:

  ```text
  fastapi
  uvicorn
  streamlit
  requests
  ```

---

How to run it locally
---------------------

### 1. Create and activate a virtual environment (optional but recommended)

From the project root:

```powershell
cd C:\Users\camer\Documents\dev\backend

python -m venv venv
.\venv\Scripts\Activate.ps1
```

If you already have `testVenv` or another venv set up, just activate that instead.

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Start the FastAPI backend (terminal UI + API)

```powershell
uvicorn peter_server:app --host 127.0.0.1 --port 8000 --reload
```

Then open in your browser:

```text
http://127.0.0.1:8000/
```

You should see the fake Windows CMD interface.

### 4. (Optional) Start the Streamlit viewer

In a second terminal (with the same venv activated):

```powershell
streamlit run test.py --server.port 8501
```

Open:

```text
http://localhost:8501
```

Use this to inspect the **real petition text** for a given session id (copied from the browser’s localStorage or from logs).

---

How the terminal UI works
-------------------------

### Login phase

1. User sees:
   - `C:\> User ID:`
   - Then `C:\> Password:` (after a correct user id).
2. Required credentials (hard‑coded):
   - **User ID**: `osiris` (case‑insensitive).
   - **Password**: `thothknowsall` (case‑sensitive).
3. Wrong values show a red error and let the user try again.
4. On success, the login panel hides and a **15–30s “connecting to secure database”** animation plays:
   - Multiple gray “process” lines.
   - Occasional red warning/error lines.
   - Ends with a green `Connection established.` message.

### Access code and facade

Once login + post‑login loading complete, the main terminal appears:

- `C:\> Access code:`  
  - The user **types whatever they want**, but the field **visually shows**:

    ```text
    Access Point: Alpha Omicron Sigma Xi Nu
    ```

    character by character between two dots that the user enters.
  - Behind the scenes, the script:
    - Keeps the true string the user typed in `realPetition`.
    - Extracts the **segment between the first and second `.`** as the final petition value.

- `C:\> Query:`  
  - The visible question the user wants answered.

### Query submission & loading

After the user enters both Access code and Query and presses Enter on Query:

1. A **multi‑line loading animation** appears:
   - e.g. `[*] Initializing secure tunnel...`, `[*] Decrypting session token...`
   - Occasional red “ERROR” lines, orange connection warnings.
2. After ~9.5 seconds, the loading area hides and the **Result** line is populated.

### Result handling and breach rules

The final petition segment (between dots) and the query drive three behaviors:

1. **Normal result**  
   - If there is a non‑empty facade segment and no special characters:
     - The extracted petition segment is sent to the backend.
     - The `Result:` line shows that text in gray.

2. **Randomized error / warning**  
   - If no valid facade segment or the backend call fails:
     - A random **red** `ERROR: ...` or **orange** connection error (`CONNECTION TIMED OUT`, etc.) is chosen from a pool.
     - That message is shown in the `Result:` line.

3. **Safety breach sequences**
   - If the extracted facade segment contains **`{`**:
     - After the normal loading animation, a **10s “breach” sequence** plays:
       - Background flashes dark red.
       - Red breach lines stream: “SAFETY PROTOCOL BREACH DETECTED”, “Rotating master encryption keys...”, etc.
       - Short, repeating beeps play in sync with the flash.
     - Ends with `[*] Security baseline restored.` in green.
     - The app **resets** back to a fresh Access code prompt.

   - If the extracted facade segment contains **`}`**:
     - The same breach animation plays for ~10s.
     - Instead of restoring, it ends with a bold red:

       ```text
       SECURITY BREACHED: PROGRAM ABORTED.
       ```

     - No reset occurs; the screen stays in the “aborted” state.

### Starting a new query

After a normal run (no abort):

- The terminal asks:

  ```text
  C:\> Submit new Query (yes/no):
  ```

- If the user types `yes` + Enter:
  - All internal state is cleared.
  - A new Access code line is shown.
- If the user types anything else:
  - The prompt is disabled and the current state is left visible.

---

Notes and extensions
--------------------

- This project is intentionally **local and for fun**. If you ever expose it publicly:
  - Wrap it behind proper auth.
  - Swap the in‑memory `_SESSIONS` store for a real database.
  - Remove or gate the “breach” sequences.
- The logic in `static/peter.js` is heavily commented by sections; treat it as the main place to tweak behavior:
  - Change credentials.
  - Adjust timings.
  - Swap out messages / animations.

