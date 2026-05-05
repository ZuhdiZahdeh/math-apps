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

  const state = {
    overlay: null,
    levelTitle: null,
    levelDesc: null,
    levelsBox: null,
    grid: null,
    message: null,
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
    if (gameData) selectLevel(currentLevelIndex);
  }

  function closeGame() {
    state.overlay.classList.remove("is-open");
    state.overlay.setAttribute("aria-hidden", "true");
  }

  function buildLevelButtons() {
    state.levelsBox.innerHTML = "";

    gameData.levels.forEach((level, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-level-btn";
      btn.textContent = level.shortTitle || level.title;
      btn.addEventListener("click", () => selectLevel(index));
      state.levelsBox.appendChild(btn);
    });
  }

  function selectLevel(index) {
    if (!gameData || !gameData.levels[index]) return;

    currentLevelIndex = index;
    const level = gameData.levels[currentLevelIndex];

    document.querySelectorAll(".memory-level-btn").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === currentLevelIndex);
    });

    attempts = 0;
    wrongMatches = 0;
    matchedPairs = 0;
    flipped = [];
    lockBoard = false;
    startedAt = new Date();

    state.endBox.classList.remove("is-visible");
    state.endBox.innerHTML = "";

    state.statLevel.textContent = level.shortTitle || level.title;
    state.levelDesc.textContent = level.description || "طابق البطاقات الصحيحة.";
    showMessage("ابدأ بقلب بطاقتين.", "info");

    buildDeck(level);
    renderCards();
    updateStats();

    startTimer();
  }

  function buildDeck(level) {
    deck = [];

    level.pairs.forEach((pair) => {
      deck.push({
        uid: `${pair.pairId}_a`,
        pairId: pair.pairId,
        concept: pair.concept,
        content: pair.cardA,
        correctFeedback: pair.correctFeedback,
        wrongHint: pair.wrongHint,
        matched: false
      });

      deck.push({
        uid: `${pair.pairId}_b`,
        pairId: pair.pairId,
        concept: pair.concept,
        content: pair.cardB,
        correctFeedback: pair.correctFeedback,
        wrongHint: pair.wrongHint,
        matched: false
      });
    });

    shuffle(deck);
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
          <span class="memory-card-face memory-card-back">${escapeHTML(gameData.settings.cardBackText || "؟")}</span>
          <span class="memory-card-face memory-card-front">${renderCardContent(card.content)}</span>
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

    setTimeout(() => {
      setCardFlipped(first.uid, false);
      setCardFlipped(second.uid, false);
      flipped = [];
      lockBoard = false;
      updateStats();
    }, gameData.settings.flipBackDelayMs || 900);
  }

  function setCardFlipped(uid, isFlipped) {
    const el = document.querySelector(`.memory-card[data-uid="${CSS.escape(uid)}"]`);
    if (el) el.classList.toggle("is-flipped", isFlipped);
  }

  function setCardMatched(uid) {
    const el = document.querySelector(`.memory-card[data-uid="${CSS.escape(uid)}"]`);
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

    state.endBox.innerHTML = `
      <h3>🎉 أحسنت! أنهيت المستوى</h3>
      <p><strong>المستوى:</strong> ${escapeHTML(gameData.levels[currentLevelIndex].title)}</p>
      <p><strong>عدد المحاولات:</strong> ${attempts}</p>
      <p><strong>الأخطاء:</strong> ${wrongMatches}</p>
      <p><strong>الوقت:</strong> ${formatTime(seconds)}</p>
      <p><strong>التقدير:</strong> ${message}</p>
    `;

    state.endBox.classList.add("is-visible");
    showMessage("أنهيت المستوى بنجاح. يمكنك إعادة المستوى أو الانتقال للمستوى التالي.", "success");

    saveMemoryResult({
      levelId: gameData.levels[currentLevelIndex].levelId,
      levelTitle: gameData.levels[currentLevelIndex].title,
      attempts,
      wrongMatches,
      totalPairs,
      timeSpentSeconds: seconds,
      accuracyPercent: accuracy,
      completed: true
    });
  }

  function goNextLevel() {
    if (!gameData) return;
    const next = currentLevelIndex + 1;
    if (next < gameData.levels.length) {
      selectLevel(next);
    } else {
      selectLevel(0);
    }
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

  function renderCardContent(content) {
    if (!content) return "";

    if (content.type === "visual") {
      return renderCircleVisual(content.value);
    }

    return `<span>${escapeHTML(content.value)}</span>`;
  }

  function renderCircleVisual(kind) {
    const commonStart = `
      <svg viewBox="0 0 160 120" role="img" aria-label="رسم عنصر من الدائرة">
        <circle cx="80" cy="60" r="42" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
        <circle cx="80" cy="60" r="3.8" fill="#ef4444"/>
    `;

    const commonEnd = `</svg>`;

    if (kind === "center") {
      return `${commonStart}
        <circle cx="80" cy="60" r="7" fill="#ef4444"/>
        <text x="80" y="50" text-anchor="middle" font-size="15" font-weight="800" fill="#ef4444">م</text>
      ${commonEnd}`;
    }

    if (kind === "radius") {
      return `${commonStart}
        <line x1="80" y1="60" x2="122" y2="60" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
        <circle cx="122" cy="60" r="4" fill="#2563eb"/>
        <text x="103" y="52" text-anchor="middle" font-size="14" font-weight="800" fill="#2563eb">نق</text>
      ${commonEnd}`;
    }

    if (kind === "diameter") {
      return `${commonStart}
        <line x1="38" y1="60" x2="122" y2="60" stroke="#7c3aed" stroke-width="5" stroke-linecap="round"/>
        <circle cx="38" cy="60" r="4" fill="#7c3aed"/>
        <circle cx="122" cy="60" r="4" fill="#7c3aed"/>
        <text x="80" y="51" text-anchor="middle" font-size="14" font-weight="800" fill="#7c3aed">ق</text>
      ${commonEnd}`;
    }

    if (kind === "chord") {
      return `${commonStart}
        <line x1="50" y1="34" x2="118" y2="82" stroke="#f97316" stroke-width="5" stroke-linecap="round"/>
        <circle cx="50" cy="34" r="4" fill="#f97316"/>
        <circle cx="118" cy="82" r="4" fill="#f97316"/>
      ${commonEnd}`;
    }

    if (kind === "arc") {
      return `${commonStart}
        <path d="M 112 33 A 42 42 0 0 1 121 78" fill="none" stroke="#db2777" stroke-width="7" stroke-linecap="round"/>
      ${commonEnd}`;
    }

    if (kind === "circumference") {
      return `
      <svg viewBox="0 0 160 120" role="img" aria-label="محيط الدائرة">
        <circle cx="80" cy="60" r="42" fill="#f8fafc" stroke="#0891b2" stroke-width="7"/>
        <circle cx="80" cy="60" r="3.8" fill="#ef4444"/>
      </svg>`;
    }

    return commonStart + commonEnd;
  }

  function saveMemoryResult(result) {
    try {
      const key = "circleMemoryResults";
      const old = JSON.parse(localStorage.getItem(key) || "[]");
      old.push({
        ...result,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(old.slice(-30)));
    } catch (err) {
      console.warn("Could not save memory game result:", err);
    }
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
