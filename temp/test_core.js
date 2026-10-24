// 核心算法自检：直接加载真实 script.js（vm 运行），验证生肖/星座/关系/分数/年龄差边界。
// 运行：node temp/test_core.js （在项目根目录执行，或绝对路径读取）
const fs = require('fs');
const vm = require('vm');

const scriptPath = 'E:\\AI\\Marvis\\作品\\年龄运势\\script.js';
const code = fs.readFileSync(scriptPath, 'utf8');

const documentMock = {
  getElementById: function () { return null; },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}
};

const sandbox = {
  document: documentMock,
  alert: function () {},
  console: console,
  Math: Math,
  Date: Date,
  parseInt: parseInt,
  isNaN: isNaN,
  String: String,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'script.js' });

const t = sandbox;
let failures = 0;
function check(name, cond) {
  if (!cond) { failures++; console.log("FAIL: " + name); }
}

/* ---------- 星座边界 ---------- */
check("1.20 水瓶", t.getSign(1, 20) === "水瓶座");
check("2.18 水瓶", t.getSign(2, 18) === "水瓶座");
check("2.19 双鱼", t.getSign(2, 19) === "双鱼座");
check("3.21 白羊", t.getSign(3, 21) === "白羊座");
check("4.19 白羊", t.getSign(4, 19) === "白羊座");
check("4.20 金牛", t.getSign(4, 20) === "金牛座");
check("6.21 双子", t.getSign(6, 21) === "双子座");
check("6.22 巨蟹", t.getSign(6, 22) === "巨蟹座");
check("7.23 狮子", t.getSign(7, 23) === "狮子座");
check("8.22 狮子", t.getSign(8, 22) === "狮子座");
check("8.23 处女", t.getSign(8, 23) === "处女座");
check("9.23 天秤", t.getSign(9, 23) === "天秤座");
check("10.23 天秤", t.getSign(10, 23) === "天秤座");
check("10.24 天蝎", t.getSign(10, 24) === "天蝎座");
check("11.22 天蝎", t.getSign(11, 22) === "天蝎座");
check("11.23 射手", t.getSign(11, 23) === "射手座");
check("12.21 射手", t.getSign(12, 21) === "射手座");
check("12.22 摩羯", t.getSign(12, 22) === "摩羯座");
check("1.19 摩羯", t.getSign(1, 19) === "摩羯座");

/* ---------- 春节口径生肖（默认 BOUNDARY=spring） ---------- */
check("2024春节前一天 属兔", t.getAnimal(2024, 2, 9) === "兔");
check("2024春节当天 属龙", t.getAnimal(2024, 2, 10) === "龙");
check("2024春节后一天 属龙", t.getAnimal(2024, 2, 11) === "龙");
check("2024-01-31 属兔（防公历%12误判）", t.getAnimal(2024, 1, 31) === "兔");
check("2023除夕 属虎", t.getAnimal(2023, 1, 21) === "虎");
check("2023春节 属兔", t.getAnimal(2023, 1, 22) === "兔");
check("2025春节前一天 属龙（仍农历2024）", t.getAnimal(2025, 1, 28) === "龙");
check("2025春节当天 属蛇（乙巳）", t.getAnimal(2025, 1, 29) === "蛇");
check("2000-01-01 属兔（农历1999兔年）", t.getAnimal(2000, 1, 1) === "兔");

/* ---------- 立春口径生肖（BOUNDARY 为 var 全局，可在 vm 中切换） ---------- */
t.BOUNDARY = "lichun";
check("立春口径2024立春前一天 属兔", t.getAnimal(2024, 2, 3) === "兔");
check("立春口径2024立春当天 属龙", t.getAnimal(2024, 2, 4) === "龙");
check("立春口径2024立春后一天 属龙", t.getAnimal(2024, 2, 5) === "龙");
check("立春口径2024-02-04 生肖年为2024", t.getLunarYear(2024, 2, 4) === 2024);
check("临界日识别2024-02-04", t.isLichunCritical(2024, 2, 4) === true);
check("非临界日2024-02-03", t.isLichunCritical(2024, 2, 3) === false);
t.BOUNDARY = "spring";

/* ---------- 农历/生肖年与范围 ---------- */
check("农历1900-01-31有效", t.lunarFromSolar(1900, 1, 31).year === 1900);
check("农历2024春节转农历2024", t.lunarFromSolar(2024, 2, 10).year === 2024);
check("农历2024-02-09仍是农历2023", t.lunarFromSolar(2024, 2, 9).year === 2023);
check("范围检查1900-01-30无效", t.checkLunarRange(1900, 1, 30) === false);
check("范围检查1900-01-31有效", t.checkLunarRange(1900, 1, 31) === true);
check("范围检查2100-12-31有效", t.checkLunarRange(2100, 12, 31) === true);
check("闰年2月29可计算", typeof t.getAnimal(2024, 2, 29) === "string");
check("未来日期识别2099", t.isFutureDate(2099, 1, 1) === true);
check("过去日期识别2000", t.isFutureDate(2000, 1, 1) === false);

/* ---------- 生肖关系：完整数据与多重关系 ---------- */
check("鼠牛六合", t.getAnimalRelation("鼠", "牛").type === "liuhe");
check("鼠马六冲", t.getAnimalRelation("鼠", "马").type === "liuchong");
check("鼠猴三合", t.getAnimalRelation("鼠", "猴").type === "sanhe");
check("鼠龙三合", t.getAnimalRelation("鼠", "龙").type === "sanhe");
check("鼠鼠其他", t.getAnimalRelation("鼠", "鼠").type === "other");
check("鼠羊六害", t.getAnimalRelation("鼠", "羊").type === "liuhai");
check("蛇猴六合+兼有相刑", t.getAnimalRelation("蛇", "猴").type === "liuhe" && t.getAnimalRelation("蛇", "猴").secondary.indexOf("xing") !== -1);
const ny = t.getAnimalRelation("牛", "羊");
check("牛羊六冲+兼有相刑", ny.type === "liuchong" && ny.secondary.indexOf("xing") !== -1);
const hs = t.getAnimalRelation("虎", "蛇");
check("虎蛇六害+兼有相刑", hs.type === "liuhai" && hs.secondary.indexOf("xing") !== -1);
check("关系对称(牛/羊)", t.getAnimalRelation("羊", "牛").type === ny.type && JSON.stringify(t.getAnimalRelation("羊", "牛").secondary) === JSON.stringify(ny.secondary));
const shRel = t.getAnimalRelation("鼠", "猴");
check("鼠猴三合主关系", shRel.type === "sanhe" && shRel.name === "三合");

/* ---------- 契合度：确定性 + 顺序无关 + 无随机扰动 ---------- */
const r1 = t.computeMatch("狮子座", "双鱼座", "虎", "蛇", 2022, 2025);
const r2 = t.computeMatch("狮子座", "双鱼座", "虎", "蛇", 2022, 2025);
check("相同输入两次结果一致", r1.total === r2.total && r1.base === r2.base);
const r3 = t.computeMatch("双鱼座", "狮子座", "蛇", "虎", 2025, 2022);
check("交换双方顺序总分一致", r1.total === r3.total);
check("交换双方顺序关系一致", r1.rel.type === r3.rel.type);
check("分数由base+bonus构成", r1.total === t.clampScore(r1.base + r1.bonus));

/* ---------- 年龄差边界（精确到年月日，顺序无关） ---------- */
function ad(y1, m1, d1, y2, m2, d2) { return t.ageDiff(y1, m1, d1, y2, m2, d2); }
let d1 = ad(2000, 1, 1, 2000, 1, 2);
check("年龄差1天", d1.years === 0 && d1.months === 0 && d1.days === 1);
let d2 = ad(2000, 1, 1, 2000, 2, 1);
check("年龄差整1月", d2.years === 0 && d2.months === 1 && d2.days === 0);
let d3 = ad(2000, 12, 31, 2001, 1, 1);
check("年龄差跨年1天", d3.years === 0 && d3.months === 0 && d3.days === 1);
let d4 = ad(2000, 2, 29, 2001, 2, 28);
check("闰日生日到平年2/28满1年", d4.years === 1 && d4.months === 0 && d4.days === 0);
let d5 = ad(2004, 2, 28, 2004, 2, 29);
check("闰日边界1天", d5.years === 0 && d5.months === 0 && d5.days === 1);
let d6 = ad(2000, 1, 31, 2000, 2, 29);
check("月末溢出29天", d6.years === 0 && d6.months === 0 && d6.days === 29);
let d7 = ad(2001, 1, 1, 2000, 1, 1);
check("年龄差顺序无关", d7.years === 1 && d7.months === 0 && d7.days === 0);
let d8 = ad(1995, 7, 23, 1996, 2, 20);
check("年龄差跨年多月", d8.years === 0 && d8.months === 6 && d8.days === 28);
let d9 = ad(2000, 2, 29, 2024, 2, 29);
check("闰日生日到闰年2/29整24年", d9.years === 24 && d9.months === 0 && d9.days === 0);
let d10 = ad(2000, 2, 29, 2023, 2, 28);
check("闰日生日到平年2/28整23年", d10.years === 23 && d10.months === 0 && d10.days === 0);
let d11 = ad(2000, 2, 29, 2004, 2, 29);
check("闰日生日到闰年2/29整4年", d11.years === 4 && d11.months === 0 && d11.days === 0);

/* ---------- 每日运势：范围与确定性 ---------- */
let okRange = true, okStable = true;
const seen = {};
for (let i = 0; i < 500; i++) {
  const y = 2000 + (i % 25), m = 1 + (i % 12), d = 1 + (i % 28);
  const f = t.getDailyFortune(y, m, d, "");
  if ([f.overall, f.love, f.career, f.wealth, f.health].some(v => v < 1 || v > 100)) okRange = false;
  const f2 = t.getDailyFortune(y, m, d, "");
  if (f.overall !== f2.overall) okStable = false;
  seen[y + "-" + m + "-" + d] = f.overall;
}
check("每日运势范围1-100", okRange);
check("每日运势同日稳定", okStable);
check("每日运势有区分度(>100种)", Object.keys(seen).length > 100);

/* ---------- 性格评分：范围 + 顺序无关 + 无确定性标签 ---------- */
let perOk = true;
const types = ["INTJ", "INFP", "ESTP", "ESFJ", "ISTJ", "ENFP", "ENTJ", "ISFP"];
const signs = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
for (let i = 0; i < 200; i++) {
  const s = t.getPersonalityScore(types[i % 8], types[(i * 3) % 8], 1990 + (i % 20), 2000 + (i % 15), signs[i % 12], signs[(i * 5) % 12]);
  if (s.score < 1 || s.score > 100) perOk = false;
}
check("性格评分范围1-100", perOk);
const p1 = t.getPersonalityScore("INTJ", "INFP", 1995, 1996, "狮子座", "双鱼座");
const p2 = t.getPersonalityScore("INFP", "INTJ", 1996, 1995, "双鱼座", "狮子座");
check("性格评分交换顺序一致", p1.score === p2.score);

/* ---------- 文案红线：无确定性标签与无依据的"今年" ---------- */
check("源文件不含今年表述", code.indexOf("今年") === -1);
check("源文件不含灵魂伴侣/天作之合", code.indexOf("灵魂伴侣") === -1 && code.indexOf("天作之合") === -1);
check("生肖关系文案不混用三会", code.indexOf("三会") !== -1 && code.indexOf("不混用") !== -1);

/* ---------- 星座速配对称化：只补反向项，不传播间接关联 ---------- */
const BEST = JSON.parse(vm.runInContext("JSON.stringify(BEST_MATCH)", sandbox));
const SYM = JSON.parse(vm.runInContext("JSON.stringify(SYM_BEST_MATCH)", sandbox));
const signs12 = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];

// 通用断言：SYM[A] 中每个元素 x，要么是 A 的原始速配项，要么是"x 视 A 为速配"的直接反向项；
// 不允许经 A→B→x 链条扩散出的星座进入列表
let noIndirect = true;
signs12.forEach(function (a) {
  SYM[a].forEach(function (x) {
    const original = BEST[a].indexOf(x) !== -1;
    const directReverse = BEST[x] && BEST[x].indexOf(a) !== -1;
    if (!(original || directReverse)) noIndirect = false;
  });
});
check("速配-无间接扩散（列表只含原始项+直接反向项）", noIndirect);

// 双向对称：A 视 B ⟺ B 视 A（对称化核心效果）
let symmetric = true;
signs12.forEach(function (a) {
  signs12.forEach(function (b) {
    if ((SYM[a].indexOf(b) !== -1) !== (SYM[b].indexOf(a) !== -1)) symmetric = false;
  });
});
check("速配-双向对称无单向结论", symmetric);

// 金牛座：只含原始项 [处女座,摩羯座,巨蟹座] + 直接反向项 [天蝎座,双鱼座]
//（天蝎座/双鱼座的原始速配表直接列出金牛座，属直接反向补全），不含间接扩散星座
const taurusSet = SYM["金牛座"];
check("速配-金牛列表=原始项+直接反向项", taurusSet.length === 5 && ["处女座", "摩羯座", "巨蟹座", "天蝎座", "双鱼座"].every(function (s) { return taurusSet.indexOf(s) !== -1; }));
const indirectCandidates = ["白羊座", "狮子座", "射手座", "水瓶座", "双子座", "天秤座"];
check("速配-金牛不含间接扩散星座", indirectCandidates.every(function (s) { return SYM["金牛座"].indexOf(s) === -1; }));
check("速配-原始BEST_MATCH未被对称化污染", BEST["金牛座"].join(",") === "处女座,摩羯座,巨蟹座");

/* ---------- 中国时区（UTC+8）：今天/不能晚于今天口径与页面声明一致 ---------- */
// 用固定"当前时刻"验证：北京时间跨日边界下 chinaToday/isFutureDate/todayText/ageNow 取值正确。
// FakeDate 将无参 new Date() / Date.now() 固定到指定时刻，带参构造仍走真实日历逻辑。
const RealDateForTest = Date;
function makeChinaBox(fakeNow) {
  class FakeDate extends RealDateForTest {
    static now() { return fakeNow; }
    constructor() {
      super(fakeNow);
    }
  }
  // 透传带参构造：script.js 中 new Date(时间戳/年,月,日) 需走真实日历逻辑（如 chinaToday 的 +8h 偏移）
  const FakeDate2 = new Proxy(FakeDate, {
    construct(target, args) {
      if (args.length === 0) return new target(fakeNow);
      return new RealDateForTest(...args);
    }
  });
  FakeDate2.now = function () { return fakeNow; };
  const sb = {
    document: documentMock,
    alert: function () {},
    console: console,
    Math: Math,
    Date: FakeDate2,
    parseInt: parseInt,
    isNaN: isNaN,
    String: String,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(code, sb, { filename: 'script.js' });
  return sb;
}

// 场景A：UTC 2026-10-24T15:59:00Z = 北京时间 2026-10-24 23:59（未跨日）
let cb = makeChinaBox(Date.UTC(2026, 9, 24, 15, 59, 0));
let ct = JSON.parse(vm.runInContext("JSON.stringify(chinaToday())", cb));
check("时区-北京未跨日今天=2026-10-24", ct.y === 2026 && ct.m === 10 && ct.d === 24);
check("时区-未跨日今天不是未来", cb.isFutureDate(2026, 10, 24) === false);
check("时区-未跨日明天是未来", cb.isFutureDate(2026, 10, 25) === true);
check("时区-未跨日todayText", vm.runInContext('todayText()', cb) === "2026 年 10 月 24 日");
check("时区-未跨日周岁已过生日", cb.ageNow(2025, 10, 24) === 1);
check("时区-未跨日周岁未过生日", cb.ageNow(2025, 10, 25) === 0);

// 场景B：UTC 2026-10-24T16:30:00Z = 北京时间 2026-10-25 00:30（已跨日，本地若为西半球仍是 24 日）
cb = makeChinaBox(Date.UTC(2026, 9, 24, 16, 30, 0));
ct = JSON.parse(vm.runInContext("JSON.stringify(chinaToday())", cb));
check("时区-北京跨日后今天=2026-10-25", ct.y === 2026 && ct.m === 10 && ct.d === 25);
check("时区-跨日后今天不是未来", cb.isFutureDate(2026, 10, 25) === false);
check("时区-跨日后明天是未来", cb.isFutureDate(2026, 10, 26) === true);
check("时区-跨日后todayText", vm.runInContext('todayText()', cb) === "2026 年 10 月 25 日");
check("时区-跨日后周岁按北京今天", cb.ageNow(2025, 10, 25) === 1);

console.log(failures === 0 ? "ALL TESTS PASSED" : failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
