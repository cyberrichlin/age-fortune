// 自测脚本：模拟 DOM + alert，验证 script.js 校验逻辑
const fs = require('fs');
const vm = require('vm');

const scriptPath = 'E:\\AI\\Marvis\\作品\\年龄运势\\script.js';
const code = fs.readFileSync(scriptPath, 'utf8');

const els = {};
const alerts = [];
const results = {};

function makeEl(id) {
  if (!els[id]) {
    els[id] = {
      value: '',
      innerHTML: '',
      dataset: {},
      classList: {
        add: function () {},
        remove: function () {},
        toggle: function () {}
      }
    };
  }
  return els[id];
}

const documentMock = {
  getElementById: function (id) { return makeEl(id); },
  querySelector: function (sel) {
    if (sel === '.seg-btn.active') return { dataset: { mode: 'a' } };
    return null;
  },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}
};

const sandbox = {
  document: documentMock,
  alert: function (msg) { alerts.push(String(msg)); },
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
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail ? ' => ' + detail : '')); }
}

function setVals(map) {
  Object.keys(map).forEach(function (k) { makeEl(k).value = map[k]; });
}
function alertMsgContains(txt) {
  return alerts.some(function (a) { return a.indexOf(txt) !== -1; });
}

// ---------- 生日测算 ----------
// 用例1：非法月份 13
alerts.length = 0; results['birth-result'] = null;
setVals({ 'birth-year': '1995', 'birth-month': '13', 'birth-day': '15', 'birth-shichen': '' });
t.onBirth();
check('生日-月份13弹窗', alertMsgContains('月份只能在1-12之间'));
check('生日-月份13不计算', makeEl('birth-result').innerHTML === '');

// 用例2：2023年2月30日非法
alerts.length = 0;
setVals({ 'birth-year': '2023', 'birth-month': '2', 'birth-day': '30', 'birth-shichen': '' });
t.onBirth();
check('生日-2月30日弹窗(2023平年)', alertMsgContains('2月只有28天'));
check('生日-2月30日不计算', makeEl('birth-result').innerHTML === '');

// 用例3：闰年2024年2月29日合法
alerts.length = 0;
setVals({ 'birth-year': '2024', 'birth-month': '2', 'birth-day': '29', 'birth-shichen': '' });
t.onBirth();
check('生日-2024闰年2月29合法', alerts.length === 0 && makeEl('birth-result').innerHTML.indexOf('双鱼座') !== -1);

// 用例4：2023年2月29日非法（非闰年）
alerts.length = 0;
setVals({ 'birth-year': '2023', 'birth-month': '2', 'birth-day': '29', 'birth-shichen': '' });
t.onBirth();
check('生日-2023非闰年2月29弹窗', alertMsgContains('2月只有28天'));

// 用例5：大月31日在4月非法
alerts.length = 0;
setVals({ 'birth-year': '2000', 'birth-month': '4', 'birth-day': '31', 'birth-shichen': '' });
t.onBirth();
check('生日-4月31日弹窗', alertMsgContains('4月只有30天'));

// 用例6：时辰非法
alerts.length = 0;
setVals({ 'birth-year': '1995', 'birth-month': '6', 'birth-day': '15', 'birth-shichen': '子时1' });
const before6 = makeEl('birth-result').innerHTML;
t.onBirth();
check('生日-时辰非法弹窗', alertMsgContains('十二时辰'));
check('生日-时辰非法不计算', makeEl('birth-result').innerHTML === before6);

// 用例7：时辰合法（带时字）
alerts.length = 0;
setVals({ 'birth-year': '1995', 'birth-month': '6', 'birth-day': '15', 'birth-shichen': '午时' });
t.onBirth();
check('生日-午时合法且计算', alerts.length === 0 && makeEl('birth-result').innerHTML.indexOf('午时') !== -1);

// 用例8：年份越界
alerts.length = 0;
setVals({ 'birth-year': '1899', 'birth-month': '6', 'birth-day': '15', 'birth-shichen': '' });
t.onBirth();
check('生日-年份1899弹窗', alertMsgContains('1900-2100'));
alerts.length = 0;
setVals({ 'birth-year': '2101', 'birth-month': '6', 'birth-day': '15', 'birth-shichen': '' });
t.onBirth();
check('生日-年份2101弹窗', alertMsgContains('1900-2100'));

// 用例9：完整合法输入
alerts.length = 0;
setVals({ 'birth-year': '1995', 'birth-month': '7', 'birth-day': '23', 'birth-shichen': '子' });
t.onBirth();
check('生日-合法输入出结果', alerts.length === 0 && makeEl('birth-result').innerHTML.indexOf('狮子座') !== -1);

// ---------- 每日运势 ----------
// 用例10：非法日
alerts.length = 0;
setVals({ 'daily-year': '2026', 'daily-month': '11', 'daily-day': '31', 'daily-shichen': '' });
t.onDaily();
check('每日-11月31日弹窗', alertMsgContains('11月只有30天'));
check('每日-非法不计算', makeEl('daily-result').innerHTML === '');

// 用例11：合法
alerts.length = 0;
setVals({ 'daily-year': '2026', 'daily-month': '10', 'daily-day': '23', 'daily-shichen': '酉' });
t.onDaily();
check('每日-合法出结果', alerts.length === 0 && makeEl('daily-result').innerHTML.indexOf('综合运势') !== -1);

// ---------- 情侣契合 方式A ----------
// 用例12：对方月份非法
alerts.length = 0;
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year': '1996', 'match-her-month': '0', 'match-her-day': '20' });
t.onMatch();
check('契合A-对方月份0弹窗', alertMsgContains('月份只能在1-12之间'));
check('契合A-非法不计算', makeEl('match-result').innerHTML === '');

// 用例13：方式A合法
alerts.length = 0;
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year': '1996', 'match-her-month': '2', 'match-her-day': '20' });
t.onMatch();
check('契合A-合法出结果', alerts.length === 0 && makeEl('match-result').innerHTML.indexOf('生肖关系') !== -1);

// ---------- 情侣契合 方式B ----------
sandbox.document.querySelector = function (sel) {
  if (sel === '.seg-btn.active') return { dataset: { mode: 'b' } };
  return null;
};
// 用例14：星座非法
alerts.length = 0;
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year2': '1996', 'match-her-sign': '大熊座' });
const before14 = makeEl('match-result').innerHTML;
t.onMatch();
check('契合B-星座非法弹窗', alertMsgContains('12星座'));
check('契合B-非法不计算', makeEl('match-result').innerHTML === before14);

// 用例15：星座合法
alerts.length = 0;
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year2': '1996', 'match-her-sign': '狮子座' });
t.onMatch();
check('契合B-星座合法出结果', alerts.length === 0 && makeEl('match-result').innerHTML.indexOf('生肖关系') !== -1);

// ---------- 性格搭配 ----------
// 用例16：MBTI非法
alerts.length = 0;
setVals({ 'per-my-type': 'XXXX', 'per-her-type': 'INFP', 'per-my-year': '1995', 'per-my-sign': '狮子座', 'per-her-year': '1996', 'per-her-sign': '双鱼座' });
t.onPersonality();
check('性格-MBTI非法弹窗', alertMsgContains('16型'));
check('性格-非法不计算', makeEl('personality-result').innerHTML === '');

// 用例17：MBTI小写合法
alerts.length = 0;
setVals({ 'per-my-type': 'intj', 'per-her-type': 'infp', 'per-my-year': '1995', 'per-my-sign': '狮子座', 'per-her-year': '1996', 'per-her-sign': '双鱼座' });
t.onPersonality();
check('性格-MBTI小写合法出结果', alerts.length === 0 && makeEl('personality-result').innerHTML.indexOf('建筑师') !== -1);

// 用例18：星座非法
alerts.length = 0;
setVals({ 'per-my-type': 'INTJ', 'per-her-type': 'INFP', 'per-my-year': '1995', 'per-my-sign': '狮子', 'per-her-year': '1996', 'per-her-sign': '双鱼座' });
t.onPersonality();
check('性格-星座非法弹窗', alertMsgContains('12星座'));

// 用例19：年份非法
alerts.length = 0;
setVals({ 'per-my-type': 'INTJ', 'per-her-type': 'INFP', 'per-my-year': '1750', 'per-my-sign': '狮子座', 'per-her-year': '1996', 'per-her-sign': '双鱼座' });
t.onPersonality();
check('性格-年份1750弹窗', alertMsgContains('1900-2100'));

// ---------- 生日速查（首屏，只收一个公历生日） ----------
// 用例20：空日期弹窗
alerts.length = 0;
setVals({ 'quick-date': '' });
t.onQuick();
check('速查-空日期弹窗', alertMsgContains('请选择你的公历生日'));
check('速查-空日期不计算', makeEl('quick-result').innerHTML === '');

// 用例21：只填一个生日即成功（不要求姓名/性别/时辰/地点）
alerts.length = 0;
setVals({ 'quick-date': '1995-07-23' });
t.onQuick();
const q21 = makeEl('quick-result').innerHTML;
check('速查-单生日成功', alerts.length === 0 && q21.indexOf('狮子座') !== -1);
check('速查-含生肖分块', q21.indexOf('生肖') !== -1 && q21.indexOf('分界口径') !== -1);
check('速查-含农历生日分块', q21.indexOf('农历生日') !== -1);
check('速查-含民俗参考分块', q21.indexOf('民俗参考') !== -1);
check('速查-含免责声明', q21.indexOf('免责声明') !== -1);
check('速查-含继续合盘按钮', q21.indexOf('继续做双人合盘') !== -1);

// 用例22：未来日期弹窗
alerts.length = 0;
makeEl('quick-result').innerHTML = '';
setVals({ 'quick-date': '2099-01-01' });
t.onQuick();
check('速查-未来日期弹窗', alertMsgContains('不能晚于今天'));
check('速查-未来日期不计算', makeEl('quick-result').innerHTML === '');

// 用例23：立春临界日提示（默认春节口径）
alerts.length = 0;
setVals({ 'quick-date': '2024-02-04' });
t.onQuick();
const q23 = makeEl('quick-result').innerHTML;
check('速查-立春临界日有提示', q23.indexOf('临界日提示') !== -1);
check('速查-临界日提示含未提供出生时间说明', q23.indexOf('未提供出生时间') !== -1);
check('速查-临界日提示含两种口径对比', q23.indexOf('若按立春日期近似判断') !== -1);

// 用例23b：非法日期不生成结果
alerts.length = 0;
makeEl('quick-result').innerHTML = '';
setVals({ 'quick-date': '2024-13-45' });
t.onQuick();
check('速查-非法日期弹窗', alertMsgContains('超出范围') || alertMsgContains('日期格式') || alertMsgContains('1-12'));
check('速查-非法日期不计算', makeEl('quick-result').innerHTML === '');

// 用例24：继续合盘按钮带入我的生日并切换入口
setVals({ 'quick-date': '1995-07-23' });
t.continueToMatch();
check('速查-继续合盘带入年份', makeEl('match-my-year').value === '1995');
check('速查-继续合盘带入月份', makeEl('match-my-month').value === '7');
check('速查-继续合盘带入日期', makeEl('match-my-day').value === '23');

// ---------- 双人合盘：任一方缺失明确提示 ----------
// 用例25：我的出生信息缺失（恢复方式A）
sandbox.document.querySelector = function (sel) {
  if (sel === '.seg-btn.active') return { dataset: { mode: 'a' } };
  return null;
};
alerts.length = 0;
makeEl('match-result').innerHTML = '';
setVals({ 'match-my-year': '', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year': '1996', 'match-her-month': '2', 'match-her-day': '20' });
t.onMatch();
check('合盘-我方缺失弹窗', alertMsgContains('我的'));
check('合盘-我方缺失不计算', makeEl('match-result').innerHTML === '');

// 用例26：对方出生信息缺失
alerts.length = 0;
makeEl('match-result').innerHTML = '';
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year': '', 'match-her-month': '2', 'match-her-day': '20' });
t.onMatch();
check('合盘-对方缺失弹窗', alertMsgContains('对方'));
check('合盘-对方缺失不计算', makeEl('match-result').innerHTML === '');

// 用例27：年龄差独立展示且不进入评分
alerts.length = 0;
setVals({ 'match-my-year': '1995', 'match-my-month': '7', 'match-my-day': '23', 'match-her-year': '1996', 'match-her-month': '2', 'match-her-day': '20' });
t.onMatch();
const q27 = makeEl('match-result').innerHTML;
check('合盘-年龄差独立卡片', q27.indexOf('年龄差') !== -1 && q27.indexOf('不参与契合度评分') !== -1);
check('合盘-民俗趣味参考值命名', q27.indexOf('民俗趣味参考值') !== -1);
check('合盘-无随机扰动声明', q27.indexOf('不含随机扰动') !== -1);
check('合盘-五行仅作次要参考', q27.indexOf('仅作次要参考') !== -1);

console.log('\n========== 自测结果 ==========');
console.log('通过: ' + pass + ' / 失败: ' + fail);
process.exit(fail === 0 ? 0 : 1);
