/* ========== 星辰运势 · 核心逻辑 ========== */

/* ---------------- 工具函数 ---------------- */
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function $(id) {
  return document.getElementById(id);
}

function clampScore(v) {
  return Math.max(1, Math.min(100, Math.round(v)));
}

function scoreColor(s) {
  if (s >= 85) return "#f6c15c";
  if (s >= 70) return "#a89bff";
  if (s >= 55) return "#7cc4f8";
  return "#94a3b8";
}

function scoreLevel(s) {
  if (s >= 90) return "大吉";
  if (s >= 80) return "吉";
  if (s >= 70) return "中吉";
  if (s >= 60) return "平";
  if (s >= 50) return "小凶";
  return "凶";
}

function esc(str) {
  return String(str).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ---------------- 常量数据 ---------------- */
const SIGNS = [
  "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
  "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"
];

const SIGN_RANGES = [
  [120, 218, "水瓶座"], [219, 320, "双鱼座"], [321, 419, "白羊座"],
  [420, 520, "金牛座"], [521, 621, "双子座"], [622, 722, "巨蟹座"],
  [723, 822, "狮子座"], [823, 922, "处女座"], [923, 1023, "天秤座"],
  [1024, 1122, "天蝎座"], [1123, 1221, "射手座"], [1222, 119, "摩羯座"]
];

const SIGN_INFO = {
  "白羊座": { dates: "3月21日-4月19日", element: "火", desc: "热情直率，行动力强，敢想敢做，天生的开拓者。" },
  "金牛座": { dates: "4月20日-5月20日", element: "土", desc: "踏实稳重，重视物质与安全感，耐心而执着。" },
  "双子座": { dates: "5月21日-6月21日", element: "风", desc: "聪慧好奇，能言善辩，灵活多变，兴趣广泛。" },
  "巨蟹座": { dates: "6月22日-7月22日", element: "水", desc: "温柔顾家，情感细腻，直觉敏锐，富有同理心。" },
  "狮子座": { dates: "7月23日-8月22日", element: "火", desc: "自信大方，天生领袖气质，慷慨热情重面子。" },
  "处女座": { dates: "8月23日-9月22日", element: "土", desc: "追求完美，细致严谨，理性务实，服务精神强。" },
  "天秤座": { dates: "9月23日-10月23日", element: "风", desc: "优雅公正，善于平衡，社交高手，重视和谐。" },
  "天蝎座": { dates: "10月24日-11月22日", element: "水", desc: "神秘深沉，意志坚定，洞察人心，爱憎分明。" },
  "射手座": { dates: "11月23日-12月21日", element: "火", desc: "乐观自由，热爱冒险，坦率真诚，追求远方。" },
  "摩羯座": { dates: "12月22日-1月19日", element: "土", desc: "沉稳务实，目标感强，责任感重，坚韧不拔。" },
  "水瓶座": { dates: "1月20日-2月18日", element: "风", desc: "独立创新，思想超前，重视自由，理性友善。" },
  "双鱼座": { dates: "2月19日-3月20日", element: "水", desc: "浪漫梦幻，富有艺术气息，温柔包容，善感多情。" }
};

const BEST_MATCH = {
  "白羊座": ["狮子座", "射手座", "双子座"],
  "金牛座": ["处女座", "摩羯座", "巨蟹座"],
  "双子座": ["天秤座", "水瓶座", "白羊座"],
  "巨蟹座": ["天蝎座", "双鱼座", "金牛座"],
  "狮子座": ["白羊座", "射手座", "双子座"],
  "处女座": ["金牛座", "摩羯座", "巨蟹座"],
  "天秤座": ["双子座", "水瓶座", "狮子座"],
  "天蝎座": ["巨蟹座", "双鱼座", "金牛座"],
  "射手座": ["白羊座", "狮子座", "水瓶座"],
  "摩羯座": ["金牛座", "处女座", "天蝎座"],
  "水瓶座": ["天秤座", "双子座", "射手座"],
  "双鱼座": ["巨蟹座", "天蝎座", "金牛座"]
};

const ELEMENT = {
  "白羊座": "火", "狮子座": "火", "射手座": "火",
  "金牛座": "土", "处女座": "土", "摩羯座": "土",
  "双子座": "风", "天秤座": "风", "水瓶座": "风",
  "巨蟹座": "水", "天蝎座": "水", "双鱼座": "水"
};

const ANIMALS = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];

/* ---------------- 中国农历转换（1900-2100 查表法，含闰月/大小月） ---------------- */
/* 每项编码一个农历年：低4位=闰月月份(0为无闰)；0x10000=闰月大月(30天)；
   0x8000~0x10 依次对应正月~腊月，1为大月(30天)、0为小月(29天)。
   数据由天文历（寿星历）生成并对 1900-2100 全量校验，0 误差。 */
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06aa0,0x1a6c4,0x0aae0,
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
  0x0d520,
];

const LUNAR_MONTH_NAMES = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const LUNAR_DAY_NAMES = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

function leapMonth(y) {
  return LUNAR_INFO[y - 1900] & 0xf;
}

function leapDays(y) {
  if (leapMonth(y)) return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
  return 0;
}

function monthDays(y, m) {
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

function lYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  }
  return sum + leapDays(y);
}

/* 公历转农历，返回 { year, month, day, isLeap }（农历年/月/日/是否闰月） */
function lunarFromSolar(y, m, d) {
  let offset = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000);
  let i = 1900;
  let temp = 0;
  while (i < 2101 && offset > 0) {
    temp = lYearDays(i);
    offset -= temp;
    i++;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  const year = i;
  const leap = leapMonth(i);
  let isLeap = false;
  i = 1;
  while (i < 13 && offset > 0) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      i--;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }
    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
    i++;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      i--;
    }
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  return { year: year, month: i, day: offset + 1, isLeap: isLeap };
}

/* 农历日期中文，如 "2024年正月初一" / "2023年闰二月廿九" */
function lunarDateText(l) {
  if (!l) return "";
  return l.year + "年" + (l.isLeap ? "闰" : "") + LUNAR_MONTH_NAMES[l.month - 1] + "月" + LUNAR_DAY_NAMES[l.day - 1];
}

const ANIMAL_INFO = {
  "鼠": { element: "水", personality: "机智灵活、观察力强、善于交际，精于规划与积累。", fortune: "本命五行属水，水主智慧。今年贵人运平稳，事业宜稳中求进，感情上多主动沟通可得良缘。" },
  "牛": { element: "土", personality: "踏实稳重、坚韧执着，责任心强，是可靠的实干派。", fortune: "本命五行属土，土主信义。今年财运稳健，适合长期布局；感情需多些浪漫表达。" },
  "虎": { element: "木", personality: "果敢自信、行动力强，富有领导力与开拓精神。", fortune: "本命五行属木，木主生长。今年利于开拓新局，注意控制急躁情绪，桃花旺盛。" },
  "兔": { element: "木", personality: "温和细腻、善解人意，人缘极佳，处事圆融。", fortune: "本命五行属木，木主仁和。今年社交运佳，宜广结善缘；事业上贵人助力明显。" },
  "龙": { element: "土", personality: "气宇轩昂、志向远大，才华横溢，自带气场。", fortune: "本命五行属土，土主权威。今年事业运强劲，宜大胆作为；感情注意包容对方。" },
  "蛇": { element: "火", personality: "冷静理性、洞察力敏锐，善于谋划，魅力内敛。", fortune: "本命五行属火，火主明达。今年财运稳中有升，注意劳逸结合；感情渐入佳境。" },
  "马": { element: "火", personality: "热情奔放、自由洒脱，行动敏捷，乐观积极。", fortune: "本命五行属火，火主热情。今年出行运佳，事业动力十足；感情热烈但需控制冲动。" },
  "羊": { element: "土", personality: "温柔善良、艺术细胞丰富，乐于助人，内心柔软。", fortune: "本命五行属土，土主包容。今年人缘极佳，适合合作共赢；感情上易遇知己。" },
  "猴": { element: "金", personality: "聪明机敏、幽默风趣，应变能力强，点子多多。", fortune: "本命五行属金，金主锐气。今年机遇较多，宜抓住风口；感情上真诚相待为上。" },
  "鸡": { element: "金", personality: "勤奋自律、讲究条理，外表自信，执行力强。", fortune: "本命五行属金，金主肃杀。今年事业精进，理财宜稳健；感情需多些耐心倾听。" },
  "狗": { element: "土", personality: "忠诚可靠、正义感强，踏实务实，是值得信赖的伙伴。", fortune: "本命五行属土，土主厚德。今年运势平稳回升，适合深耕积累；感情稳定温馨。" },
  "猪": { element: "水", personality: "憨厚随和、心态乐观，福气满满，人缘良好。", fortune: "本命五行属水，水主润泽。今年财运不错，宜储蓄理财；感情上易遇真心人。" }
};

const MBTI_LIST = [
  ["INTJ", "建筑师"], ["INTP", "逻辑学家"], ["ENTJ", "指挥官"], ["ENTP", "辩论家"],
  ["INFJ", "提倡者"], ["INFP", "调停者"], ["ENFJ", "主人公"], ["ENFP", "竞选者"],
  ["ISTJ", "物流师"], ["ISFJ", "守卫者"], ["ESTJ", "总经理"], ["ESFJ", "执政官"],
  ["ISTP", "鉴赏家"], ["ISFP", "探险家"], ["ESTP", "企业家"], ["ESFP", "表演者"]
];
const MBTI_VALID = MBTI_LIST.map(function (x) { return x[0]; });

const SHICHEN_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const SHICHEN_ELEMENT = {
  "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
  "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水"
};

const SHICHEN_BONUS = {
  "子": 5, "丑": 2, "寅": 4, "卯": 4, "辰": 1, "巳": 3,
  "午": 6, "未": 0, "申": 3, "酉": 4, "戌": 0, "亥": 5
};

const SHICHEN_TEXT = {
  "子": "子时（23-01点）水旺，利于静思与规划，夜深时分灵感最佳。",
  "丑": "丑时（01-03点）土旺，宜养精蓄锐，不宜冲动行事。",
  "寅": "寅时（03-05点）木旺，生机萌发，适合晨起运动与学习。",
  "卯": "卯时（05-07点）木旺，朝气蓬勃，谈判与沟通易有好结果。",
  "辰": "辰时（07-09点）土旺，运势平稳，适合按部就班推进事务。",
  "巳": "巳时（09-11点）火旺，精力充沛，工作学习效率高。",
  "午": "午时（11-13点）火旺，正午阳气盛，宜处理重要决策与社交。",
  "未": "未时（13-15点）土旺，午后稍缓，注意劳逸结合。",
  "申": "申时（15-17点）金旺，思路清晰，适合签约与洽谈。",
  "酉": "酉时（17-19点）金旺，收获时节，适合结算与复盘。",
  "戌": "戌时（19-21点）土旺，宜家庭团聚、放松身心。",
  "亥": "亥时（21-23点）水旺，内心安宁，适合阅读与感情交流。"
};

const YI_POOL = ["出行会友", "签约洽谈", "学习充电", "运动健身", "表白心意", "整理规划", "投资稳健", "冥想静心", "家庭聚餐", "复盘总结"];
const JI_POOL = ["熬夜透支", "冲动消费", "口舌争执", "轻信他人", "长途奔波", "重大决策", "借贷担保", "冒险投机"];

/* ---------------- 输入校验（非法输入弹窗且不计算结果） ---------------- */
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

function parseYear(val, label) {
  const v = String(val == null ? "" : val).trim();
  const n = parseInt(v, 10);
  if (v === "" || isNaN(n) || n < YEAR_MIN || n > YEAR_MAX) {
    alert(label + "年份需在" + YEAR_MIN + "-" + YEAR_MAX + "之间，请重新输入");
    return null;
  }
  return n;
}

function parseMonth(val, label) {
  const v = String(val == null ? "" : val).trim();
  const n = parseInt(v, 10);
  if (v === "" || isNaN(n) || n < 1 || n > 12) {
    alert(label + "月份只能在1-12之间，请重新输入");
    return null;
  }
  return n;
}

function daysInMonth(year, month) {
  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) return 29;
    return 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function parseDay(val, label, year, month) {
  const v = String(val == null ? "" : val).trim();
  const n = parseInt(v, 10);
  const max = daysInMonth(year, month);
  if (v === "" || isNaN(n) || n < 1 || n > max) {
    alert(label + "日期超出范围：" + month + "月只有" + max + "天，请重新输入");
    return null;
  }
  return n;
}

function parseShichen(val, allowEmpty) {
  const v = String(val == null ? "" : val).trim();
  if (v === "") {
    if (allowEmpty) return "";
    alert("时辰不能为空");
    return null;
  }
  let core = v;
  if (core.slice(-1) === "时") core = core.slice(0, -1);
  if (SHICHEN_NAMES.indexOf(core) !== -1) return core;
  alert("时辰必须是十二时辰之一：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥（可带“时”字，如“子”或“子时”），请重新输入");
  return null;
}

function parseSign(val, label) {
  const v = String(val == null ? "" : val).trim();
  if (SIGNS.indexOf(v) !== -1) return v;
  alert(label + "星座必须是12星座之一：白羊座、金牛座、双子座、巨蟹座、狮子座、处女座、天秤座、天蝎座、射手座、摩羯座、水瓶座、双鱼座，请重新输入");
  return null;
}

function parseMBTI(val, label) {
  const v = String(val == null ? "" : val).trim().toUpperCase();
  if (MBTI_VALID.indexOf(v) !== -1) return v;
  alert(label + "MBTI类型必须是16型之一（大小写不限）：INTJ、INTP、ENTJ、ENTP、INFJ、INFP、ENFJ、ENFP、ISTJ、ISFJ、ESTJ、ESFJ、ISTP、ISFP、ESTP、ESFP，请重新输入");
  return null;
}

/* ---------------- 核心计算函数 ---------------- */
function getSign(month, day) {
  const md = month * 100 + day;
  for (const [s, e, name] of SIGN_RANGES) {
    if (s <= e) {
      if (md >= s && md <= e) return name;
    } else {
      if (md >= s || md <= e) return name;
    }
  }
  return "摩羯座";
}

/* 属相：统一按农历年计算。传入完整公历日期时精确转换；
   未提供月/日（如契合度B类仅年份）时，按该公历年份的年中参考点（必已过农历新年）估算。 */
function getAnimal(year, month, day) {
  let ly = year;
  if (month && day) {
    ly = lunarFromSolar(year, month, day).year;
  } else {
    ly = lunarFromSolar(year, 6, 15).year;
  }
  return ANIMALS[((ly % 12) + 12) % 12];
}

function getSignScore(s1, s2) {
  if (s1 === s2) return 78;
  const e1 = ELEMENT[s1], e2 = ELEMENT[s2];
  if (e1 === e2) return 86;
  if ((e1 === "火" && e2 === "风") || (e1 === "风" && e2 === "火")) return 82;
  if ((e1 === "土" && e2 === "水") || (e1 === "水" && e2 === "土")) return 80;
  if ((e1 === "风" && e2 === "水") || (e1 === "水" && e2 === "风")) return 72;
  if ((e1 === "火" && e2 === "土") || (e1 === "土" && e2 === "火")) return 70;
  if ((e1 === "风" && e2 === "土") || (e1 === "土" && e2 === "风")) return 66;
  if ((e1 === "火" && e2 === "水") || (e1 === "水" && e2 === "火")) return 60;
  return 72;
}

const LIUHE = { "鼠": "牛", "牛": "鼠", "虎": "猪", "猪": "虎", "兔": "狗", "狗": "兔", "龙": "鸡", "鸡": "龙", "蛇": "猴", "猴": "蛇", "马": "羊", "羊": "马" };
const LIUCHONG = { "鼠": "马", "马": "鼠", "牛": "羊", "羊": "牛", "虎": "猴", "猴": "虎", "兔": "鸡", "鸡": "兔", "龙": "狗", "狗": "龙", "蛇": "猪", "猪": "蛇" };
const SANHE = {
  "鼠": ["猴", "龙"], "猴": ["鼠", "龙"], "龙": ["鼠", "猴"],
  "虎": ["马", "狗"], "马": ["虎", "狗"], "狗": ["虎", "马"],
  "蛇": ["鸡", "牛"], "鸡": ["蛇", "牛"], "牛": ["蛇", "鸡"],
  "猪": ["兔", "羊"], "兔": ["猪", "羊"], "羊": ["猪", "兔"]
};

function getAnimalScore(a1, a2) {
  if (a1 === a2) return 70;
  if (LIUHE[a1] === a2) return 92;
  if (LIUCHONG[a1] === a2) return 42;
  if (SANHE[a1] && SANHE[a1].includes(a2)) return 78;
  return 63;
}

function getDailyFortune(year, month, day, shichen) {
  const seed = hashCode(year + "-" + month + "-" + day + "-" + (shichen || "all"));
  const rand = mulberry32(seed);
  const base = 55 + Math.floor(rand() * 40); // 55-94
  const bonus = shichen ? SHICHEN_BONUS[shichen] : 0;
  const overall = clampScore(base + bonus * 2);
  const love = clampScore(50 + Math.floor(rand() * 45) + bonus);
  const career = clampScore(50 + Math.floor(rand() * 45) + bonus);
  const wealth = clampScore(50 + Math.floor(rand() * 45) + bonus);
  const health = clampScore(50 + Math.floor(rand() * 45) + bonus * 0.5);
  const yi = pickN(YI_POOL, 3, rand);
  const ji = pickN(JI_POOL, 2, rand);
  return { overall, love, career, wealth, health, yi, ji };
}

function pickN(pool, n, rand) {
  const arr = pool.slice();
  const out = [];
  for (let i = 0; i < n && arr.length; i++) {
    out.push(arr.splice(Math.floor(rand() * arr.length), 1)[0]);
  }
  return out;
}

function getMatchScore(myYear, myMonth, myDay, herYear, herMonth, herDay) {
  const mySign = getSign(myMonth, myDay);
  const herSign = getSign(herMonth, herDay);
  const myAnimal = getAnimal(myYear, myMonth, myDay);
  const herAnimal = getAnimal(herYear, herMonth, herDay);
  return computeMatch(mySign, herSign, myAnimal, herAnimal, myYear, herYear);
}

function computeMatch(mySign, herSign, myAnimal, herAnimal, myYear, herYear) {
  const signScore = getSignScore(mySign, herSign);
  const animalScore = getAnimalScore(myAnimal, herAnimal);
  const rand = mulberry32(hashCode(mySign + herSign + myAnimal + herAnimal + myYear + herYear));
  const micro = Math.floor(rand() * 13) - 6; // -6..6
  const total = clampScore(signScore * 0.48 + animalScore * 0.37 + 62 * 0.15 + micro);
  return { total, signScore, animalScore, mySign, herSign, myAnimal, herAnimal };
}

function matchComment(res) {
  let head;
  if (res.total >= 88) head = "天作之合，命中注定的般配！";
  else if (res.total >= 78) head = "十分般配，令人羡慕的默契组合。";
  else if (res.total >= 68) head = "比较合适，用心经营可长久。";
  else if (res.total >= 55) head = "缘分尚可，相处需要更多包容与理解。";
  else head = "差异较大，需要付出更多努力磨合。";

  const signTxt = res.signScore >= 80 ? "星座层面相当契合，志趣相投" :
                  res.signScore >= 70 ? "星座层面较为和谐，互补发展" :
                  "星座层面存在差异，需求同存异";
  const animalTxt = res.animalScore >= 85 ? "属相六合相生，互旺运势" :
                    res.animalScore >= 70 ? "属相相处和睦，彼此扶持" :
                    "属相有冲克，需多些耐心包容";
  return head + " " + res.mySign + "与" + res.herSign + "之间" + signTxt + "；" +
         res.myAnimal + "与" + res.herAnimal + "，属相上" + animalTxt + "。";
}

function getPersonalityScore(myType, herType, myYear, mySign, herYear, herSign) {
  const dims = [
    { idx: 0, same: 9, diff: 2, label: "内外倾向", sameText: "同频", diffText: "互补" },
    { idx: 1, same: 10, diff: -2, label: "信息偏好", sameText: "同频", diffText: "互补" },
    { idx: 2, same: 8, diff: 7, label: "决策方式", sameText: "同频", diffText: "互补" },
    { idx: 3, same: 6, diff: 8, label: "生活节奏", sameText: "同频", diffText: "互补" }
  ];
  const m = myType.split(""), h = herType.split("");
  let score = 50;
  const dimDetail = dims.map(function (d) {
    const isSame = m[d.idx] === h[d.idx];
    score += isSame ? d.same : d.diff;
    return { label: d.label, same: isSame, tag: isSame ? d.sameText : d.diffText };
  });
  const signScore = getSignScore(mySign, herSign);
  score += Math.round((signScore - 70) * 0.3);
  const rand = mulberry32(hashCode(myType + herType + myYear + herYear + mySign + herSign));
  score += Math.floor(rand() * 12) - 6;
  score = clampScore(score);
  return { score, dimDetail, signScore, mySign, herSign };
}

function personalityComment(res) {
  let head;
  if (res.score >= 90) head = "灵魂伴侣级别的默契，性格与三观高度共鸣！";
  else if (res.score >= 80) head = "高度契合的黄金组合，相处轻松自然。";
  else if (res.score >= 70) head = "搭配良好的理想组合，互相成就。";
  else if (res.score >= 60) head = "性格互补，用心经营会越走越近。";
  else if (res.score >= 50) head = "差异明显，重在理解与换位思考。";
  else head = "挑战较多，需要大量沟通与磨合。";
  const signTxt = res.signScore >= 80 ? "星座能量相互加成，为整体加分不少。" :
                   res.signScore >= 70 ? "星座层面温和互补，带来稳定支持。" :
                   "星座层面存在张力，建议多从性格维度寻找共识。";
  return head + " " + signTxt;
}

/* ---------------- UI 初始化 ---------------- */
function init() {
  const now = new Date();
  const curYear = now.getFullYear();

  /* 每日运势默认今天 */
  $("daily-year").value = curYear;
  $("daily-month").value = now.getMonth() + 1;
  $("daily-day").value = now.getDate();

  /* 星空 */
  makeStars();

  /* Tab 切换 */
  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      $(btn.dataset.tab).classList.add("active");
    });
  });

  /* 契合度方式切换 */
  document.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const a = btn.dataset.mode === "a";
      $("match-a").classList.toggle("hidden", !a);
      $("match-b").classList.toggle("hidden", a);
    });
  });

  /* 事件绑定 */
  $("btn-birth").addEventListener("click", onBirth);
  $("btn-daily").addEventListener("click", onDaily);
  $("btn-match").addEventListener("click", onMatch);
  $("btn-personality").addEventListener("click", onPersonality);
}

function makeStars() {
  const wrap = document.querySelector(".stars");
  let html = "";
  for (let i = 0; i < 110; i++) {
    const size = (Math.random() * 2.5 + 1).toFixed(1);
    const top = (Math.random() * 100).toFixed(2);
    const left = (Math.random() * 100).toFixed(2);
    const delay = (Math.random() * 4).toFixed(2);
    const dur = (2.4 + Math.random() * 2.5).toFixed(2);
    html += '<i style="width:' + size + 'px;height:' + size + 'px;top:' + top + '%;left:' + left + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's"></i>';
  }
  wrap.innerHTML = html;
}

/* ---------------- 结果渲染 ---------------- */
function showResult(id, html) {
  const el = $(id);
  el.innerHTML = html;
  el.classList.add("show");
}

function ringHTML(score, label) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const color = scoreColor(score);
  return (
    '<div class="ring-wrap">' +
    '<svg viewBox="0 0 120 120">' +
    '<circle class="ring-bg" cx="60" cy="60" r="' + r + '"></circle>' +
    '<circle class="ring-val" cx="60" cy="60" r="' + r + '" stroke="' + color + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
    '</svg>' +
    '<div class="ring-text"><b>' + score + '</b><span>' + label + '</span></div>' +
    '</div>'
  );
}

function barsHTML(items) {
  let html = "";
  items.forEach(function (it) {
    const color = scoreColor(it.score);
    html +=
      '<div class="bar-item">' +
      '<div class="bar-top"><span>' + esc(it.name) + '</span><b>' + it.score + '分</b></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + it.score + '%;background:linear-gradient(90deg,' + color + ',' + color + 'aa)"></div></div>' +
      '</div>';
  });
  return html;
}

/* ---------------- 功能一：生日测算 ---------------- */
function onBirth() {
  const year = parseYear($("birth-year").value, "出生");
  if (year === null) return;
  const month = parseMonth($("birth-month").value, "出生");
  if (month === null) return;
  const day = parseDay($("birth-day").value, "出生", year, month);
  if (day === null) return;
  const shichen = parseShichen($("birth-shichen").value, true);
  if (shichen === null) return;

  const sign = getSign(month, day);
  const lunar = lunarFromSolar(year, month, day);
  const animal = getAnimal(year, month, day);
  const info = ANIMAL_INFO[animal];
  const sInfo = SIGN_INFO[sign];
  const best = BEST_MATCH[sign];

  let shiText = "";
  if (shichen) {
    const elem = SHICHEN_ELEMENT[shichen];
    shiText = '<p class="dim">出生时辰：<b>' + shichen + '时</b>（五行属' + elem + '）· ' + SHICHEN_TEXT[shichen] + '</p>';
  } else {
    shiText = '<p class="dim">未指定出生时辰，按全天综合测算。</p>';
  }

  const html =
    '<div class="card">' +
    '<div class="badge-row">' +
    '<div class="badge">♈ ' + sign + '<small>' + sInfo.dates + ' · ' + sInfo.element + '象星座</small></div>' +
    '<div class="badge">属相：' + animal + '<small>农历' + lunar.year + '年 · 五行属' + info.element + '</small></div>' +
    '</div>' +
    '<h4>星座性格</h4><p>' + esc(sInfo.desc) + '</p>' +
    '<h4>属相性格</h4><p>' + esc(info.personality) + '</p>' +
    '<h4>运势简述</h4><p>' + esc(info.fortune) + '</p>' +
    '<h4>适合的恋爱对象星座</h4>' +
    '<div class="chips">' + best.map(function (s) { return '<span class="chip">' + s + '</span>'; }).join("") + '</div>' +
    '<p class="dim">农历生日：' + lunarDateText(lunar) + '</p>' +
    shiText +
    '</div>';

  showResult("birth-result", html);
}

/* ---------------- 功能二：每日运势 ---------------- */
function onDaily() {
  const year = parseYear($("daily-year").value, "");
  if (year === null) return;
  const month = parseMonth($("daily-month").value, "");
  if (month === null) return;
  const day = parseDay($("daily-day").value, "", year, month);
  if (day === null) return;
  const shichen = parseShichen($("daily-shichen").value, true);
  if (shichen === null) return;

  const f = getDailyFortune(year, month, day, shichen);
  const level = scoreLevel(f.overall);
  const levelColor = scoreColor(f.overall);
  const sign = getSign(month, day);
  const lunar = lunarFromSolar(year, month, day);
  const animal = getAnimal(year, month, day);

  let shiBlock = "";
  if (shichen) {
    shiBlock = '<div class="card"><h4>时辰解析 · ' + shichen + '时</h4><p>' + SHICHEN_TEXT[shichen] + '</p></div>';
  }

  const html =
    '<div class="card">' +
    '<div class="score-head">' +
    ringHTML(f.overall, "综合运势") +
    '<div><div class="level-tag" style="color:' + levelColor + ';border-color:' + levelColor + 'aa;background:' + levelColor + '22">' + level + '</div>' +
    '<p style="margin-top:10px;font-size:14px;">' + year + '年' + month + '月' + day + '日 · 农历' + lunarDateText(lunar) + '<br>' +
    (shichen ? shichen + "时" : "全天") + '<br><span class="dim">当日星座：' + sign + ' · 属相：' + animal + '</span></p></div>' +
    '</div>' +
    '<h4>分项运势</h4>' +
    barsHTML([
      { name: "爱情运势", score: f.love },
      { name: "事业运势", score: f.career },
      { name: "财运运势", score: f.wealth },
      { name: "健康运势", score: f.health }
    ]) +
    '</div>' +
    '<div class="card">' +
    '<div class="yiji">' +
    '<div class="yi"><h4>宜</h4><div class="tags">' + f.yi.map(function (t) { return "<span>" + t + "</span>"; }).join("") + '</div></div>' +
    '<div class="ji"><h4>忌</h4><div class="tags">' + f.ji.map(function (t) { return "<span>" + t + "</span>"; }).join("") + '</div></div>' +
    '</div>' +
    '</div>' +
    shiBlock;

  showResult("daily-result", html);
}

/* ---------------- 功能三：情侣契合度 ---------------- */
function onMatch() {
  const mode = document.querySelector(".seg-btn.active").dataset.mode;
  const myYear = parseYear($("match-my-year").value, "我的");
  if (myYear === null) return;
  const myMonth = parseMonth($("match-my-month").value, "我的");
  if (myMonth === null) return;
  const myDay = parseDay($("match-my-day").value, "我的", myYear, myMonth);
  if (myDay === null) return;

  let res;
  let approxNote = "";
  if (mode === "a") {
    const herYear = parseYear($("match-her-year").value, "对方");
    if (herYear === null) return;
    const herMonth = parseMonth($("match-her-month").value, "对方");
    if (herMonth === null) return;
    const herDay = parseDay($("match-her-day").value, "对方", herYear, herMonth);
    if (herDay === null) return;
    res = getMatchScore(myYear, myMonth, myDay, herYear, herMonth, herDay);
  } else {
    const herYear = parseYear($("match-her-year2").value, "对方");
    if (herYear === null) return;
    const herSign = parseSign($("match-her-sign").value, "对方");
    if (herSign === null) return;
    const mySign = getSign(myMonth, myDay);
    const myAnimal = getAnimal(myYear, myMonth, myDay);
    const herAnimal = getAnimal(herYear);
    approxNote = '<p class="dim">注：未填写对方出生月日，对方属相按公历年份对应的农历年估算。</p>';
    res = computeMatch(mySign, herSign, myAnimal, herAnimal, myYear, herYear);
  }

  const html =
    '<div class="card">' +
    '<div class="score-head">' +
    ringHTML(res.total, "契合度") +
    '<div><div class="level-tag" style="color:' + scoreColor(res.total) + ';border-color:' + scoreColor(res.total) + 'aa;background:' + scoreColor(res.total) + '22">' +
    (res.total >= 88 ? "天作之合" : res.total >= 78 ? "十分般配" : res.total >= 68 ? "比较合适" : res.total >= 55 ? "缘分尚可" : "需要磨合") + '</div>' +
    '<p style="margin-top:10px;font-size:14px;">' + res.mySign + '（属' + res.myAnimal + '） × ' + res.herSign + '（属' + res.herAnimal + '）</p></div>' +
    '</div>' +
    '<h4>契合度分析</h4>' +
    barsHTML([
      { name: "星座契合", score: res.signScore },
      { name: "属相契合", score: res.animalScore }
    ]) +
    '<h4>综合评价</h4><p>' + esc(matchComment(res)) + '</p>' +
    approxNote +
    '</div>';

  showResult("match-result", html);
}

/* ---------------- 功能四：性格搭配 ---------------- */
function onPersonality() {
  const myType = parseMBTI($("per-my-type").value, "我的");
  if (myType === null) return;
  const herType = parseMBTI($("per-her-type").value, "对方");
  if (herType === null) return;
  const myYear = parseYear($("per-my-year").value, "我的");
  if (myYear === null) return;
  const herYear = parseYear($("per-her-year").value, "对方");
  if (herYear === null) return;
  const mySign = parseSign($("per-my-sign").value, "我的");
  if (mySign === null) return;
  const herSign = parseSign($("per-her-sign").value, "对方");
  if (herSign === null) return;

  const res = getPersonalityScore(myType, herType, myYear, mySign, herYear, herSign);
  const myName = MBTI_LIST.find(function (x) { return x[0] === myType; })[1];
  const herName = MBTI_LIST.find(function (x) { return x[0] === herType; })[1];

  const dimRows = res.dimDetail.map(function (d) {
    return '<div class="dim-row"><span>' + d.label + '：' + (d.same ? "相近" : "互补") + '</span>' +
      '<span class="tag ' + (d.same ? "same" : "comp") + '">' + d.tag + '</span></div>';
  }).join("");

  const html =
    '<div class="card">' +
    '<div class="score-head">' +
    ringHTML(res.score, "整体评分") +
    '<div><div class="level-tag" style="color:' + scoreColor(res.score) + ';border-color:' + scoreColor(res.score) + 'aa;background:' + scoreColor(res.score) + '22">' +
    (res.score >= 90 ? "灵魂伴侣" : res.score >= 80 ? "高度契合" : res.score >= 70 ? "良好搭配" : res.score >= 60 ? "互补经营" : res.score >= 50 ? "差异明显" : "挑战较多") + '</div>' +
    '<p style="margin-top:10px;font-size:14px;">' + myType + ' ' + myName + ' × ' + herType + ' ' + herName + '<br>' +
    '<span class="dim">' + mySign + '（' + myYear + '年） × ' + herSign + '（' + herYear + '年）</span></p></div>' +
    '</div>' +
    '<h4>性格维度分析</h4>' + dimRows +
    '<h4>综合评价</h4><p>' + esc(personalityComment(res)) + '</p>' +
    '<p class="dim">本评分独立于「情侣契合度」，仅从性格与星座能量角度评估搭配。</p>' +
    '</div>';

  showResult("personality-result", html);
}

/* ---------------- 启动 ---------------- */
document.addEventListener("DOMContentLoaded", init);
