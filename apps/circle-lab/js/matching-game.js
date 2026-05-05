(() => {
  "use strict";

  const DATA = window.CIRCLE_GAME_DATA;

  const state = {
    stageIndex: 0,
    answers: {},
    selectedItem: null,
    checked: false,
    completedStages: new Set(),
    optionOrders: {}
  };

  const els = {
    stageCounter: document.getElementById("stageCounter"),
    scoreText: document.getElementById("scoreText"),
    stageTitle: document.getElementById("stageTitle"),
    stageInstruction: document.getElementById("stageInstruction"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    stageArea: document.getElementById("stageArea"),
    feedback: document.getElementById("feedback"),
    hintBtn: document.getElementById("hintBtn"),
    checkBtn: document.getElementById("checkBtn"),
    resetBtn: document.getElementById("resetBtn"),
    nextBtn: document.getElementById("nextBtn")
  };

  function currentStage() {
    return DATA.stages[state.stageIndex];
  }

  function term(id) {
    return DATA.terms[id];
  }

  function isAssigned(itemId) {
    return Object.values(state.answers).includes(itemId);
  }

  function targetClass(targetId) {
    const assigned = state.answers[targetId];
    const classes = [];
    if (assigned) classes.push("filled");
    if (state.checked) {
      if (assigned === targetId) classes.push("correct");
      else classes.push("wrong");
    }
    return classes.join(" ");
  }

  function setFeedback(message, kind = "neutral") {
    els.feedback.className = `feedback ${kind}`;
    els.feedback.textContent = message;
  }

  function updateHeader() {
    const stage = currentStage();
    const correct = countCorrect();
    const total = stage.targets.length;
    const progress = Math.round((correct / total) * 100);

    els.stageCounter.textContent = `المرحلة ${state.stageIndex + 1} من ${DATA.stages.length}`;
    els.scoreText.textContent = state.checked ? `${correct} من ${total} إجابات صحيحة` : "ابدأ المطابقة";
    els.stageTitle.textContent = stage.title;
    els.stageInstruction.textContent = stage.instruction;
    els.progressBar.style.width = `${progress}%`;
    els.progressText.textContent = `${progress}%`;
    els.nextBtn.disabled = correct !== total;
    els.nextBtn.textContent = state.stageIndex === DATA.stages.length - 1 ? "إنهاء" : "التالي";
  }

  function countCorrect() {
    return currentStage().targets.reduce((sum, targetId) => {
      return sum + (state.answers[targetId] === targetId ? 1 : 0);
    }, 0);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function optionOrder(optionIds, kind) {
    const key = `${currentStage().id}:${kind}`;
    const existing = state.optionOrders[key];
    const sameItems = existing && existing.length === optionIds.length && optionIds.every((id) => existing.includes(id));
    if (!sameItems) {
      state.optionOrders[key] = shuffle(optionIds);
    }
    return state.optionOrders[key];
  }

  function optionContent(itemId, kind) {
    if (kind === "drawing") {
      return `
        <div class="drawing-option-content">
          ${iconSvg(itemId)}
          <span class="icon-caption">رسم عنصر في الدائرة</span>
        </div>
      `;
    }
    return `<span class="option-name">${term(itemId).name}</span>`;
  }

  function filledContent(itemId, kind) {
    if (!itemId) return "ضع البطاقة هنا";
    if (kind === "drawing") return iconSvg(itemId);
    return term(itemId).name;
  }

  function makeBank(optionIds, kind = "name") {
    const bank = document.createElement("aside");
    bank.className = "bank-card";
    bank.innerHTML = `
      <p class="bank-title">بطاقات قابلة للسحب</p>
      <div class="options-bank" role="list"></div>
    `;
    const holder = bank.querySelector(".options-bank");
    const remaining = optionOrder(optionIds, kind).filter((id) => !isAssigned(id));

    if (!remaining.length) {
      holder.innerHTML = `<div class="empty-bank">تم وضع جميع البطاقات. اضغط «تحقق من الإجابات».</div>`;
      return bank;
    }

    remaining.forEach((itemId) => {
      const card = document.createElement("div");
      card.className = `option-card ${kind === "drawing" ? "drawing-option" : ""}`;
      if (state.selectedItem === itemId) card.classList.add("selected");
      card.draggable = true;
      card.tabIndex = 0;
      card.setAttribute("role", "listitem");
      card.setAttribute("aria-label", kind === "drawing" ? `رسم ${term(itemId).name}` : term(itemId).name);
      card.dataset.item = itemId;
      card.innerHTML = optionContent(itemId, kind);

      card.addEventListener("click", () => selectItem(itemId));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectItem(itemId);
        }
      });
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", itemId);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));

      holder.appendChild(card);
    });

    return bank;
  }

  function selectItem(itemId) {
    state.selectedItem = state.selectedItem === itemId ? null : itemId;
    state.checked = false;
    setFeedback(
      state.selectedItem
        ? `تم اختيار بطاقة «${term(itemId).name}». اضغط الآن على المكان المناسب لها.`
        : "تم إلغاء اختيار البطاقة.",
      "neutral"
    );
    renderStage();
  }

  function assignItem(targetId, itemId) {
    if (!itemId || !currentStage().targets.includes(targetId)) return;

    Object.keys(state.answers).forEach((key) => {
      if (state.answers[key] === itemId) delete state.answers[key];
    });

    state.answers[targetId] = itemId;
    state.selectedItem = null;
    state.checked = false;
    setFeedback(`تم وضع بطاقة «${term(itemId).name}». يمكنك تعديلها أو التحقق من الإجابات.`, "neutral");
    renderStage();
  }

  function removeAssignment(targetId) {
    const assigned = state.answers[targetId];
    if (!assigned) return;
    delete state.answers[targetId];
    state.checked = false;
    setFeedback(`تمت إعادة بطاقة «${term(assigned).name}» إلى قائمة البطاقات.`, "neutral");
    renderStage();
  }

  function addDropHandlers(node, targetId) {
    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    node.addEventListener("drop", (event) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData("text/plain");
      assignItem(targetId, itemId);
    });

    node.addEventListener("click", () => {
      if (state.selectedItem) {
        assignItem(targetId, state.selectedItem);
      }
    });

    node.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && state.selectedItem) {
        event.preventDefault();
        assignItem(targetId, state.selectedItem);
      }
      if ((event.key === "Backspace" || event.key === "Delete") && state.answers[targetId]) {
        event.preventDefault();
        removeAssignment(targetId);
      }
    });
  }

  function renderStage() {
    updateHeader();
    const stage = currentStage();
    els.stageArea.innerHTML = "";

    if (stage.type === "diagram") renderDiagramStage(stage);
    else renderDefinitionMatchStage(stage);
  }

  function renderDiagramStage(stage) {
    const layout = document.createElement("div");
    layout.className = "diagram-layout";

    const diagramCard = document.createElement("section");
    diagramCard.className = "diagram-card";
    diagramCard.innerHTML = circleDiagramSvg(stage.targets);

    layout.appendChild(diagramCard);
    layout.appendChild(makeBank(stage.targets, "name"));
    els.stageArea.appendChild(layout);

    diagramCard.querySelectorAll(".svg-drop-zone").forEach((zone) => {
      addDropHandlers(zone, zone.dataset.target);
    });
  }

  function renderDefinitionMatchStage(stage) {
    const layout = document.createElement("div");
    layout.className = "match-layout";

    const targetsCard = document.createElement("section");
    targetsCard.className = "match-targets-card";
    targetsCard.innerHTML = `<div class="match-targets"></div>`;
    const holder = targetsCard.querySelector(".match-targets");

    stage.targets.forEach((targetId) => {
      const assigned = state.answers[targetId];
      const target = document.createElement("article");
      target.className = `match-target ${targetClass(targetId)}`;
      target.dataset.target = targetId;
      target.tabIndex = 0;
      target.setAttribute("aria-label", `تعريف ${term(targetId).name}`);
      target.innerHTML = `
        <div class="target-definition">${term(targetId).definition}</div>
        <div class="drop-slot">
          <div class="filled-chip">${filledContent(assigned, stage.optionKind)}</div>
        </div>
        ${targetFeedback(targetId)}
      `;
      addDropHandlers(target, targetId);
      holder.appendChild(target);
    });

    layout.appendChild(targetsCard);
    layout.appendChild(makeBank(stage.targets, stage.optionKind));
    els.stageArea.appendChild(layout);
  }

  function targetFeedback(targetId) {
    if (!state.checked) return "";
    const assigned = state.answers[targetId];
    if (assigned === targetId) {
      return `<p class="target-feedback">صحيح: ${term(targetId).feedback}</p>`;
    }
    if (!assigned) {
      return `<p class="target-feedback">لم توضع بطاقة هنا. ${term(targetId).hint}</p>`;
    }
    return `<p class="target-feedback">راجع المطابقة: ${term(targetId).hint}</p>`;
  }

  function checkStage() {
    state.checked = true;
    const stage = currentStage();
    const correct = countCorrect();
    const total = stage.targets.length;

    if (correct === total) {
      state.completedStages.add(stage.id);
      setFeedback("ممتاز! جميع المطابقات صحيحة. انتقل إلى المرحلة التالية.", "success");
    } else {
      const emptyCount = stage.targets.filter((targetId) => !state.answers[targetId]).length;
      const wrongCount = total - correct - emptyCount;
      const parts = [];
      if (wrongCount) parts.push(`${wrongCount} مطابقة تحتاج مراجعة`);
      if (emptyCount) parts.push(`${emptyCount} مكان لم توضع فيه بطاقة`);
      setFeedback(`إجاباتك قريبة. ${parts.join("، ")}. اقرأ التلميحات ثم عدّل البطاقات.`, "error");
    }
    renderStage();
  }

  function resetStage() {
    state.answers = {};
    state.selectedItem = null;
    state.checked = false;
    Object.keys(state.optionOrders).forEach((key) => {
      if (key.startsWith(`${currentStage().id}:`)) delete state.optionOrders[key];
    });
    setFeedback("تمت إعادة المرحلة. اسحب البطاقات إلى أماكنها الصحيحة.", "neutral");
    renderStage();
  }

  function showHint() {
    const stage = currentStage();
    const firstUnsolved = stage.targets.find((targetId) => state.answers[targetId] !== targetId);
    const message = firstUnsolved
      ? `${stage.hint} تلميح إضافي: ${term(firstUnsolved).hint}`
      : stage.hint;
    setFeedback(message, "neutral");
  }

  function nextStage() {
    if (countCorrect() !== currentStage().targets.length) return;

    if (state.stageIndex === DATA.stages.length - 1) {
      renderCompletion();
      return;
    }

    state.stageIndex += 1;
    state.answers = {};
    state.selectedItem = null;
    state.checked = false;
    setFeedback("مرحلة جديدة: اقرأ التعليمات ثم ابدأ المطابقة.", "neutral");
    renderStage();
  }

  function renderCompletion() {
    els.stageCounter.textContent = "اكتملت اللعبة";
    els.scoreText.textContent = "أحسنت";
    els.stageTitle.textContent = "إنجاز رائع";
    els.stageInstruction.textContent = "أنهيت المراحل الثلاث: المكان، التعريف، والرسم.";
    els.progressBar.style.width = "100%";
    els.progressText.textContent = "100%";
    els.stageArea.innerHTML = `
      <div class="completion-card">
        <h2>أحسنت! لقد أتممت لعبة مطابقة عناصر الدائرة.</h2>
        <p>تدرّبت على التعرف إلى عناصر الدائرة، والتمييز بين القطر والوتر ونصف القطر، وربط المصطلح بالرسم والتعريف.</p>
        <button type="button" class="primary-btn" id="playAgainBtn">إعادة اللعبة من البداية</button>
      </div>
    `;
    els.checkBtn.disabled = true;
    els.hintBtn.disabled = true;
    els.nextBtn.disabled = true;
    setFeedback("اكتمل النشاط بنجاح.", "success");
    document.getElementById("playAgainBtn").addEventListener("click", () => {
      state.stageIndex = 0;
      state.answers = {};
      state.selectedItem = null;
      state.checked = false;
      state.optionOrders = {};
      els.checkBtn.disabled = false;
      els.hintBtn.disabled = false;
      setFeedback("لنبدأ من جديد. اسحب كل بطاقة إلى مكانها الصحيح.", "neutral");
      renderStage();
    });
  }

  function circleDiagramSvg(targets) {
    const labels = {
      center: { x: 260, y: 214, w: 118, h: 36 },
      radius: { x: 337, y: 226, w: 124, h: 36 },
      diameter: { x: 260, y: 290, w: 124, h: 36 },
      chord: { x: 260, y: 80, w: 112, h: 36 },
      arc: { x: 260, y: 42, w: 102, h: 36 },
      circumference: { x: 116, y: 306, w: 132, h: 36 }
    };

    const zoneMarkup = targets.map((targetId) => {
      const item = labels[targetId];
      const assigned = state.answers[targetId];
      const cls = targetClass(targetId);
      const text = assigned ? term(assigned).name : "ضع هنا";
      return `
        <g class="svg-drop-zone ${cls}" data-target="${targetId}" tabindex="0" role="button" aria-label="موضع ${term(targetId).name}">
          <rect class="drop-zone-shape" x="${item.x - item.w / 2}" y="${item.y - item.h / 2}" width="${item.w}" height="${item.h}" rx="12"></rect>
          <text class="zone-text" x="${item.x}" y="${item.y}">${text}</text>
        </g>
      `;
    }).join("");

    return `
      <svg class="circle-svg" viewBox="0 0 520 380" aria-label="رسم دائرة يحتوي على عناصر: المركز، نصف القطر، القطر، الوتر، القوس، والمحيط">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#253858"></path>
          </marker>
        </defs>

        <circle class="circle-outline" cx="260" cy="190" r="125"></circle>

        <line class="element-line" x1="135" y1="190" x2="385" y2="190"></line>
        <line class="element-highlight" x1="260" y1="190" x2="385" y2="190"></line>
        <line class="element-line" x1="185" y1="98" x2="335" y2="105"></line>
        <path class="element-highlight" d="M 183 92 A 125 125 0 0 1 337 92"></path>
        <circle class="element-dot" cx="260" cy="190" r="8"></circle>

        <line x1="245" y1="214" x2="260" y2="197" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>
        <line x1="332" y1="224" x2="330" y2="190" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>
        <line x1="260" y1="273" x2="260" y2="194" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>
        <line x1="260" y1="99" x2="260" y2="102" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>
        <line x1="260" y1="61" x2="260" y2="70" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>
        <line x1="144" y1="290" x2="166" y2="276" stroke="#253858" stroke-width="2" marker-end="url(#arrow)"></line>

        ${zoneMarkup}
      </svg>
    `;
  }

  function iconSvg(id) {
    const base = `
      <circle cx="50" cy="38" r="26" fill="#ffffff" stroke="#253858" stroke-width="2.4"></circle>
      <circle cx="50" cy="38" r="2.8" fill="#253858"></circle>
    `;

    const highlight = {
      center: `<circle cx="50" cy="38" r="6" fill="#2663eb" stroke="#ffffff" stroke-width="2"></circle>`,
      radius: `<line x1="50" y1="38" x2="76" y2="38" stroke="#2663eb" stroke-width="4.4" stroke-linecap="round"></line>`,
      diameter: `<line x1="24" y1="38" x2="76" y2="38" stroke="#2663eb" stroke-width="4.4" stroke-linecap="round"></line>`,
      chord: `<line x1="31" y1="24" x2="72" y2="27" stroke="#2663eb" stroke-width="4.4" stroke-linecap="round"></line>`,
      arc: `<path d="M 34 17 A 26 26 0 0 1 66 17" fill="none" stroke="#2663eb" stroke-width="4.4" stroke-linecap="round"></path>`,
      circumference: `<circle cx="50" cy="38" r="26" fill="none" stroke="#2663eb" stroke-width="4.4"></circle>`
    }[id];

    return `
      <svg class="mini-svg" viewBox="0 0 100 76" aria-label="رسم ${term(id).name}">
        ${base}
        ${highlight}
      </svg>
    `;
  }

  els.checkBtn.addEventListener("click", checkStage);
  els.resetBtn.addEventListener("click", resetStage);
  els.hintBtn.addEventListener("click", showHint);
  els.nextBtn.addEventListener("click", nextStage);

  renderStage();
})();
