const GUIDE_STORAGE_KEY = 'sample-space-lab-progress-v1';

const GUIDE_FALLBACK = {
  levels: [
    {
      id: 'single',
      questions: [
        { id: 'bag-colors-write' },
        { id: 'spinner-count' },
        { id: 'fruit-choose-space' },
        { id: 'cards-reverse' }
      ]
    },
    {
      id: 'same',
      questions: [
        { id: 'traffic-count' },
        { id: 'bus-write' },
        { id: 'weather-choose-space' },
        { id: 'same-reverse' }
      ]
    },
    {
      id: 'different',
      questions: [
        { id: 'hero-write' },
        { id: 'canteen-count' },
        { id: 'outfit-choose-space' },
        { id: 'different-reverse' }
      ]
    }
  ],
  levelsCount: 3,
  reverseCount: 6,
  matchingCount: 2
};

document.addEventListener('DOMContentLoaded', initGuidePage);

async function initGuidePage() {
  const data = await loadGuideData();
  const progress = loadGuideProgress();

  setText('guideScoreValue', String(progress.score || 0));
  setText('guideCompletedLevelsValue', `${countCompletedLevels(progress, data.levels || [])} / ${data.levelsCount}`);
  setText('guideReverseProgressValue', `${countSolvedReverse(progress)} / ${data.reverseCount}`);
  setText('guideMatchingProgressValue', `${countCompletedMatching(progress)} / ${data.matchingCount}`);
}

async function loadGuideData() {
  try {
    const response = await fetch('content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('تعذر تحميل content.json');
    const json = await response.json();
    return {
      levels: Array.isArray(json.levels) ? json.levels : [],
      levelsCount: Array.isArray(json.levels) ? json.levels.length : GUIDE_FALLBACK.levelsCount,
      reverseCount: Array.isArray(json.reverse) ? json.reverse.length : GUIDE_FALLBACK.reverseCount,
      matchingCount: GUIDE_FALLBACK.matchingCount
    };
  } catch (error) {
    return {
      levels: GUIDE_FALLBACK.levels,
      levelsCount: GUIDE_FALLBACK.levelsCount,
      reverseCount: GUIDE_FALLBACK.reverseCount,
      matchingCount: GUIDE_FALLBACK.matchingCount
    };
  }
}

function defaultGuideProgress() {
  return {
    score: 0,
    answered: {},
    reverse: {},
    matching: {
      terms: false,
      experiments: false
    }
  };
}

function loadGuideProgress() {
  try {
    const raw = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) return defaultGuideProgress();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultGuideProgress(), parsed || {});
  } catch (error) {
    return defaultGuideProgress();
  }
}

function countCompletedLevels(progress, levels) {
  return (levels || []).filter((level) => {
    const questions = Array.isArray(level.questions) ? level.questions : [];
    if (!questions.length) return false;
    return questions.every((question) => {
      const key = `level:${level.id}:${question.id}`;
      const entry = progress.answered?.[key];
      return Boolean(entry && entry.correct);
    });
  }).length;
}

function countSolvedReverse(progress) {
  const reverse = progress.reverse || {};
  return Object.values(reverse).filter(Boolean).length;
}

function countCompletedMatching(progress) {
  const matching = progress.matching || {};
  return ['terms', 'experiments'].filter((key) => Boolean(matching[key])).length;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
