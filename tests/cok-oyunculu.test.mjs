import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { PLAYERS, BONUS_PLAYER, DATASET_META, getPlayerById } from '../dist/games/cok-oyunculu/players.js';
import {
  calculateAccuracyScore,
  calculateRoundScores,
  selectUniqueGamePlayers,
  formatMarketValue
} from '../dist/games/cok-oyunculu/scoring.js';
import {
  generateRoomCode,
  isValidRoomCode
} from '../dist/games/cok-oyunculu/room.js';

test('300 futbolcu veri seti tam dağılım (%80 Avrupa, %15 Süper Lig, %5 Arabistan/ABD) ve bütünlük kontrolü', () => {
  assert.equal(PLAYERS.length, 300, 'Veri setinde tam 300 futbolcu olmalı');
  assert.equal(DATASET_META.totalPlayers, 300);

  const ids = new Set(PLAYERS.map((p) => p.id));
  assert.equal(ids.size, 300, 'Tüm futbolcu IDleri benzersiz olmalı');

  const europe = PLAYERS.filter((p) => p.category === 'europe');
  const superLig = PLAYERS.filter((p) => p.category === 'super_lig');
  const saudiMls = PLAYERS.filter((p) => p.category === 'saudi_mls');

  assert.equal(europe.length, 240, '%80 Avrupa top kulüplerinden (240 futbolcu) olmalı');
  assert.equal(superLig.length, 45, '%15 Süper Lig kulüplerinden (45 futbolcu) olmalı');
  assert.equal(saudiMls.length, 15, '%5 Arabistan ve ABD liglerinden (15 futbolcu) olmalı');

  for (const p of PLAYERS) {
    assert.ok(p.name && p.name.length > 1, `İsim eksik: ${p.id}`);
    assert.ok(p.age >= 15 && p.age <= 45, `Geçersiz yaş (${p.name}): ${p.age}`);
    assert.ok(p.position && p.position.length > 1, `Mevki eksik (${p.name})`);
    assert.ok(p.club && p.club.length > 1, `Kulüp eksik (${p.name})`);
    assert.ok(p.country && p.country.length > 1, `Ülke eksik (${p.name})`);
    assert.ok(p.marketValue > 0, `Piyasa değeri 0'dan büyük olmalı (${p.name})`);
    assert.ok(p.photoUrl && p.photoUrl.startsWith('https://'), `Fotoğraf URL eksik (${p.name})`);
    assert.ok(!p.photoUrl.includes('default.jpg'), `Varsayılan silüet fotoğraf olmamalı (${p.name})`);
    assert.equal(getPlayerById(p.id)?.name, p.name);
  }
});

test('Bir oyun süresince aynı futbolcunun tekrar sorulmaması (10 ve 20 soruluk modlar)', () => {
  const deck10 = selectUniqueGamePlayers(PLAYERS, 10);
  assert.equal(deck10.length, 10);
  assert.equal(new Set(deck10.map((p) => p.id)).size, 10, '10 soruluk modda tekrar eden futbolcu olmamalı');

  const deck20 = selectUniqueGamePlayers(PLAYERS, 20);
  assert.equal(deck20.length, 20);
  assert.equal(new Set(deck20.map((p) => p.id)).size, 20, '20 soruluk modda tekrar eden futbolcu olmamalı');

  // Ardışık iki oyunda da önceki oyunun futbolcuları hariç tutulabilmeli
  const secondDeck20 = selectUniqueGamePlayers(PLAYERS, 20, deck20.map((p) => p.id));
  assert.equal(secondDeck20.length, 20);
  const overlap = secondDeck20.filter((p) => deck20.some((first) => first.id === p.id));
  assert.equal(overlap.length, 0, 'Hariç tutulan futbolcular tekrar seçilmemeli');
});

test('Adil puanlama formülü, sıralama bonusları, Kâhin bonusu ve erken kilitleme eşitlik bozucusu', () => {
  const actual = 100_000_000; // 100M €

  // Tam isabet (%0 hata) -> 800 isabet + 100 Kâhin bonusu
  const exact = calculateAccuracyScore(100_000_000, actual);
  assert.equal(exact.accuracyPoints, 800);
  assert.equal(exact.bullseyeBonus, 100);

  // %50 ve üzeri sapma -> 0 isabet puanı
  const far = calculateAccuracyScore(160_000_000, actual);
  assert.equal(far.accuracyPoints, 0);
  assert.equal(far.bullseyeBonus, 0);

  // Çok oyunculu tur sıralaması ve eşitlik bozucu (lockedAt)
  const roundResults = calculateRoundScores(
    [
      { playerId: 'p1', name: 'Ahmet', guess: 95_000_000, lockedAt: 2000 }, // %5 hata (daha geç kilitledi)
      { playerId: 'p2', name: 'Burak', guess: 105_000_000, lockedAt: 1000 }, // %5 hata (daha erken kilitledi -> 1. olmalı!)
      { playerId: 'p3', name: 'Emre', guess: 100_500_000, lockedAt: 3000 }, // %0.5 hata (Kâhin bonusu + 1. sıra!)
      { playerId: 'p4', name: 'Kaan', guess: null } // Tahmin yapmadı
    ],
    actual
  );

  assert.equal(roundResults[0].playerId, 'p3', 'En yakın tahmini yapan 1. sırada olmalı');
  assert.equal(roundResults[0].rankBonus, 200);
  assert.equal(roundResults[0].bullseyeBonus, 100);

  assert.equal(roundResults[1].playerId, 'p2', 'Aynı hata oranında daha erken kilitleyen 2. sırayı almalı');
  assert.equal(roundResults[1].rankBonus, 120);

  assert.equal(roundResults[2].playerId, 'p1', 'Daha geç kilitleyen 3. sırayı almalı');
  assert.equal(roundResults[2].rankBonus, 60);

  assert.equal(roundResults[3].playerId, 'p4');
  assert.equal(roundResults[3].totalRoundPoints, 0);
});

test('4 haneli oda kodu üretimi ve doğrulaması', () => {
  for (let i = 0; i < 25; i++) {
    const code = generateRoomCode();
    assert.match(code, /^\d{4}$/, 'Oda kodu tam 4 haneli sayı olmalı');
    assert.equal(isValidRoomCode(code), true);
  }
  assert.equal(isValidRoomCode('123'), false);
  assert.equal(isValidRoomCode('12345'), false);
  assert.equal(isValidRoomCode('ABCD'), false);
  assert.equal(isValidRoomCode('4819'), true);
});

test('Oyun ekranı HTML, CSS ve registry.json entegrasyon kontrolü', () => {
  const html = fs.readFileSync(path.resolve('dist/games/cok-oyunculu/index.html'), 'utf8');
  const css = fs.readFileSync(path.resolve('dist/games/cok-oyunculu/style.css'), 'utf8');
  const registry = JSON.parse(fs.readFileSync(path.resolve('dist/games/registry.json'), 'utf8'));

  assert.ok(registry.some((g) => g.id === 'cok-oyunculu'), 'registry.json içinde cok-oyunculu kayıtlı olmalı');
  assert.ok(html.includes('id="leaderboardSidebar"'), 'Sağ tarafta canlı puan tablosu paneli bulunmalı');
  assert.ok(html.includes('id="playerPositionText"'), 'Futbolcu kartında mevki göstergesi bulunmalı');
  assert.ok(!/baskın ayak/i.test(html), 'Baskın ayak bilgisi kartta yer almamalı');
  assert.ok(css.includes('object-fit: cover'), 'Fotoğraflarda kayma/bozulma önleyici object-fit: cover bulunmalı');
  assert.ok(html.includes('data-bonus="true"'), 'Lobi ekranında Bonus Soru Aktif/Aktif Değil seçimi bulunmalı');
  assert.equal(formatMarketValue(180_000_000, true), '€180.0M');
});

test('Bonus oyuncu (Eren Çiftçi) özellikleri, TL formatı ve puansız değerlendirme kontrolü', () => {
  assert.equal(BONUS_PLAYER.name, 'Eren Çiftçi');
  assert.equal(BONUS_PLAYER.club, 'Albaraka');
  assert.equal(BONUS_PLAYER.country, 'Türkiye');
  assert.equal(BONUS_PLAYER.position, 'Stajyer');
  assert.equal(BONUS_PLAYER.marketValue, 28075.50);
  assert.equal(BONUS_PLAYER.currency, 'TRY');
  assert.equal(BONUS_PLAYER.isBonus, true);
  assert.equal(getPlayerById(BONUS_PLAYER.id)?.name, 'Eren Çiftçi');

  // TL formatlama kontrolü
  assert.equal(formatMarketValue(28075.50, true, 'TRY'), '28.075,50 ₺');

  // Bonus turunda sıralama yapılmalı ama puanlamaya dahil edilmemeli (0 Puan)
  const bonusRound = calculateRoundScores(
    [
      { playerId: 'p1', name: 'Ahmet', guess: 28075.50, lockedAt: 1000 },
      { playerId: 'p2', name: 'Burak', guess: 25000, lockedAt: 1200 }
    ],
    BONUS_PLAYER.marketValue,
    { isBonus: true }
  );

  assert.equal(bonusRound[0].playerId, 'p1');
  assert.equal(bonusRound[0].rank, 1);
  assert.equal(bonusRound[0].totalRoundPoints, 0, 'Bonus soru puanlamaya dahil edilmemeli');
  assert.equal(bonusRound[1].totalRoundPoints, 0, 'Bonus soru puanlamaya dahil edilmemeli');
});

test('Tahmini kilitleme zorunluluğu olmadan süre bittiğinde oyuncunun o anki değeri puanlanır', async () => {
  const { MultiplayerRoomClient } = await import('../dist/games/cok-oyunculu/room.js');
  const client = new MultiplayerRoomClient();
  client.isOfflineMode = true;
  client.localRoomState = {
    code: '4819',
    status: 'playing',
    currentRound: 0,
    players: {
      [client.clientId]: { id: client.clientId, name: 'TestOyuncu', isBot: false, totalScore: 0 }
    },
    guesses: {}
  };

  // Oyuncu kilitlemeden sadece slider/input değerini değiştirdiğinde (locked = false)
  await client.submitGuess(75_000_000, false);
  const draft = client.localRoomState.guesses[0][client.clientId];
  assert.equal(draft.guess, 75_000_000);
  assert.equal(draft.locked, false, 'Kilitlenmemiş canlı tahmin olarak kaydedilmeli');

  // Süre bittiğinde bu değer üzerinden puan hesaplanmalı (0 puan almamalı)
  const scores = calculateRoundScores(
    [{ playerId: client.clientId, name: 'TestOyuncu', guess: draft.guess, lockedAt: draft.lockedAt }],
    80_000_000
  );
  assert.ok(scores[0].totalRoundPoints > 0, 'Kilitlemeyen oyuncu o anki değeriyle puan almalı, 0 puan almamalı');
});
