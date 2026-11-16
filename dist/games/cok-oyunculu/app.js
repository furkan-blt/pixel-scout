import { PLAYERS, BONUS_PLAYER, getPlayerById } from './players.js';
import {
  calculateRoundScores,
  selectUniqueGamePlayers,
  formatMarketValue
} from './scoring.js';
import {
  MultiplayerRoomClient,
  isValidRoomCode,
  getSavedPlayerName,
  getInitials
} from './room.js';

// ==================== DURUM DEĞİŞKENLERİ ====================
const roomClient = new MultiplayerRoomClient();
let selectedQuestionCount = 10;
let selectedTimerSec = 15;
let selectedBonusEnabled = true;
let currentGuessValue = 50_000_000;
let currentRoundIsBonus = false;
let isMyGuessLocked = false;
let lastRenderedRound = -1;
let lastRenderedStatus = '';
let countdownInterval = null;
let liveSyncTimer = null;
const usedPlayerIdsInSession = new Set();

// ==================== DOM REFERANSLARI ====================
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const podiumScreen = document.getElementById('podiumScreen');

const playerNameInput = document.getElementById('playerNameInput');
const lobbyErrorMsg = document.getElementById('lobbyErrorMsg');
const lobbyActionsGrid = document.getElementById('lobbyActionsGrid');
const waitingRoomPanel = document.getElementById('waitingRoomPanel');

const createRoomBtn = document.getElementById('createRoomBtn');
const quickBotMatchBtn = document.getElementById('quickBotMatchBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');

const waitingRoomCodeDisplay = document.getElementById('waitingRoomCodeDisplay');
const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
const waitingSettingsBadge = document.getElementById('waitingSettingsBadge');
const waitingPlayerCount = document.getElementById('waitingPlayerCount');
const waitingPlayersList = document.getElementById('waitingPlayersList');
const addBotBtn = document.getElementById('addBotBtn');
const leaveLobbyRoomBtn = document.getElementById('leaveLobbyRoomBtn');
const startMatchBtn = document.getElementById('startMatchBtn');

// Oyun Ekranı DOM
const exitGameBtn = document.getElementById('exitGameBtn');
const headerRoomCode = document.getElementById('headerRoomCode');
const roundCounterPill = document.getElementById('roundCounterPill');
const roundStepDots = document.getElementById('roundStepDots');
const timerBox = document.getElementById('timerBox');
const timerText = document.getElementById('timerText');
const timerProgressBar = document.getElementById('timerProgressBar');

const playerPortraitImg = document.getElementById('playerPortraitImg');
const playerPortraitFallback = document.getElementById('playerPortraitFallback');
const playerFallbackInitials = document.getElementById('playerFallbackInitials');
const playerAgeBadge = document.getElementById('playerAgeBadge');
const playerPositionText = document.getElementById('playerPositionText');
const playerSeasonTag = document.getElementById('playerSeasonTag');
const playerNameHeading = document.getElementById('playerNameHeading');
const playerClubLogo = document.getElementById('playerClubLogo');
const playerClubName = document.getElementById('playerClubName');
const playerCountryFlag = document.getElementById('playerCountryFlag');
const playerCountryEmoji = document.getElementById('playerCountryEmoji');
const playerCountryName = document.getElementById('playerCountryName');

const guessConsoleCard = document.getElementById('guessConsoleCard');
const consoleKickerText = document.getElementById('consoleKickerText');
const consoleSubText = document.getElementById('consoleSubText');
const guessValueDisplay = document.getElementById('guessValueDisplay');
const bonusExactInputRow = document.getElementById('bonusExactInputRow');
const bonusExactInput = document.getElementById('bonusExactInput');
const marketValueSlider = document.getElementById('marketValueSlider');
const sliderScaleLabels = document.getElementById('sliderScaleLabels');
const quickAdjustGrid = document.getElementById('quickAdjustGrid');
const lockGuessBtn = document.getElementById('lockGuessBtn');
const lockedStatusNote = document.getElementById('lockedStatusNote');

const roundRevealCard = document.getElementById('roundRevealCard');
const revealActualValue = document.getElementById('revealActualValue');
const revealMyPoints = document.getElementById('revealMyPoints');
const revealBreakdownRow = document.getElementById('revealBreakdownRow');
const revealPlayersList = document.getElementById('revealPlayersList');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const nextRoundBtnLabel = document.getElementById('nextRoundBtnLabel');

const sidebarPlayerCountBadge = document.getElementById('sidebarPlayerCountBadge');
const liveScoreboardList = document.getElementById('liveScoreboardList');

// Podyum DOM
const podiumWinnerSubtitle = document.getElementById('podiumWinnerSubtitle');
const podiumTopThree = document.getElementById('podiumTopThree');
const podiumFullList = document.getElementById('podiumFullList');
const playAgainBtn = document.getElementById('playAgainBtn');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');

// ==================== YARDIMCI FONKSİYONLAR ====================
function showLobbyError(msg) {
  if (!lobbyErrorMsg) return;
  if (!msg) {
    lobbyErrorMsg.hidden = true;
    lobbyErrorMsg.textContent = '';
    return;
  }
  lobbyErrorMsg.textContent = msg;
  lobbyErrorMsg.hidden = false;
}

function buildNewDeck(questionCount, bonusEnabled = selectedBonusEnabled) {
  const selected = selectUniqueGamePlayers(PLAYERS, questionCount, [...usedPlayerIdsInSession]);
  for (const p of selected) {
    usedPlayerIdsInSession.add(p.id);
  }
  const normalIds = selected.map((p) => p.id);
  return bonusEnabled ? [BONUS_PLAYER.id, ...normalIds] : normalIds;
}

function configureConsoleForPlayer(player) {
  const isBonus = Boolean(player?.isBonus);
  currentRoundIsBonus = isBonus;

  if (isBonus) {
    if (consoleKickerText) consoleKickerText.textContent = '🎁 BONUS SORU TAHMİNİN (TÜRK LİRASI ₺)';
    if (consoleSubText) consoleSubText.textContent = 'Bonus soruya özel TL (₺) cinsinden piyasa değerini belirle (Puanlamaya dahil edilmez)';
    if (bonusExactInputRow) bonusExactInputRow.hidden = false;
    if (bonusExactInput) {
      bonusExactInput.disabled = false;
      bonusExactInput.value = '25000,00';
    }
    if (marketValueSlider) {
      marketValueSlider.min = '0';
      marketValueSlider.max = '100000';
      marketValueSlider.step = '50';
    }
    if (sliderScaleLabels) {
      sliderScaleLabels.innerHTML = `
        <span>0 ₺</span>
        <span>20.000 ₺</span>
        <span>40.000 ₺</span>
        <span>60.000 ₺</span>
        <span>80.000 ₺</span>
        <span>100.000 ₺</span>
      `;
    }
    if (quickAdjustGrid) {
      quickAdjustGrid.innerHTML = `
        <button type="button" class="quick-step-btn minus" data-step="-10000">-10.000₺</button>
        <button type="button" class="quick-step-btn minus" data-step="-2500">-2.500₺</button>
        <button type="button" class="quick-step-btn minus" data-step="-250">-250₺</button>
        <button type="button" class="quick-step-btn plus" data-step="250">+250₺</button>
        <button type="button" class="quick-step-btn plus" data-step="2500">+2.500₺</button>
        <button type="button" class="quick-step-btn plus" data-step="10000">+10.000₺</button>
      `;
    }
    setGuessValue(25000, true);
  } else {
    if (consoleKickerText) consoleKickerText.textContent = 'SENİN TAHMİNİN';
    if (consoleSubText) consoleSubText.textContent = '2026/27 Transfermarkt güncel piyasa değerini belirle';
    if (bonusExactInputRow) bonusExactInputRow.hidden = true;
    if (marketValueSlider) {
      marketValueSlider.min = '500000';
      marketValueSlider.max = '250000000';
      marketValueSlider.step = '500000';
    }
    if (sliderScaleLabels) {
      sliderScaleLabels.innerHTML = `
        <span>€0.5M</span>
        <span>€50M</span>
        <span>€100M</span>
        <span>€150M</span>
        <span>€200M</span>
        <span>€250M</span>
      `;
    }
    if (quickAdjustGrid) {
      quickAdjustGrid.innerHTML = `
        <button type="button" class="quick-step-btn minus" data-step="-10000000">-10M</button>
        <button type="button" class="quick-step-btn minus" data-step="-5000000">-5M</button>
        <button type="button" class="quick-step-btn minus" data-step="-1000000">-1M</button>
        <button type="button" class="quick-step-btn plus" data-step="1000000">+1M</button>
        <button type="button" class="quick-step-btn plus" data-step="5000000">+5M</button>
        <button type="button" class="quick-step-btn plus" data-step="10000000">+10M</button>
      `;
    }
    setGuessValue(45_000_000, false);
  }
}

function setGuessValue(val, syncInput = true) {
  if (currentRoundIsBonus) {
    const clamped = Math.max(0, Math.min(100_000, Math.round(val * 100) / 100));
    currentGuessValue = clamped;
    if (marketValueSlider) marketValueSlider.value = String(Math.round(clamped));
    if (guessValueDisplay) guessValueDisplay.textContent = formatMarketValue(clamped, true, 'TRY');
    if (syncInput && bonusExactInput) {
      bonusExactInput.value = clamped.toFixed(2).replace('.', ',');
    }
  } else {
    const clamped = Math.max(500_000, Math.min(250_000_000, Math.round(val / 500_000) * 500_000));
    currentGuessValue = clamped;
    if (marketValueSlider) marketValueSlider.value = String(clamped);
    if (guessValueDisplay) guessValueDisplay.textContent = formatMarketValue(clamped, true, 'EUR');
  }

  if (!isMyGuessLocked && roomClient.localRoomState?.status === 'playing') {
    if (liveSyncTimer) clearTimeout(liveSyncTimer);
    liveSyncTimer = setTimeout(() => {
      if (!isMyGuessLocked) {
        roomClient.submitGuess(currentGuessValue, false);
      }
    }, 180);
  }
}

// ==================== EKRAN GEÇİŞLERİ VE RENDER ====================
function handleRoomStateUpdate(room) {
  if (!room) return;

  if (room.status === 'lobby') {
    lobbyScreen.hidden = false;
    gameScreen.hidden = true;
    podiumScreen.hidden = true;
    lobbyActionsGrid.hidden = true;
    waitingRoomPanel.hidden = false;
    renderWaitingRoom(room);
    stopRoundCountdown();
    lastRenderedRound = -1;
    lastRenderedStatus = 'lobby';
    return;
  }

  if (room.status === 'playing' || room.status === 'reveal') {
    lobbyScreen.hidden = true;
    gameScreen.hidden = false;
    podiumScreen.hidden = true;
    renderGameArena(room);
    return;
  }

  if (room.status === 'finished') {
    stopRoundCountdown();
    lobbyScreen.hidden = true;
    gameScreen.hidden = true;
    podiumScreen.hidden = false;
    renderPodium(room);
    lastRenderedStatus = 'finished';
  }
}

function renderWaitingRoom(room) {
  waitingRoomCodeDisplay.textContent = room.code;
  const qCount = room.settings?.questionCount || 10;
  const tSec = room.settings?.roundDurationSec || 15;
  const hasBonus = room.settings?.bonusEnabled !== false;
  waitingSettingsBadge.textContent = `${qCount} Soru • ${tSec} Saniye • Bonus: ${hasBonus ? 'Aktif' : 'Kapalı'}`;

  const playersArr = Object.values(room.players || {}).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  waitingPlayerCount.textContent = String(playersArr.length);

  waitingPlayersList.innerHTML = playersArr
    .map((p) => {
      const isMe = p.id === roomClient.clientId;
      return `
        <div class="waiting-player-chip">
          <div class="waiting-avatar" style="background:${p.color || '#10b981'}">${p.avatar || getInitials(p.name)}</div>
          <div style="min-width:0;">
            <div style="font-weight:700;font-size:0.9rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(p.name)} ${isMe ? '<span style="color:#34d399;font-size:0.75rem;">(Sen)</span>' : ''}
            </div>
            <div style="font-size:0.72rem;color:#94a3b8;">
              ${p.isHost ? '👑 Oda Kurucusu' : p.isBot ? '🤖 Bot Rakip' : '⚡ Hazır'}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const isHost = room.hostId === roomClient.clientId;
  startMatchBtn.disabled = !isHost;
  startMatchBtn.querySelector('span').textContent = isHost ? '🚀 MAÇI BAŞLAT' : '⏳ Kurucunun Başlatması Bekleniyor...';
  addBotBtn.hidden = !isHost || playersArr.length >= 6;
}

function renderGameArena(room) {
  const roundIdx = room.currentRound || 0;
  const totalQ = room.settings?.questionCount || 10;
  const hasBonus = room.deckIds?.[0] === BONUS_PLAYER.id;
  const targetId = room.deckIds?.[roundIdx];
  const footballer = getPlayerById(targetId) || PLAYERS[roundIdx % PLAYERS.length];
  const isBonus = Boolean(footballer?.isBonus);

  headerRoomCode.textContent = room.code;

  if (roundCounterPill) {
    if (isBonus) {
      roundCounterPill.classList.add('is-bonus');
      roundCounterPill.innerHTML = '🎁 <strong>BONUS SORU</strong> (PUANSIZ)';
    } else {
      roundCounterPill.classList.remove('is-bonus');
      const scoredNum = hasBonus ? roundIdx : roundIdx + 1;
      roundCounterPill.innerHTML = `SORU <strong id="currentQuestionNum">${scoredNum}</strong> / <span id="totalQuestionNum">${totalQ}</span>`;
    }
  }

  renderRoundDots(roundIdx, room.deckIds?.length || totalQ);

  // Yeni tura geçildiyse futbolcu kartını ve tahmin konsolunu sıfırla
  if (roundIdx !== lastRenderedRound || lastRenderedStatus === 'lobby' || lastRenderedStatus === 'finished') {
    lastRenderedRound = roundIdx;
    isMyGuessLocked = false;
    marketValueSlider.disabled = false;
    lockGuessBtn.disabled = false;
    lockGuessBtn.querySelector('span').textContent = '✓ HAZIRIM (ERKEN ONAYLA)';
    lockedStatusNote.hidden = true;
    renderFootballerCard(footballer);
    configureConsoleForPlayer(footballer);
    roomClient.submitGuess(currentGuessValue, false);
  }

  // Eğer bu turda zaten tahmin kilitlediysek durumu koru
  const mySubmission = room.guesses?.[roundIdx]?.[roomClient.clientId];
  if (mySubmission && mySubmission.locked && !isMyGuessLocked) {
    isMyGuessLocked = true;
    setGuessValue(mySubmission.guess, true);
    marketValueSlider.disabled = true;
    if (bonusExactInput) bonusExactInput.disabled = true;
    lockGuessBtn.disabled = true;
    lockGuessBtn.querySelector('span').textContent = '✓ TAHMİN SABİTLENDİ';
    lockedStatusNote.hidden = false;
  }

  renderLiveScoreboard(room, roundIdx, footballer);

  if (room.status === 'playing') {
    guessConsoleCard.hidden = false;
    roundRevealCard.hidden = true;
    startOrSyncCountdown(room, footballer);
    checkIfAllPlayersLocked(room, footballer);
  } else if (room.status === 'reveal') {
    stopRoundCountdown();
    guessConsoleCard.hidden = true;
    roundRevealCard.hidden = false;
    renderRoundReveal(room, roundIdx, footballer);
  }

  lastRenderedStatus = room.status;
}

function renderRoundDots(currentIdx, totalCount) {
  const dots = [];
  for (let i = 0; i < totalCount; i++) {
    const cls = i < currentIdx ? 'round-dot done' : i === currentIdx ? 'round-dot current' : 'round-dot';
    dots.push(`<span class="${cls}"></span>`);
  }
  roundStepDots.innerHTML = dots.join('');
}

function renderFootballerCard(player) {
  if (!player) return;

  playerAgeBadge.textContent = `${player.age} YAŞ`;
  playerPositionText.textContent = (player.position || 'Futbolcu').toUpperCase();
  if (playerSeasonTag) {
    playerSeasonTag.textContent = player.isBonus ? '🎁 ÖZEL BONUS OYUNCU (PUANSIZ)' : '2026/27 SEZONU';
  }
  playerNameHeading.textContent = player.name;
  playerClubName.textContent = player.club;
  playerCountryName.textContent = player.country;

  // Fotoğraf yükleme
  playerPortraitFallback.hidden = true;
  playerPortraitImg.hidden = false;
  playerPortraitImg.style.objectPosition = player.objectPosition || '50% 8%';
  playerPortraitImg.alt = `${player.name} fotoğrafı`;
  playerPortraitImg.onerror = () => {
    playerPortraitImg.hidden = true;
    playerPortraitFallback.hidden = false;
    playerFallbackInitials.textContent = getInitials(player.name);
  };
  playerPortraitImg.src = player.photoUrl;

  if (player.clubLogo) {
    playerClubLogo.hidden = false;
    playerClubLogo.src = player.clubLogo;
    playerClubLogo.alt = `${player.club} logosu`;
  } else {
    playerClubLogo.hidden = true;
  }

  if (player.flagUrl) {
    playerCountryFlag.hidden = false;
    playerCountryEmoji.hidden = true;
    playerCountryFlag.src = player.flagUrl;
    playerCountryFlag.alt = `${player.country} bayrağı`;
  } else {
    playerCountryFlag.hidden = true;
    playerCountryEmoji.hidden = false;
  }
}

function renderLiveScoreboard(room, roundIdx, footballer) {
  const playersArr = Object.values(room.players || {});
  const roundGuesses = room.guesses?.[roundIdx] || {};
  const now = Date.now();
  const currency = footballer?.currency || 'EUR';

  sidebarPlayerCountBadge.textContent = `${playersArr.length}/6 Oyuncu`;

  const sorted = [...playersArr].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  liveScoreboardList.innerHTML = sorted
    .map((p, idx) => {
      const rank = idx + 1;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      const isMe = p.id === roomClient.clientId;
      const sub = roundGuesses[p.id];
      const hasLocked = Boolean(sub && sub.locked !== false && (!p.isBot || sub.lockedAt <= now || room.status === 'reveal'));

      const statusText = room.status === 'reveal'
        ? (sub ? `Tahmin: ${formatMarketValue(sub.guess, true, currency)}` : 'Değerlendirildi')
        : (hasLocked ? 'Hazır ✓' : 'Ayarlıyor...');

      const statusClass = hasLocked ? 'locked' : 'thinking';
      const delta = p.lastRoundDelta || 0;

      return `
        <div class="sb-player-card ${isMe ? 'is-me' : ''}">
          <div class="sb-left">
            <div class="sb-rank ${rankClass}">${rank}</div>
            <div class="sb-avatar" style="background:${p.color || '#3b82f6'}">${p.avatar || getInitials(p.name)}</div>
            <div class="sb-user-col">
              <div class="sb-name">${escapeHtml(p.name)} ${isMe ? '(Sen)' : ''}</div>
              <div class="sb-status ${statusClass}">${statusText}</div>
            </div>
          </div>
          <div class="sb-right">
            <div class="sb-total-pts">${(p.totalScore || 0).toLocaleString('tr-TR')}</div>
            ${delta > 0 ? `<div class="sb-delta">+${delta} Puan</div>` : '<div class="sb-delta" style="color:#64748b;">0 Puan</div>'}
          </div>
        </div>
      `;
    })
    .join('');
}

function checkIfAllPlayersLocked(room, footballer) {
  if (room.status !== 'playing') return;
  const roundIdx = room.currentRound || 0;
  const playersArr = Object.values(room.players || {});
  const roundGuesses = room.guesses?.[roundIdx] || {};

  const humans = playersArr.filter((p) => !p.isBot);
  const allHumansLocked = humans.length > 0 && humans.every((h) => Boolean(roundGuesses[h.id]?.locked));

  if (allHumansLocked) {
    triggerRoundEvaluation(room, footballer);
  }
}

function triggerRoundEvaluation(room, footballer) {
  if (!room || room.status !== 'playing' || !footballer) return;
  const roundIdx = room.currentRound || 0;
  const playersArr = Object.values(room.players || {});
  const roundGuesses = room.guesses?.[roundIdx] || {};
  const fallbackVal = footballer.isBonus ? 25000 : 45_000_000;

  const submissions = playersArr.map((p) => {
    const g = roundGuesses[p.id];
    const isMe = p.id === roomClient.clientId;
    const effectiveGuess = isMe
      ? (g && g.locked ? g.guess : currentGuessValue)
      : (g && Number.isFinite(g.guess) ? g.guess : fallbackVal);
    return {
      playerId: p.id,
      name: p.name,
      guess: effectiveGuess,
      lockedAt: g && Number.isFinite(g.lockedAt) ? g.lockedAt : Date.now()
    };
  });

  const roundScores = calculateRoundScores(submissions, footballer.marketValue, {
    isBonus: Boolean(footballer.isBonus)
  });
  roomClient.revealRoundResults(roundScores);
}

function renderRoundReveal(room, roundIdx, footballer) {
  if (!footballer) return;
  const isBonus = Boolean(footballer.isBonus);
  const currency = footballer.currency || 'EUR';
  const roundScores = room.roundHistory?.[roundIdx] || [];
  revealActualValue.textContent = formatMarketValue(footballer.marketValue, true, currency);

  const myResult = roundScores.find((r) => r.playerId === roomClient.clientId);
  const myPts = myResult ? myResult.totalRoundPoints : 0;
  revealMyPoints.textContent = isBonus ? '0 Puan (Bonus)' : `+${myPts} Puan`;

  const pills = [];
  if (isBonus) {
    pills.push('<span class="breakdown-pill"><strong class="amber-txt">🎁 Bonus Soru: Puanlamaya Dahil Edilmez</strong></span>');
  }
  if (myResult && myResult.guess !== null) {
    const errPct = (myResult.relativeError * 100).toFixed(1);
    pills.push(`<span class="breakdown-pill">Tahminin: <strong>${formatMarketValue(myResult.guess, true, currency)}</strong> (%${errPct} Sapma)</span>`);
    if (!isBonus) {
      pills.push(`<span class="breakdown-pill">İsabet Puanı: <strong class="emerald-txt">+${myResult.accuracyPoints}</strong></span>`);
      if (myResult.rankBonus > 0) {
        pills.push(`<span class="breakdown-pill">${myResult.rank}. Sıra Bonusu: <strong class="amber-txt">+${myResult.rankBonus}</strong></span>`);
      }
      if (myResult.bullseyeBonus > 0) {
        pills.push(`<span class="breakdown-pill">🎯 Kâhin Bonusu: <strong class="purple-txt">+${myResult.bullseyeBonus}</strong></span>`);
      }
    }
  } else {
    pills.push('<span class="breakdown-pill">Bu turda tahmin kilitlenmedi (0 Puan)</span>');
  }
  revealBreakdownRow.innerHTML = pills.join('');

  revealPlayersList.innerHTML = roundScores
    .map((item, idx) => {
      const guessTxt = item.guess !== null ? formatMarketValue(item.guess, true, currency) : 'Tahmin Yok';
      const errTxt = item.guess !== null ? `%${(item.relativeError * 100).toFixed(1)} fark` : '-';
      const ptsTxt = isBonus ? 'Bonus (0 Puan)' : `+${item.totalRoundPoints} Puan`;
      return `
        <div class="reveal-row">
          <div>
            <strong>#${idx + 1} ${escapeHtml(item.name)}</strong>
            <span style="color:#94a3b8;margin-left:8px;">${guessTxt} (${errTxt})</span>
          </div>
          <strong class="emerald-txt">${ptsTxt}</strong>
        </div>
      `;
    })
    .join('');

  const totalRounds = room.deckIds?.length || (room.settings?.questionCount || 10);
  const isLastQuestion = roundIdx + 1 >= totalRounds;
  nextRoundBtnLabel.textContent = isLastQuestion ? '🏆 FİNAL PODYUMUNU GÖR ➔' : 'SONRAKİ FUTBOLCU ➔';
}

function renderPodium(room) {
  const playersArr = Object.values(room.players || {}).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const winner = playersArr[0];
  if (winner) {
    podiumWinnerSubtitle.textContent = `🏆 ${winner.name}, toplam ${winner.totalScore.toLocaleString('tr-TR')} puanla Piyasa Değeri Arenası şampiyonu oldu!`;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const top3 = playersArr.slice(0, 3);
  podiumTopThree.innerHTML = top3
    .map((p, idx) => `
      <div class="podium-box place-${idx + 1}">
        <div class="podium-medal">${medals[idx] || '🏅'}</div>
        <div class="waiting-avatar" style="background:${p.color || '#10b981'};width:48px;height:48px;font-size:1rem;">
          ${p.avatar || getInitials(p.name)}
        </div>
        <div class="podium-name">${escapeHtml(p.name)}</div>
        <div class="podium-score">${(p.totalScore || 0).toLocaleString('tr-TR')} Puan</div>
      </div>
    `)
    .join('');

  podiumFullList.innerHTML = playersArr
    .map((p, idx) => `
      <div class="reveal-row">
        <div>
          <strong>#${idx + 1} ${escapeHtml(p.name)}</strong>
        </div>
        <strong class="emerald-txt">${(p.totalScore || 0).toLocaleString('tr-TR')} Puan</strong>
      </div>
    `)
    .join('');
}

// ==================== SÜRE SAYACI ====================
function startOrSyncCountdown(room, footballer) {
  stopRoundCountdown();
  const durationSec = room.settings?.roundDurationSec || 15;
  const startedAt = room.roundStartedAt || Date.now();

  const tick = () => {
    const elapsedSec = (Date.now() - startedAt) / 1000;
    const remaining = Math.max(0, durationSec - elapsedSec);
    const wholeSec = Math.ceil(remaining);

    timerText.textContent = `00:${String(wholeSec).padStart(2, '0')}`;
    const pct = Math.max(0, Math.min(100, (remaining / durationSec) * 100));
    timerProgressBar.style.width = `${pct}%`;

    if (wholeSec <= 5) {
      timerBox.classList.add('urgent');
    } else {
      timerBox.classList.remove('urgent');
    }

    renderLiveScoreboard(room, room.currentRound || 0, footballer);

    if (remaining <= 0) {
      stopRoundCountdown();
      triggerRoundEvaluation(room, footballer);
    }
  };

  tick();
  countdownInterval = setInterval(tick, 250);
}

function stopRoundCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==================== EVENT LISTENERS ====================
function initEvents() {
  const savedName = getSavedPlayerName();
  if (savedName && playerNameInput) {
    playerNameInput.value = savedName;
  }

  roomClient.onStateChange = handleRoomStateUpdate;

  // Soru sayısı seçimi (10 / 20)
  document.querySelectorAll('[data-qcount]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-qcount]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedQuestionCount = Number(btn.dataset.qcount) || 10;
    });
  });

  // Süre seçimi (10 / 15 / 20 / 25 sn)
  document.querySelectorAll('[data-timer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-timer]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTimerSec = Number(btn.dataset.timer) || 15;
    });
  });

  // Bonus soru seçimi (Aktif / Aktif Değil)
  document.querySelectorAll('[data-bonus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-bonus]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedBonusEnabled = btn.dataset.bonus === 'true';
    });
  });

  // Yeni 4 haneli oda oluştur
  createRoomBtn?.addEventListener('click', async () => {
    showLobbyError('');
    const hostName = playerNameInput?.value.trim() || 'Scout_10';
    const deckIds = buildNewDeck(selectedQuestionCount, selectedBonusEnabled);
    await roomClient.createRoom({
      hostName,
      questionCount: selectedQuestionCount,
      roundDurationSec: selectedTimerSec,
      bonusEnabled: selectedBonusEnabled,
      deckIds,
      withBots: 0
    });
  });

  // Hızlı Bot Maçı (3 Bot Rakiple Hemen Başla)
  quickBotMatchBtn?.addEventListener('click', async () => {
    showLobbyError('');
    const hostName = playerNameInput?.value.trim() || 'Scout_10';
    const deckIds = buildNewDeck(selectedQuestionCount, selectedBonusEnabled);
    await roomClient.createRoom({
      hostName,
      questionCount: selectedQuestionCount,
      roundDurationSec: selectedTimerSec,
      bonusEnabled: selectedBonusEnabled,
      deckIds,
      withBots: 3
    });
    await roomClient.startGame(deckIds, getPlayerById);
  });

  // 4 haneli odaya katıl
  joinRoomBtn?.addEventListener('click', async () => {
    showLobbyError('');
    const code = roomCodeInput?.value.trim() || '';
    if (!isValidRoomCode(code)) {
      showLobbyError('Lütfen 4 haneli sayısal oda kodunu girin (Örn: 4819).');
      return;
    }
    const playerName = playerNameInput?.value.trim() || 'Oyuncu';
    try {
      await roomClient.joinRoom({ roomCode: code, playerName });
    } catch (err) {
      showLobbyError(err.message || 'Odaya katılırken bir hata oluştu.');
    }
  });

  roomCodeInput?.addEventListener('input', () => {
    roomCodeInput.value = roomCodeInput.value.replace(/\D/g, '').slice(0, 4);
  });

  copyRoomCodeBtn?.addEventListener('click', async () => {
    const code = waitingRoomCodeDisplay?.textContent || '';
    try {
      await navigator.clipboard.writeText(code);
      copyRoomCodeBtn.textContent = '✓ Kopyalandı!';
      setTimeout(() => {
        copyRoomCodeBtn.textContent = '📋 Kodu Kopyala';
      }, 1800);
    } catch {
      // ignore
    }
  });

  addBotBtn?.addEventListener('click', async () => {
    await roomClient.addBotToRoom();
  });

  leaveLobbyRoomBtn?.addEventListener('click', () => {
    roomClient.leaveRoom();
    waitingRoomPanel.hidden = true;
    lobbyActionsGrid.hidden = false;
  });

  startMatchBtn?.addEventListener('click', async () => {
    const state = roomClient.localRoomState;
    if (!state) return;
    const playerCount = Object.keys(state.players || {}).length;
    if (playerCount < 2) {
      await roomClient.addBotToRoom();
      await roomClient.addBotToRoom();
    }
    const qCount = state.settings?.questionCount || 10;
    const hasBonus = state.settings?.bonusEnabled !== false;
    const expectedLen = hasBonus ? qCount + 1 : qCount;
    const deckIds = state.deckIds?.length === expectedLen ? state.deckIds : buildNewDeck(qCount, hasBonus);
    await roomClient.startGame(deckIds, getPlayerById);
  });

  exitGameBtn?.addEventListener('click', () => {
    stopRoundCountdown();
    roomClient.leaveRoom();
    gameScreen.hidden = true;
    podiumScreen.hidden = true;
    lobbyScreen.hidden = false;
    waitingRoomPanel.hidden = true;
    lobbyActionsGrid.hidden = false;
  });

  // Slider & Hızlı Butonlar (Event Delegation ile dinamik butonları destekler)
  marketValueSlider?.addEventListener('input', () => {
    if (isMyGuessLocked) return;
    setGuessValue(Number(marketValueSlider.value), true);
  });

  bonusExactInput?.addEventListener('input', () => {
    if (isMyGuessLocked || !currentRoundIsBonus) return;
    const normalized = bonusExactInput.value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      setGuessValue(parsed, false);
    }
  });

  quickAdjustGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-step-btn');
    if (!btn || isMyGuessLocked) return;
    const step = Number(btn.dataset.step) || 0;
    setGuessValue(currentGuessValue + step, true);
  });

  // Tahmini Sabitle (İsteğe Bağlı Erken Onay)
  lockGuessBtn?.addEventListener('click', async () => {
    if (isMyGuessLocked) return;
    isMyGuessLocked = true;
    marketValueSlider.disabled = true;
    if (bonusExactInput) bonusExactInput.disabled = true;
    lockGuessBtn.disabled = true;
    lockGuessBtn.querySelector('span').textContent = '✓ TAHMİN SABİTLENDİ';
    lockedStatusNote.hidden = false;
    await roomClient.submitGuess(currentGuessValue, true);
  });

  // Sonraki Futbolcu
  nextRoundBtn?.addEventListener('click', async () => {
    await roomClient.nextRound(getPlayerById);
  });

  // Tekrar Oyna
  playAgainBtn?.addEventListener('click', async () => {
    const state = roomClient.localRoomState;
    if (!state) return;
    const qCount = state.settings?.questionCount || 10;
    const hasBonus = state.settings?.bonusEnabled !== false;
    const freshDeck = buildNewDeck(qCount, hasBonus);
    await roomClient.startGame(freshDeck, getPlayerById);
  });

  backToLobbyBtn?.addEventListener('click', () => {
    stopRoundCountdown();
    roomClient.leaveRoom();
    podiumScreen.hidden = true;
    gameScreen.hidden = true;
    lobbyScreen.hidden = false;
    waitingRoomPanel.hidden = true;
    lobbyActionsGrid.hidden = false;
  });
}

initEvents();
