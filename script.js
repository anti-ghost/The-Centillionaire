"use strict";

const game = Vue.reactive({});

const newGame = {
  lastTick: Date.now(),
  cpf: 10,
  money: 0,
  bestMoney: 0,
  totalMoney: 0,
  moneyLoop: []
};

function loop(time) {
  for (let i = 0; i < moneyLoop.length; i++) game.moneyLoop[i] += getMoneyFrequency(i, time);
}
  
function simulateTime(ms) {
  game.lastTick = Date.now();
  if (DEBUG) ms *= dev.speed;
  for (let i = 0; i < game.cpf; i++) {
    loop(ms / (1000 * game.cpf));
  }
}
