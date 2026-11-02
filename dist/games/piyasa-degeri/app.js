import { CLUBS, formatMarketValue, formatFullCurrency } from './clubs.js';
import {
  getScoreboard,
  recordScore,
  fetchGlobalScoreboard,
  recordScoreGlobal,
  getStoredPlayerName,
  setStoredPlayerName
} from './scoreboard.js';
import { launchConfetti, stopConfetti } from './confetti.js';

// DOM Elemanları - Skor Paneli & Üst Çubuk
const elCurrentScore = document.getElementById('current-score');
const elBestScore = document.getElementById('best-score');
const elPlayerProfileBtn = document.getElementById('player-profile-btn');
const elHeaderPlayerName = document.getElementById('header-player-name');
const elScoreboardBtn = document.getElementById('scoreboard-btn');

// Konfeti Kanvası
const elConfettiCanvas = document.getElementById('confetti-canvas');

// Sol Panel Elemanları (Açık Olan Kulüp)
const elLeftSide = document.getElementById('left-side');
const elLeftWatermark = document.getElementById('left-watermark');
const elLeftBgGlow = document.getElementById('left-bg-glow');
const elLeftLogo = document.getElementById('left-logo');
const elLeftName = document.getElementById('left-name');
const elLeftLeague = document.getElementById('left-league');
const elLeftValue = document.getElementById('left-value');
const elLeftFullValue = document.getElementById('left-full-value');

// Sağ Panel Elemanları (Tahmin Edilecek Kulüp)
const elRightSide = document.getElementById('right-side');
const elRightWatermark = document.getElementById('right-watermark');
const elRightBgGlow = document.getElementById('right-bg-glow');
const elRightLogo = document.getElementById('right-logo');
const elRightName = document.getElementById('right-name');
const elRightLeague = document.getElementById('right-league');
const elRightValueBox = document.getElementById('right-value-box');
const elRightValue = document.getElementById('right-value');
const elRightFullValue = document.getElementById('right-full-value');
const elActionButtonsBox = document.getElementById('action-buttons-box');
const elHigherBtn = document.getElementById('higher-btn');
const elLowerBtn = document.getElementById('lower-btn');
const elComparisonCaption = document.getElementById('comparison-caption');

// Geri Bildirim Rozeti
const elFeedbackBadge = document.getElementById('feedback-badge');
const elFeedbackIcon = document.getElementById('feedback-icon');

// Başlama / İsim Sorma Modalı
const elStartDialog = document.getElementById('start-dialog');
const elStartForm = document.getElementById('start-form');
const elPlayerNameInput = document.getElementById('player-name-input');
const elStartScoreboardList = document.getElementById('start-scoreboard-list');

// Müstakil Skor Tablosu Modalı
const elScoreboardDialog = document.getElementById('scoreboard-dialog');
const elScoreboardListItems = document.getElementById('scoreboard-list-items');
const elCloseScoreboardBtn = document.getElementById('close-scoreboard-btn');

// Oyun Bitti (Game Over) Modalı
const elGameOverDialog = document.getElementById('game-over-dialog');
const elModalCardBox = document.getElementById('modal-card-box');
const elModalBadgeIcon = document.getElementById('modal-badge-icon');
const elModalTitle = document.getElementById('modal-title');
const elModalSubtitle = document.getElementById('modal-subtitle');
const elGameOverReason = document.getElementById('game-over-reason');
const elFinalScore = document.getElementById('final-score');
const elModalBestScore = document.getElementById('modal-best-score');
const elModalScoreboardList = document.getElementById('modal-scoreboard-list');
const elModalComparison = document.getElementById('modal-comparison');
const elRestartBtn = document.getElementById('restart-btn');
const elChangeNameBtn = document.getElementById('change-name-btn');

// Oyun Durumu
const STORAGE_KEY = 'pixel-scout:piyasa-degeri:best';
let score = 0;
let bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
if (Number.isNaN(bestScore)) bestScore = 0;

let currentPlayerName = getStoredPlayerName() || '';
let currentClubA = null;
let currentClubB = null;
let sessionBag = [];
let isTransitioning = false;

// HTML Güvenli Metin Kaçırma
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Fisher-Yates Karıştırma
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Kulüp Çantası (Tekrar etmeden seçim)
function replenishBag(excludeId = null) {
  let clubs = CLUBS.filter(c => c.id !== excludeId);
  sessionBag = shuffle(clubs);
}

function drawNextClub(excludeId = null) {
  if (sessionBag.length === 0) {
    replenishBag(excludeId);
  }
  const nextClub = sessionBag.pop();
  if (nextClub && nextClub.id === excludeId) {
    if (sessionBag.length === 0) replenishBag(excludeId);
    return sessionBag.pop() || CLUBS.find(c => c.id !== excludeId);
  }
  return nextClub;
}

// Kulüp Logosu Hazırlama (Sadece Logo)
function setupLogo(imgEl, club) {
  if (club && club.logo) {
    imgEl.src = club.logo;
    imgEl.alt = `${club.name} Logosu`;
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none';
  }
}

// Sol Paneli Güncelle (Kulüp A)
function renderClubA(club) {
  currentClubA = club;
  elLeftName.textContent = club.name;
  elLeftLeague.textContent = `${club.flag} ${club.league}`;
  elLeftValue.textContent = formatMarketValue(club.marketValue);
  elLeftFullValue.textContent = formatFullCurrency(club.marketValue);

  // Takım Renklerinde Dinamik Arka Plan ve Atmosfer Tasarımı
  if (elLeftSide) {
    elLeftSide.style.background = `radial-gradient(circle at 50% 30%, ${club.color}35 0%, ${club.color}14 50%, #070d09 85%), linear-gradient(180deg, rgba(7, 13, 9, 0.25) 0%, rgba(7, 13, 9, 0.9) 100%)`;
  }
  if (elLeftWatermark) {
    elLeftWatermark.style.backgroundImage = `url("${club.logo}")`;
  }
  if (elLeftBgGlow) {
    elLeftBgGlow.style.background = `radial-gradient(circle at center, ${club.color}45 0%, transparent 68%)`;
  }
  if (elLeftLogo) {
    elLeftLogo.style.filter = `drop-shadow(0 16px 32px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 45px ${club.color}66)`;
  }

  setupLogo(elLeftLogo, club);
}

// Sağ Paneli Güncelle (Kulüp B - Tahmin)
function renderClubB(club) {
  currentClubB = club;
  elRightName.textContent = club.name;
  elRightLeague.textContent = `${club.flag} ${club.league}`;
  
  // Takım Renklerinde Dinamik Arka Plan ve Atmosfer Tasarımı
  if (elRightSide) {
    elRightSide.style.background = `radial-gradient(circle at 50% 30%, ${club.color}35 0%, ${club.color}14 50%, #070d09 85%), linear-gradient(180deg, rgba(7, 13, 9, 0.25) 0%, rgba(7, 13, 9, 0.9) 100%)`;
  }
  if (elRightWatermark) {
    elRightWatermark.style.backgroundImage = `url("${club.logo}")`;
  }
  if (elRightBgGlow) {
    elRightBgGlow.style.background = `radial-gradient(circle at center, ${club.color}45 0%, transparent 68%)`;
  }
  if (elRightLogo) {
    elRightLogo.style.filter = `drop-shadow(0 16px 32px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 45px ${club.color}66)`;
  }

  setupLogo(elRightLogo, club);

  const compName = currentClubA.shortName || currentClubA.name;
  elComparisonCaption.textContent = `${compName}'dan daha mı değerli?`;

  // Butonları aç, sayaç kutusunu gizle
  elActionButtonsBox.hidden = false;
  elRightValueBox.hidden = true;
}

// HUD Güncelle
function updateHUD() {
  elCurrentScore.textContent = score;
  elBestScore.textContent = bestScore;
}

function updatePlayerNameDisplay() {
  if (elHeaderPlayerName) {
    elHeaderPlayerName.textContent = `👤 ${currentPlayerName || 'Oyuncu'}`;
  }
}

function populateListDOM(targetEl, list, highlightTimestamp = null) {
  if (!targetEl) return;
  targetEl.innerHTML = '';

  list.forEach((item, index) => {
    const li = document.createElement('li');
    const rank = index + 1;
    li.className = `scoreboard-item rank-${rank}`;

    if (highlightTimestamp && item.timestamp === highlightTimestamp) {
      li.classList.add('current-user-rank');
    }

    const badge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    const isCurrentUser = highlightTimestamp && item.timestamp === highlightTimestamp;

    li.innerHTML = `
      <div class="scoreboard-item-left">
        <span class="scoreboard-badge">${badge}</span>
        <span class="scoreboard-item-name">${escapeHtml(item.name)}</span>
        ${isCurrentUser ? '<span class="scoreboard-item-tag">SEN</span>' : ''}
      </div>
      <div class="scoreboard-item-right">
        <span class="scoreboard-item-score">${item.score} Skor</span>
        <span class="scoreboard-item-date">${item.date || ''}</span>
      </div>
    `;
    targetEl.appendChild(li);
  });
}

// Scoreboard Listesini DOM Elemanına Bas (Önce Lokal, ardından Canlı Global)
function renderScoreboardList(targetEl, highlightTimestamp = null) {
  if (!targetEl) return;
  const localList = getScoreboard();
  populateListDOM(targetEl, localList, highlightTimestamp);

  // Canlı global listeyi çekip arkaplanda güncelle
  fetchGlobalScoreboard().then(globalList => {
    if (globalList && globalList.length > 0) {
      populateListDOM(targetEl, globalList, highlightTimestamp);
    }
  }).catch(() => {});
}

// Oyuncu İsmi Sorma Modalı
function openStartDialog() {
  if (!elStartDialog) return;
  if (elPlayerNameInput) {
    elPlayerNameInput.value = currentPlayerName || '';
  }
  renderScoreboardList(elStartScoreboardList);
  if (elStartDialog.showModal) {
    elStartDialog.showModal();
  } else {
    elStartDialog.setAttribute('open', '');
  }
  setTimeout(() => elPlayerNameInput?.focus(), 80);
}

// Müstakil Skor Tablosu Modalı
function openScoreboardDialog() {
  if (!elScoreboardDialog) return;
  renderScoreboardList(elScoreboardListItems);
  if (elScoreboardDialog.showModal) {
    elScoreboardDialog.showModal();
  } else {
    elScoreboardDialog.setAttribute('open', '');
  }
}

function closeScoreboardDialog() {
  if (!elScoreboardDialog) return;
  if (elScoreboardDialog.close) {
    elScoreboardDialog.close();
  } else {
    elScoreboardDialog.removeAttribute('open');
  }
}

// Sayaç Efekti (Count-up Animation)
function animateValue(targetValue, duration = 850) {
  return new Promise(resolve => {
    const startTime = performance.now();
    elRightValueBox.hidden = false;
    elActionButtonsBox.hidden = true;

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(targetValue * easeProgress);

      elRightValue.textContent = formatMarketValue(currentVal);
      elRightFullValue.textContent = formatFullCurrency(currentVal);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        elRightValue.textContent = formatMarketValue(targetValue);
        elRightFullValue.textContent = formatFullCurrency(targetValue);
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// Oyuncunun Tahmini (Higher / Lower)
async function handleGuess(isHigher) {
  if (isTransitioning || !currentClubA || !currentClubB) return;
  isTransitioning = true;

  const valA = currentClubA.marketValue;
  const valB = currentClubB.marketValue;

  // Sayacı çalıştır ve değeri göster
  await animateValue(valB);

  // Eşitlik durumunda tahmin doğru kabul edilir
  const isCorrect = (valB === valA) || (isHigher && valB > valA) || (!isHigher && valB < valA);

  // Geri bildirim rozeti
  elFeedbackBadge.hidden = false;
  if (isCorrect) {
    elFeedbackBadge.className = 'feedback-badge correct';
    elFeedbackIcon.textContent = '✓';
  } else {
    elFeedbackBadge.className = 'feedback-badge wrong';
    elFeedbackIcon.textContent = '✗';
  }

  if (isCorrect) {
    score++;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(STORAGE_KEY, bestScore.toString());
    }
    updateHUD();

    // 1 saniye sonra bir sonraki tura geç
    setTimeout(() => {
      elFeedbackBadge.hidden = true;
      elFeedbackBadge.className = 'feedback-badge';

      // Sağdaki kulübü sola aktar ve yeni bir sağ kulüp çek
      const nextA = currentClubB;
      const nextB = drawNextClub(nextA.id);

      renderClubA(nextA);
      renderClubB(nextB);

      isTransitioning = false;
    }, 1100);
  } else {
    // Yanlış tahmin - Game Over
    setTimeout(() => {
      elFeedbackBadge.hidden = true;
      elFeedbackBadge.className = 'feedback-badge';
      showGameOver(isHigher);
      isTransitioning = false;
    }, 1200);
  }
}

function applyOutcomeUI(result) {
  if (elModalCardBox) {
    elModalCardBox.classList.remove('outcome-record', 'outcome-podium', 'outcome-disappointment');
  }
  stopConfetti(elConfettiCanvas);

  if (result.outcome === 'RECORD') {
    if (elModalCardBox) elModalCardBox.classList.add('outcome-record');
    launchConfetti(elConfettiCanvas);
  } else if (result.outcome === 'PODIUM') {
    if (elModalCardBox) elModalCardBox.classList.add('outcome-podium');
  } else if (result.outcome === 'DISAPPOINTMENT') {
    if (elModalCardBox) elModalCardBox.classList.add('outcome-disappointment');
  }

  if (elModalBadgeIcon) elModalBadgeIcon.textContent = result.icon;
  if (elModalTitle) elModalTitle.textContent = result.title;
  if (elModalSubtitle) elModalSubtitle.textContent = result.subtitle;
}

// Oyun Bitti Ekranı
function showGameOver(guessedHigher) {
  elFinalScore.textContent = score;
  elModalBestScore.textContent = bestScore;

  // 1. Anında yerel kayıt ve anında UI tepkisi
  const localResult = recordScore(score, currentPlayerName || 'Oyuncu');
  applyOutcomeUI(localResult);
  renderScoreboardList(elModalScoreboardList, localResult.newEntry?.timestamp);

  // 2. Global Firebase bulutuna eşitle
  recordScoreGlobal(score, currentPlayerName || 'Oyuncu').then(globalResult => {
    if (globalResult && globalResult.outcome !== localResult.outcome) {
      applyOutcomeUI(globalResult);
    }
    renderScoreboardList(elModalScoreboardList, globalResult.newEntry?.timestamp);
  }).catch(() => {});

  const valA = currentClubA.marketValue;
  const valB = currentClubB.marketValue;
  const diff = Math.abs(valB - valA);

  const relation = valB > valA ? 'daha yüksek' : 'daha düşük';
  const guessedWord = guessedHigher ? 'daha yüksek' : 'daha düşük';

  elGameOverReason.textContent = `Yanıldın! Sen "${guessedWord}" dedin ancak ${currentClubB.name} (${formatMarketValue(valB)}), ${currentClubA.name}'dan (${formatMarketValue(valA)}) ${relation} bir değere sahipti.`;

  elModalComparison.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span><strong>${currentClubA.name}:</strong> ${formatFullCurrency(valA)}</span>
      <span><strong>${currentClubB.name}:</strong> ${formatFullCurrency(valB)}</span>
    </div>
    <div style="color: var(--muted); font-size: 11px;">
      Fark: <strong>${formatMarketValue(diff)}</strong> (${formatFullCurrency(diff)})
    </div>
  `;

  if (elGameOverDialog.showModal) {
    elGameOverDialog.showModal();
  } else {
    elGameOverDialog.setAttribute('open', '');
  }
}

// Tur Başlatma
function startNewRound() {
  score = 0;
  updateHUD();

  replenishBag();
  const firstClub = drawNextClub();
  const secondClub = drawNextClub(firstClub.id);

  renderClubA(firstClub);
  renderClubB(secondClub);
  isTransitioning = false;
}

// Oyunu Yeniden Başlat
function restartGame() {
  stopConfetti(elConfettiCanvas);
  if (elGameOverDialog.close) {
    elGameOverDialog.close();
  } else {
    elGameOverDialog.removeAttribute('open');
  }

  startNewRound();
}

// İsim Değiştirme
function changePlayerName() {
  stopConfetti(elConfettiCanvas);
  if (elGameOverDialog.open) {
    if (elGameOverDialog.close) elGameOverDialog.close();
    else elGameOverDialog.removeAttribute('open');
  }
  openStartDialog();
}

// Olay Dinleyicileri (Event Listeners)
elHigherBtn.addEventListener('click', () => handleGuess(true));
elLowerBtn.addEventListener('click', () => handleGuess(false));
elRestartBtn.addEventListener('click', restartGame);

if (elChangeNameBtn) {
  elChangeNameBtn.addEventListener('click', changePlayerName);
}
if (elPlayerProfileBtn) {
  elPlayerProfileBtn.addEventListener('click', openStartDialog);
}
if (elScoreboardBtn) {
  elScoreboardBtn.addEventListener('click', openScoreboardDialog);
}
if (elCloseScoreboardBtn) {
  elCloseScoreboardBtn.addEventListener('click', closeScoreboardDialog);
}

// Başlama Formu Gönderimi
if (elStartForm) {
  elStartForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = (elPlayerNameInput.value || '').trim();
    currentPlayerName = nameVal || 'Oyuncu';
    setStoredPlayerName(currentPlayerName);
    updatePlayerNameDisplay();

    if (elStartDialog.close) {
      elStartDialog.close();
    } else {
      elStartDialog.removeAttribute('open');
    }

    // Oyun henüz başlamamışsa veya yeniden başlama gerekiyorsa
    startNewRound();
  });
}

// Klavye Kısayolları
window.addEventListener('keydown', (e) => {
  if (elStartDialog?.open || elScoreboardDialog?.open) {
    return;
  }

  if (elGameOverDialog.open) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      restartGame();
    }
    return;
  }

  if (isTransitioning) return;

  const key = e.key.toLowerCase();
  if (e.key === 'ArrowUp' || key === 'w' || key === 'h' || key === 'y') {
    e.preventDefault();
    handleGuess(true);
  } else if (e.key === 'ArrowDown' || key === 's' || key === 'l' || key === 'd') {
    e.preventDefault();
    handleGuess(false);
  }
});

// Başlatma
function init() {
  updateHUD();
  updatePlayerNameDisplay();

  // Oyuna başlarken İsim sorsun
  openStartDialog();
}

init();
