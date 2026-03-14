
const DATA_URL = './data/theorems.json';

const DOMAIN_ICONS = {
  'زوايا وخطوط': '∠',
  'مثلث': '△',
  'شكل رباعي': '▱',
  'موضع هندسي': '⌖',
  'مضلع': '⬠',
  'دائرة': '◯'
};

const SPECIFIC_QUESTIONS = {
  "1": [
    {
      "key": "direct",
      "title": "زاويتان متجاورتان على مستقيم",
      "level": "تطبيق مباشر",
      "statement": "إذا كانت ∠1 = 3x + 20 و∠2 = 2x + 10 وهما زاويتان متجاورتان على استقامة واحدة، فأوجد x وقياس كل زاوية.",
      "hint": "استعمل أن مجموع الزاويتين المتجاورتين على مستقيم يساوي 180°."
    }
  ],
  "2": [
    {
      "key": "direct",
      "title": "زوايا متقابلة بالرأس",
      "level": "تطبيق مباشر",
      "statement": "يتقاطع مستقيمان في النقطة O. إذا كانت إحدى الزوايا تساوي 5x − 8 والزاوية المتقابلة بالرأس معها تساوي 3x + 16، فأوجد x وقياس الزاويتين.",
      "hint": "الزوايا المتقابلة بالرأس متساوية."
    }
  ],
  "4": [
    {
      "key": "proof",
      "title": "قاعدة مثلث متساوي الساقين",
      "level": "برهان قصير",
      "statement": "في المثلث ABC إذا كان AB = AC، فبرهن أن ∠B = ∠C.",
      "hint": "حدِّد نوع المثلث أولًا، ثم استعمل نظرية زاويتي القاعدة."
    }
  ],
  "5": [
    {
      "key": "check",
      "title": "هل يمكن تكوين مثلث؟",
      "level": "تحقّق",
      "statement": "هل يمكن تكوين مثلث أطوال أضلاعه 4 سم، 7 سم، 12 سم؟ فسّر إجابتك باستعمال النظرية المناسبة.",
      "hint": "قارن مجموع كل ضلعين بالضلع الثالث."
    }
  ],
  "12": [
    {
      "key": "angles",
      "title": "مجموع زوايا مثلث",
      "level": "تطبيق مباشر",
      "statement": "في المثلث ABC قياس ∠A = 2x + 10 و∠B = x + 20 و∠C = 3x. أوجد x ثم أوجد قياس الزوايا الثلاث.",
      "hint": "مجموع زوايا أي مثلث يساوي 180°."
    }
  ],
  "13": [
    {
      "key": "exterior-angle",
      "title": "زاوية خارجية في مثلث",
      "level": "تطبيق مباشر",
      "statement": "في المثلث ABC مُدِّد الضلع BC إلى النقطة D. إذا كانت ∠A = 45° و∠B = 58°، فأوجد قياس الزاوية الخارجية ∠ACD.",
      "hint": "الزاوية الخارجية تساوي مجموع الزاويتين الداخليتين البعيدتين."
    }
  ],
  "14": [
    {
      "key": "midsegment",
      "title": "قطعة متوسطة في مثلث",
      "level": "تطبيق مباشر",
      "statement": "في المثلث ABC النقطتان D وE هما منتصَفا الضلعين AB وAC. إذا كان BC = 18 سم، فأوجد طول DE واذكر العلاقة بين DE وBC.",
      "hint": "القطعة المتوسطة في المثلث توازي الضلع الثالث وتساوي نصفه."
    }
  ],
  "17": [
    {
      "key": "sas",
      "title": "تطابق ضلع-زاوية-ضلع",
      "level": "إثبات",
      "statement": "في المثلثين ABC وDEF إذا كان AB = DE و∠B = ∠E وBC = EF، فهل المثلثان متطابقان؟ سمِّ معيار التطابق واستنتج علاقة بين AC وDF.",
      "hint": "حدِّد العنصر المحصور بين الضلعين في كل مثلث."
    }
  ],
  "18": [
    {
      "key": "asa",
      "title": "تطابق زاوية-ضلع-زاوية",
      "level": "إثبات",
      "statement": "في المثلثين ABC وDEF إذا كان ∠A = ∠D وAB = DE و∠B = ∠E، فاستعمل معيار التطابق المناسب لإثبات أن AC = DF.",
      "hint": "الضلع المعطى محصور بين زاويتين متناظرتين."
    }
  ],
  "19": [
    {
      "key": "sss",
      "title": "تطابق ضلع-ضلع-ضلع",
      "level": "إثبات",
      "statement": "في المثلثين ABC وDEF إذا كان AB = DE وBC = EF وAC = DF، فبرهن أن ∠C = ∠F.",
      "hint": "بعد إثبات التطابق يمكن نقل المعلومة إلى الزوايا المتناظرة."
    }
  ],
  "21": [
    {
      "key": "kite",
      "title": "القطر الرئيسي في الدالتون",
      "level": "استنتاج",
      "statement": "في دالتون ABCD حيث AB = AD وCB = CD، ارسم القطر AC. ماذا يمكن أن تستنتج عن القطر AC بالنسبة للزاويتين A وC؟",
      "hint": "استعمل خاصية القطر الرئيسي في الدالتون."
    }
  ],
  "26": [
    {
      "key": "parallelogram-angles",
      "title": "زوايا متوازي الأضلاع",
      "level": "تطبيق مباشر",
      "statement": "في متوازي الأضلاع ABCD إذا كانت ∠A = 3x + 10 و∠B = 2x + 20، فأوجد x ثم أوجد قياس الزوايا الأربع.",
      "hint": "الزوايا المتجاورة في متوازي الأضلاع متكاملة، والزوايا المتقابلة متساوية."
    }
  ],
  "33": [
    {
      "key": "rhombus-diagonal",
      "title": "أقطار المعين وتنصيف الزوايا",
      "level": "إثبات",
      "statement": "في معين ABCD يتقاطع القطـران AC وBD في النقطة O. ماذا يمكن أن تستنتج عن العلاقة بين القطر AC والزاويتين A وC؟",
      "hint": "في المعين كل قطر ينصف زاويتين متقابلتين."
    }
  ],
  "37": [
    {
      "key": "rectangle-diagonals",
      "title": "أقطار المستطيل",
      "level": "تطبيق مباشر",
      "statement": "في المستطيل ABCD إذا كان طول القطر AC = 12 سم، فأوجد طول القطر BD مع ذكر السبب.",
      "hint": "أقطار المستطيل متساوية."
    }
  ],
  "39": [
    {
      "key": "isosceles-trapezoid-angles",
      "title": "زوايا شبه المنحرف متساوي الساقين",
      "level": "تطبيق مباشر",
      "statement": "في شبه المنحرف متساوي الساقين ABCD حيث AB ∥ CD، إذا كانت ∠A = 70°، فأوجد ∠B و∠C و∠D.",
      "hint": "زاويتا كل قاعدة في شبه المنحرف متساوي الساقين متساويتان."
    }
  ],
  "43": [
    {
      "key": "trapezoid-midsegment",
      "title": "القطعة المتوسطة في شبه المنحرف",
      "level": "تطبيق مباشر",
      "statement": "في شبه المنحرف ABCD إذا كان طول القاعدتين AB = 8 سم وCD = 14 سم، فأوجد طول القطعة المتوسطة.",
      "hint": "طول القطعة المتوسطة يساوي نصف مجموع القاعدتين."
    }
  ],
  "45": [
    {
      "key": "medians",
      "title": "تلاقي المتوسطات",
      "level": "ملاحظة هندسية",
      "statement": "في مثلث ABC ارسم المتوسطات الثلاثة. ماذا تلاحظ عن نقطة تقاطعها؟ وماذا تُسمّى هذه النقطة؟",
      "hint": "المتوسطات تتلاقى في نقطة واحدة."
    }
  ],
  "46": [
    {
      "key": "centroid-ratio",
      "title": "نسبة مركز الثقل",
      "level": "تطبيق مباشر",
      "statement": "في مثلث ABC إذا كانت G مركز الثقل وD منتصف BC، وكان طول AG = 8 سم، فأوجد طول GD ثم طول AD.",
      "hint": "مركز الثقل يقسم كل متوسط بنسبة 2 : 1 من جهة الرأس."
    }
  ],
  "49": [
    {
      "key": "incenter",
      "title": "مركز الدائرة المحصورة",
      "level": "استنتاج",
      "statement": "في مثلث ABC ارسم منصفات الزوايا الداخلية. ماذا تمثل نقطة تقاطعها؟ وما الخاصية المرتبطة بالمسافات من هذه النقطة إلى أضلاع المثلث؟",
      "hint": "تقاطع منصفات الزوايا هو مركز الدائرة المحصورة."
    }
  ],
  "54": [
    {
      "key": "circumcenter",
      "title": "مركز الدائرة المحيطة",
      "level": "استنتاج",
      "statement": "في مثلث ABC ارسم الأعمدة المتوسطة للأضلاع الثلاثة. ماذا تمثل نقطة تقاطعها؟ وما العلاقة بينها وبين رؤوس المثلث؟",
      "hint": "تقاطع الأعمدة المتوسطة هو مركز الدائرة المحيطة."
    }
  ],
  "56": [
    {
      "key": "cyclic-quad",
      "title": "شرط الرباعي الدائري",
      "level": "تطبيق مباشر",
      "statement": "في رباعي ABCD إذا كانت ∠A = 108° و∠C = 72°، فهل يمكن أن يكون رباعيًا دائريًا؟ علّل.",
      "hint": "في الرباعي الدائري مجموع زاويتين متقابلتين يساوي 180°."
    }
  ],
  "61": [
    {
      "key": "central-arc",
      "title": "زوايا مركزية وأقواس",
      "level": "تطبيق مباشر",
      "statement": "في دائرة مركزها O إذا كانت ∠AOB = 75° و∠COD = 75°، فما العلاقة بين القوسين AB وCD؟",
      "hint": "الزوايا المركزية المتساوية تقابل أقواسًا متساوية."
    }
  ],
  "69": [
    {
      "key": "inscribed-angle",
      "title": "الزاوية المحيطية",
      "level": "تطبيق مباشر",
      "statement": "في دائرة إذا كان قياس القوس AB يساوي 100°، فأوجد قياس أي زاوية محيطية ترتكز على القوس AB.",
      "hint": "الزاوية المحيطية تساوي نصف الزاوية المركزية المرتكزة على القوس نفسه."
    }
  ],
  "73": [
    {
      "key": "semicircle",
      "title": "زاوية في نصف دائرة",
      "level": "تطبيق مباشر",
      "statement": "في دائرة قطرها AB ونقطة C على الدائرة، ما قياس الزاوية ∠ACB؟",
      "hint": "كل زاوية ترتكز على قطر هي زاوية قائمة."
    }
  ],
  "75": [
    {
      "key": "interior-circle",
      "title": "زاوية داخلية في الدائرة",
      "level": "تطبيق مباشر",
      "statement": "في دائرة يتقاطع وتران داخلها. إذا كان قياس القوس الأول 120° وقياس القوس المقابل له 40°، فأوجد قياس الزاوية الداخلية المتكوِّنة.",
      "hint": "الزاوية الداخلية في الدائرة تساوي نصف مجموع القوسين المقابلين."
    }
  ],
  "77": [
    {
      "key": "tangent-radius",
      "title": "المماس ونصف القطر",
      "level": "استنتاج",
      "statement": "في دائرة مركزها O إذا كان المستقيم l مماسًا للدائرة عند النقطة T، فما العلاقة بين OT والمستقيم l؟",
      "hint": "نصف القطر المرسوم إلى نقطة التماس عمودي على المماس."
    }
  ],
  "79": [
    {
      "key": "tangent-chord",
      "title": "الزاوية بين المماس والوتر",
      "level": "تطبيق مباشر",
      "statement": "في دائرة إذا شكّل المماس عند النقطة A زاوية مقدارها 38° مع الوتر AB، فما قياس القوس أو الزاوية المحيطية المرتكزة على الوتر AB؟",
      "hint": "الزاوية بين المماس والوتر تساوي الزاوية المحيطية القائمة على القوس المقابل."
    }
  ],
  "80": [
    {
      "key": "two-tangents",
      "title": "مماسان من نقطة خارجية",
      "level": "تطبيق مباشر",
      "statement": "من النقطة P خارج دائرة رُسم المماسان PA وPB. إذا كان PA = 11 سم، فأوجد PB.",
      "hint": "المماسان المرسومان من نقطة خارجية إلى الدائرة متساويان."
    }
  ],
  "84": [
    {
      "key": "pythagoras",
      "title": "نظرية فيثاغورس",
      "level": "تطبيق مباشر",
      "statement": "في مثلث قائم الزاوية طول الضلعين القائمين 6 سم و8 سم. أوجد طول الوتر.",
      "hint": "احسب مجموع مربعي الضلعين القائمين ثم خذ الجذر التربيعي."
    }
  ],
  "86": [
    {
      "key": "median-to-hypotenuse",
      "title": "المتوسط إلى الوتر",
      "level": "تطبيق مباشر",
      "statement": "في مثلث قائم الزاوية ABC طول الوتر AB = 14 سم، وD منتصف AB. إذا كان CD متوسطًا إلى الوتر، فأوجد CD.",
      "hint": "المتوسط إلى الوتر في المثلث القائم يساوي نصف الوتر."
    }
  ],
  "88": [
    {
      "key": "thirty-degree",
      "title": "نظرية 30° في المثلث القائم",
      "level": "تطبيق مباشر",
      "statement": "في مثلث قائم الزاوية إذا كانت إحدى الزوايا الحادة 30° وكان الوتر يساوي 18 سم، فأوجد طول الضلع المقابل لزاوية 30°.",
      "hint": "الضلع المقابل لـ 30° يساوي نصف الوتر."
    }
  ],
  "90": [
    {
      "key": "thales",
      "title": "نظرية طاليس",
      "level": "تطبيق مباشر",
      "statement": "في المثلث ABC النقطة D على AB والنقطة E على AC، وكان DE ∥ BC. إذا كان AD = 4 وDB = 6 وAE = x وEC = 9، فأوجد x.",
      "hint": "استعمل تناسب القطع الناتج من مستقيم موازٍ لأحد أضلاع المثلث."
    }
  ],
  "91": [
    {
      "key": "extended-thales",
      "title": "نظرية طاليس الموسعة",
      "level": "تطبيق مباشر",
      "statement": "ثلاثة مستقيمات متوازية تقطع ضلعين خارجين من نقطة واحدة. إذا كانت القطعتان المتتاليتان على الضلع الأول 3 و5، وعلى الضلع الثاني 6 وx، فأوجد x.",
      "hint": "النسب بين القطع المتناظرة على مستقيمين قاطعين للمتوازيات متساوية."
    }
  ],
  "93": [
    {
      "key": "angle-bisector",
      "title": "منصف الزاوية الداخلية",
      "level": "تطبيق مباشر",
      "statement": "في المثلث ABC إذا كان AD منصف الزاوية A ويقطع BC في D، وكان AB = 8 وAC = 12 وBD = 6، فأوجد DC.",
      "hint": "قسمة الضلع المقابل تكون بنسبة الضلعين المجاورين للزاوية."
    }
  ],
  "95": [
    {
      "key": "similarity-sas",
      "title": "تشابه ضلع-زاوية-ضلع",
      "level": "إثبات",
      "statement": "في المثلثين ABC وDEF إذا كان AB : DE = AC : DF وكانت ∠A = ∠D، فبرهن أن المثلثين متشابهان، ثم استنتج أن ∠B = ∠E.",
      "hint": "استعمل نسبة ضلعين متناظرين مع الزاوية المحصورة بينهما."
    }
  ],
  "99": [
    {
      "key": "intersecting-chords",
      "title": "نظرية الوترين المتقاطعين",
      "level": "تطبيق مباشر",
      "statement": "في دائرة يتقاطع الوتران AC وBD في النقطة P. إذا كان AP = 3 وPC = 6 وBP = 2، فأوجد PD.",
      "hint": "حاصل ضرب جزأي الوتر الأول يساوي حاصل ضرب جزأي الوتر الثاني."
    }
  ],
  "100": [
    {
      "key": "two-secants",
      "title": "قاطعان من نقطة خارجية",
      "level": "تطبيق مباشر",
      "statement": "من نقطة خارجية P خرج قاطعان إلى دائرة. في القاطع الأول الجزء الخارجي PA = 4 والطول الكلي PB = 10. وفي القاطع الثاني الجزء الخارجي PC = 5 والطول الكلي PD = x. أوجد x.",
      "hint": "استعمل مساواة حاصل ضرب الجزء الخارجي بالطول الكلي لكل قاطع."
    }
  ],
  "101": [
    {
      "key": "secant-tangent",
      "title": "قاطع ومماس",
      "level": "تطبيق مباشر",
      "statement": "من نقطة خارجية P رُسم المماس PT إلى دائرة وقاطع يقطعها في A وB. إذا كان PA = 4 وPB = 9، فأوجد طول PT.",
      "hint": "مربع طول المماس يساوي حاصل ضرب الجزء الخارجي في الطول الكلي للقاطع."
    }
  ],
  "102": [
    {
      "key": "geom-mean-leg",
      "title": "المعدل الهندسي للضلع القائم",
      "level": "تطبيق مباشر",
      "statement": "في مثلث قائم الزاوية، إذا قسم الارتفاع إلى الوتر الوتر إلى قطعتين طولهما 4 سم و9 سم، فأوجد طول الضلع القائم المجاور للقطعة 9 سم.",
      "hint": "الضلع القائم هو المتوسط الهندسي بين الوتر والقطعة المجاورة له على الوتر."
    }
  ],
  "103": [
    {
      "key": "geom-mean-altitude",
      "title": "المعدل الهندسي لارتفاع الوتر",
      "level": "تطبيق مباشر",
      "statement": "في مثلث قائم الزاوية إذا قسم الارتفاع إلى الوتر الوتر إلى قطعتين طولهما 4 سم و9 سم، فأوجد طول الارتفاع إلى الوتر.",
      "hint": "الارتفاع إلى الوتر هو المتوسط الهندسي بين القطعتين اللتين يقسم الوتر إليهما."
    }
  ],
  "104": [
    {
      "key": "polygon-sum",
      "title": "مجموع زوايا مضلع محدب",
      "level": "تطبيق مباشر",
      "statement": "أوجد مجموع الزوايا الداخلية لمضلع محدب عدد أضلاعه 9.",
      "hint": "استعمل الصيغة: (n − 2) × 180°."
    }
  ]
};

const RESOURCE_RULES = [
  {
    title: 'شرح نظرية فيثاغورس – الصف الثامن',
    path: '../apps/pythagoras/pythagoras.html',
    test: (theorem) => [84, 85, 86, 87, 88, 89, 102, 103].includes(theorem.number)
  },
  {
    title: 'قرعة مسابقة نظرية فيثاغورس',
    path: '../apps/pythagoras/pythagoras-lottery.html',
    test: (theorem) => theorem.number === 84 || theorem.number === 85
  },
  {
    title: 'المثلث متساوي الأضلاع – لعبة فان هيلي (1–4)',
    path: '../apps/equilateral-vanhiele/index.html',
    test: (theorem) => [3, 4, 6, 7, 8, 9].includes(theorem.number)
  },
  {
    title: 'أنواع المثلثات – لعبة تصنيف',
    path: '../apps/triangle-types/triangle-quiz.html',
    test: (theorem) => theorem.domain === 'مثلث'
  },
  {
    title: 'حلول الهندسة المستوية (أسئلة 1–68)',
    path: '../solutions-site/plane-geometry/index.html',
    test: (theorem) => ['مثلث', 'شكل رباعي', 'دائرة'].includes(theorem.domain) && theorem.number >= 17
  }
];

const state = {
  data: null,
  maps: {
    theorem: new Map(),
    category: new Map(),
    domain: new Map()
  }
};

const els = {
  searchInput: document.getElementById('searchInput'),
  domainFilter: document.getElementById('domainFilter'),
  toolbarNote: document.getElementById('toolbarNote'),
  heroStats: document.getElementById('heroStats'),
  breadcrumbs: document.getElementById('breadcrumbs'),
  view: document.getElementById('view'),
  homeLink: document.getElementById('homeLink')
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function norm(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(text, max = 110) {
  const value = String(text ?? '').trim();
  if (value.length <= max) return value;
  return value.slice(0, max).trimEnd() + '…';
}

function getParams() {
  return new URLSearchParams(window.location.search);
}

function getViewState() {
  const params = getParams();
  return {
    q: (params.get('q') || '').trim(),
    domainFilter: params.get('domainFilter') || 'all',
    categoryId: params.get('category') || '',
    theoremId: params.get('theorem') || '',
    questionKey: params.get('question') || ''
  };
}

function makeHref(overrides = {}) {
  const current = getViewState();
  const next = {
    q: current.q,
    domainFilter: current.domainFilter,
    categoryId: '',
    theoremId: '',
    questionKey: '',
    ...overrides
  };

  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.domainFilter && next.domainFilter !== 'all') params.set('domainFilter', next.domainFilter);
  if (next.categoryId) params.set('category', next.categoryId);
  if (next.theoremId) params.set('theorem', next.theoremId);
  if (next.questionKey) params.set('question', next.questionKey);

  const qs = params.toString();
  return qs ? `?${qs}` : './index.html';
}

function pushHref(href, mode = 'push') {
  if (mode === 'replace') {
    history.replaceState({}, '', href);
  } else {
    history.pushState({}, '', href);
  }
}

function byId(map, id) {
  return map.get(id);
}

function sortByNumber(list) {
  return [...list].sort((a, b) => a.number - b.number);
}

function buildMaps() {
  state.maps.theorem = new Map(state.data.theorems.map(item => [item.id, item]));
  state.maps.category = new Map(state.data.categories.map(item => [item.id, item]));
  state.maps.domain = new Map(state.data.domains.map(item => [item.id, item]));
}

function populateDomainFilter() {
  const options = [
    `<option value="all">كل المجالات</option>`,
    ...state.data.domains.map(domain => `<option value="${escapeHtml(domain.id)}">${escapeHtml(domain.name)} (${domain.count})</option>`)
  ];
  els.domainFilter.innerHTML = options.join('');
}

function theoremSearchBlob(theorem) {
  return norm([
    theorem.number,
    theorem.domain,
    theorem.category,
    theorem.name.ar,
    theorem.name.en,
    theorem.name.he,
    theorem.statement.ar
  ].join(' '));
}

function filterTheorems({ q = '', domainFilter = 'all', categoryId = '' } = {}) {
  const query = norm(q);
  return state.data.theorems.filter(theorem => {
    const okDomain = domainFilter === 'all' || theorem.domainId === domainFilter;
    const okCategory = !categoryId || theorem.categoryId === categoryId;
    const okQuery = !query || theoremSearchBlob(theorem).includes(query);
    return okDomain && okCategory && okQuery;
  });
}

function uniqueByTitle(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRelatedResources(theorem) {
  return uniqueByTitle(
    RESOURCE_RULES
      .filter(rule => rule.test(theorem))
      .map(rule => ({
        title: rule.title,
        path: rule.path
      }))
  ).slice(0, 3);
}

function genericQuestions(theorem) {
  return [
    {
      key: 'starter',
      title: `تطبيق سريع على ${theorem.name.ar}`,
      level: 'تدريب مبدئي',
      statement: `ارسم شكلاً مناسبًا أو استعن برسم معطى ثم حدِّد المعطيات التي تسمح باستعمال «${theorem.name.ar}». بعد ذلك اكتب النتيجة التي تتوقع الوصول إليها.`,
      hint: `نص النظرية: ${theorem.statement.ar}`,
      generated: true
    },
    {
      key: 'thinking',
      title: 'سؤال تفكير واستدلال',
      level: 'استدلال',
      statement: `حوّل نص النظرية إلى سؤال: ما المعطى؟ وما المطلوب؟ ثم اكتب سببًا واحدًا مختصرًا يربط بينهما ضمن الصنف «${theorem.category}».`,
      hint: 'ابدأ بتمييز الكلمات التي تعبّر عن المعطيات، ثم الكلمات التي تعبّر عن الاستنتاج.',
      generated: true
    }
  ];
}

function getQuestionsForTheorem(theorem) {
  const explicit = Array.isArray(theorem.questions) ? theorem.questions : [];
  const normalizedExplicit = explicit.map((q, index) => ({
    ...q,
    id: q.id || `${theorem.id}-explicit-${index + 1}`,
    title: q.title || `سؤال ${index + 1}`,
    level: q.level || 'سؤال مرتبط',
    statement: q.statement || '',
    hint: q.hint || '',
    sourceSite: q.sourceSite || '',
    sourceLabel: q.sourceLabel || '',
    externalHref: q.externalHref || '',
    externalText: q.externalText || '',
    images: Array.isArray(q.images) ? q.images : [],
    generated: false
  }));

  if (normalizedExplicit.length) return normalizedExplicit;

  const specific = (SPECIFIC_QUESTIONS[theorem.number] || []).map((q, index) => ({
    id: `${theorem.id}-${q.key || `specific-${index + 1}`}`,
    title: q.title,
    level: q.level || 'تطبيق مباشر',
    statement: q.statement,
    hint: q.hint || '',
    generated: true
  }));

  const fallback = genericQuestions(theorem).map((q, index) => ({
    id: `${theorem.id}-${q.key || `generated-${index + 1}`}`,
    title: q.title,
    level: q.level || 'تدريب',
    statement: q.statement,
    hint: q.hint || '',
    generated: true
  }));

  const combined = [...specific, ...fallback];
  const ids = new Set();
  return combined.filter(item => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
}

function updateToolbarState() {
  const viewState = getViewState();
  els.searchInput.value = viewState.q;
  els.domainFilter.value = viewState.domainFilter;
  els.homeLink.href = makeHref({ categoryId: '', theoremId: '', questionKey: '' });

  const filtered = filterTheorems({ q: viewState.q, domainFilter: viewState.domainFilter });
  const domainName = viewState.domainFilter === 'all'
    ? 'كل المجالات'
    : byId(state.maps.domain, viewState.domainFilter)?.name || 'مجال محدد';

  els.toolbarNote.textContent = viewState.q
    ? `عدد النظريات المطابقة الآن: ${filtered.length}. يمكنك فتح النظرية مباشرة أو متابعة التصفح حسب الصنف.`
    : viewState.domainFilter !== 'all'
      ? `يعرض المرجع الآن المجال: ${domainName}.`
      : 'ابدأ من الصنف، أو ابحث مباشرة باسم النظرية بالعربية أو الإنجليزية أو العبرية.';

  const stats = [
    { value: state.data.meta.totalTheorems, label: 'إجمالي النظريات' },
    { value: state.data.meta.totalCategories, label: 'عدد الأصناف' },
    { value: state.data.meta.totalDomains, label: 'عدد المجالات' },
    { value: filtered.length, label: 'المعروض حاليًا' }
  ];

  els.heroStats.innerHTML = stats.map(stat => `
    <div class="stat-card">
      <strong>${escapeHtml(stat.value)}</strong>
      <span>${escapeHtml(stat.label)}</span>
    </div>
  `).join('');
}

function renderBreadcrumbs() {
  const viewState = getViewState();
  const crumbs = [
    `<a href="${makeHref({ categoryId: '', theoremId: '', questionKey: '' })}">الملخّص</a>`
  ];

  if (viewState.categoryId) {
    const category = byId(state.maps.category, viewState.categoryId);
    const domain = category ? byId(state.maps.domain, category.domainId) : null;
    if (domain) crumbs.push(`<span class="crumb-sep">/</span><span class="crumb-current">${escapeHtml(domain.name)}</span>`);
    if (category) crumbs.push(`<span class="crumb-sep">/</span><span class="crumb-current">${escapeHtml(category.name)}</span>`);
  }

  if (viewState.theoremId) {
    const theorem = byId(state.maps.theorem, viewState.theoremId);
    const category = theorem ? byId(state.maps.category, theorem.categoryId) : null;
    const domain = theorem ? byId(state.maps.domain, theorem.domainId) : null;
    crumbs.length = 0;
    crumbs.push(`<a href="${makeHref({ categoryId: '', theoremId: '', questionKey: '' })}">الملخّص</a>`);
    if (domain) crumbs.push(`<span class="crumb-sep">/</span><a href="${makeHref({ categoryId: category?.id || '', theoremId: '', questionKey: '' })}">${escapeHtml(domain.name)}</a>`);
    if (category) crumbs.push(`<span class="crumb-sep">/</span><a href="${makeHref({ categoryId: category.id, theoremId: '', questionKey: '' })}">${escapeHtml(category.name)}</a>`);
    if (theorem) crumbs.push(`<span class="crumb-sep">/</span><span class="crumb-current">${escapeHtml(theorem.name.ar)}</span>`);
  }

  if (viewState.questionKey && viewState.theoremId) {
    const theorem = byId(state.maps.theorem, viewState.theoremId);
    const category = theorem ? byId(state.maps.category, theorem.categoryId) : null;
    const domain = theorem ? byId(state.maps.domain, theorem.domainId) : null;
    const question = theorem ? getQuestionsForTheorem(theorem).find(item => item.id === viewState.questionKey) : null;
    crumbs.length = 0;
    crumbs.push(`<a href="${makeHref({ categoryId: '', theoremId: '', questionKey: '' })}">الملخّص</a>`);
    if (domain) crumbs.push(`<span class="crumb-sep">/</span><a href="${makeHref({ categoryId: category?.id || '', theoremId: '', questionKey: '' })}">${escapeHtml(domain.name)}</a>`);
    if (category) crumbs.push(`<span class="crumb-sep">/</span><a href="${makeHref({ categoryId: category.id, theoremId: '', questionKey: '' })}">${escapeHtml(category.name)}</a>`);
    if (theorem) crumbs.push(`<span class="crumb-sep">/</span><a href="${makeHref({ theoremId: theorem.id, questionKey: '' })}">${escapeHtml(theorem.name.ar)}</a>`);
    if (question) crumbs.push(`<span class="crumb-sep">/</span><span class="crumb-current">${escapeHtml(question.title)}</span>`);
  }

  els.breadcrumbs.innerHTML = crumbs.join('');
}

function renderTheoremCard(theorem) {
  return `
    <a class="theorem-card" href="${makeHref({ theoremId: theorem.id, questionKey: '' })}">
      <div class="foot">
        <span class="theorem-num">${theorem.number}</span>
        <div class="badges">
          <span class="badge">${escapeHtml(theorem.domain)}</span>
          <span class="badge sky">${escapeHtml(theorem.category)}</span>
        </div>
      </div>
      <div>
        <h3>${escapeHtml(theorem.name.ar)}</h3>
        <p class="sub-name">${escapeHtml(theorem.name.en)}</p>
      </div>
      <p>${escapeHtml(excerpt(theorem.statement.ar, 135))}</p>
      <div class="foot">
        <span class="badge accent">مرجع: ${theorem.source.page}</span>
        <span class="link-row">فتح البطاقة ←</span>
      </div>
    </a>
  `;
}

function renderCategoryCard(category, list) {
  const preview = list.slice(0, 3).map(item => `<li>${escapeHtml(item.name.ar)}</li>`).join('');
  const more = list.length > 3 ? `<li>+ ${list.length - 3} نظريات أخرى</li>` : '';
  return `
    <a class="category-card" href="${makeHref({ categoryId: category.id, theoremId: '', questionKey: '' })}">
      <div class="section-top">
        <div class="intro">
          <h4>${escapeHtml(category.name)}</h4>
          <div class="badges">
            <span class="badge">${list.length} نظرية</span>
            <span class="badge sky">${escapeHtml(category.domain)}</span>
          </div>
        </div>
      </div>
      <ul class="preview more-compact">${preview}${more}</ul>
      <div class="link-row">
        <span>عرض النظريات التابعة لهذا الصنف</span>
        <span>←</span>
      </div>
    </a>
  `;
}

function renderSummaryPage() {
  const viewState = getViewState();
  const filtered = sortByNumber(filterTheorems({ q: viewState.q, domainFilter: viewState.domainFilter }));
  const featured = state.data.featuredTheoremIds
    .map(id => byId(state.maps.theorem, id))
    .filter(Boolean);

  const introPanel = `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>كيف تستعمل هذا المرجع؟</h2>
          <p>ابدأ من صفحة الملخّص، ثم انقر على الصنف المناسب، وبعدها افتح بطاقة النظرية. داخل كل بطاقة ستجد اسم النظرية بالعربية والإنجليزية والعبرية، نصّها بالعربية، ومساحة للصور المرفقة إن وُجدت، إضافةً إلى أسئلة وأمثلة تدريبية قابلة للتصفّح.</p>
        </div>
        <div class="actions">
          <a class="btn secondary" href="#fullIndex">الفهرس الكامل</a>
        </div>
      </div>
      <div class="callout">
        <strong>ملاحظة:</strong> الملفات المرسلة لا تحتوي حاليًا على بنك أسئلة مفهرس ولا صور مرتبطة بكل نظرية، لذلك أُنشئت أمثلة تدريبية أولية تلقائيًا، مع إبقاء بنية الصفحة جاهزة لاستقبال الأسئلة والصور الحقيقية لاحقًا.
      </div>
    </section>
  `;

  const featuredPanel = !viewState.q && viewState.domainFilter === 'all' ? `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>نظريات مقترحة للبدء</h2>
          <p>مدخل سريع إلى أكثر النظريات استخدامًا في المسائل: فيثاغورس، طاليس، الزاوية المحيطية، القاطع والمماس، ومنصف الزاوية.</p>
        </div>
      </div>
      <div class="theorem-grid">
        ${featured.map(renderTheoremCard).join('')}
      </div>
    </section>
  ` : '';

  const resultsPanel = viewState.q ? `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>نتائج البحث المباشرة</h2>
          <p>هذه النظريات مطابقة لعبارة البحث الحالية.</p>
        </div>
      </div>
      ${filtered.length ? `<div class="theorem-grid">${filtered.map(renderTheoremCard).join('')}</div>` : `
        <div class="empty-state">
          <h3>لا توجد نتائج مطابقة</h3>
          <p>جرّب البحث باسم النظرية بالعربية أو الإنجليزية أو العبرية، أو خفّف التصفية حسب المجال.</p>
        </div>
      `}
    </section>
  ` : '';

  const domainSections = state.data.domains.map(domain => {
    if (viewState.domainFilter !== 'all' && viewState.domainFilter !== domain.id) return '';
    const categories = state.data.categories
      .filter(category => category.domainId === domain.id)
      .map(category => {
        const items = filtered.filter(theorem => theorem.categoryId === category.id);
        if (!items.length) return '';
        return renderCategoryCard(category, items);
      })
      .filter(Boolean);

    if (!categories.length) return '';

    const matchedCount = filtered.filter(theorem => theorem.domainId === domain.id).length;
    return `
      <section class="domain-section">
        <div class="domain-head">
          <div class="domain-title">
            <div class="domain-icon">${DOMAIN_ICONS[domain.name] || '◇'}</div>
            <div>
              <h3>${escapeHtml(domain.name)}</h3>
              <p>${matchedCount} نظرية ظاهرة ضمن ${escapeHtml(domain.name)} موزّعة على الأصناف التابعة له.</p>
            </div>
          </div>
          <div class="badges">
            <span class="badge accent">${matchedCount} نظرية</span>
            <span class="badge">${domain.categoryIds.length} أصناف</span>
          </div>
        </div>
        <div class="grid cols-3">
          ${categories.join('')}
        </div>
      </section>
    `;
  }).filter(Boolean).join('');

  const fullIndex = renderFullIndex(filtered, {
    heading: 'الفهرس الكامل للنظريات',
    description: 'فهرس يجمع جميع النظريات في صفحة واحدة بشكل منظم ومصنف. انقر على اسم النظرية لفتح البطاقة التفصيلية.',
    id: 'fullIndex'
  });

  els.view.innerHTML = [introPanel, featuredPanel, resultsPanel, domainSections ? `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>التصنيف حسب المجال والصنف</h2>
          <p>عند النقر على أي صنف ستظهر قائمة النظريات التابعة له. هذه الواجهة هي الطريق الأسرع للتصفح المنهجي.</p>
        </div>
      </div>
      <div class="grid">
        ${domainSections}
      </div>
    </section>
  ` : `
    <section class="panel">
      <div class="empty-state">
        <h3>لا توجد أصناف مطابقة للتصفية الحالية</h3>
        <p>جرّب إزالة عبارة البحث أو اختر «كل المجالات» من القائمة.</p>
      </div>
    </section>
  `, fullIndex].join('');
}

function renderFullIndex(list, options = {}) {
  const { heading = 'الفهرس', description = '', id = '' } = options;
  const viewState = getViewState();

  const grouped = state.data.domains.map(domain => {
    const categories = state.data.categories
      .filter(category => category.domainId === domain.id)
      .map(category => {
        const items = list.filter(theorem => theorem.categoryId === category.id);
        if (!items.length) return '';
        return `
          <div class="index-category">
            <h4>${escapeHtml(category.name)} <span class="badge">${items.length}</span></h4>
            <div class="inline-links">
              ${items.map(theorem => `<a href="${makeHref({ theoremId: theorem.id, questionKey: '' })}">${escapeHtml(theorem.number)} – ${escapeHtml(theorem.name.ar)}</a>`).join('')}
            </div>
          </div>
        `;
      })
      .filter(Boolean)
      .join('');

    if (!categories) return '';

    return `
      <details class="index-domain" ${viewState.q || viewState.domainFilter !== 'all' ? 'open' : ''}>
        <summary>
          <span>${escapeHtml(domain.name)}</span>
          <span class="badge">${list.filter(theorem => theorem.domainId === domain.id).length} نظرية</span>
        </summary>
        <div class="index-inner">
          ${categories}
        </div>
      </details>
    `;
  }).filter(Boolean).join('');

  return `
    <section class="panel" id="${escapeHtml(id)}">
      <div class="section-top">
        <div class="intro">
          <h2>${escapeHtml(heading)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
      </div>
      <div class="index-list">
        ${grouped || `
          <div class="empty-state">
            <h3>الفهرس فارغ للتصفية الحالية</h3>
            <p>لا توجد نظريات تطابق عبارة البحث الحالية.</p>
          </div>
        `}
      </div>
    </section>
  `;
}

function renderCategoryPage(categoryId) {
  const viewState = getViewState();
  const category = byId(state.maps.category, categoryId);
  if (!category) {
    renderNotFound('الصنف المطلوب غير موجود.');
    return;
  }

  const domain = byId(state.maps.domain, category.domainId);
  const theorems = sortByNumber(filterTheorems({
    q: viewState.q,
    domainFilter: viewState.domainFilter === 'all' ? 'all' : viewState.domainFilter,
    categoryId
  }));

  const siblingCategories = state.data.categories
    .filter(item => item.domainId === category.domainId && item.id !== category.id)
    .sort((a, b) => b.count - a.count);

  els.view.innerHTML = `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>${escapeHtml(category.name)}</h2>
          <p>هذا الصنف يتبع المجال «${escapeHtml(domain?.name || '')}»، ويجمع النظريات المتقاربة من حيث الفكرة أو البنية الهندسية.</p>
        </div>
        <div class="actions">
          <a class="btn secondary" href="${makeHref({ categoryId: '', theoremId: '', questionKey: '' })}">العودة إلى الملخّص</a>
        </div>
      </div>
      <div class="badges">
        <span class="badge accent">${theorems.length} نظرية معروضة</span>
        <span class="badge">${escapeHtml(domain?.name || '')}</span>
        <span class="badge sky">الصنف: ${escapeHtml(category.name)}</span>
      </div>
    </section>

    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>النظريات التابعة لهذا الصنف</h2>
          <p>انقر على أي نظرية لفتح بطاقة مستقلة تتضمن الأسماء باللغات الثلاث، ونص النظرية، والأسئلة أو الأمثلة المرتبطة بها.</p>
        </div>
      </div>
      ${theorems.length ? `<div class="theorem-grid">${theorems.map(renderTheoremCard).join('')}</div>` : `
        <div class="empty-state">
          <h3>لا توجد نظريات مطابقة داخل هذا الصنف</h3>
          <p>قد تكون عبارة البحث الحالية ضيقة جدًا. جرّب مسح البحث لرؤية جميع النظريات التابعة للصنف.</p>
        </div>
      `}
    </section>

    ${siblingCategories.length ? `
      <section class="panel">
        <div class="section-top">
          <div class="intro">
            <h2>أصناف أخرى ضمن المجال نفسه</h2>
            <p>يمكنك التنقل السريع بين الأصناف القريبة داخل المجال نفسه.</p>
          </div>
        </div>
        <div class="inline-links">
          ${siblingCategories.map(item => `<a href="${makeHref({ categoryId: item.id, theoremId: '', questionKey: '' })}">${escapeHtml(item.name)} (${item.count})</a>`).join('')}
        </div>
      </section>
    ` : ''}
  `;
}

function renderTheoremPage(theoremId) {
  const theorem = byId(state.maps.theorem, theoremId);
  if (!theorem) {
    renderNotFound('النظرية المطلوبة غير موجودة.');
    return;
  }

  const category = byId(state.maps.category, theorem.categoryId);
  const questions = getQuestionsForTheorem(theorem);
  const hasGeneratedQuestions = questions.some(question => question.generated);
  const images = Array.isArray(theorem.images) ? theorem.images : [];
  const resources = getRelatedResources(theorem);
  const siblings = sortByNumber(state.data.theorems.filter(item => item.categoryId === theorem.categoryId));
  const currentIndex = siblings.findIndex(item => item.id === theorem.id);
  const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const imageSection = images.length ? `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>الصور المرتبطة بالنظرية</h2>
          <p>أي صور أو رسومات مرتبطة بالنظرية ستُعرض هنا.</p>
        </div>
      </div>
      <div class="gallery">
        ${images.map(image => `
          <figure class="figure-card">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || theorem.name.ar)}" loading="lazy">
            ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
          </figure>
        `).join('')}
      </div>
    </section>
  ` : `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>الصور المرتبطة بالنظرية</h2>
          <p>لا توجد صور مرفقة في البيانات الحالية لهذه النظرية. عند إضافة صور إلى ملف البيانات ستظهر تلقائيًا هنا.</p>
        </div>
      </div>
    </section>
  `;

  els.view.innerHTML = `
    <section class="detail-layout">
      <div class="detail-card">
        <div class="badges">
          <span class="badge accent">رقم النظرية: ${theorem.number}</span>
          <span class="badge">المجال: ${escapeHtml(theorem.domain)}</span>
          <span class="badge sky">الصنف: ${escapeHtml(theorem.category)}</span>
          <span class="badge ok">مرجع: ${theorem.source.page}</span>
        </div>

        <div class="name-stack">
          <div class="name-line">
            <span class="label">الاسم بالعربية</span>
            <strong>${escapeHtml(theorem.name.ar)}</strong>
          </div>
          <div class="name-line en">
            <span class="label">Name in English</span>
            <strong>${escapeHtml(theorem.name.en)}</strong>
          </div>
          <div class="name-line he">
            <span class="label">השם בעברית</span>
            <strong>${escapeHtml(theorem.name.he)}</strong>
          </div>
        </div>

        <div class="statement-box">
          <h2>نص النظرية</h2>
          <p>${escapeHtml(theorem.statement.ar)}</p>
        </div>
      </div>

      <aside class="side-panel">
        <div class="side-card">
          <h3>تنقّل سريع</h3>
          <div class="nav-list">
            <a href="${makeHref({ categoryId: theorem.categoryId, theoremId: '', questionKey: '' })}">
              <span>العودة إلى الصنف</span>
              <small>${escapeHtml(category?.name || '')}</small>
            </a>
            ${prev ? `
              <a href="${makeHref({ theoremId: prev.id, questionKey: '' })}">
                <span>النظرية السابقة</span>
                <small>${escapeHtml(prev.name.ar)}</small>
              </a>
            ` : ''}
            ${next ? `
              <a href="${makeHref({ theoremId: next.id, questionKey: '' })}">
                <span>النظرية التالية</span>
                <small>${escapeHtml(next.name.ar)}</small>
              </a>
            ` : ''}
          </div>
        </div>

        <div class="side-card">
          <h3>معلومة مرجعية</h3>
          <p>مرجع هذه النظرية: <strong>${theorem.source.page}</strong>${theorem.source.referenceFile ? ` — ${escapeHtml(theorem.source.referenceFile)}` : ''}.</p>
        </div>

        ${resources.length ? `
          <div class="side-card">
            <h3>مواد مرتبطة داخل المختبر</h3>
            <div class="nav-list">
              ${resources.map(item => `
                <a href="${escapeHtml(item.path)}">
                  <span>${escapeHtml(item.title)}</span>
                  <small>فتح المورد</small>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </aside>
    </section>

    ${imageSection}

    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>أسئلة وأمثلة تطبيقية مرتبطة</h2>
          <p>يمكنك تصفّح هذه البطاقات كسيناريوهات تطبيق أو كنقاط انطلاق لبناء بنك أسئلة حقيقي مربوط بالنظرية.</p>
        </div>
      </div>

      ${hasGeneratedQuestions ? `
        <div class="callout">
          <strong>تنبيه تعليمي:</strong> بما أن الملفات الحالية لا تحتوي على ملف ربط فعلي بين النظريات وبنك أسئلة مفصّل، فقد أُنشئت هذه الأمثلة التدريبية تلقائيًا كبداية عملية قابلة للتوسعة.
        </div>
      ` : ''}

      <div class="question-grid" style="margin-top:14px">
        ${questions.map(question => `
          <article class="question-card">
            <div class="badges">
              <span class="badge">${escapeHtml(question.level)}</span>
              ${question.sourceLabel ? `<span class="badge sky">${escapeHtml(question.sourceLabel)}</span>` : ''}
              ${question.generated ? '<span class="badge accent">مثال مولّد</span>' : '<span class="badge ok">سؤال مرتبط</span>'}
            </div>
            <h3>${escapeHtml(question.title)}</h3>
            <p>${escapeHtml(excerpt(question.statement, 170))}</p>
            ${question.hint ? `<div class="hint"><strong>ملاحظة:</strong> ${escapeHtml(question.hint)}</div>` : ''}
            <div class="card-actions">
              <a class="btn small" href="${makeHref({ theoremId: theorem.id, questionKey: question.id })}">فتح بطاقة السؤال</a>
              ${question.externalHref ? `<a class="btn small secondary" href="${escapeHtml(question.externalHref)}">فتح السؤال الأصلي</a>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderQuestionPage(theoremId, questionKey) {
  const theorem = byId(state.maps.theorem, theoremId);
  if (!theorem) {
    renderNotFound('النظرية المرتبطة بالسؤال غير موجودة.');
    return;
  }

  const questions = getQuestionsForTheorem(theorem);
  const question = questions.find(item => item.id === questionKey);
  if (!question) {
    renderNotFound('بطاقة السؤال المطلوبة غير موجودة.');
    return;
  }

  const relatedQuestions = questions.filter(item => item.id !== question.id).slice(0, 3);

  const previewGallery = Array.isArray(question.images) && question.images.length ? `
    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>معاينة صور السؤال</h2>
          <p>هذه معاينة سريعة لبعض صور السؤال من موقع الحلول المرتبط.</p>
        </div>
      </div>
      <div class="gallery">
        ${question.images.map((src, idx) => `
          <figure class="figure-card">
            <img src="${escapeHtml(src)}" alt="صورة ${idx + 1} مرتبطة بالسؤال" loading="lazy">
          </figure>
        `).join('')}
      </div>
    </section>
  ` : '';

  els.view.innerHTML = `
    <section class="panel question-detail">
      <div class="section-top">
        <div class="intro">
          <h2>${escapeHtml(question.title)}</h2>
          <p>بطاقة سؤال مرتبطة بالنظرية «${escapeHtml(theorem.name.ar)}». يمكنك قراءة الفكرة هنا، ثم فتح السؤال الأصلي لرؤية الصور والحل الكامل.</p>
        </div>
        <div class="actions">
          <a class="btn secondary" href="${makeHref({ theoremId: theorem.id, questionKey: '' })}">العودة إلى بطاقة النظرية</a>
          ${question.externalHref ? `<a class="btn" href="${escapeHtml(question.externalHref)}">فتح السؤال الأصلي</a>` : ''}
        </div>
      </div>

      <div class="badges">
        <span class="badge">${escapeHtml(question.level)}</span>
        <span class="badge sky">${escapeHtml(theorem.category)}</span>
        ${question.sourceLabel ? `<span class="badge sky">${escapeHtml(question.sourceLabel)}</span>` : ''}
        ${question.generated ? '<span class="badge accent">مثال مولّد</span>' : '<span class="badge ok">سؤال مربوط</span>'}
      </div>

      <div class="question-body">
        <p>${escapeHtml(question.statement)}</p>
      </div>

      ${question.hint ? `<div class="hint"><strong>ملاحظة:</strong> ${escapeHtml(question.hint)}</div>` : ''}
    </section>

    ${previewGallery}

    <section class="panel">
      <div class="section-top">
        <div class="intro">
          <h2>النظرية المرتبطة بهذا السؤال</h2>
          <p>افتح بطاقة النظرية لقراءة النص الرسمي بالعربية ورؤية الاسم باللغات الثلاث.</p>
        </div>
      </div>
      <div class="theorem-grid">
        ${renderTheoremCard(theorem)}
      </div>
    </section>

    ${relatedQuestions.length ? `
      <section class="panel">
        <div class="section-top">
          <div class="intro">
            <h2>بطاقات أخرى من النظرية نفسها</h2>
            <p>يمكنك التنقل بين أكثر من مثال أو بطاقة تدريبية مرتبطة بالنظرية نفسها.</p>
          </div>
        </div>
        <div class="question-grid">
          ${relatedQuestions.map(item => `
            <article class="question-card">
              <div class="badges">
                <span class="badge">${escapeHtml(item.level)}</span>
                ${item.sourceLabel ? `<span class="badge sky">${escapeHtml(item.sourceLabel)}</span>` : ''}
                ${item.generated ? '<span class="badge accent">مثال مولّد</span>' : '<span class="badge ok">سؤال مربوط</span>'}
              </div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(excerpt(item.statement, 150))}</p>
              <div class="card-actions">
                <a class="btn small" href="${makeHref({ theoremId: theorem.id, questionKey: item.id })}">فتح البطاقة</a>
                ${item.externalHref ? `<a class="btn small secondary" href="${escapeHtml(item.externalHref)}">فتح السؤال الأصلي</a>` : ''}
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    ` : ''}
  `;
}

function renderNotFound(message) {
  els.view.innerHTML = `
    <section class="panel">
      <div class="empty-state">
        <h3>تعذّر العثور على المحتوى المطلوب</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function render() {
  updateToolbarState();
  renderBreadcrumbs();

  const viewState = getViewState();
  if (viewState.questionKey && viewState.theoremId) {
    renderQuestionPage(viewState.theoremId, viewState.questionKey);
    return;
  }
  if (viewState.theoremId) {
    renderTheoremPage(viewState.theoremId);
    return;
  }
  if (viewState.categoryId) {
    renderCategoryPage(viewState.categoryId);
    return;
  }
  renderSummaryPage();
}

function onSearchInput() {
  const current = getViewState();
  const nextQ = els.searchInput.value.trim();

  const nextHref = makeHref(
    current.theoremId || current.questionKey
      ? { q: nextQ, domainFilter: current.domainFilter, categoryId: '', theoremId: '', questionKey: '' }
      : { q: nextQ, domainFilter: current.domainFilter, categoryId: current.categoryId, theoremId: current.theoremId, questionKey: current.questionKey }
  );

  pushHref(nextHref, 'replace');
  render();
}

function onDomainFilterChange() {
  const nextDomain = els.domainFilter.value;
  const current = getViewState();
  const nextHref = makeHref({
    q: current.q,
    domainFilter: nextDomain,
    categoryId: '',
    theoremId: '',
    questionKey: ''
  });
  pushHref(nextHref, 'push');
  render();
}

async function loadData() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('تعذر تحميل ملف النظريات.');
  }
  return response.json();
}

async function init() {
  try {
    state.data = await loadData();
    buildMaps();
    populateDomainFilter();

    els.searchInput.addEventListener('input', onSearchInput);
    els.domainFilter.addEventListener('change', onDomainFilterChange);
    window.addEventListener('popstate', render);

    render();
  } catch (error) {
    console.error(error);
    els.view.innerHTML = `
      <section class="panel">
        <div class="empty-state">
          <h3>حدث خطأ أثناء تحميل المرجع</h3>
          <p>تأكد من وجود ملف <code>theorems.json</code> داخل مجلد البيانات، ثم أعد المحاولة.</p>
        </div>
      </section>
    `;
  }
}

init();
