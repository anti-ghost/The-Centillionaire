"use strict";

const game = Vue.reactive({});

const newGame = {
  lastTick: Date.now(),
  cpf: 10,
  money: 0,
  bestMoney: 0,
  totalMoney: 0,
  investments: [1],
  moneyLoop: [0],
  managers: 0
};

function getMoneyRate() {
  let rate = 0;
  for (let i = 0; i < game.moneyLoop.length; i++) rate += getProfit(i) * getFrequency(i);
  return rate;
}

function getProfit(i) {
  return 10 ** i * game.investments[i];
}

function getFrequency(i) {
  return 2 ** (Math.floor(game.investments[i] / 10) - i);
}

function getUpgradeCost(i) {
  return 100 ** i * game.investments[i] * 5 ** (Math.floor(game.investments[i] / 10) + 1);
}

function format(number, f = 0) {
  if (number.sign < 0) return "-" + format(-number);
  if (number === Infinity) return "Infinity";
  if (number === 0) return "0";
  if (number < 1000) return number.toFixed(f);
  let exponent = Math.floor(Math.log10(number));
  let mantissa = number / 10 ** exponent;
  if (format(mantissa) === "10.00") {
    mantissa = 1;
    exponent++;
  }
  return format(mantissa) + "e" + format(exponent);
}

function formatTime(time, f = 0) {
  if (time == Infinity) return "forever";
  if (time < 60) return format(time, p) + "s";
  if (time < 3600) return Math.floor(time / 60) + "m " +
    (time % 60).toFixed(f) + "s";
  if (time < 86400) return Math.floor(time / 3600) + "h " +
    Math.floor((time % 3600) / 60) + "m " +
    (time % 60).toFixed(f) + "s";
  return Math.floor(time / 86400) + "d " +
    Math.floor((time % 86400) / 3600) + "h " +
    Math.floor((time % 3600) / 60) + "m" +
    (time % 60).toFixed(f) + "s";
}

function formatMoney(money) {
  return "$" + format(money, 2);
}

function collect(i, bulk = 1) {
  if (game.moneyLoop[i] >= bulk) {
    game.moneyLoop[i] -= bulk;
    game.money += getProfit(i) * bulk;
    game.totalMoney += getProfit(i) * bulk;
  }
}

function upgrade(i) {
  if (game.money >= getUpgradeCost(i)) {
    game.money -= getUpgradeCost(i);
    game.investments[i]++;
  }
}

function unlockInvestment() {
  if (game.investments.length < 6 && game.money.gte(100 ** game.investments.length)) {
    game.money -= 100 ** game.investments.length;
    game.investments.push(1);
    game.moneyLoop.push(0);
  }
}

function buyManager() {
  if (game.money >= 10 ** (2 * game.managers + 1)) {
    game.money -= 10 ** (2 * game.managers + 1);
    game.managers++;
  }
}

function loop(time) {
  if (game.money > game.bestMoney) game.bestMoney = game.money;
  for (let i = 0; i < game.moneyLoop.length; i++) {
    game.moneyLoop[i] += getFrequency(i) * time;
    if (i < game.managers) collect(i, Math.floor(game.moneyLoop[i]));
    else game.moneyLoop[i] = Math.min(game.moneyLoop[i], 1);
  }
}
  
function simulateTime(ms) {
  game.lastTick = Date.now();
  if (DEBUG) ms *= dev.speed;
  for (let i = 0; i < game.cpf; i++) loop(ms / (1000 * game.cpf));
}
