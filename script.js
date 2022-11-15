"use strict";

const VERSION = "2.0";

const app = Vue.createApp(
  {
    data() {
      return {
        tab,
        game,
        newGame,
        getMoneyRate,
        getProfit,
        getFrequency,
        getUpgradeCost,
        getUpgrade10Cost,
        getPrestigeGain,
        getPrestigePointEffect,
        getPrestigeBoost,
        format,
        formatTime,
        formatMoney,
        invest,
        collect,
        upgrade,
        upgrade10,
        unlockInvestment,
        buyManager,
        prestige,
        importSave,
        exportSave,
        hardReset
      };
    }
  }
);

const game = Vue.reactive({});

const newGame = {
  version: VERSION,
  lastTick: Date.now(),
  cpf: 100,
  timePlayed: 0,
  money: 0,
  bestMoney: 0,
  totalMoney: 0,
  prestigeMoney: 0,
  investments: [1],
  investing: [false],
  moneyLoop: [0],
  managers: 0,
  prestiged: false,
  prestigePoints: 0
};

const WORDS = [
  " thousand",
  " million",
  " billion",
  " trillion",
  " quadrillion",
  " quintillion",
  " sextillion",
  " septillion",
  " octillion",
  " nonillion",
  " decillion",
  " undecillion",
  " duodecillion",
  " tredecillion",
  " quattuordecillion",
  " quindecillion",
  " sexdecillion",
  " septendecillion",
  " octodecillion",
  " novemdecillion",
  " vigintillion"
];

const LETTERS = [
  "K",
  "M",
  "B",
  "T",
  "q",
  "Q",
  "s",
  "S",
  "o",
  "N",
  "d",
  "U",
  "D",
  "tD",
  "qD",
  "QD",
  "sD",
  "SD",
  "oD",
  "nD",
  "Vg"
];

let interval, saveInterval;

let devSpeed = 1;

let tab = 0;

function getMoneyRate() {
  let rate = 0;
  for (let i = 0; i < game.managers; i++) rate += getProfit(i) * getFrequency(i);
  return rate;
}

function getProfit(i) {
  return 100 ** i * game.investments[i] * getPrestigeBoost();
}

function getFrequency(i) {
  return 2 ** (Math.floor(game.investments[i] / 10) + i) / 5 ** i;
}

function getUpgradeCost(i) {
  return 100 ** i * game.investments[i] * 5 ** (Math.floor(game.investments[i] / 10) + 1);
}

function getUpgrade10Cost(i) {
  return (
    100 ** i *
    5 ** (Math.floor(game.investments[i] / 10) + 1) * (
      10 * (Math.floor(game.investments[i] / 10) + 1) * (10 * (Math.floor(game.investments[i] / 10) + 1) - 1) - game.investments[i] * (game.investments[i] - 1)
    ) / 2
  );
}

function getPrestigeGain() {
  return Math.max(Math.floor(Math.sqrt(game.totalMoney / 1e12)) - game.prestigePoints, 0);
}

function getPrestigePointEffect() {
  return 0.1;
}

function getPrestigeBoost() {
  return 1 + getPrestigePointEffect() * game.prestigePoints;
}

function format(number, f = 0, words = false) {
  if (number.sign < 0) return "-" + format(-number);
  if (number === Infinity) return "Infinity";
  if (number === 0) return "0";
  if (number < 1000) return number.toFixed(f);
  /* let exponent = Math.floor(Math.log10(number));
  let mantissa = number / 10 ** exponent;
  if (format(mantissa, 2) === "10.00") {
    mantissa = 1;
    exponent++;
  }
  return format(mantissa, 2) + "e" + format(exponent); */
  let exponent = Math.floor(Math.log10(number) / 3);
  let mantissa = number / 1000 ** exponent;
  if (mantissa.toPrecision(3) === "1.00e+3") {
    mantissa = 1;
    exponent++;
  }
  return mantissa.toPrecision(3) + (words ? WORDS : LETTERS)[exponent - 1];
}

function formatTime(time, f = 0) {
  if (time == Infinity) return "forever";
  if (time < 60) return format(time, f) + "s";
  if (time < 3600) return Math.floor(time / 60) + "m " +
    format(time % 60, f) + "s";
  if (time < 86400) return Math.floor(time / 3600) + "h " +
    Math.floor((time % 3600) / 60) + "m " +
    format(time % 60, f) + "s";
  return format(Math.floor(time / 86400)) + "d " +
    Math.floor((time % 86400) / 3600) + "h " +
    Math.floor((time % 3600) / 60) + "m " +
    format(time % 60) + "s";
}

function formatMoney(money, words = false) {
  return "$" + format(money, 2, words);
}

function increaseMoney(x) {
  game.money += x;
  game.totalMoney += x;
  game.prestigeMoney += x;
}

function invest(i) {
  if (i >= game.managers) game.investing[i] = true;
}

function collect(i) {
  if (i < game.managers) return;
  if (game.moneyLoop[i] >= 1) {
    game.moneyLoop[i] = 0;
    increaseMoney(getProfit(i));
    game.investing[i] = false;
  }
}

function upgrade(i) {
  if (game.money >= getUpgradeCost(i)) {
    game.money -= getUpgradeCost(i);
    game.investments[i]++;
  }
}

function upgrade10(i) {
  if (game.money >= getUpgrade10Cost(i)) {
    game.money -= getUpgrade10Cost(i);
    game.investments[i] = 10 * (Math.floor(game.investments[i] / 10) + 1);
  }
}

function unlockInvestment() {
  if (game.investments.length < 6 && game.money >= 100 ** game.investments.length) {
    game.money -= 100 ** game.investments.length;
    game.investments.push(1);
    game.investing.push(false);
    game.moneyLoop.push(0);
  }
}

function buyManager() {
  if (game.managers < 6 && game.money >= 10 ** (2 * game.managers + 2)) {
    game.money -= 10 ** (2 * game.managers + 2);
    game.managers++;
  }
}

function prestige() {
  if (getPrestigeGain() > 0) {
    game.prestigePoints += getPrestigeGain();
    game.money = 0;
    game.prestigeMoney = 0;
    game.investments = [1];
    game.investing = [false];
    game.moneyLoop = [0];
    game.managers = 0;
    game.prestiged = true;
  }
}

function loop(time) {
  game.timePlayed += time;
  if (game.money > game.bestMoney) game.bestMoney = game.money;
  for (let i = 0; i < game.moneyLoop.length; i++) {
    if (i < game.managers || game.investing[i]) game.moneyLoop[i] += getFrequency(i) * time;
    if (i < game.managers) {
      increaseMoney(getProfit(i) * Math.floor(game.moneyLoop[i]));
      game.moneyLoop[i] %= 1;
    } else game.moneyLoop[i] = Math.min(game.moneyLoop[i], 1);
  }
}

function simulateTime(ms, off = false) {
  game.lastTick = Date.now();
  ms *= devSpeed;
  for (let i = 0; i < game.cpf; i++) loop(ms / (1000 * game.cpf));
}

function reset() {
  for (const i in newGame) game[i] = newGame[i];
}

function loadGame(loadgame) {
  reset();
  for (const i in loadgame) game[i] = loadgame[i];
  game.version = VERSION;
  if (loadgame.version == "1.0") game.prestigeMoney = game.totalMoney;
  const diff = Date.now() - game.lastTick;
  console.log(diff);
  simulateTime(diff, true);
}

function save() {
  localStorage.setItem(
    "TheCentillionaireSave",
    btoa(JSON.stringify(game))
  );
}
  
function load() {
  reset();
  if (localStorage.getItem("TheCentillionaireSave") !== null) loadGame(JSON.parse(atob(localStorage.getItem("TheCentillionaireSave"))));
  interval = setInterval(() => simulateTime(Date.now() - game.lastTick));
  saveInterval = setInterval(() => save(), 1000);
}

function copyStringToClipboard(str) {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function importSave() {
  try {
    const txt = prompt("Copy-paste your save. WARNING: WILL OVERWRITE YOUR SAVE");
    const loadgame = JSON.parse(atob(txt));
    loadGame(loadgame);
  } catch (e) {}
}

function exportSave() {
  copyStringToClipboard(btoa(JSON.stringify(game)));
  $.notify("Copied to clipboard!", "success");
}

function hardReset() {
  if (confirm("This will delete all game data along with the ability for us to restore it. Are you sure?")) {
    clearInterval(interval);
    clearInterval(saveInterval);
    localStorage.removeItem("TheCentillionaireSave");
    location.reload();
  }
}

load();
app.mount("#app");
