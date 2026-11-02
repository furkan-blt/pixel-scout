import {
  drawSecretTarget,
  createRoundAssignment
} from './pool.js';

const STORAGE_PLAYERS_KEY = 'pixel_scout_futbol_imposter_players';

// ==================== OYUN DURUMU ====================
let players = loadSavedPlayers();
let imposterCount = 1;
let hintEnabled = true;

const usedTargetIds = new Set();
let currentSecretTarget = null;
let currentImposterIndices = new Set();
let currentStarterIndex = 0;
let currentPassIndex = 0;
let hasCurrentPlayerSeenCard = false;
let isCardCurrentlyOpen = false;

// ==================== DOM REFERANSLARI ====================
const setupScreen = document.getElementById('setupScreen');
const passScreen = document.getElementById('passScreen');
const discussionScreen = document.getElementById('discussionScreen');
const resultScreen = document.getElementById('resultScreen');

const playerCountLabel = document.getElementById('playerCountLabel');
const addPlayerForm = document.getElementById('addPlayerForm');
const newPlayerInput = document.getElementById('newPlayerInput');
const playersChipsList = document.getElementById('playersChipsList');
const setupErrorMsg = document.getElementById('setupErrorMsg');
const startGameBtn = document.getElementById('startGameBtn');

// Elden Ele Ekranı
const passStepBadge = document.getElementById('passStepBadge');
const currentPassPlayerName = document.getElementById('currentPassPlayerName');
const secretCardBox = document.getElementById('secretCardBox');
const cardClosedView = document.getElementById('cardClosedView');
const cardRevealedView = document.getElementById('cardRevealedView');
const roleHeaderBadge = document.getElementById('roleHeaderBadge');
const secretWordDisplay = document.getElementById('secretWordDisplay');
const imposterHintBadge = document.getElementById('imposterHintBadge');
const roleSubInstruction = document.getElementById('roleSubInstruction');
const nextPlayerPassBtn = document.getElementById('nextPlayerPassBtn');
const nextPlayerPassBtnText = document.getElementById('nextPlayerPassBtnText');

// Tartışma & Oylama Ekranı
const starterAnnouncement = document.getElementById('starterAnnouncement');
const goToVoteActionWrap = document.getElementById('goToVoteActionWrap');
const showVoteButtonsBtn = document.getElementById('showVoteButtonsBtn');
const inlineVoteSection = document.getElementById('inlineVoteSection');
const votePlayersGrid = document.getElementById('votePlayersGrid');

// Sonuç Ekranı
const resultEmoji = document.getElementById('resultEmoji');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const revealedSecretName = document.getElementById('revealedSecretName');
const revealedImposterNames = document.getElementById('revealedImposterNames');
const nextRoundSamePlayersBtn = document.getElementById('nextRoundSamePlayersBtn');
const backToSetupBtn = document.getElementById('backToSetupBtn');

// ==================== YARDIMCI FONKSİYONLAR ====================
function loadSavedPlayers() {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.map((n) => String(n).trim()).filter(Boolean).slice(0, 12);
      }
    }
  } catch {
    // ignore
  }
  return ['Oyuncu 1', 'Oyuncu 2', 'Oyuncu 3', 'Oyuncu 4'];
}

function savePlayers() {
  try {
    localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(players));
  } catch {
    // ignore
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showSetupError(msg) {
  if (!setupErrorMsg) return;
  if (!msg) {
    setupErrorMsg.hidden = true;
    setupErrorMsg.textContent = '';
    return;
  }
  setupErrorMsg.textContent = msg;
  setupErrorMsg.hidden = false;
}

function switchScreen(activeEl) {
  for (const el of [setupScreen, passScreen, discussionScreen, resultScreen]) {
    if (el) el.hidden = el !== activeEl;
  }
}

// ==================== 1. KURULUM EKRANI ====================
function renderPlayersSetupList() {
  if (playerCountLabel) playerCountLabel.textContent = String(players.length);
  if (!playersChipsList) return;

  playersChipsList.innerHTML = players
    .map((name, idx) => `
      <div class="player-chip">
        <span>${escapeHtml(name)}</span>
        ${players.length > 3 ? `<button type="button" class="remove-player-btn" data-remove-idx="${idx}" aria-label="${escapeHtml(name)} sil">✕</button>` : ''}
      </div>
    `)
    .join('');
}

// ==================== 2. TUR BAŞLATMA & ELDEN ELE ====================
function startNewRound() {
  if (players.length < 3) {
    showSetupError('Oyuna başlamak için en az 3 oyuncu gereklidir.');
    return;
  }
  if (imposterCount >= players.length) {
    showSetupError('Imposter sayısı toplam oyuncu sayısından az olmalıdır.');
    return;
  }
  showSetupError('');

  currentSecretTarget = drawSecretTarget(usedTargetIds);
  const assignment = createRoundAssignment(players.length, imposterCount);
  currentImposterIndices = assignment.imposterIndices;
  currentStarterIndex = assignment.starterIndex;
  currentPassIndex = 0;

  renderCurrentPassStep();
  switchScreen(passScreen);
}

function renderCurrentPassStep() {
  const playerName = players[currentPassIndex];
  hasCurrentPlayerSeenCard = false;
  isCardCurrentlyOpen = false;

  passStepBadge.textContent = `OYUNCU ${currentPassIndex + 1} / ${players.length}`;
  currentPassPlayerName.textContent = playerName;

  // Kartı kapalı duruma getir
  secretCardBox.className = 'secret-card locked';
  cardClosedView.hidden = false;
  cardRevealedView.hidden = true;

  nextPlayerPassBtn.disabled = true;
  nextPlayerPassBtnText.textContent = 'ÖNCE KARTINA BAK 👁️';
}

function toggleSecretCard() {
  if (!isCardCurrentlyOpen) {
    // Kartı aç
    isCardCurrentlyOpen = true;
    hasCurrentPlayerSeenCard = true;
    const isImposter = currentImposterIndices.has(currentPassIndex);

    cardClosedView.hidden = true;
    cardRevealedView.hidden = false;

    if (isImposter) {
      secretCardBox.className = 'secret-card revealed-imposter';
      roleHeaderBadge.textContent = '🕵️ ROLÜN';
      secretWordDisplay.textContent = "SEN IMPOSTER'SIN!";
      secretWordDisplay.classList.add('is-imposter');

      if (hintEnabled && currentSecretTarget?.hint) {
        imposterHintBadge.hidden = false;
        imposterHintBadge.textContent = `💡 İpucu: ${currentSecretTarget.hint}`;
      } else {
        imposterHintBadge.hidden = true;
      }
      roleSubInstruction.textContent = 'Gizli ismi bilmiyorsun! Diğerlerini dinle ve şüphe çekmeden araya kayna.';
    } else {
      secretCardBox.className = 'secret-card revealed-crew';
      roleHeaderBadge.textContent = '⚽ GİZLİ İSİM';
      secretWordDisplay.textContent = currentSecretTarget.name;
      secretWordDisplay.classList.remove('is-imposter');
      imposterHintBadge.hidden = true;
      roleSubInstruction.textContent = 'Bu ismi Imposter\'a çaktırmadan tek kelimelik bir ipucu hazırla!';
    }

    nextPlayerPassBtn.disabled = false;
    const isLastPlayer = currentPassIndex + 1 >= players.length;
    nextPlayerPassBtnText.textContent = isLastPlayer
      ? '🔒 GİZLE VE TARTIŞMAYI BAŞLAT ➔'
      : '🔒 GİZLE VE SIRADAKİ OYUNCUYA GEÇ ➔';
  } else {
    // Kartı tekrar gizle
    isCardCurrentlyOpen = false;
    secretCardBox.className = 'secret-card locked';
    cardClosedView.hidden = false;
    cardRevealedView.hidden = true;
  }
}

// ==================== 3. TARTIŞMA & TEK ADIMDA OYLAMA ====================
function showDiscussionScreen() {
  const starterName = players[currentStarterIndex] || players[0];
  starterAnnouncement.textContent = `${starterName} turu başlatır`;

  goToVoteActionWrap.hidden = false;
  inlineVoteSection.hidden = true;

  votePlayersGrid.innerHTML = players
    .map((name, idx) => `
      <button type="button" class="vote-player-btn" data-vote-idx="${idx}">
        ${escapeHtml(name)}
      </button>
    `)
    .join('');

  switchScreen(discussionScreen);
}

// ==================== 4. SONUÇ EKRANI ====================
function resolveVoteForPlayer(votedIdx) {
  const votedName = players[votedIdx];
  const caughtImposter = currentImposterIndices.has(votedIdx);

  if (caughtImposter) {
    resultEmoji.textContent = '🎉';
    resultTitle.textContent = 'MASUMLAR KAZANDI!';
    resultTitle.style.color = '#34d399';
    resultSubtitle.textContent = `Tebrikler! Oylamada seçilen ${votedName} gerçekten Imposter'dı!`;
  } else {
    resultEmoji.textContent = '🕵️';
    resultTitle.textContent = 'IMPOSTER KAZANDI!';
    resultTitle.style.color = '#fb7185';
    resultSubtitle.textContent = `Yanlış kişiyi suçladınız! ${votedName} masumdu, Imposter aranızdan sıyrıldı.`;
  }

  revealedSecretName.textContent = currentSecretTarget?.name || '';
  const imposterNames = [...currentImposterIndices].map((i) => players[i]).join(', ');
  revealedImposterNames.textContent = imposterNames;

  switchScreen(resultScreen);
}

// ==================== EVENT LISTENERS ====================
function initEvents() {
  renderPlayersSetupList();

  addPlayerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = newPlayerInput?.value.trim() || '';
    if (!val) return;
    if (players.length >= 12) {
      showSetupError('En fazla 12 oyuncu ekleyebilirsiniz.');
      return;
    }
    players.push(val);
    newPlayerInput.value = '';
    showSetupError('');
    savePlayers();
    renderPlayersSetupList();
  });

  playersChipsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-idx]');
    if (!btn) return;
    if (players.length <= 3) return;
    const idx = Number(btn.dataset.removeIdx);
    players.splice(idx, 1);
    savePlayers();
    renderPlayersSetupList();
  });

  document.querySelectorAll('[data-imposters]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-imposters]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      imposterCount = Number(btn.dataset.imposters) || 1;
    });
  });

  document.querySelectorAll('[data-hint]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-hint]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      hintEnabled = btn.dataset.hint === 'true';
    });
  });

  startGameBtn?.addEventListener('click', () => {
    startNewRound();
  });

  secretCardBox?.addEventListener('click', () => {
    toggleSecretCard();
  });

  secretCardBox?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSecretCard();
    }
  });

  nextPlayerPassBtn?.addEventListener('click', () => {
    if (!hasCurrentPlayerSeenCard) return;
    if (currentPassIndex + 1 < players.length) {
      currentPassIndex++;
      renderCurrentPassStep();
    } else {
      showDiscussionScreen();
    }
  });

  // "🗳️ Oylamaya Geç" butonuna basınca aynı ekranda oyuncu butonlarını aç
  showVoteButtonsBtn?.addEventListener('click', () => {
    goToVoteActionWrap.hidden = true;
    inlineVoteSection.hidden = false;
  });

  // Seçilen oyuncuya tıklanınca doğrudan sonucu göster
  votePlayersGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-vote-idx]');
    if (!btn) return;
    const votedIdx = Number(btn.dataset.voteIdx);
    resolveVoteForPlayer(votedIdx);
  });

  nextRoundSamePlayersBtn?.addEventListener('click', () => {
    startNewRound();
  });

  backToSetupBtn?.addEventListener('click', () => {
    switchScreen(setupScreen);
  });
}

initEvents();
