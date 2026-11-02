import { createRound } from './engine.js';

export const BONUS_ID = 'bonus-player';

export const BONUS_PLAYER = {
  id: BONUS_ID,
  name: 'Eren Çiftçi',
  aliases: ['Eren Çiftçi', 'Eren', 'Çiftçi', 'Bonus Oyuncu', 'Bonus'],
  bonus: true,
  club: 'ALBARAKA',
  league: 'Süper Lig',
  nationality: 'Türkiye',
  nationalityCode: 'TR',
  position: 'Stajyer',
  birthDate: '2004-05-15',
  shirtNumber: 37,
  photo: {
    path: 'assets/bonus/eren-ciftci.jpg',
    author: 'Pixel Scout',
    sourcePage: null,
    license: 'Personal',
    licenseUrl: null,
    date: '2026',
    objectPosition: '50% 12%',
    scale: 1.08,
    transformOrigin: '50% 20%'
  }
};

export function isBonusRound(round) {
  return round?.targetId === BONUS_ID;
}

export function openingRound() {
  return createRound(BONUS_ID, 'photo');
}

export function searchRosterForRound(round, normalRoster) {
  return isBonusRound(round) ? [BONUS_PLAYER, ...normalRoster] : normalRoster;
}
