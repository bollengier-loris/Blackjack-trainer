/* =====================================================================
   MOTEUR DE STRATÉGIE — Blackjack European No Hole Card (ENHC)
   Source : chart "ENHC Basic Strategy" (Blackjack Apprenticeship 2021).
   La stratégie (quelle action jouer) est un fait mathématique ; ce
   fichier ne fait qu'encoder les bonnes décisions du tableau fourni.
   Conventions de carte : rang = 2..10, 'J','Q','K','A'.
   ===================================================================== */

(function (root) {
  'use strict';

  // ---- Actions ----
  var ACTIONS = {
    HIT: 'HIT',
    STAND: 'STAND',
    DOUBLE: 'DOUBLE',
    SPLIT: 'SPLIT',
    SURRENDER: 'SURRENDER'
  };

  var LABELS_FR = {
    HIT: 'Hit',
    STAND: 'Stand',
    DOUBLE: 'Double',
    SPLIT: 'Split',
    SURRENDER: 'Surrender'
  };

  // ---- Valeurs des cartes ----
  function rankValue(rank) {
    if (rank === 'A') return 11;
    if (rank === 'J' || rank === 'Q' || rank === 'K' || rank === 10 || rank === '10') return 10;
    return Number(rank);
  }

  // Clé "carte visible du croupier" pour la lecture du tableau.
  // 2..9 -> nombre ; 10/J/Q/K -> 10 ; A -> 'A'
  function dealerKey(rank) {
    if (rank === 'A') return 'A';
    var v = rankValue(rank);
    return v === 10 ? 10 : v;
  }

  // Rang "équivalent" pour détecter une paire (toutes les bûches = 'T').
  function rankEquiv(rank) {
    if (rank === 'A') return 'A';
    if (rankValue(rank) === 10) return 'T';
    return String(rankValue(rank));
  }

  // Total d'une main + indicateur "soft" (un As compté comme 11).
  function handValue(cards) {
    var total = 0, aces = 0;
    for (var i = 0; i < cards.length; i++) {
      var v = rankValue(cards[i]);
      total += v;
      if (cards[i] === 'A') aces++;
    }
    var soft = false;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    if (aces > 0 && total <= 21) soft = true; // il reste un As compté 11
    return { total: total, soft: soft };
  }

  function isPair(cards) {
    return cards.length === 2 && rankEquiv(cards[0]) === rankEquiv(cards[1]);
  }

  // ---- Valeur Hi-Lo ----
  function hiLo(rank) {
    var v = rankValue(rank);
    if (rank === 'A' || v === 10) return -1;
    if (v >= 2 && v <= 6) return 1;
    return 0; // 7,8,9
  }

  /* -------------------------------------------------------------------
     TABLEAUX (colonnes croupier : 2 3 4 5 6 7 8 9 10 A)
     ------------------------------------------------------------------- */
  var COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'A'];
  function col(dk) { return COLS.indexOf(dk); }

  // DURS — par total
  var HARD = {
    8:  ['H','H','H','H','H','H','H','H','H','H'],
    9:  ['H','D','D','D','D','H','H','H','H','H'],
    10: ['D','D','D','D','D','D','D','D','H','H'],
    11: ['D','D','D','D','D','D','D','D','H','H'],
    12: ['H','H','S','S','S','H','H','H','H','H'],
    13: ['S','S','S','S','S','H','H','H','H','H'],
    14: ['S','S','S','S','S','H','H','H','H','H'],
    15: ['S','S','S','S','S','H','H','H','H','H'],
    16: ['S','S','S','S','S','H','H','H','H','H']
    // 17+ : toujours Rester ; <=8 : toujours Tirer (gérés en code)
  };

  // MOUS — par total (A,2=13 ... A,9=20). D = double sinon tire, Ds = double sinon reste
  var SOFT = {
    13: ['H','H','H','D','D','H','H','H','H','H'],   // A,2
    14: ['H','H','H','D','D','H','H','H','H','H'],   // A,3
    15: ['H','H','D','D','D','H','H','H','H','H'],   // A,4
    16: ['H','H','D','D','D','H','H','H','H','H'],   // A,5
    17: ['H','D','D','D','D','H','H','H','H','H'],   // A,6
    18: ['S','Ds','Ds','Ds','Ds','S','S','H','H','H'], // A,7
    19: ['S','S','S','S','S','S','S','S','S','S'],   // A,8
    20: ['S','S','S','S','S','S','S','S','S','S']    // A,9
  };

  // PAIRES — 'Y' split, 'N' non, 'D' = split si DAS sinon non
  var PAIRS = {
    'A': ['Y','Y','Y','Y','Y','Y','Y','Y','Y','N'],
    'T': ['N','N','N','N','N','N','N','N','N','N'],
    '9': ['Y','Y','Y','Y','Y','N','Y','Y','N','N'],
    '8': ['Y','Y','Y','Y','Y','Y','Y','Y','N','N'],
    '7': ['Y','Y','Y','Y','Y','Y','N','N','N','N'],
    '6': ['D','Y','Y','Y','Y','N','N','N','N','N'],
    '5': ['N','N','N','N','N','N','N','N','N','N'],
    '4': ['N','N','N','D','D','N','N','N','N','N'],
    '3': ['D','D','Y','Y','Y','Y','N','N','N','N'],
    '2': ['D','D','Y','Y','Y','Y','N','N','N','N']
  };

  // EARLY SURRENDER — par total dur ; 8,8 est un cas particulier
  var SURR_TOTALS = {
    17: ['A'],
    16: [9, 10, 'A'],
    15: [10, 'A'],
    14: [10, 'A'],
    13: ['A'],
    12: ['A'],
    7:  ['A'],
    6:  ['A'],
    5:  ['A']
  };

  function surrenderApplies(cards, dk) {
    // Paire de 8 : abandon uniquement contre 10 ou A
    if (cards.length === 2 && rankEquiv(cards[0]) === '8' && rankEquiv(cards[1]) === '8') {
      return dk === 10 || dk === 'A';
    }
    var hv = handValue(cards);
    if (hv.soft) return false;            // pas d'abandon sur main molle
    var set = SURR_TOTALS[hv.total];
    return !!set && set.indexOf(dk) !== -1;
  }

  /* -------------------------------------------------------------------
     DÉCISION
     opts = { das:true, surrenderAllowed:true, canDouble:true, canSurrender:true }
     ------------------------------------------------------------------- */
  function getCorrectAction(cards, dealerUp, opts) {
    opts = opts || {};
    var das = opts.das !== false;                       // défaut : DAS activé
    var surrenderAllowed = opts.surrenderAllowed !== false; // ENHC : early surrender dispo
    var initial = cards.length === 2 && opts.isInitial !== false;
    var canDouble = initial && opts.canDouble !== false;
    var canSurrender = initial && surrenderAllowed && opts.canSurrender !== false;
    var dk = dealerKey(dealerUp);

    // 1) Abandon (prioritaire, seulement sur les 2 cartes de départ)
    if (canSurrender && surrenderApplies(cards, dk)) return ACTIONS.SURRENDER;

    // 2) Split
    if (initial && isPair(cards)) {
      var pk = rankEquiv(cards[0]);
      var cell = PAIRS[pk][col(dk)];
      if (cell === 'Y' || (cell === 'D' && das)) return ACTIONS.SPLIT;
      // sinon : on retombe sur le total (dur ou mou) de la main
    }

    // 3) Total mou / dur
    var hv = handValue(cards);
    var raw;
    if (hv.soft) {
      if (hv.total >= 13 && hv.total <= 20) raw = SOFT[hv.total][col(dk)];
      else if (hv.total >= 21) raw = 'S';
      else raw = 'H'; // soft 12 (A,A non splitté) -> tirer
    } else {
      if (hv.total >= 17) raw = 'S';
      else if (hv.total <= 8) raw = 'H';
      else raw = HARD[hv.total][col(dk)];
    }
    return resolve(raw, canDouble);
  }

  function resolve(raw, canDouble) {
    switch (raw) {
      case 'S':  return ACTIONS.STAND;
      case 'H':  return ACTIONS.HIT;
      case 'D':  return canDouble ? ACTIONS.DOUBLE : ACTIONS.HIT;
      case 'Ds': return canDouble ? ACTIONS.DOUBLE : ACTIONS.STAND;
      default:   return ACTIONS.HIT;
    }
  }

  // Courte explication FR pour le feedback pédagogique (reçoit un tableau de rangs)
  function explain(cards, dealerUp, opts) {
    var h = handValue(cards);
    var totalTxt = h.total + ' ' + (h.soft ? 'soft' : 'hard');
    if (isPair(cards)) {
      var rk = rankEquiv(cards[0]); if (rk === 'T') rk = '10';
      totalTxt = 'paire de ' + rk;
    }
    var dk = dealerKey(dealerUp);
    return totalTxt + ' contre ' + (dk === 'A' ? 'As' : dk);
  }

  // Note de conditionnalité pour le feedback : '(si DAS)', '(sinon Hit)', etc.
  function noteFor(cards, dealerUp, opts) {
    opts = opts || {};
    var das = opts.das !== false;
    var initial = cards.length === 2 && opts.isInitial !== false;
    var surrAllowed = opts.surrenderAllowed !== false;
    var dk = dealerKey(dealerUp);
    if (initial && surrAllowed && surrenderApplies(cards, dk)) return '(early surrender)';
    if (initial && isPair(cards)) {
      var pk = rankEquiv(cards[0]), cell = PAIRS[pk][col(dk)];
      if (cell === 'D') return das ? '(si DAS)' : '(Split si DAS)';
      if (cell === 'Y') return '';
    }
    var h = handValue(cards), raw;
    if (h.soft) { if (h.total >= 13 && h.total <= 20) raw = SOFT[h.total][col(dk)]; }
    else { if (h.total >= 9 && h.total <= 16) raw = HARD[h.total][col(dk)]; }
    if (raw === 'D') return '(sinon ' + LABELS_FR.HIT + ')';
    if (raw === 'Ds') return '(sinon ' + LABELS_FR.STAND + ')';
    return '';
  }

  var API = {
    ACTIONS: ACTIONS,
    LABELS_FR: LABELS_FR,
    rankValue: rankValue,
    dealerKey: dealerKey,
    rankEquiv: rankEquiv,
    handValue: handValue,
    isPair: isPair,
    hiLo: hiLo,
    getCorrectAction: getCorrectAction,
    explain: explain,
    note: noteFor,
    COLS: COLS,
    _tables: { HARD: HARD, SOFT: SOFT, PAIRS: PAIRS, SURR_TOTALS: SURR_TOTALS }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Strategy = API;
})(typeof self !== 'undefined' ? self : this);
