(() => {
  "use strict";

  const DATA_URL = "./circle-memory-pairs.json";

  let gameData = null;
  let currentLevelIndex = 0;
  let deck = [];
  let flipped = [];
  let lockBoard = false;
  let matchedPairs = 0;
  let attempts = 0;
  let wrongMatches = 0;
  let startedAt = null;
  let timerId = null;
  let memoryFeedbackSummary = [];

  const state = {
    overlay: null,
    levelsBox: null,
    grid: null,
    message: null,
    levelDesc: null,
    statLevel: null,
    statPairs: null,
    statAttempts: null,
    statTime: null,
    endBox: null
  };

  document.addEventListener("DOMContentLoaded", initMemoryGame);

  async function initMemoryGame() {
    injectOpenButtonIfNeeded();
    injectGamePanel();
    bindOpenButtons();

    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("تعذر تحميل ملف بيانات اللعبة.");
      gameData = await res.json();

      prepareMixedChallengeLevel();
      buildLevelButtons();
      selectLevel(0);
    } catch (err) {
      console.error(err);
      showMessage("تعذر تحميل بيانات لعبة الذاكرة. تأكد من وجود ملف circle-memory-pairs.json في مجلد circle-lab.", "info");
    }
  }

  function injectOpenButtonIfNeeded() {
    if (document.getElementById("btnOpenMemoryGame")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnOpenMemoryGame";
    btn.className = "memory-floating-btn";
    btn.textContent = "🧠 لعبة الذاكرة";
    document.body.appendChild(btn);
  }

  function injectGamePanel() {
    if (document.getElementById("circleMemoryGameOverlay")) return;

    const overlay = document.createElement("section");
    overlay.id = "circleMemoryGameOverlay";
    overlay.className = "memory-game-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="memory-game-panel" role="dialog" aria-modal="true" aria-labelledby="memoryGameTitle">
        <header class="memory-game-header">
          <div class="memory-game-title-row">
            <h2 id="memoryGameTitle" class="memory-game-title">لعبة ذاكرة عناصر الدائرة</h2>
            <button type="button" class="memory-close-btn" id="memoryCloseBtn" aria-label="إغلاق">×</button>
          </div>
          <p class="memory-game-subtitle">
            اقلب بطاقتين في كل مرة، وحاول مطابقة عنصر الدائرة مع تعريفه أو خاصيته أو شكله.
          </p>
        </header>

        <div class="memory-game-body">
          <div class="memory-levels" id="memoryLevels"></div>

          <div class="memory-status">
            <div class="memory-stat">
              <span>المستوى</span>
              <strong id="memoryStatLevel">-</strong>
            </div>
            <div class="memory-stat">
              <span>الأزواج</span>
              <strong id="memoryStatPairs">0 / 0</strong>
            </div>
            <div class="memory-stat">
              <span>المحاولات</span>
              <strong id="memoryStatAttempts">0</strong>
            </div>
            <div class="memory-stat">
              <span>الوقت</span>
              <strong id="memoryStatTime">00:00</strong>
            </div>
          </div>

          <div class="memory-actions">
            <button type="button" class="memory-action-btn" id="memoryRestartBtn">إعادة المستوى</button>
            <button type="button" class="memory-action-btn secondary" id="memoryNextBtn">المستوى التالي</button>
            <button type="button" class="memory-action-btn secondary" id="memoryBackBtn">العودة إلى المختبر</button>
          </div>

          <div id="memoryLevelDesc" class="memory-message info">اختر مستوى ثم ابدأ المطابقة.</div>
          <div id="memoryMessage" class="memory-message info">ابدأ بقلب بطاقتين.</div>

          <div id="memoryGrid" class="memory-grid"></div>

          <div id="memoryEndBox" class="memory-end-box"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    state.overlay = overlay;
    state.levelsBox = document.getElementById("memoryLevels");
    state.grid = document.getElementById("memoryGrid");
    state.message = document.getElementById("memoryMessage");
    state.levelDesc = document.getElementById("memoryLevelDesc");
    state.statLevel = document.getElementById("memoryStatLevel");
    state.statPairs = document.getElementById("memoryStatPairs");
    state.statAttempts = document.getElementById("memoryStatAttempts");
    state.statTime = document.getElementById("memoryStatTime");
    state.endBox = document.getElementById("memoryEndBox");

    document.getElementById("memoryCloseBtn").addEventListener("click", closeGame);
    document.getElementById("memoryBackBtn").addEventListener("click", closeGame);
    document.getElementById("memoryRestartBtn").addEventListener("click", () => selectLevel(currentLevelIndex));
    document.getElementById("memoryNextBtn").addEventListener("click", goNextLevel);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeGame();
    });
  }

  function bindOpenButtons() {
    document.querySelectorAll("#btnOpenMemoryGame, [data-open-memory-game]").forEach((btn) => {
      btn.addEventListener("click", openGame);
    });
  }

  function openGame() {
    state.overlay.classList.add("is-open");
    state.overlay.setAttribute("aria-hidden", "false");

    if (typeof addLabEvent === "function") {
      addLabEvent("memory_game_opened", "memory", "فتح الطالب لعبة الذاكرة");
    }

    if (gameData) selectLevel(currentLevelIndex);
  }

  function closeGame() {
    state.overlay.classList.remove("is-open");
    state.overlay.setAttribute("aria-hidden", "true");
  }

  function buildLevelButtons() {
    state.levelsBox.innerHTML = "";

    gameData.levels.forEach((level, index) => {
      if (!Array.isArray(level.pairs) || !level.pairs.length) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-level-btn";
      btn.textContent = getText(level.title, `المستوى ${index + 1}`);
      btn.addEventListener("click", () => selectLevel(index));
      state.levelsBox.appendChild(btn);
    });
  }

  function selectLevel(index) {
    if (!gameData || !gameData.levels[index]) return;

    currentLevelIndex = index;
    const level = gameData.levels[currentLevelIndex];

    if (!Array.isArray(level.pairs) || !level.pairs.length) {
      showMessage("هذا المستوى لا يحتوي على أزواج جاهزة بعد.", "info");
      return;
    }

    document.querySelectorAll(".memory-level-btn").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === currentLevelIndex);
    });

    attempts = 0;
    wrongMatches = 0;
    matchedPairs = 0;
    flipped = [];
    lockBoard = false;
    startedAt = new Date();
    memoryFeedbackSummary = [];

    state.endBox.classList.remove("is-visible");
    state.endBox.innerHTML = "";

    state.statLevel.textContent = getText(level.title, `المستوى ${index + 1}`);
    state.levelDesc.textContent = getText(level.description, "طابق البطاقات الصحيحة.");
    showMessage("ابدأ بقلب بطاقتين.", "info");

    buildDeck(level);
    renderCards();
    updateStats();
    startTimer();

    if (typeof addLabEvent === "function") {
      addLabEvent("memory_level_started", "memory", `بدأ مستوى الذاكرة: ${getText(level.title, "")}`, {
        levelId: level.levelId || "",
        pairsCount: level.pairs.length
      });
    }
  }

  function buildDeck(level) {
    deck = [];

    level.pairs.forEach((pair) => {
      const conceptId = pair.conceptId || pair.concept || pair.pairId;

      deck.push({
        uid: `${pair.pairId}_a`,
        pairId: pair.pairId,
        conceptId,
        content: pair.cardA,
        correctFeedback: getText(pair.feedback && pair.feedback.correct, pair.correctFeedback || "أحسنت! مطابقة صحيحة."),
        wrongHint: getText(pair.feedback && pair.feedback.wrongHint, pair.wrongHint || "حاول مرة أخرى."),
        matched: false
      });

      deck.push({
        uid: `${pair.pairId}_b`,
        pairId: pair.pairId,
        conceptId,
        content: pair.cardB,
        correctFeedback: getText(pair.feedback && pair.feedback.correct, pair.correctFeedback || "أحسنت! مطابقة صحيحة."),
        wrongHint: getText(pair.feedback && pair.feedback.wrongHint, pair.wrongHint || "حاول مرة أخرى."),
        matched: false
      });
    });

    if (!gameData.settings || gameData.settings.shuffleCards !== false) {
      shuffle(deck);
    }
  }

  function renderCards() {
    state.grid.innerHTML = "";

    deck.forEach((card) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.dataset.uid = card.uid;
      btn.dataset.pairId = card.pairId;

      btn.innerHTML = `
        <span class="memory-card-inner">
          <span class="memory-card-face memory-card-back">${escapeHTML(getCardBackText())}</span>
          <span class="memory-card-face memory-card-front">${renderCardContent(card.content, card.conceptId)}</span>
        </span>
      `;

      btn.addEventListener("click", () => onCardClick(card.uid));
      state.grid.appendChild(btn);
    });
  }

  function onCardClick(uid) {
    if (lockBoard) return;

    const card = deck.find((item) => item.uid === uid);
    if (!card || card.matched) return;
    if (flipped.some((item) => item.uid === uid)) return;

    flipped.push(card);
    setCardFlipped(uid, true);

    if (flipped.length === 2) {
      attempts++;
      updateStats();
      checkMatch();
    }
  }

  function checkMatch() {
    const [first, second] = flipped;

    if (first.pairId === second.pairId) {
      first.matched = true;
      second.matched = true;
      matchedPairs++;

      setCardMatched(first.uid);
      setCardMatched(second.uid);

      showMessage(first.correctFeedback || "أحسنت! مطابقة صحيحة.", "success");
      playSound("successSound");
      addMemoryFeedback(first.correctFeedback || "مطابقة صحيحة.");

      flipped = [];
      updateStats();

      if (matchedPairs === deck.length / 2) {
        finishLevel();
      }

      return;
    }

    wrongMatches++;
    lockBoard = true;
 

    const hint = first.wrongHint || second.wrongHint || "حاول مرة أخرى، وابحث عن العلاقة الصحيحة.";
    showMessage(hint, "info");
    addMemoryFeedback(hint);

    setTimeout(() => {
      setCardFlipped(first.uid, false);
      setCardFlipped(second.uid, false);
      flipped = [];
      lockBoard = false;
      updateStats();
    }, getFlipDelay());
  }

  function setCardFlipped(uid, isFlipped) {
    const el = document.querySelector(`.memory-card[data-uid="${uid}"]`);
    if (el) el.classList.toggle("is-flipped", isFlipped);
  }

  function setCardMatched(uid) {
    const el = document.querySelector(`.memory-card[data-uid="${uid}"]`);
    if (el) {
      el.classList.add("is-matched");
      el.disabled = true;
    }
  }

  function finishLevel() {
    stopTimer();

    const seconds = getElapsedSeconds();
    const totalPairs = deck.length / 2;
    const accuracy = attempts ? Math.round((totalPairs / attempts) * 100) : 100;

    let message = "إتقان جيد";
    if (accuracy >= 85) message = "إتقان عالٍ";
    else if (accuracy < 60) message = "يحتاج تدريبًا إضافيًا";

    const level = gameData.levels[currentLevelIndex];

    state.endBox.innerHTML = `
      <h3>🎉 أحسنت! أنهيت المستوى</h3>
      <p><strong>المستوى:</strong> ${escapeHTML(getText(level.title, ""))}</p>
      <p><strong>عدد المحاولات:</strong> ${attempts}</p>
      <p><strong>الأخطاء:</strong> ${wrongMatches}</p>
      <p><strong>الوقت:</strong> ${formatTime(seconds)}</p>
      <p><strong>التقدير:</strong> ${escapeHTML(message)}</p>
    `;

    state.endBox.classList.add("is-visible");
    showMessage("أنهيت المستوى بنجاح. يمكنك إعادة المستوى أو الانتقال للمستوى التالي.", "success");

    const result = {
      levelId: level.levelId || "",
      levelTitle: getText(level.title, ""),
      attempts,
      wrongMatches,
      totalPairs,
      matchedPairs,
      timeSpentSeconds: seconds,
      accuracyPercent: accuracy,
      completed: true,
      feedbackSummary: memoryFeedbackSummary
    };

    saveMemoryResult(result);

    if (typeof window.recordMemoryGameResult === "function") {
      window.recordMemoryGameResult(result);
    }

    if (typeof addLabEvent === "function") {
      addLabEvent("memory_level_completed", "memory", `أنهى الطالب مستوى الذاكرة: ${result.levelTitle}`, result);
    }
  }

  function goNextLevel() {
    if (!gameData) return;

    let next = currentLevelIndex + 1;

    while (next < gameData.levels.length) {
      if (Array.isArray(gameData.levels[next].pairs) && gameData.levels[next].pairs.length) {
        selectLevel(next);
        return;
      }
      next++;
    }

    selectLevel(0);
  }

  function updateStats() {
    const totalPairs = deck.length / 2;
    state.statPairs.textContent = `${matchedPairs} / ${totalPairs}`;
    state.statAttempts.textContent = attempts;
    state.statTime.textContent = formatTime(getElapsedSeconds());
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(updateStats, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function getElapsedSeconds() {
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((new Date() - startedAt) / 1000));
  }

  function showMessage(text, type = "info") {
    if (!state.message) return;
    state.message.textContent = text;
    state.message.className = `memory-message ${type}`;
  }

  function renderCardContent(content, conceptId) {
    if (!content) return "";

    if (content.type === "text") {
      return `<span>${escapeHTML(getText(content.text, content.value || ""))}</span>`;
    }

    if (content.type === "image") {
      return renderCircleVisual(conceptId);
    }

    if (content.type === "visual") {
      return renderCircleVisual(content.value || conceptId);
    }

    return `<span>${escapeHTML(getText(content.text, content.value || ""))}</span>`;
  }

  function renderCircleVisual(conceptId) {
    const key = normalizeConceptKey(conceptId);

    const commonStart = `
      <svg viewBox="0 0 160 120" role="img" aria-label="رسم عنصر من الدائرة">
        <circle cx="80" cy="60" r="42" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
        <circle cx="80" cy="60" r="3.8" fill="#ef4444"/>
    `;

    const commonEnd = `</svg>`;

    if (key.includes("center")) {
      return `${commonStart}
        <circle cx="80" cy="60" r="7" fill="#ef4444"/>
        <text x="80" y="48" text-anchor="middle" font-size="15" font-weight="800" fill="#ef4444">م</text>
      ${commonEnd}`;
    }

    if (key.includes("radius") && !key.includes("diameter")) {
      return `${commonStart}
        <line x1="80" y1="60" x2="122" y2="60" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
        <circle cx="122" cy="60" r="4" fill="#2563eb"/>
        <text x="103" y="52" text-anchor="middle" font-size="14" font-weight="800" fill="#2563eb">نق</text>
      ${commonEnd}`;
    }

    if (key.includes("diameter")) {
      return `${commonStart}
        <line x1="38" y1="60" x2="122" y2="60" stroke="#7c3aed" stroke-width="5" stroke-linecap="round"/>
        <circle cx="38" cy="60" r="4" fill="#7c3aed"/>
        <circle cx="122" cy="60" r="4" fill="#7c3aed"/>
        <text x="80" y="51" text-anchor="middle" font-size="14" font-weight="800" fill="#7c3aed">ق</text>
      ${commonEnd}`;
    }

    if (key.includes("chord")) {
      return `${commonStart}
        <line x1="50" y1="34" x2="118" y2="82" stroke="#f97316" stroke-width="5" stroke-linecap="round"/>
        <circle cx="50" cy="34" r="4" fill="#f97316"/>
        <circle cx="118" cy="82" r="4" fill="#f97316"/>
      ${commonEnd}`;
    }

    if (key.includes("arc")) {
      return `${commonStart}
        <path d="M 112 33 A 42 42 0 0 1 121 78" fill="none" stroke="#db2777" stroke-width="7" stroke-linecap="round"/>
      ${commonEnd}`;
    }

    if (key.includes("circumference")) {
      return `
        <svg viewBox="0 0 160 120" role="img" aria-label="محيط الدائرة">
          <circle cx="80" cy="60" r="42" fill="#f8fafc" stroke="#0891b2" stroke-width="7"/>
          <circle cx="80" cy="60" r="3.8" fill="#ef4444"/>
        </svg>`;
    }

    if (key.includes("point")) {
      return `${commonStart}
        <circle cx="112" cy="33" r="6" fill="#16a34a"/>
        <path d="M 130 18 L 116 29" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
      ${commonEnd}`;
    }

    if (key.includes("radii") || key.includes("multiple")) {
      return `${commonStart}
        <line x1="80" y1="60" x2="122" y2="60" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
        <line x1="80" y1="60" x2="50" y2="34" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
        <line x1="80" y1="60" x2="80" y2="18" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
      ${commonEnd}`;
    }

    return `${commonStart}${commonEnd}`;
  }

  function normalizeConceptKey(value) {
    return String(value || "")
      .replace("visual_", "")
      .replace("mistake_", "")
      .toLowerCase();
  }

  function prepareMixedChallengeLevel() {
    if (!gameData || !Array.isArray(gameData.levels)) return;

    const mixed = gameData.levels.find((level) => level.levelId === "mixed_challenge");
    if (!mixed || (Array.isArray(mixed.pairs) && mixed.pairs.length)) return;

    const sourceIds = mixed.sourceLevels || [];
    const sourcePairs = [];

    gameData.levels.forEach((level) => {
      if (sourceIds.includes(level.levelId) && Array.isArray(level.pairs)) {
        level.pairs.forEach((pair) => sourcePairs.push(pair));
      }
    });

    shuffle(sourcePairs);
    mixed.pairs = sourcePairs.slice(0, mixed.recommendedPairsCount || 12);
  }

  function addMemoryFeedback(text) {
    const clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) return;

    if (!memoryFeedbackSummary.includes(clean)) {
      memoryFeedbackSummary.push(clean);
    }

    memoryFeedbackSummary = memoryFeedbackSummary.slice(0, 8);
  }

  function saveMemoryResult(result) {
    try {
      const key = "circleMemoryResults";
      const old = JSON.parse(localStorage.getItem(key) || "[]");

      const studentCodeInput = document.getElementById("studentCode");
      const classNameInput = document.getElementById("className");

      old.push({
        ...result,
        studentCode: studentCodeInput ? studentCodeInput.value.trim() : "",
        className: classNameInput ? classNameInput.value.trim() : "",
        savedAt: new Date().toISOString()
      });

      localStorage.setItem(key, JSON.stringify(old.slice(-50)));
    } catch (err) {
      console.warn("Could not save memory game result:", err);
    }
  }

  function playSound(id) {
    const sound = document.getElementById(id);
    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (err) {
      console.warn("تعذر تشغيل الصوت.", err);
    }
  }

  function getText(value, fallback = "") {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      if (typeof value.ar === "string") return value.ar;
      if (typeof value.text === "string") return value.text;
    }
    return fallback;
  }

  function getCardBackText() {
    if (gameData && gameData.settings) {
      return gameData.settings.cardBackText || "؟";
    }
    return "؟";
  }

  function getFlipDelay() {
    if (gameData && gameData.settings && Number(gameData.settings.flipBackDelayMs)) {
      return Number(gameData.settings.flipBackDelayMs);
    }
    return 1000;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.CircleMemoryGame = {
    open: openGame,
    close: closeGame,
    restart: () => selectLevel(currentLevelIndex)
  };
})();
