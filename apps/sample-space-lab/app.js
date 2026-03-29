
const FALLBACK_DATA = {"meta":{"title":"لعبة الفضاء العيني — مغامرة Ω","subtitle":"لعبة تربوية تفاعلية لتعلّم كتابة الفضاء العيني، وعدّ عناصره، وربط التجربة المناسبة بفضائها العيني.","grades":[5,6,7,8,9]},"rules":[{"id":"single","title":"تجربة من مرحلة واحدة","text":"نكتب جميع النتائج الممكنة مرة واحدة داخل الأقواس المعقوفة. لا نكرّر النتائج ولا نضيف شيئًا غير ممكن.","miniExample":"Ω = {أحمر، أزرق، أخضر}"},{"id":"same","title":"مرتان من نفس النوع","text":"عندما نكرّر التجربة نفسها مرتين نستخدم أزواجًا مرتبة؛ لأن ترتيب النتيجتين مهم.","miniExample":"Ω = {(خ، خ)، (خ، ح)، (ح، خ)، (ح، ح)}"},{"id":"different","title":"مرحلتان من نوعين مختلفين","text":"نزاوج كل اختيار من المرحلة الأولى مع كل اختيار من المرحلة الثانية. غالبًا نعدّ العناصر بالضرب.","miniExample":"2 مشروبات × 3 شطائر = 6 عناصر"}],"levels":[{"id":"single","title":"المستوى 1: مرحلة واحدة","emoji":"①","objective":"نكتب فضاء عيني بسيطًا لتجربة واحدة ونميّز بين الناتج الواحد والفضاء العيني كاملًا.","heroImage":"images/school-bag.svg","questions":[{"id":"bag-colors-write","type":"write_space","image":"images/school-bag.svg","prompt":"تبيع المكتبة غلافًا لدفتر الواجب بألوان: أزرق، أخضر، أحمر. اكتب الفضاء العيني Ω.","stages":[{"label":"اللون الممكن","options":["أزرق","أخضر","أحمر"]}],"sampleSpace":["أزرق","أخضر","أحمر"],"hint":"في المرحلة الواحدة نكتب كل نتيجة ممكنة مرة واحدة داخل الأقواس المعقوفة.","explanation":"لأن التجربة تتكوّن من خطوة واحدة فقط، فالفضاء العيني هو قائمة الألوان الممكنة كلها: Ω = {أزرق، أخضر، أحمر}."},{"id":"spinner-count","type":"count_space","image":"images/spinner.svg","prompt":"في ركن الألعاب الصفية يدور قرص بأربعة ألوان: أصفر، أزرق، وردي، أخضر. ما عدد عناصر الفضاء العيني؟","stages":[{"label":"نتائج القرص","options":["أصفر","أزرق","وردي","أخضر"]}],"sampleSpace":["أصفر","أزرق","وردي","أخضر"],"correctCount":4,"hint":"عدّ النتائج الممكنة مباشرة.","explanation":"هناك 4 نتائج مختلفة ممكنة، إذن عدد عناصر الفضاء العيني يساوي 4."},{"id":"fruit-choose-space","type":"choose_space","image":"images/canteen.svg","prompt":"اختيار فاكهة من سلة الصف إذا كانت الخيارات: تفاح، موز، برتقال. ما الفضاء العيني المناسب؟","stages":[{"label":"الفاكهة","options":["تفاح","موز","برتقال"]}],"choices":[["تفاح","موز","برتقال"],["تفاح","موز"],["تفاح","موز","برتقال","عنب"],["(تفاح، موز)","(تفاح، برتقال)"]],"correctChoice":0,"hint":"لا نكتب إلا النتائج التي يمكن أن تحدث فعلاً.","explanation":"التجربة اختيار فاكهة واحدة فقط، لذلك الفضاء العيني هو {تفاح، موز، برتقال}."},{"id":"cards-reverse","type":"choose_experiment","image":"images/reverse.svg","prompt":"إذا كان Ω = {1، 2، 3، 4، 5} فما التجربة العشوائية المناسبة؟","spaceDisplay":["1","2","3","4","5"],"choices":["سحب بطاقة مرقمة من 1 إلى 5.","اختيار لون من (أحمر، أزرق).","مراقبة إشارة المرور مرتين من (خ، ح).","اختيار وجبة من عصيرين وثلاث شطائر."],"correctChoice":0,"hint":"فتّش عن تجربة نتائجها هي الأعداد نفسها تمامًا.","explanation":"لأن الفضاء العيني يتكوّن من الأعداد 1 إلى 5 فقط، فأفضل تجربة مناسبة هي سحب بطاقة مرقمة من 1 إلى 5."}]},{"id":"same","title":"المستوى 2: مرحلتان من نفس النوع","emoji":"②","objective":"نتدرّب على كتابة الأزواج المرتبة عندما تتكرر التجربة نفسها مرتين.","heroImage":"images/traffic-light.svg","questions":[{"id":"traffic-count","type":"count_space","image":"images/traffic-light.svg","prompt":"في تجربة مراقبة إشارة المرور لمرتين متتاليتين (عند الذهاب للبيت وعند العودة)، إذا كانت الإشارة إما خضراء (خ) أو حمراء (ح)، فما عدد عناصر الفضاء العيني؟","stages":[{"label":"المرّة الأولى","options":["خ","ح"]},{"label":"المرّة الثانية","options":["خ","ح"]}],"sampleSpace":["(خ، خ)","(خ، ح)","(ح، خ)","(ح، ح)"],"correctCount":4,"hint":"لكل نتيجة في المرة الأولى نتيجتان ممكنتان في المرة الثانية.","explanation":"نكوّن كل الأزواج المرتبة الممكنة: (خ، خ)، (خ، ح)، (ح، خ)، (ح، ح). لذلك 2 × 2 = 4 عناصر."},{"id":"bus-write","type":"write_space","image":"images/bus-trip.svg","prompt":"في يومين متتاليين، قد تصل حافلة المدرسة إمّا في موعدها (م) أو متأخرة (ت). اكتب Ω.","stages":[{"label":"اليوم الأول","options":["م","ت"]},{"label":"اليوم الثاني","options":["م","ت"]}],"sampleSpace":["(م، م)","(م، ت)","(ت، م)","(ت، ت)"],"hint":"اكتب كل زوج مرتب: (نتيجة اليوم الأول، نتيجة اليوم الثاني).","explanation":"الترتيب مهم لأن (م، ت) يختلف عن (ت، م). لذلك نكتب جميع الأزواج المرتبة الممكنة."},{"id":"weather-choose-space","type":"choose_space","image":"images/weather.svg","prompt":"عند تسجيل الطقس صباحًا ومساءً، وكانت الحالة إما مشمس (ش) أو غائم (غ)، ما الفضاء العيني المناسب؟","stages":[{"label":"الصباح","options":["ش","غ"]},{"label":"المساء","options":["ش","غ"]}],"choices":[["(ش، ش)","(ش، غ)","(غ، ش)","(غ، غ)"],["ش","غ"],["(ش، غ)","(غ، ش)"],["(ش، ش، غ)","(غ، غ، ش)"]],"correctChoice":0,"hint":"لدينا مرحلتان، لذا نكتب أزواجًا مرتبة لا عناصر مفردة.","explanation":"كل حالة صباحية يمكن أن يقابلها حالتان مسائيتان؛ لذلك نحصل على 4 أزواج مرتبة."},{"id":"same-reverse","type":"choose_experiment","image":"images/reverse.svg","prompt":"إذا كان Ω = {(أ، أ)، (أ، ب)، (ب، أ)، (ب، ب)} فما التجربة الأنسب؟","spaceDisplay":["(أ، أ)","(أ، ب)","(ب، أ)","(ب، ب)"],"choices":["اختيار لون حقيبة من (أ، ب).","متابعة نتيجتين متتاليتين لتجربة لها خياران فقط: (أ، ب).","اختيار وجبة من عصيرين وثلاث شطائر.","سحب بطاقة مرقمة من 1 إلى 4."],"correctChoice":1,"hint":"وجود أزواج مرتبة من العنصرين نفسيهما يدل على تكرار التجربة نفسها مرتين.","explanation":"هذا فضاء عيني لمرحلتين من النوع نفسه، وفي كل مرحلة خياران فقط هما أ وب."}]},{"id":"different","title":"المستوى 3: مرحلتان من نوعين مختلفين","emoji":"③","objective":"نزاوج اختيارات من نوعين مختلفين ونستعمل قاعدة الضرب لعدّ العناصر.","heroImage":"images/hero-player.svg","questions":[{"id":"hero-write","type":"write_space","image":"images/hero-player.svg","prompt":"تصميم شخصية لاعب في لعبة إلكترونية، حيث يختار نوع القتال (سيف، قوس) ولون الدرع (ذهبي، فضي). ما هو الفضاء العيني لهذه التجربة؟","stages":[{"label":"نوع القتال","options":["سيف","قوس"]},{"label":"لون الدرع","options":["ذهبي","فضي"]}],"sampleSpace":["(سيف، ذهبي)","(سيف، فضي)","(قوس، ذهبي)","(قوس، فضي)"],"hint":"ابدأ بكل اختيار للسيف، ثم كرره مع اللونين. بعد ذلك كرر الأمر للقوس.","explanation":"نزاوج كل نوع قتال مع كل لون درع، لذلك 2 × 2 = 4 نواتج ممكنة."},{"id":"canteen-count","type":"count_space","image":"images/canteen.svg","prompt":"اختيار وجبة من المقصف المدرسي تتكون من (عصير برتقال أو حليب) مع (شطيرة لبنة أو زعتر أو جبنة). ما عدد عناصر الفضاء العيني؟","stages":[{"label":"المشروب","options":["عصير برتقال","حليب"]},{"label":"الشطيرة","options":["لبنة","زعتر","جبنة"]}],"sampleSpace":["(عصير برتقال، لبنة)","(عصير برتقال، زعتر)","(عصير برتقال، جبنة)","(حليب، لبنة)","(حليب، زعتر)","(حليب، جبنة)"],"correctCount":6,"hint":"عدد الخيارات في المشروب × عدد الخيارات في الشطيرة.","explanation":"لأن لدينا مشروبين وثلاث شطائر، فإن عدد عناصر الفضاء العيني يساوي 2 × 3 = 6."},{"id":"outfit-choose-space","type":"choose_space","image":"images/outfit.svg","prompt":"في نادي الرسم، يختار الطالب لون القميص (أزرق، أبيض) مع شارة الحقيبة (نجمة، قلب، كتاب). ما الفضاء العيني المناسب؟","stages":[{"label":"لون القميص","options":["أزرق","أبيض"]},{"label":"شارة الحقيبة","options":["نجمة","قلب","كتاب"]}],"choices":[["(أزرق، نجمة)","(أزرق، قلب)","(أزرق، كتاب)","(أبيض، نجمة)","(أبيض، قلب)","(أبيض، كتاب)"],["أزرق","أبيض","نجمة","قلب","كتاب"],["(أزرق، أبيض)","(نجمة، قلب، كتاب)"],["(أزرق، نجمة)","(أبيض، قلب)"]],"correctChoice":0,"hint":"كل لون قميص يمكن أن يقترن بثلاث شارات.","explanation":"هنا ندمج اختيارًا من نوعين مختلفين، لذلك نكتب جميع الأزواج الممكنة بين ألوان القميص وشارات الحقيبة."},{"id":"different-reverse","type":"choose_experiment","image":"images/reverse.svg","prompt":"إذا كان Ω = {(مشي، مبكر)، (مشي، متأخر)، (حافلة، مبكر)، (حافلة، متأخر)} فما التجربة المناسبة؟","spaceDisplay":["(مشي، مبكر)","(مشي، متأخر)","(حافلة، مبكر)","(حافلة، متأخر)"],"choices":["اختيار وسيلة الوصول إلى المدرسة (مشي، حافلة) مع وقت الانطلاق (مبكر، متأخر).","اختيار رقم من 1 إلى 4.","مراقبة إشارة المرور مرتين من (خ، ح).","اختيار لون واحد من أربعة ألوان."],"correctChoice":0,"hint":"لاحظ أن العنصر الأول يصف نوعًا، والثاني يصف نوعًا مختلفًا.","explanation":"الفضاء هنا ناتج عن دمج وسيلة وصول مع وقت انطلاق؛ ولذلك هو مثال لمرحلتين من نوعين مختلفين."}]}],"matching":{"terms":[{"left":"التجربة العشوائية","right":"موقف له أكثر من نتيجة ممكنة ولا نعرف أيها سيحدث قبل التنفيذ."},{"left":"الناتج","right":"نتيجة واحدة ممكنة للتجربة."},{"left":"الفضاء العيني","right":"مجموعة كل النتائج الممكنة للتجربة."},{"left":"عنصر في Ω","right":"ناتج واحد داخل الفضاء العيني."},{"left":"عدد عناصر Ω","right":"عدد النواتج المختلفة الموجودة في الفضاء العيني."},{"left":"زوج مرتب","right":"طريقتنا في كتابة نتيجتين عندما يكون الترتيب مهمًا."}],"experiments":[{"left":"اختيار مشروب من (ماء، عصير)","right":"Ω = {ماء، عصير}"},{"left":"إشارة المرور مرتان من (خ، ح)","right":"Ω = {(خ، خ)، (خ، ح)، (ح، خ)، (ح، ح)}"},{"left":"سحب بطاقة مرقمة من 1 إلى 3","right":"Ω = {1، 2، 3}"},{"left":"اختيار مشروب (حليب، عصير) مع شطيرة (لبنة، جبنة)","right":"Ω = {(حليب، لبنة)، (حليب، جبنة)، (عصير، لبنة)، (عصير، جبنة)}"},{"left":"حالة الحافلة في يومين: (م، ت)","right":"Ω = {(م، م)، (م، ت)، (ت، م)، (ت، ت)}"},{"left":"اختيار لون كرة من (أحمر، أزرق، أخضر)","right":"Ω = {أحمر، أزرق، أخضر}"}]},"reverse":[{"id":"rev-1","image":"images/reverse.svg","spaceDisplay":["1","2","3","4","5","6","7","8","9"],"prompt":"إذا كان Ω = {1، 2، 3، 4، 5، 6، 7، 8، 9}، فما التجربة العشوائية المناسبة؟","choices":["إدارة قرص مرقم من 1 إلى 9.","اختيار لون من (أحمر، أزرق، أخضر).","مراقبة نتيجتين من (ش، غ).","اختيار وجبة من عصيرين وثلاث شطائر."],"correctChoice":0,"explanation":"هذه تجربة من مرحلة واحدة ونتائجها هي الأعداد من 1 إلى 9."},{"id":"rev-2","image":"images/traffic-light.svg","spaceDisplay":["(خ، خ)","(خ، ح)","(ح، خ)","(ح، ح)"],"prompt":"ما التجربة التي تناسب هذا الفضاء؟","choices":["اختيار لون واحد من (خ، ح).","مراقبة إشارة المرور مرتين من (خ، ح).","اختيار وجبة من خيارين وثلاثة أصناف.","سحب بطاقة من 1 إلى 4."],"correctChoice":1,"explanation":"الأزواج المرتبة هنا تدل على أن التجربة نفسها تكررت مرتين."},{"id":"rev-3","image":"images/canteen.svg","spaceDisplay":["(عصير، لبنة)","(عصير، جبنة)","(حليب، لبنة)","(حليب، جبنة)"],"prompt":"أي تجربة تناسب Ω؟","choices":["اختيار شطيرة واحدة فقط.","اختيار مشروب من (عصير، حليب) مع شطيرة من (لبنة، جبنة).","مراقبة مصباحين بلونين.","سحب بطاقة مرقمة من 1 إلى 4."],"correctChoice":1,"explanation":"العنصر الأول مشروب والعنصر الثاني شطيرة، لذلك التجربة المناسبة تجمع نوعين مختلفين من الخيارات."},{"id":"rev-4","image":"images/school-bag.svg","spaceDisplay":["أحمر","أزرق","أخضر"],"prompt":"أي تجربة تناسب Ω = {أحمر، أزرق، أخضر}؟","choices":["اختيار لون قلم من ثلاثة ألوان.","مراقبة نتيجتين متتاليتين من لونين.","اختيار وجبة من خيارين وثلاثة أصناف.","إدارة قرص مرقم من 1 إلى 3."],"correctChoice":0,"explanation":"هذا فضاء عيني لتجربة من مرحلة واحدة لها ثلاث نتائج لونية."},{"id":"rev-5","image":"images/hero-player.svg","spaceDisplay":["(سيف، ذهبي)","(سيف، فضي)","(قوس، ذهبي)","(قوس، فضي)"],"prompt":"أي تجربة تناسب Ω الآتي؟","choices":["تصميم شخصية لاعب: نوع القتال (سيف، قوس) ولون الدرع (ذهبي، فضي).","مراقبة إشارة المرور مرتين.","اختيار لون واحد من أربعة ألوان.","سحب بطاقة مرقمة من 1 إلى 4."],"correctChoice":0,"explanation":"الفضاء يضم جميع التزاوجات الممكنة بين نوع القتال ولون الدرع."},{"id":"rev-6","image":"images/outfit.svg","spaceDisplay":["(أبيض، نجمة)","(أبيض، قلب)","(أبيض، كتاب)","(أزرق، نجمة)","(أزرق، قلب)","(أزرق، كتاب)"],"prompt":"أي تجربة تناسب هذا الفضاء العيني؟","choices":["اختيار لون قميص (أبيض، أزرق) مع شارة حقيبة (نجمة، قلب، كتاب).","مراقبة الطقس صباحًا ومساءً من (ش، غ).","اختيار رقم من 1 إلى 6.","اختيار لون حقيبة من ستة ألوان."],"correctChoice":0,"explanation":"كل عنصر يتكوّن من لون قميص مع شارة مختلفة، وهذا يدل على مرحلتين من نوعين مختلفين."}],"glossaryCards":[{"title":"كيف أكتب Ω؟","body":"أكتب النتائج كلها داخل الأقواس المعقوفة { }، ويمكنك أن تبدأ بالرمز Ω = ولكن هذا ليس شرطًا للتصحيح."},{"title":"متى أستخدم زوجًا مرتبًا؟","body":"عندما توجد مرحلتان، ونريد أن نعرف نتيجة الأولى ثم الثانية. لذلك الترتيب مهم."},{"title":"كيف أعدّ العناصر بسرعة؟","body":"إذا كانت التجربة تمرّ بمراحل مستقلة، فغالبًا نضرب عدد الخيارات في كل مرحلة."},{"title":"هل ترتيب كتابة العناصر في Ω مهم؟","body":"يمكن أن ترتّب عناصر الفضاء العيني بأي ترتيب، لكن يجب أن تكون جميع النتائج الصحيحة موجودة دون نقصان أو زيادة."},{"title":"متى يكون الجواب خاطئًا؟","body":"إذا نسيت عنصرًا، أو أضفت عنصرًا غير ممكن، أو خلطت بين تجربة من مرحلة واحدة وتجربة من مرحلتين."},{"title":"فكرة تربوية سريعة","body":"اسأل نفسك دائمًا: ما الذي يمكن أن يحدث؟ هل يوجد خطوة واحدة أم خطوتان؟ وهل المرحلتان من النوع نفسه أم من نوعين مختلفين؟"}]};
const STORAGE_KEY = 'sample-space-lab-progress-v1';
const SOUND_STORAGE_KEY = 'sample-space-lab-sound-enabled-v1';

// ================== إعداد الأصوات المشتركة ==================
// المسار النسبي من apps/sample-space-lab/ إلى apps/audio/...
const successSounds = [
  new Audio('../audio/success/success_toolMatch_a.mp3'),
  new Audio('../audio/success/success_toolMatch_b.mp3'),
  new Audio('../audio/success/success_toolMatch_c.mp3'),
  new Audio('../audio/success/success_toolMatch_d.mp3'),
  new Audio('../audio/success/success_toolMatch_e.mp3')
].map(prepareAudioClip);

const failSounds = [
  new Audio('../audio/fail/fail_toolMatch_a.mp3'),
  new Audio('../audio/fail/fail_toolMatch_b.mp3'),
  new Audio('../audio/fail/fail_toolMatch_c.mp3')
].map(prepareAudioClip);

const state = {
  data: FALLBACK_DATA,
  currentTab: 'levels',
  currentLevelIndex: 0,
  currentQuestionIndex: 0,
  reverseIndex: 0,
  currentLevelSelectedChoice: null,
  currentReverseSelectedChoice: null,
  levelRevealChoice: false,
  reverseRevealChoice: false,
  matchingMode: 'terms',
  matchingSelectedLeft: null,
  matchingPairs: {},
  matchingPool: [],
  progress: loadProgress(),
  soundEnabled: loadSoundPreference(),
  audioContext: null,
  pendingLevelMessage: ''
};

const els = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheDom();
  bindEvents();
  initializeSoundUi();
  state.data = await loadData();
  ensureProgressShape();
  renderLevelCards();
  renderCurrentQuestion();
  renderMatching();
  renderReverse();
  renderGlossary();
  switchTab('levels');
  updateStats();
}

function cacheDom() {
  els.levelCards = byId('levelCards');
  els.modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
  els.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  els.soundToggleBtn = byId('soundToggleBtn');

  els.levelBadge = byId('levelBadge');
  els.questionCounter = byId('questionCounter');
  els.levelStars = byId('levelStars');
  els.questionImage = byId('questionImage');
  els.ruleBox = byId('ruleBox');
  els.questionPrompt = byId('questionPrompt');
  els.spacePreview = byId('spacePreview');
  els.stagesBox = byId('stagesBox');
  els.answerBox = byId('answerBox');
  els.feedbackBox = byId('feedbackBox');

  els.checkBtn = byId('checkBtn');
  els.hintBtn = byId('hintBtn');
  els.showBtn = byId('showBtn');
  els.nextBtn = byId('nextBtn');

  els.scoreValue = byId('scoreValue');
  els.completedLevelsValue = byId('completedLevelsValue');
  els.reverseProgressValue = byId('reverseProgressValue');
  els.matchingProgressValue = byId('matchingProgressValue');

  els.submodeButtons = Array.from(document.querySelectorAll('.submode-btn'));
  els.shuffleMatchingBtn = byId('shuffleMatchingBtn');
  els.matchLeft = byId('matchLeft');
  els.matchRight = byId('matchRight');
  els.matchLines = byId('matchLines');
  els.matchingBoard = byId('matchingBoard');
  els.matchingFeedback = byId('matchingFeedback');
  els.matchingStatusPill = byId('matchingStatusPill');

  els.reverseImage = byId('reverseImage');
  els.reversePrompt = byId('reversePrompt');
  els.reverseSpace = byId('reverseSpace');
  els.reverseChoices = byId('reverseChoices');
  els.reverseCounter = byId('reverseCounter');
  els.reverseCheckBtn = byId('reverseCheckBtn');
  els.reverseShowBtn = byId('reverseShowBtn');
  els.reverseNextBtn = byId('reverseNextBtn');
  els.reverseFeedback = byId('reverseFeedback');

  els.glossaryGrid = byId('glossaryGrid');
}

function bindEvents() {
  document.querySelector('.mode-bar').addEventListener('click', (event) => {
    const btn = event.target.closest('.mode-btn');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  els.levelCards.addEventListener('click', (event) => {
    const card = event.target.closest('.level-card');
    if (!card) return;
    const nextIndex = Number(card.dataset.levelIndex);
    if (Number.isNaN(nextIndex)) return;
    state.currentLevelIndex = nextIndex;
    state.currentQuestionIndex = 0;
    state.currentLevelSelectedChoice = null;
    state.levelRevealChoice = false;
    renderLevelCards();
    renderCurrentQuestion();
  });

  els.answerBox.addEventListener('click', (event) => {
    const choice = event.target.closest('.choice-card');
    if (choice) {
      state.currentLevelSelectedChoice = Number(choice.dataset.choiceIndex);
      state.levelRevealChoice = false;
      updateChoiceSelection(els.answerBox, state.currentLevelSelectedChoice);
      return;
    }

    const insertBtn = event.target.closest('[data-insert]');
    if (insertBtn) {
      const textarea = byId('setInput');
      if (!textarea) return;
      insertAtCursor(textarea, insertBtn.dataset.insert || '');
      return;
    }

    const clearBtn = event.target.closest('[data-action="clear-input"]');
    if (clearBtn) {
      const textarea = byId('setInput');
      if (textarea) textarea.value = '';
    }
  });

  els.checkBtn.addEventListener('click', checkCurrentQuestion);
  els.hintBtn.addEventListener('click', showCurrentHint);
  els.showBtn.addEventListener('click', showCurrentSolution);
  els.nextBtn.addEventListener('click', goToNextQuestion);

  document.querySelector('.submode-bar').addEventListener('click', (event) => {
    const btn = event.target.closest('.submode-btn');
    if (!btn) return;
    state.matchingMode = btn.dataset.matchMode;
    renderMatching();
  });
  els.shuffleMatchingBtn.addEventListener('click', () => renderMatching());

  els.matchLeft.addEventListener('click', (event) => {
    const card = event.target.closest('.match-card');
    if (!card || card.classList.contains('matched')) return;
    state.matchingSelectedLeft = card.dataset.pairId;
    updateMatchingSelection();
  });

  els.matchRight.addEventListener('click', (event) => {
    const card = event.target.closest('.match-card');
    if (!card || card.classList.contains('matched')) return;
    handleMatchingTry(card.dataset.pairId, card);
  });

  els.reverseChoices.addEventListener('click', (event) => {
    const choice = event.target.closest('.choice-card');
    if (!choice) return;
    state.currentReverseSelectedChoice = Number(choice.dataset.choiceIndex);
    state.reverseRevealChoice = false;
    updateChoiceSelection(els.reverseChoices, state.currentReverseSelectedChoice);
  });

  els.reverseCheckBtn.addEventListener('click', checkReverseQuestion);
  els.reverseShowBtn.addEventListener('click', showReverseSolution);
  els.reverseNextBtn.addEventListener('click', goToNextReverseQuestion);

  if (els.soundToggleBtn) {
    els.soundToggleBtn.addEventListener('click', toggleSound);
  }

  window.addEventListener('resize', debounce(drawMatchingLines, 60));
}

async function loadData() {
  try {
    const response = await fetch('content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('تعذر تحميل content.json');
    return await response.json();
  } catch (error) {
    console.warn('سيتم استخدام البيانات المضمّنة بدل الملف الخارجي.', error);
    return FALLBACK_DATA;
  }
}

function prepareAudioClip(audio) {
  audio.preload = 'auto';
  audio.volume = 0.92;
  audio._loadFailed = false;
  audio.addEventListener('error', () => {
    audio._loadFailed = true;
  });
  return audio;
}

function initializeSoundUi() {
  warmUpSoundPool(successSounds);
  warmUpSoundPool(failSounds);
  updateSoundToggle();
}

function warmUpSoundPool(pool) {
  pool.forEach((audio) => {
    try {
      audio.load();
    } catch (error) {
      /* تجاهل */
    }
  });
}

function loadSoundPreference() {
  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === null) return true;
    return raw !== 'false';
  } catch (error) {
    return true;
  }
}

function saveSoundPreference() {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(state.soundEnabled));
  } catch (error) {
    /* تجاهل */
  }
}

function updateSoundToggle() {
  if (!els.soundToggleBtn) return;
  els.soundToggleBtn.setAttribute('aria-pressed', String(Boolean(state.soundEnabled)));
  els.soundToggleBtn.textContent = state.soundEnabled ? '🔊 الصوت مفعّل' : '🔇 الصوت مكتوم';
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveSoundPreference();
  updateSoundToggle();
}

function pickRandom(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function playFeedbackSound(kind) {
  if (!state.soundEnabled) return;

  const pool = kind === 'success' ? successSounds : failSounds;
  const audio = pickRandom(pool);

  if (!audio || audio._loadFailed) {
    playFallbackToneSequence(kind);
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => playFallbackToneSequence(kind));
    }
  } catch (error) {
    playFallbackToneSequence(kind);
  }
}

function playFallbackToneSequence(kind) {
  if (!state.soundEnabled) return;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    if (!state.audioContext) {
      state.audioContext = new AudioContextCtor();
    }

    const ctx = state.audioContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = kind === 'success'
      ? [659.25, 783.99, 987.77]
      : [246.94, 207.65, 164.81];

    let start = ctx.currentTime + 0.01;
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = kind === 'success' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === 'success' ? 0.09 : 0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);

      start += kind === 'success' ? 0.12 : (index === 0 ? 0.11 : 0.13);
    });
  } catch (error) {
    /* تجاهل */
  }
}

function defaultProgress() {
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

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultProgress(), parsed || {});
  } catch (error) {
    return defaultProgress();
  }
}

function ensureProgressShape() {
  if (!state.progress || typeof state.progress !== 'object') {
    state.progress = defaultProgress();
  }
  state.progress.answered = state.progress.answered || {};
  state.progress.reverse = state.progress.reverse || {};
  state.progress.matching = state.progress.matching || { terms: false, experiments: false };
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (error) {
    /* تجاهل */
  }
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function debounce(fn, delay) {
  let timer = null;
  return function debounced(...args) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), delay);
  };
}

function levelQuestionKey(levelId, questionId) {
  return `level:${levelId}:${questionId}`;
}

function reverseQuestionKey(questionId) {
  return `reverse:${questionId}`;
}

function getCurrentLevel() {
  return state.data.levels[state.currentLevelIndex];
}

function getCurrentQuestion() {
  const level = getCurrentLevel();
  return level.questions[state.currentQuestionIndex];
}

function getCurrentRule(levelId) {
  return state.data.rules.find((rule) => rule.id === levelId) || state.data.rules[0];
}

function getLevelStatus(level) {
  const total = level.questions.length;
  let solved = 0;
  let correct = 0;
  let revealed = 0;

  level.questions.forEach((question) => {
    const key = levelQuestionKey(level.id, question.id);
    const entry = state.progress.answered[key];
    if (entry && (entry.correct || entry.revealed)) solved += 1;
    if (entry && entry.correct) correct += 1;
    if (entry && entry.revealed) revealed += 1;
  });

  const complete = solved === total;
  let stars = 0;
  if (complete) {
    if (correct === total && revealed === 0) stars = 3;
    else if (correct >= Math.ceil(total * 0.75)) stars = 2;
    else stars = 1;
  }

  return { total, solved, correct, revealed, complete, stars };
}

function countSolvedReverse() {
  return state.data.reverse.reduce((sum, question) => {
    const entry = state.progress.reverse[reverseQuestionKey(question.id)];
    return sum + ((entry && (entry.correct || entry.revealed)) ? 1 : 0);
  }, 0);
}

function countCompletedLevels() {
  return state.data.levels.reduce((sum, level) => sum + (getLevelStatus(level).complete ? 1 : 0), 0);
}

function countCompletedMatching() {
  const matching = state.progress.matching || {};
  return ['terms', 'experiments'].reduce((sum, key) => sum + (matching[key] ? 1 : 0), 0);
}

function awardPoints(bucket, key, points) {
  let store = null;
  if (bucket === 'level') store = state.progress.answered;
  if (bucket === 'reverse') store = state.progress.reverse;
  if (!store) return;

  const entry = store[key] || {};
  if (entry.correct || entry.revealed) {
    store[key] = Object.assign({}, entry, { correct: true });
    return;
  }
  store[key] = Object.assign({}, entry, { correct: true, revealed: false });
  state.progress.score += points;
  saveProgress();
}

function markRevealed(bucket, key) {
  let store = null;
  if (bucket === 'level') store = state.progress.answered;
  if (bucket === 'reverse') store = state.progress.reverse;
  if (!store) return;

  const entry = store[key] || {};
  if (entry.correct) return;
  store[key] = Object.assign({}, entry, { revealed: true });
  saveProgress();
}

function renderStars(count) {
  const stars = [];
  for (let i = 0; i < 3; i += 1) {
    stars.push(`<span class="${i < count ? 'on' : 'off'}">★</span>`);
  }
  return stars.join('');
}

function formatSpace(items) {
  const list = Array.isArray(items) ? items : [];
  return `Ω = {${list.join('، ')}}`;
}

function renderLevelCards() {
  els.levelCards.innerHTML = state.data.levels.map((level, index) => {
    const status = getLevelStatus(level);
    const progressWidth = status.total ? (status.solved / status.total) * 100 : 0;

    return `
      <button class="level-card ${index === state.currentLevelIndex ? 'active' : ''} ${status.complete ? 'done' : ''}" data-level-index="${index}">
        <div class="lvl-top">
          <span class="lvl-emoji">${escapeHTML(level.emoji || '•')}</span>
          <span class="stars">${renderStars(status.stars)}</span>
        </div>
        <h3>${escapeHTML(level.title)}</h3>
        <p>${escapeHTML(level.objective || '')}</p>
        <div class="mini-progress"><span style="width:${progressWidth}%;"></span></div>
        <div class="lvl-foot">
          <span>${status.solved} / ${status.total}</span>
          <span>${status.complete ? 'مكتمل' : 'قيد الإنجاز'}</span>
        </div>
      </button>
    `;
  }).join('');
}

function renderCurrentQuestion() {
  const level = getCurrentLevel();
  const question = getCurrentQuestion();
  const progressKey = levelQuestionKey(level.id, question.id);
  const entry = state.progress.answered[progressKey];
  const rule = getCurrentRule(level.id);

  els.levelBadge.textContent = level.title;
  els.questionCounter.textContent = `السؤال ${state.currentQuestionIndex + 1} من ${level.questions.length}`;
  els.levelStars.innerHTML = renderStars(getLevelStatus(level).stars);
  els.questionImage.src = question.image || level.heroImage || 'images/thumb.svg';
  els.questionImage.alt = `صورة توضيحية: ${question.prompt}`;
  els.questionPrompt.textContent = question.prompt;

  els.ruleBox.innerHTML = `
    <b>${escapeHTML(rule.title)}</b>
    <span>${escapeHTML(rule.text)}</span>
    <span class="mini-space">${escapeHTML(rule.miniExample || '')}</span>
  `;

  if (Array.isArray(question.spaceDisplay) && question.spaceDisplay.length) {
    els.spacePreview.hidden = false;
    els.spacePreview.innerHTML = `<strong>Ω</strong> = {${question.spaceDisplay.map(escapeHTML).join('، ')}}`;
  } else {
    els.spacePreview.hidden = true;
    els.spacePreview.innerHTML = '';
  }

  renderStages(question.stages || []);
  renderQuestionAnswerArea(question, entry);

  if (state.pendingLevelMessage) {
    setFeedback(els.feedbackBox, 'info', 'أحسنت!', state.pendingLevelMessage);
    state.pendingLevelMessage = '';
  } else if (entry && entry.correct) {
    setFeedback(els.feedbackBox, 'success', 'إجابة صحيحة محفوظة', question.explanation || '');
  } else if (entry && entry.revealed) {
    setFeedback(els.feedbackBox, 'warn', 'تم عرض الحل سابقًا', question.explanation || '');
  } else {
    resetFeedback(els.feedbackBox);
  }

  updateStats();
}

function renderStages(stages) {
  if (!stages.length) {
    els.stagesBox.innerHTML = '';
    return;
  }

  els.stagesBox.innerHTML = stages.map((stage) => `
    <div class="stage-card">
      <div class="stage-title">${escapeHTML(stage.label)}</div>
      <div class="stage-options">
        ${(stage.options || []).map((option) => `<span class="option-chip">${escapeHTML(option)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderQuestionAnswerArea(question, entry) {
  state.currentLevelSelectedChoice = null;
  state.levelRevealChoice = false;

  if (question.type === 'write_space') {
    els.answerBox.innerHTML = `
      <label for="setInput">اكتب الفضاء العيني:</label>
      <textarea id="setInput" placeholder="مثال: Ω = {أزرق، أخضر، أحمر}"></textarea>
      <div class="input-tools">
        <button type="button" class="btn small ghost" data-insert="Ω = {  }">إدراج Ω</button>
        <button type="button" class="btn small ghost" data-insert="( ، )">إدراج زوج مرتب</button>
        <button type="button" class="btn small ghost" data-action="clear-input">مسح</button>
      </div>
      <div class="input-note">يمكنك كتابة العناصر بأي ترتيب، لكن يجب أن تكتب جميع النتائج الصحيحة فقط.</div>
    `;
    const textarea = byId('setInput');
    textarea.value = (entry && (entry.correct || entry.revealed)) ? formatSpace(question.sampleSpace) : '';
    return;
  }

  if (question.type === 'count_space') {
    els.answerBox.innerHTML = `
      <label for="countInput">اكتب عدد عناصر الفضاء العيني:</label>
      <input id="countInput" type="number" min="0" step="1" inputmode="numeric" placeholder="مثال: 4">
      <div class="input-note">فكّر: هل أعدّ مباشرة، أم أستخدم الضرب بين عدد الخيارات في كل مرحلة؟</div>
    `;
    const input = byId('countInput');
    input.value = (entry && (entry.correct || entry.revealed)) ? String(question.correctCount || (question.sampleSpace || []).length) : '';
    return;
  }

  if (question.type === 'choose_space' || question.type === 'choose_experiment') {
    const shouldReveal = Boolean(entry && (entry.correct || entry.revealed));
    state.currentLevelSelectedChoice = shouldReveal ? question.correctChoice : null;
    state.levelRevealChoice = shouldReveal;

    const cards = (question.choices || []).map((choice, index) => {
      const selectedClass = state.currentLevelSelectedChoice === index ? 'selected' : '';
      const correctClass = shouldReveal && index === question.correctChoice ? 'correct' : '';
      const cardHTML = Array.isArray(choice)
        ? `<div><strong>Ω</strong> = {${choice.map(escapeHTML).join('، ')}}</div>`
        : `<div>${escapeHTML(choice)}</div>`;

      return `
        <button type="button" class="choice-card ${selectedClass} ${correctClass}" data-choice-index="${index}">
          ${cardHTML}
        </button>
      `;
    }).join('');

    els.answerBox.innerHTML = `
      <div class="choices-grid">${cards}</div>
      <div class="input-note">اختر البطاقة التي تمثل الجواب الصحيح.</div>
    `;
  }
}

function updateChoiceSelection(container, selectedIndex) {
  container.querySelectorAll('.choice-card').forEach((card) => {
    card.classList.toggle('selected', Number(card.dataset.choiceIndex) === selectedIndex);
  });
}

function showCurrentHint() {
  const question = getCurrentQuestion();
  setFeedback(els.feedbackBox, 'info', 'تلميح', question.hint || 'فكّر في جميع النتائج الممكنة خطوة خطوة.');
}

function checkCurrentQuestion() {
  const level = getCurrentLevel();
  const question = getCurrentQuestion();
  const key = levelQuestionKey(level.id, question.id);

  if (question.type === 'write_space') {
    const textarea = byId('setInput');
    const parsed = parseSetInput(textarea ? textarea.value : '');
    if (!parsed.length) {
      setFeedback(els.feedbackBox, 'warn', 'ما زال الجواب فارغًا', 'اكتب عناصر الفضاء العيني داخل { }، أو ابدأ بكتابة Ω = ثم المجموعة.');
      return;
    }

    const correct = compareSets(parsed, question.sampleSpace || []);
    if (correct) {
      awardPoints('level', key, 10);
      playFeedbackSound('success');
      renderLevelCards();
      setFeedback(els.feedbackBox, 'success', 'إجابة صحيحة', question.explanation || '');
      updateStats();
      return;
    }

    const expectedCount = (question.sampleSpace || []).length;
    playFeedbackSound('fail');
    setFeedback(
      els.feedbackBox,
      'error',
      'ليست الإجابة الصحيحة بعد',
      `جرّب من جديد. تذكّر أن عدد العناصر الصحيح هنا هو ${expectedCount}.`
    );
    return;
  }

  if (question.type === 'count_space') {
    const input = byId('countInput');
    const value = parseArabicNumber(input ? input.value : '');
    if (value === null) {
      setFeedback(els.feedbackBox, 'warn', 'أدخل عددًا أولًا', 'يمكنك كتابة العدد بالأرقام العربية أو المعتادة.');
      return;
    }

    const target = Number(question.correctCount || (question.sampleSpace || []).length);
    if (value === target) {
      awardPoints('level', key, 10);
      playFeedbackSound('success');
      renderLevelCards();
      setFeedback(els.feedbackBox, 'success', 'إجابة صحيحة', question.explanation || '');
      updateStats();
      return;
    }

    playFeedbackSound('fail');
    setFeedback(els.feedbackBox, 'error', 'العدد غير صحيح', 'أعد التفكير في عدد الخيارات في كل مرحلة، ثم جرّب ثانية.');
    return;
  }

  if (question.type === 'choose_space' || question.type === 'choose_experiment') {
    if (state.currentLevelSelectedChoice === null || Number.isNaN(state.currentLevelSelectedChoice)) {
      setFeedback(els.feedbackBox, 'warn', 'اختر بطاقة أولًا', 'انقر على البطاقة التي ترى أنها تمثل الإجابة الصحيحة.');
      return;
    }

    if (state.currentLevelSelectedChoice === question.correctChoice) {
      awardPoints('level', key, 10);
      playFeedbackSound('success');
      state.levelRevealChoice = true;
      renderQuestionAnswerArea(question, state.progress.answered[key]);
      setFeedback(els.feedbackBox, 'success', 'إجابة صحيحة', question.explanation || '');
      renderLevelCards();
      updateStats();
      return;
    }

    highlightWrongChoice(els.answerBox, state.currentLevelSelectedChoice);
    playFeedbackSound('fail');
    setFeedback(els.feedbackBox, 'error', 'هذه ليست البطاقة الصحيحة', 'تأمّل شكل عناصر Ω: هل هي مفردة أم أزواج مرتبة؟ وهل تمثل مرحلة واحدة أم مرحلتين؟');
  }
}

function showCurrentSolution() {
  const level = getCurrentLevel();
  const question = getCurrentQuestion();
  const key = levelQuestionKey(level.id, question.id);

  if (question.type === 'write_space') {
    const textarea = byId('setInput');
    if (textarea) textarea.value = formatSpace(question.sampleSpace || []);
  }

  if (question.type === 'count_space') {
    const input = byId('countInput');
    if (input) input.value = String(question.correctCount || (question.sampleSpace || []).length);
  }

  if (question.type === 'choose_space' || question.type === 'choose_experiment') {
    state.currentLevelSelectedChoice = question.correctChoice;
    state.levelRevealChoice = true;
    renderQuestionAnswerArea(question, { revealed: true });
  }

  markRevealed('level', key);
  renderLevelCards();
  updateStats();
  setFeedback(
    els.feedbackBox,
    'warn',
    'هذا هو الحل',
    `${question.explanation || ''}${question.type === 'write_space' ? ` <br><strong>الصيغة الصحيحة:</strong> ${escapeHTML(formatSpace(question.sampleSpace || []))}` : ''}`
  );
}

function goToNextQuestion() {
  const level = getCurrentLevel();
  if (state.currentQuestionIndex < level.questions.length - 1) {
    state.currentQuestionIndex += 1;
    renderCurrentQuestion();
    return;
  }

  const status = getLevelStatus(level);
  const nextLevelIndex = state.currentLevelIndex + 1;

  if (status.complete) {
    state.pendingLevelMessage = `أنهيت ${level.title}. ${status.stars ? `حصلت على ${status.stars} من 3 نجوم.` : ''}`;
  } else {
    state.pendingLevelMessage = `وصلت إلى آخر سؤال في ${level.title}. يمكنك العودة لتحسين الإجابات أو عرض الحلول الناقصة.`;
  }

  if (nextLevelIndex < state.data.levels.length) {
    state.currentLevelIndex = nextLevelIndex;
    state.currentQuestionIndex = 0;
    renderLevelCards();
    renderCurrentQuestion();
    return;
  }

  renderCurrentQuestion();
  setFeedback(els.feedbackBox, 'info', 'وصلت إلى نهاية المستويات', state.pendingLevelMessage || 'يمكنك الآن الانتقال إلى المطابقة أو إلى النمط العكسي.');
  state.pendingLevelMessage = '';
}

function renderMatching() {
  els.submodeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.matchMode === state.matchingMode);
  });

  state.matchingSelectedLeft = null;
  state.matchingPairs = {};
  state.matchingPool = shuffle((state.data.matching[state.matchingMode] || []).map((pair, index) => ({
    pairId: String(index),
    left: pair.left,
    right: pair.right
  })));

  const sourcePairs = (state.data.matching[state.matchingMode] || []).map((pair, index) => ({
    pairId: String(index),
    left: pair.left,
    right: pair.right
  }));

  els.matchLeft.innerHTML = sourcePairs.map((pair) => `
    <button type="button" class="match-card" data-pair-id="${pair.pairId}">
      ${escapeHTML(pair.left)}
    </button>
  `).join('');

  els.matchRight.innerHTML = state.matchingPool.map((pair) => `
    <button type="button" class="match-card" data-pair-id="${pair.pairId}">
      ${escapeHTML(pair.right)}
    </button>
  `).join('');

  resetFeedback(els.matchingFeedback);
  updateMatchingPill();
  requestAnimationFrame(drawMatchingLines);
}

function updateMatchingSelection() {
  els.matchLeft.querySelectorAll('.match-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.pairId === state.matchingSelectedLeft);
  });
}

function handleMatchingTry(rightPairId, rightCard) {
  if (!state.matchingSelectedLeft) {
    setFeedback(els.matchingFeedback, 'warn', 'ابدأ من العمود الأيسر', 'اختر أولًا بطاقة من العمود الأيسر، ثم طابقها مع البطاقة المناسبة في العمود الأيمن.');
    return;
  }

  const leftPairId = state.matchingSelectedLeft;
  const leftCard = els.matchLeft.querySelector(`.match-card[data-pair-id="${CSS.escape(leftPairId)}"]`);

  if (leftPairId === rightPairId) {
    state.matchingPairs[leftPairId] = rightPairId;
    leftCard.classList.add('matched');
    rightCard.classList.add('matched');
    leftCard.classList.remove('selected');
    state.matchingSelectedLeft = null;
    updateMatchingPill();
    requestAnimationFrame(drawMatchingLines);

    const totalPairs = (state.data.matching[state.matchingMode] || []).length;
    const matchedCount = Object.keys(state.matchingPairs).length;
    playFeedbackSound('success');
    setFeedback(els.matchingFeedback, 'success', 'مطابقة صحيحة', `أحسنت! أنجزت ${matchedCount} من ${totalPairs}.`);

    if (matchedCount === totalPairs) {
      if (!state.progress.matching[state.matchingMode]) {
        state.progress.matching[state.matchingMode] = true;
        state.progress.score += 15;
        saveProgress();
      }
      setFeedback(
        els.matchingFeedback,
        'success',
        'أكملت جولة المطابقة',
        state.matchingMode === 'terms'
          ? 'الآن أصبحت المصطلحات الأساسية أوضح. جرّب جولة "تجربة وفضاؤها".'
          : 'أحسنت! لقد ربطت بين التجربة وفضائها العيني بنجاح.'
      );
      updateStats();
    }
    return;
  }

  leftCard.classList.add('shake');
  rightCard.classList.add('shake');
  window.setTimeout(() => {
    leftCard.classList.remove('shake');
    rightCard.classList.remove('shake');
  }, 280);

  playFeedbackSound('fail');
  setFeedback(els.matchingFeedback, 'error', 'ليست المطابقة الصحيحة', 'جرّب مرة أخرى، وانظر إلى معنى المصطلح أو شكل الفضاء العيني بعناية.');
}

function updateMatchingPill() {
  const total = (state.data.matching[state.matchingMode] || []).length;
  const matched = Object.keys(state.matchingPairs).length;
  els.matchingStatusPill.textContent = `${matched} / ${total}`;
}

function drawMatchingLines() {
  if (window.innerWidth <= 720) return;
  const boardRect = els.matchingBoard.getBoundingClientRect();
  const width = Math.max(10, boardRect.width);
  const height = Math.max(10, boardRect.height);

  els.matchLines.setAttribute('viewBox', `0 0 ${width} ${height}`);
  els.matchLines.innerHTML = '';

  Object.keys(state.matchingPairs).forEach((pairId) => {
    const leftEl = els.matchLeft.querySelector(`.match-card[data-pair-id="${CSS.escape(pairId)}"]`);
    const rightEl = els.matchRight.querySelector(`.match-card[data-pair-id="${CSS.escape(pairId)}"]`);
    if (!leftEl || !rightEl) return;

    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();

    const x1 = leftRect.left - boardRect.left + leftRect.width;
    const y1 = leftRect.top - boardRect.top + leftRect.height / 2;
    const x2 = rightRect.left - boardRect.left;
    const y2 = rightRect.top - boardRect.top + rightRect.height / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    els.matchLines.appendChild(line);

    const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c1.setAttribute('cx', x1);
    c1.setAttribute('cy', y1);
    c1.setAttribute('r', 4);
    els.matchLines.appendChild(c1);

    const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c2.setAttribute('cx', x2);
    c2.setAttribute('cy', y2);
    c2.setAttribute('r', 4);
    els.matchLines.appendChild(c2);
  });
}

function renderReverse() {
  const question = state.data.reverse[state.reverseIndex];
  const entry = state.progress.reverse[reverseQuestionKey(question.id)];
  const shouldReveal = Boolean(entry && (entry.correct || entry.revealed));

  state.currentReverseSelectedChoice = shouldReveal ? question.correctChoice : null;
  state.reverseRevealChoice = shouldReveal;

  els.reverseCounter.textContent = `السؤال ${state.reverseIndex + 1} من ${state.data.reverse.length}`;
  els.reverseImage.src = question.image || 'images/reverse.svg';
  els.reverseImage.alt = question.prompt;
  els.reversePrompt.textContent = question.prompt;
  els.reverseSpace.innerHTML = `<strong>Ω</strong> = {${question.spaceDisplay.map(escapeHTML).join('، ')}}`;

  els.reverseChoices.innerHTML = (question.choices || []).map((choice, index) => `
    <button type="button" class="choice-card ${shouldReveal && index === question.correctChoice ? 'correct' : ''} ${state.currentReverseSelectedChoice === index ? 'selected' : ''}" data-choice-index="${index}">
      ${escapeHTML(choice)}
    </button>
  `).join('');

  if (entry && entry.correct) {
    setFeedback(els.reverseFeedback, 'success', 'إجابة صحيحة محفوظة', question.explanation || '');
  } else if (entry && entry.revealed) {
    setFeedback(els.reverseFeedback, 'warn', 'تم عرض الحل سابقًا', question.explanation || '');
  } else {
    resetFeedback(els.reverseFeedback);
  }

  updateStats();
}

function checkReverseQuestion() {
  const question = state.data.reverse[state.reverseIndex];
  const key = reverseQuestionKey(question.id);

  if (state.currentReverseSelectedChoice === null || Number.isNaN(state.currentReverseSelectedChoice)) {
    setFeedback(els.reverseFeedback, 'warn', 'اختر بطاقة أولًا', 'ابحث عن التجربة التي تنتج العناصر نفسها تمامًا.');
    return;
  }

  if (state.currentReverseSelectedChoice === question.correctChoice) {
    awardPoints('reverse', key, 8);
    playFeedbackSound('success');
    state.reverseRevealChoice = true;
    renderReverse();
    setFeedback(els.reverseFeedback, 'success', 'إجابة صحيحة', question.explanation || '');
    updateStats();
    return;
  }

  highlightWrongChoice(els.reverseChoices, state.currentReverseSelectedChoice);
  playFeedbackSound('fail');
  setFeedback(els.reverseFeedback, 'error', 'هذه ليست التجربة المناسبة', 'حلّل شكل العناصر: هل هي مفردة أم أزواج؟ وهل تعبّر عن نوع واحد من النتائج أم عن نوعين مختلفين؟');
}

function showReverseSolution() {
  const question = state.data.reverse[state.reverseIndex];
  const key = reverseQuestionKey(question.id);
  markRevealed('reverse', key);
  state.currentReverseSelectedChoice = question.correctChoice;
  state.reverseRevealChoice = true;
  renderReverse();
  setFeedback(els.reverseFeedback, 'warn', 'هذا هو الحل', question.explanation || '');
  updateStats();
}

function goToNextReverseQuestion() {
  if (state.reverseIndex < state.data.reverse.length - 1) {
    state.reverseIndex += 1;
    renderReverse();
    return;
  }
  state.reverseIndex = 0;
  renderReverse();
  setFeedback(els.reverseFeedback, 'info', 'وصلت إلى نهاية النمط العكسي', 'يمكنك إعادة المحاولة لتحسين إجاباتك أو العودة إلى المستويات.');
}

function renderGlossary() {
  const cards = [];

  (state.data.rules || []).forEach((rule) => {
    cards.push(`
      <article class="card glossary-card">
        <div class="tagline">قاعدة</div>
        <h3>${escapeHTML(rule.title)}</h3>
        <p>${escapeHTML(rule.text)}</p>
        <div class="space-preview">${escapeHTML(rule.miniExample || '')}</div>
      </article>
    `);
  });

  (state.data.matching.terms || []).forEach((pair) => {
    cards.push(`
      <article class="card glossary-card">
        <div class="tagline">مصطلح</div>
        <h3>${escapeHTML(pair.left)}</h3>
        <p>${escapeHTML(pair.right)}</p>
      </article>
    `);
  });

  (state.data.glossaryCards || []).forEach((card) => {
    cards.push(`
      <article class="card glossary-card">
        <div class="tagline">بطاقة فكرة</div>
        <h3>${escapeHTML(card.title)}</h3>
        <p>${escapeHTML(card.body)}</p>
      </article>
    `);
  });

  els.glossaryGrid.innerHTML = cards.join('');
}

function switchTab(tabName) {
  state.currentTab = tabName;
  els.modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  els.tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${tabName}Tab`);
  });

  if (tabName === 'matching') {
    requestAnimationFrame(drawMatchingLines);
  }
}

function setFeedback(element, type, title, body) {
  element.className = `feedback ${type}`;
  element.innerHTML = `<strong>${escapeHTML(title)}</strong><div>${body || ''}</div>`;
}

function resetFeedback(element) {
  element.className = 'feedback';
  element.innerHTML = '<span class="muted-text">جرّب بنفسك، ثم اضغط "تحقق".</span>';
}

function highlightWrongChoice(container, wrongIndex) {
  const wrongCard = container.querySelector(`.choice-card[data-choice-index="${wrongIndex}"]`);
  if (!wrongCard) return;
  wrongCard.classList.add('wrong');
  window.setTimeout(() => wrongCard.classList.remove('wrong'), 900);
}

function parseArabicNumber(value) {
  if (value === null || value === undefined) return null;
  const latin = String(value)
    .trim()
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  if (!latin) return null;
  const num = Number(latin);
  return Number.isFinite(num) ? num : null;
}

function splitTopLevel(text) {
  const parts = [];
  let current = '';
  let depthParen = 0;
  let depthSquare = 0;
  let depthCurly = 0;

  for (const char of text) {
    if (char === '(') depthParen += 1;
    if (char === ')') depthParen = Math.max(0, depthParen - 1);
    if (char === '[') depthSquare += 1;
    if (char === ']') depthSquare = Math.max(0, depthSquare - 1);
    if (char === '{') depthCurly += 1;
    if (char === '}') depthCurly = Math.max(0, depthCurly - 1);

    const isSeparator = /[,،؛|\n]/.test(char);
    const atTop = depthParen === 0 && depthSquare === 0 && depthCurly === 0;

    if (isSeparator && atTop) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function normalizeItem(item) {
  return String(item || '')
    .replace(/^\s*Ω\s*=\s*/i, '')
    .replace(/^\s*omega\s*=\s*/i, '')
    .replace(/[{}]/g, '')
    .replace(/\s*,\s*/g, '، ')
    .replace(/\s*،\s*/g, '، ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSetInput(input) {
  if (!input || !String(input).trim()) return [];
  let text = String(input).trim();
  text = text.replace(/^\s*Ω\s*=\s*/i, '').replace(/^\s*omega\s*=\s*/i, '');

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace + 1, lastBrace);
  }

  return splitTopLevel(text).map(normalizeItem).filter(Boolean);
}

function compareSets(userItems, expectedItems) {
  const normalizedUser = userItems.map(normalizeItem).sort();
  const normalizedExpected = (expectedItems || []).map(normalizeItem).sort();
  if (normalizedUser.length !== normalizedExpected.length) return false;
  return normalizedUser.every((item, index) => item === normalizedExpected[index]);
}

function insertAtCursor(textarea, snippet) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${snippet}${after}`;
  textarea.focus();

  let cursor = start + snippet.length;
  if (snippet === 'Ω = {  }') cursor = start + snippet.length - 2;
  if (snippet === '( ، )') cursor = start + snippet.length - 3;
  textarea.setSelectionRange(cursor, cursor);
}

function updateStats() {
  els.scoreValue.textContent = String(state.progress.score || 0);
  els.completedLevelsValue.textContent = `${countCompletedLevels()} / ${state.data.levels.length}`;
  els.reverseProgressValue.textContent = `${countSolvedReverse()} / ${state.data.reverse.length}`;
  els.matchingProgressValue.textContent = `${countCompletedMatching()} / 2`;
}
