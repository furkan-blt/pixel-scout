/**
 * Çok Oyunculu Piyasa Değeri Arenası — Puanlama & Soru Havuzu Motoru
 *
 * Onaylanan Adil Puanlama Formülü:
 *  - Bağıl Hata (E) = |Tahmin - Gerçek| / Gerçek
 *  - İsabet Puanı (Maks 800) = round(800 * max(0, 1 - E / 0.50)^2)
 *  - Kâhin Bonusu (+100) = E <= 0.01 (%1 veya daha az sapma)
 *  - Tur Sıralama Bonusu = 1. En Yakın (+200), 2. En Yakın (+120), 3. En Yakın (+60)
 *    (Eşitlik durumunda tahminini daha erken kilitleyen oyuncu üst sırayı alır)
 *  - Bonus Soru (Eren Çiftçi): Sıralama gösterilir ancak puanlamaya dahil edilmez (0 Puan).
 */

export const RANK_BONUSES = [200, 120, 60];
export const BULLSEYE_BONUS = 100;
export const BULLSEYE_THRESHOLD = 0.01;
export const MAX_ACCURACY_POINTS = 800;
export const ERROR_CUTOFF = 0.50;

/**
 * Tek bir tahmin için bağıl hata ve temel isabet puanını hesaplar.
 * @param {number} guessValue - Tahmin edilen değer
 * @param {number} actualValue - Gerçek piyasa değeri
 */
export function calculateAccuracyScore(guessValue, actualValue) {
  if (!Number.isFinite(actualValue) || actualValue <= 0) {
    return { relativeError: 1, accuracyPoints: 0, bullseyeBonus: 0 };
  }
  if (!Number.isFinite(guessValue) || guessValue < 0) {
    return { relativeError: 1, accuracyPoints: 0, bullseyeBonus: 0 };
  }

  const diff = Math.abs(guessValue - actualValue);
  const relativeError = diff / actualValue;

  const ratio = Math.max(0, 1 - relativeError / ERROR_CUTOFF);
  const accuracyPoints = Math.round(MAX_ACCURACY_POINTS * Math.pow(ratio, 2));
  const bullseyeBonus = relativeError <= BULLSEYE_THRESHOLD ? BULLSEYE_BONUS : 0;

  return {
    diff,
    relativeError,
    accuracyPoints,
    bullseyeBonus
  };
}

/**
 * Bir turdaki tüm oyuncuların tahminlerini değerlendirir, sıralar ve puanlarını hesaplar.
 * Bonus soruda (options.isBonus === true) yakınlık sıralaması yapılır fakat tüm puanlar 0 olur.
 * @param {Array<{playerId: string, name: string, guess: number|null, lockedAt?: number}>} submissions
 * @param {number} actualValue
 * @param {{isBonus?: boolean}} [options]
 */
export function calculateRoundScores(submissions, actualValue, options = {}) {
  if (!Array.isArray(submissions)) return [];
  const isBonus = Boolean(options?.isBonus);

  const evaluated = submissions.map((sub) => {
    const hasGuess = typeof sub.guess === 'number' && Number.isFinite(sub.guess) && sub.guess >= 0;
    if (!hasGuess) {
      return {
        playerId: sub.playerId,
        name: sub.name || 'Oyuncu',
        guess: null,
        lockedAt: sub.lockedAt ?? Infinity,
        diff: Infinity,
        relativeError: 1,
        accuracyPoints: 0,
        bullseyeBonus: 0,
        rank: null,
        rankBonus: 0,
        totalRoundPoints: 0,
        isBonus
      };
    }

    const { diff, relativeError, accuracyPoints, bullseyeBonus } = calculateAccuracyScore(sub.guess, actualValue);
    return {
      playerId: sub.playerId,
      name: sub.name || 'Oyuncu',
      guess: sub.guess,
      lockedAt: typeof sub.lockedAt === 'number' ? sub.lockedAt : Infinity,
      diff,
      relativeError,
      accuracyPoints: isBonus ? 0 : accuracyPoints,
      bullseyeBonus: isBonus ? 0 : bullseyeBonus,
      rank: null,
      rankBonus: 0,
      totalRoundPoints: 0,
      isBonus
    };
  });

  // Tahmin yapanları hata oranına göre (eşitlikte erken kilitleme zamanına göre) sırala
  const active = evaluated
    .filter((item) => item.guess !== null)
    .sort((a, b) => {
      if (Math.abs(a.relativeError - b.relativeError) > 1e-9) {
        return a.relativeError - b.relativeError;
      }
      return a.lockedAt - b.lockedAt;
    });

  active.forEach((item, index) => {
    const rank = index + 1;
    const rankBonus = !isBonus && index < RANK_BONUSES.length ? RANK_BONUSES[index] : 0;
    item.rank = rank;
    item.rankBonus = rankBonus;
    item.totalRoundPoints = isBonus ? 0 : item.accuracyPoints + item.bullseyeBonus + rankBonus;
  });

  const inactive = evaluated.filter((item) => item.guess === null);
  return [...active, ...inactive];
}

/**
 * Bir oyun boyunca aynı futbolcunun asla tekrar sorulmamasını sağlayan karıştırıcı.
 * @param {Array<Object>} players - 300 futbolculuk veri seti
 * @param {number} questionCount - 10 veya 20 soru
 * @param {string[]} [excludeIds] - Daha önce sorulmuş oyuncu ID'leri
 * @returns {Array<Object>} Benzersiz futbolcu listesi
 */
export function selectUniqueGamePlayers(players, questionCount = 10, excludeIds = []) {
  if (!Array.isArray(players) || players.length === 0) return [];
  const excluded = new Set(excludeIds);

  const seenIds = new Set();
  const pool = [];
  for (const p of players) {
    if (!p || !p.id || p.isBonus) continue;
    if (seenIds.has(p.id) || excluded.has(p.id)) continue;
    seenIds.add(p.id);
    pool.push(p);
  }

  const effectivePool = pool.length >= questionCount
    ? pool
    : Array.from(new Map(players.filter((p) => p && !p.isBonus).map((p) => [p.id, p])).values());

  const shuffled = [...effectivePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(questionCount, shuffled.length));
}

/**
 * Para birimine göre değeri okunaklı formata çevirir:
 * - EUR: 180000000 -> "€180.0M"
 * - TRY (Bonus Soru): 28075.50 -> "28.075,50 ₺"
 * @param {number} value
 * @param {boolean} [alwaysDecimal=false]
 * @param {'EUR'|'TRY'} [currency='EUR']
 */
export function formatMarketValue(value, alwaysDecimal = false, currency = 'EUR') {
  if (!Number.isFinite(value) || value < 0) {
    return currency === 'TRY' ? '0,00 ₺' : '€0M';
  }
  if (currency === 'TRY') {
    const formatted = value.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatted} ₺`;
  }
  const millions = value / 1_000_000;
  if (millions >= 100 && !alwaysDecimal && Number.isInteger(millions)) {
    return `€${millions.toFixed(0)}M`;
  }
  if (Number.isInteger(millions) && !alwaysDecimal) {
    return `€${millions}M`;
  }
  return `€${millions.toFixed(1)}M`;
}
