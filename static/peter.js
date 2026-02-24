(() => {
  const TARGET_TEXT = "Access Point: Alpha Omicron Sigma Xi Nu";
  const LOGIN_USER_ID = "osiris";
  const LOGIN_PASSWORD = "thothknowsall";

  const loginContainer = document.getElementById("loginContainer");
  const mainTerminal = document.getElementById("mainTerminal");
  const postLoginLoadingContainer = document.getElementById("postLoginLoadingContainer");
  const postLoginLoadingOutput = document.getElementById("postLoginLoadingOutput");
  const userIdInput = document.getElementById("userIdInput");
  const passwordRow = document.getElementById("passwordRow");
  const passwordInput = document.getElementById("passwordInput");
  const loginErrorRow = document.getElementById("loginErrorRow");
  const loginErrorText = document.getElementById("loginErrorText");

  const petitionInput = document.getElementById("petition");
  const questionInput = document.getElementById("question");
  const questionRow = document.getElementById("questionRow");
  const resultRow = document.getElementById("resultRow");
  const realPetitionEl = document.getElementById("realPetition");
  const newQueryRow = document.getElementById("newQueryRow");
  const newQueryInput = document.getElementById("newQueryInput");
  const loadingRow = document.getElementById("loadingRow");
  const loadingOutput = document.getElementById("loadingOutput");

  if (
    !loginContainer ||
    !mainTerminal ||
    !postLoginLoadingContainer ||
    !postLoginLoadingOutput ||
    !userIdInput ||
    !passwordRow ||
    !passwordInput ||
    !loginErrorRow ||
    !loginErrorText ||
    !petitionInput ||
    !questionInput ||
    !questionRow ||
    !resultRow ||
    !realPetitionEl ||
    !newQueryRow ||
    !newQueryInput ||
    !loadingRow ||
    !loadingOutput
  ) {
    return;
  }

  const LOADING_DURATION_MS = 9500;
  const LOADING_LINE_INTERVAL_MS = 180;

  const LOADING_PROCESS_MESSAGES = [
    "[*] Initializing secure tunnel...",
    "[*] Resolving host 10.0.2.xx:443...",
    "[*] Handshake with certificate authority...",
    "[*] Bypassing firewall rules...",
    "[*] Accessing primary database cluster...",
    "[*] Decrypting session token...",
    "[*] Querying index server...",
    "[*] Establishing SSH bridge...",
    "[*] Loading decryption keys from keychain...",
    "[*] Connecting to backup node 0x7f...",
    "[*] Parsing query syntax tree...",
    "[*] Allocating memory buffer 0x4000...",
    "[*] Spawning worker process...",
    "[*] Syncing with replication layer...",
    "[*] Verifying checksums...",
    "[*] Mounting virtual filesystem...",
    "[*] Reading config from /etc/secure.conf...",
    "[*] Authenticating via Kerberos...",
    "[*] Fetching schema version...",
    "[*] Compiling query plan...",
    "[*] Executing subquery 1/3...",
    "[*] Executing subquery 2/3...",
    "[*] Executing subquery 3/3...",
    "[*] Merging result sets...",
    "[*] Applying post-processing filters...",
    "[*] Writing to output buffer...",
    "[*] Flushing cache...",
    "[*] Closing connection pool...",
  ];

  const LOADING_ERROR_MESSAGES = [
    "[!] WARN: Checksum mismatch on block 0x4a - retrying...",
    "[!] ERROR: Connection timeout (attempt 2/5)",
    "[!] WARN: Deprecated API used in libssl - continuing...",
    "[!] ERROR: Certificate chain validation failed - using fallback...",
    "[!] WARN: High latency detected (342ms) - switching node...",
    "[!] ERROR: Database lock contention - waiting...",
    "[!] WARN: Memory pressure - releasing buffer...",
    "[!] ERROR: Checksum mismatch - recomputing...",
    "[!] WARN: Replica lag 0.2s - using primary...",
    "[!] ERROR: TLS renegotiation required...",
  ];

  const POST_LOGIN_DURATION_MS_MIN = 15000;
  const POST_LOGIN_DURATION_MS_MAX = 30000;
  const POST_LOGIN_LINE_INTERVAL_MS = 220;

  const POST_LOGIN_PROCESS_MESSAGES = [
    "[*] Validating credentials against auth server...",
    "[*] Establishing secure channel to primary database...",
    "[*] Resolving database endpoint db-secure-01.internal:5432...",
    "[*] Loading CA bundle for TLS...",
    "[*] Performing mutual TLS handshake...",
    "[*] Fetching user role and permissions...",
    "[*] Connecting to configuration store...",
    "[*] Loading connection pool (max 20)...",
    "[*] Pinging replica set members...",
    "[*] Waiting for quorum (2/3 nodes)...",
    "[*] Syncing session state with key server...",
    "[*] Acquiring read lease on schema cache...",
    "[*] Binding to secure port 8443...",
    "[*] Verifying server certificate chain...",
    "[*] Initializing encrypted session...",
    "[*] Loading access control list...",
    "[*] Checking IP allowlist...",
    "[*] Authenticating with directory service...",
    "[*] Fetching encryption keys from KMS...",
    "[*] Decrypting connection parameters...",
    "[*] Opening transaction log handle...",
    "[*] Registering heartbeat with cluster...",
    "[*] Allocating secure buffer pool...",
    "[*] Running post-auth hooks...",
    "[*] Setting session variables...",
    "[*] Preparing statement cache...",
    "[*] Connection established to primary.",
  ];

  const POST_LOGIN_ERROR_MESSAGES = [
    "[!] WARN: Auth server slow (1200ms) - retrying...",
    "[!] ERROR: Database unreachable - trying failover node...",
    "[!] WARN: Certificate expires in 30 days...",
    "[!] ERROR: Connection refused (attempt 3/6)...",
    "[!] WARN: Replica lag 1.2s - using stale read...",
    "[!] ERROR: KMS key not found - using cached key...",
    "[!] WARN: High memory usage - reducing pool size...",
    "[!] ERROR: TLS handshake timeout - reconnecting...",
    "[!] WARN: Quorum not reached - waiting 2s...",
    "[!] ERROR: Lease expired - re-acquiring...",
  ];

  let sessionId = localStorage.getItem("peter_session_id") || "";
  let realPetition = "";
  let petitionSegment = "";
  let petitionHasCurlyBrace = false;

  const ensureSession = async () => {
    if (sessionId) return;
    const res = await fetch("/api/new-session");
    if (!res.ok) throw new Error("Failed to create session");
    const json = await res.json();
    sessionId = json.session_id;
    localStorage.setItem("peter_session_id", sessionId);
  };

  let postTimer = null;
  const postRealPetition = () => {
    if (!sessionId) return;
    if (postTimer) clearTimeout(postTimer);
    postTimer = setTimeout(async () => {
      try {
        await fetch(`/api/petition/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: realPetition }),
        });
      } catch (e) {
        // ignore; terminal UI stays clean
      }
    }, 120);
  };

  const computeDisplayedPetition = () => {
    const firstDot = realPetition.indexOf(".");
    if (firstDot === -1) {
      // No trigger yet: show what the user actually typed.
      return realPetition;
    }

    // Look for a second '.' after the first one
    const secondDot = realPetition.indexOf(".", firstDot + 1);

    // Everything before the first '.' is shown as-typed
    const prefix = realPetition.slice(0, firstDot);

    if (secondDot === -1) {
      // Only one '.', so we are still in facade mode:
      // mask from the first '.' onward with the Peter text
      const maskedLen = Math.max(0, realPetition.length - firstDot);
      return prefix + TARGET_TEXT.slice(0, maskedLen);
    }

    // Two dots: from the first '.' THROUGH the second '.' we show the facade,
    // and after the second '.' we show the real text again.
    const facadeLen = Math.max(0, secondDot - firstDot + 1);
    const facadeSegment = TARGET_TEXT.slice(0, facadeLen);
    const suffix = realPetition.slice(secondDot + 1); // after the second '.'

    return prefix + facadeSegment + suffix;
  };

  const updateFacade = () => {
    const displayed = computeDisplayedPetition();
    petitionInput.value = displayed;
    // keep caret at end
    petitionInput.setSelectionRange(displayed.length, displayed.length);
  };

  // Capture keystrokes without ever showing them.
  petitionInput.addEventListener("beforeinput", (e) => {
    // Prevent the browser from applying the user's typed characters.
    // We'll update our realText and then replace the visible value.
    const inputType = e.inputType || "";

    if (inputType.startsWith("insert")) {
      // insertText, insertCompositionText, insertFromPaste, etc.
      // For paste, handle in 'paste' event for full clipboard text.
      if (inputType === "insertFromPaste") {
        e.preventDefault();
        return;
      }

      if (typeof e.data === "string" && e.data.length > 0) {
        realPetition += e.data;
      }
      e.preventDefault();
      updateFacade();
      postRealPetition();
      return;
    }

    if (inputType.startsWith("delete")) {
      // deleteContentBackward, deleteContentForward, deleteByCut, etc.
      if (realPetition.length > 0) {
        realPetition = realPetition.slice(0, -1);
      }
      e.preventDefault();
      updateFacade();
      postRealPetition();
      return;
    }
  });

  petitionInput.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text") || "";
    if (text) {
      realPetition += text;
      updateFacade();
      postRealPetition();
    }
    e.preventDefault();
  });

  petitionInput.addEventListener("cut", (e) => {
    // Treat cut as delete of selection; we only support deleting from end.
    if (realPetition.length > 0) {
      realPetition = realPetition.slice(0, -1);
      updateFacade();
      postRealPetition();
    }
    e.preventDefault();
  });

  const extractBetweenDots = () => {
    const firstDot = realPetition.indexOf(".");
    if (firstDot === -1) return "";
    const secondDot = realPetition.indexOf(".", firstDot + 1);
    if (secondDot === -1) {
      // If there's only one '.', keep everything after it.
      return realPetition.slice(firstDot + 1);
    }
    return realPetition.slice(firstDot + 1, secondDot);
  };

  const RESULT_ERROR_MESSAGES = [
    "ERROR: SERVER REJECTED QUERY",
    "ERROR: DATA ACCESS DENIED",
    "ERROR: UNAUTHORIZED OPERATION",
    "ERROR: QUERY TIMED OUT",
    "ERROR: UPSTREAM NODE FAILED",
    "ERROR: INVALID ACCESS TOKEN",
    "ERROR: SESSION KEY EXPIRED",
    "ERROR: RATE LIMIT EXCEEDED",
    "ERROR: MALFORMED QUERY PAYLOAD",
    "ERROR: CHECKSUM VERIFICATION FAILED",
    "ERROR: ENCRYPTION HANDSHAKE FAILED",
    "ERROR: DATABASE LOCKED BY ANOTHER SESSION",
    "ERROR: REPLICA OUT OF SYNC",
    "ERROR: PERMISSION LEVEL TOO LOW",
    "ERROR: RESOURCE NOT FOUND",
    "ERROR: INTERNAL PIPELINE FAILURE",
    "ERROR: FAILED TO COMPILE QUERY PLAN",
    "ERROR: INDEX CORRUPTED - READ ABORTED",
    "ERROR: FALLBACK NODE UNREACHABLE",
    "ERROR: SECURE CHANNEL NEGOTIATION FAILED",
    "ERROR: AUDIT POLICY BLOCKED REQUEST",
    "ERROR: SANDBOX VIOLATION DETECTED",
    "ERROR: OPERATION FLAGGED FOR REVIEW",
  ];

  const RESULT_WARNING_MESSAGES = [
    "CONNECTION TIMED OUT",
    "NETWORK UNREACHABLE",
    "REQUEST TIMED OUT",
    "HOST UNREACHABLE",
    "SOCKET CLOSED BY REMOTE",
    "DNS LOOKUP FAILED",
    "PROXY CONNECTION REFUSED",
    "TLS HANDSHAKE TIMED OUT",
    "PACKET LOSS EXCEEDED THRESHOLD",
    "ROUTE TO HOST FAILED",
    "CONNECTION RESET BY PEER",
    "GATEWAY TIMEOUT",
    "UPSTREAM CONNECTION FAILED",
    "LINK LOCAL ADDRESS EXPIRED",
    "NO ROUTE TO HOST",
    "BROKER DISCONNECTED",
    "STREAM READ TIMEOUT",
    "RELAY NODE OFFLINE",
    "TUNNEL CONNECTION DROPPED",
    "HEARTBEAT TIMEOUT",
    "SERVICE UNAVAILABLE - RETRY LATER",
    "CONNECTION POOL EXHAUSTED",
    "REMOTE HOST CLOSED CONNECTION",
    "LATENCY THRESHOLD EXCEEDED",
  ];

  const pickRandomStatusMessage = () => {
    const pools = [];
    if (RESULT_ERROR_MESSAGES.length) {
      pools.push({ arr: RESULT_ERROR_MESSAGES, isError: true, isWarning: false });
    }
    if (RESULT_WARNING_MESSAGES.length) {
      pools.push({ arr: RESULT_WARNING_MESSAGES, isError: false, isWarning: true });
    }
    if (!pools.length) {
      return { text: "ERROR: INTERNAL PIPELINE FAILURE", isError: true, isWarning: false };
    }
    const pool = pools[Math.floor(Math.random() * pools.length)];
    const idx = Math.floor(Math.random() * pool.arr.length);
    const text = pool.arr[idx] ?? pool.arr[0];
    return { text, isError: pool.isError, isWarning: pool.isWarning };
  };

  const showResult = (text, isError = false, isWarning = false) => {
    realPetitionEl.textContent = text;
    realPetitionEl.classList.remove("error", "warning");
    if (isError) {
      realPetitionEl.classList.add("error");
    } else if (isWarning) {
      realPetitionEl.classList.add("warning");
    }
    resultRow.classList.remove("hidden");
  };

  let loadingIntervalId = null;
  let loadingTimeoutId = null;
  let breachIntervalId = null;
  let breachTimeoutId = null;
  let breachBeepIntervalId = null;

  const playBreachBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const addLoadingLine = (text, isError = false, isSuccess = false) => {
    const line = document.createElement("div");
    line.className = "loading-line" + (isError ? " error" : "") + (isSuccess ? " success" : "");
    line.textContent = text;
    loadingOutput.appendChild(line);
    loadingOutput.scrollTop = loadingOutput.scrollHeight;
  };

  const addPostLoginLine = (text, isError = false, isSuccess = false) => {
    const line = document.createElement("div");
    line.className = "loading-line" + (isError ? " error" : "") + (isSuccess ? " success" : "");
    line.textContent = text;
    postLoginLoadingOutput.appendChild(line);
    postLoginLoadingOutput.scrollTop = postLoginLoadingOutput.scrollHeight;
  };

  let postLoginIntervalId = null;
  let postLoginTimeoutId = null;

  const runPostLoginLoading = (onComplete) => {
    postLoginLoadingOutput.innerHTML = "";
    postLoginLoadingContainer.classList.remove("hidden");

    const durationMs =
      POST_LOGIN_DURATION_MS_MIN +
      Math.floor(Math.random() * (POST_LOGIN_DURATION_MS_MAX - POST_LOGIN_DURATION_MS_MIN + 1));

    const processPool = [...POST_LOGIN_PROCESS_MESSAGES];
    const errorPool = [...POST_LOGIN_ERROR_MESSAGES];
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffle(processPool);
    shuffle(errorPool);

    let processIdx = 0;
    let errorIdx = 0;
    let successShown = false;
    const numTicks = Math.floor(durationMs / POST_LOGIN_LINE_INTERVAL_MS);
    const successAtTick = Math.max(1, numTicks - Math.floor(1500 / POST_LOGIN_LINE_INTERVAL_MS));

    const tick = () => {
      const lineCount = postLoginLoadingOutput.querySelectorAll(".loading-line").length;
      if (!successShown && lineCount >= successAtTick) {
        successShown = true;
        addPostLoginLine("Connection established.", false, true);
        if (postLoginIntervalId) clearInterval(postLoginIntervalId);
        postLoginIntervalId = null;
        return;
      }
      if (successShown) return;

      const useError = Math.random() < 0.18 && errorPool.length > 0;
      if (useError) {
        addPostLoginLine(errorPool[errorIdx % errorPool.length], true);
        errorIdx += 1;
      } else {
        addPostLoginLine(processPool[processIdx % processPool.length], false);
        processIdx += 1;
      }
    };

    postLoginIntervalId = setInterval(tick, POST_LOGIN_LINE_INTERVAL_MS);
    tick();

    postLoginTimeoutId = setTimeout(() => {
      if (postLoginIntervalId) clearInterval(postLoginIntervalId);
      postLoginIntervalId = null;
      if (!successShown) {
        addPostLoginLine("Connection established.", false, true);
      }
      postLoginLoadingContainer.classList.add("hidden");
      onComplete();
    }, durationMs);
  };

  const runBreachSequence = (abortOnEnd = false) => {
    // Simulate safety protocol breach; if abortOnEnd, show dire warning and do not reset.
    if (breachIntervalId) clearInterval(breachIntervalId);
    if (breachTimeoutId) clearTimeout(breachTimeoutId);
    document.body.classList.add("breach-mode");
    loadingOutput.innerHTML = "";
    loadingRow.classList.remove("hidden");

    playBreachBeep();
    breachBeepIntervalId = setInterval(playBreachBeep, 400);
    resultRow.classList.add("hidden");
    newQueryRow.classList.add("hidden");

    const BREACH_MESSAGES = [
      "[!] SAFETY PROTOCOL BREACH DETECTED",
      "[!] Unauthorized access pattern detected in access code.",
      "[!] Escalating incident to security daemon...",
      "[!] Injecting trap routines into execution pipeline...",
      "[!] Attempting to isolate hostile process...",
      "[!] Firewall rules being rewritten in real time...",
      "[!] Mirroring traffic to analysis node...",
      "[!] Suspicious payload detected in encrypted channel...",
      "[!] Forcing re-key of all active sessions...",
      "[!] Killing non-essential processes...",
      "[!] Revoking elevated privileges...",
      "[!] Rotating master encryption keys...",
      "[!] Rebuilding access control lists...",
      "[!] Purging transient caches...",
      "[!] Flushing authentication tokens...",
      "[!] Rolling back uncommitted changes...",
      "[!] Restoring baseline configuration...",
    ];

    let idx = 0;
    const addBreachLine = () => {
      const text =
        idx < BREACH_MESSAGES.length
          ? BREACH_MESSAGES[idx]
          : "[!] Monitoring for residual anomalies...";
      addLoadingLine(text, true, false);
      idx += 1;
    };

    addBreachLine();
    breachIntervalId = setInterval(addBreachLine, 350);

    breachTimeoutId = setTimeout(() => {
      if (breachIntervalId) clearInterval(breachIntervalId);
      breachIntervalId = null;
      if (breachBeepIntervalId) clearInterval(breachBeepIntervalId);
      breachBeepIntervalId = null;
      if (abortOnEnd) {
        const abortLine = document.createElement("div");
        abortLine.className = "loading-line error breach-abort";
        abortLine.textContent = "SECURITY BREACHED: PROGRAM ABORTED.";
        loadingOutput.appendChild(abortLine);
        loadingOutput.scrollTop = loadingOutput.scrollHeight;
        document.body.classList.remove("breach-mode");
        loadingOutput.scrollTop = loadingOutput.scrollHeight;
      } else {
        addLoadingLine("[*] Security baseline restored.", false, true);
        setTimeout(() => {
          document.body.classList.remove("breach-mode");
          loadingRow.classList.add("hidden");
          reset();
        }, 1000);
      }
    }, 10000);
  };

  const runLoadingAnimation = (onComplete) => {
    loadingOutput.innerHTML = "";
    loadingRow.classList.remove("hidden");
    questionInput.disabled = true;

    const processPool = [...LOADING_PROCESS_MESSAGES];
    const errorPool = [...LOADING_ERROR_MESSAGES];
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffle(processPool);
    shuffle(errorPool);

    let processIdx = 0;
    let errorIdx = 0;
    let successShown = false;
    const numTicks = Math.floor(LOADING_DURATION_MS / LOADING_LINE_INTERVAL_MS);
    const successAtTick = Math.max(1, numTicks - Math.floor(1000 / LOADING_LINE_INTERVAL_MS));

    const tick = () => {
      const lineCount = loadingOutput.querySelectorAll(".loading-line").length;
      if (!successShown && lineCount >= successAtTick) {
        successShown = true;
        addLoadingLine("Success", false, true);
        if (loadingIntervalId) clearInterval(loadingIntervalId);
        loadingIntervalId = null;
        return;
      }
      if (successShown) return;

      const useError = Math.random() < 0.22 && errorPool.length > 0;
      if (useError) {
        addLoadingLine(errorPool[errorIdx % errorPool.length], true);
        errorIdx += 1;
      } else {
        addLoadingLine(processPool[processIdx % processPool.length], false);
        processIdx += 1;
      }
    };

    loadingIntervalId = setInterval(tick, LOADING_LINE_INTERVAL_MS);
    tick();

    loadingTimeoutId = setTimeout(() => {
      if (loadingIntervalId) clearInterval(loadingIntervalId);
      loadingIntervalId = null;
      if (!successShown) {
        addLoadingLine("Success", false, true);
      }
      loadingRow.classList.add("hidden");
      questionInput.disabled = false;
      onComplete();
    }, LOADING_DURATION_MS);
  };

  const submit = async () => {
    await ensureSession();
    const question = questionInput.value || "";
    // Prefer the extracted facade segment; if none, fall back to the full raw petition
    const petitionForSubmit = petitionSegment || realPetition;

    if (!petitionForSubmit) {
      const { text, isError, isWarning } = pickRandomStatusMessage();
      showResult(text, isError, isWarning);
      newQueryRow.classList.remove("hidden");
      newQueryInput.value = "";
      newQueryInput.focus();
      return;
    }

    try {
      const res = await fetch(`/api/submit/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petition: petitionForSubmit, question }),
      });
      if (!res.ok) throw new Error("Submit failed");
      showResult(petitionForSubmit);
      questionInput.disabled = true;
      newQueryRow.classList.remove("hidden");
      newQueryInput.disabled = false;
      newQueryInput.value = "";
      newQueryInput.focus();
    } catch (e) {
      const { text, isError, isWarning } = pickRandomStatusMessage();
      showResult(text, isError, isWarning);
      newQueryRow.classList.remove("hidden");
      newQueryInput.value = "";
      newQueryInput.focus();
    }
  };

  const reset = () => {
    if (loadingIntervalId) clearInterval(loadingIntervalId);
    loadingIntervalId = null;
    if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
    if (breachIntervalId) clearInterval(breachIntervalId);
    breachIntervalId = null;
    if (breachTimeoutId) clearTimeout(breachTimeoutId);
    breachTimeoutId = null;
    if (breachBeepIntervalId) clearInterval(breachBeepIntervalId);
    breachBeepIntervalId = null;
    realPetition = "";
    petitionSegment = "";
    petitionHasCurlyBrace = false;
    petitionInput.value = "";
    petitionInput.disabled = false;
    questionInput.value = "";
    questionInput.disabled = false;
    newQueryInput.value = "";
    newQueryInput.disabled = false;
    questionRow.classList.add("hidden");
    resultRow.classList.add("hidden");
    loadingRow.classList.add("hidden");
    newQueryRow.classList.add("hidden");
    realPetitionEl.textContent = "";
    realPetitionEl.classList.remove("error", "warning");
    petitionInput.focus();
  };

  newQueryInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const answer = newQueryInput.value.trim().toLowerCase();
    if (answer === "yes") {
      reset();
    } else {
      newQueryInput.disabled = true;
    }
  });

  // Petition: Enter moves to Question (validation happens after loading).
  petitionInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    petitionSegment = extractBetweenDots();
    petitionHasCurlyBrace = !!petitionSegment && (petitionSegment.includes("{") || petitionSegment.includes("}"));
    petitionInput.disabled = true;
    questionRow.classList.remove("hidden");
    questionInput.focus();
  });

  // Question: Enter shows loading animation, then submits
  questionInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    runLoadingAnimation(() => {
      if (petitionHasCurlyBrace) {
        runBreachSequence(petitionSegment.includes("}"));
      } else {
        submit();
      }
    });
  });

  const showLoginError = (msg) => {
    loginErrorText.textContent = msg;
    loginErrorRow.classList.remove("hidden");
  };

  const hideLoginError = () => {
    loginErrorRow.classList.add("hidden");
    loginErrorText.textContent = "";
  };

  userIdInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = userIdInput.value.trim().toLowerCase();
    if (value !== LOGIN_USER_ID) {
      showLoginError("Invalid User ID");
      userIdInput.value = "";
      userIdInput.focus();
      return;
    }
    hideLoginError();
    passwordRow.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
  });

  passwordInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = passwordInput.value;
    if (value !== LOGIN_PASSWORD) {
      showLoginError("Invalid password");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }
    loginContainer.classList.add("hidden");
    runPostLoginLoading(() => {
      postLoginLoadingContainer.classList.add("hidden");
      mainTerminal.classList.remove("hidden");
      initMainTerminal();
    });
  });

  const initMainTerminal = () => {
    questionRow.classList.add("hidden");
    resultRow.classList.add("hidden");
    loadingRow.classList.add("hidden");
    newQueryRow.classList.add("hidden");
    ensureSession().catch(() => {});
    petitionInput.focus();
  };

  // Start with login visible, main terminal hidden
  mainTerminal.classList.add("hidden");
  userIdInput.focus();
})();
