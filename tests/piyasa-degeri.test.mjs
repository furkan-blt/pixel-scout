import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CLUBS, formatMarketValue, formatFullCurrency } from '../dist/games/piyasa-degeri/clubs.js';

const root = fileURLToPath(new URL('../', import.meta.url));

test('piyasa-degeri registry is valid and points to local entrypoint', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'dist/games/registry.json'), 'utf8'));
  const entry = registry.find(g => g.id === 'piyasa-degeri');
  assert.ok(entry, 'Game should be present in registry.json');
  assert.equal(entry.title, 'Piyasa Değeri (Higher or Lower)');
  assert.equal(entry.href, './piyasa-degeri/index.html');

  const htmlPath = path.join(root, 'dist/games/piyasa-degeri/index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
});

test('clubs database contains comprehensive list across all requested leagues', () => {
  assert.ok(CLUBS.length >= 100, `Expected at least 100 clubs, got ${CLUBS.length}`);

  const ids = new Set();
  const leagues = new Set();

  for (const club of CLUBS) {
    assert.ok(club.id, 'Club must have an id');
    assert.ok(!ids.has(club.id), `Duplicate club id found: ${club.id}`);
    ids.add(club.id);

    assert.ok(club.name, `Club ${club.id} must have a name`);
    assert.ok(club.league, `Club ${club.id} must have a league`);
    assert.ok(club.country, `Club ${club.id} must have a country`);
    assert.ok(club.flag, `Club ${club.id} must have a flag`);
    assert.ok(typeof club.marketValue === 'number' && club.marketValue > 0, `Club ${club.id} must have positive market value`);
    assert.match(club.color, /^#[0-9a-fA-F]{6}$/, `Club ${club.id} must have valid hex color`);
    assert.ok(club.logo, `Club ${club.id} must have logo`);
    if (club.logo.startsWith('./logos/')) {
      const logoPath = path.join(root, 'dist/games/piyasa-degeri', club.logo);
      assert.ok(fs.existsSync(logoPath), `Local logo file must exist: ${logoPath}`);
    }

    leagues.add(club.league);
  }

  // Key requested leagues
  assert.ok(leagues.has('Premier League'), 'Should have Premier League');
  assert.ok(leagues.has('La Liga'), 'Should have La Liga');
  assert.ok(leagues.has('Serie A'), 'Should have Serie A');
  assert.ok(leagues.has('Süper Lig'), 'Should have Süper Lig');
  assert.ok(leagues.has('Bundesliga'), 'Should have Bundesliga');
  assert.ok(leagues.has('Ligue 1'), 'Should have Ligue 1');
  assert.ok(leagues.has('Saudi Pro League'), 'Should have Saudi Pro League');

  // Verify Scandinavian clubs are present
  const scandinavianClubs = CLUBS.filter(c => ['Norveç', 'Danimarka', 'İsveç'].includes(c.country));
  assert.ok(scandinavianClubs.length >= 5, 'Should have Scandinavian clubs included');
});

test('market value formatting helpers work correctly', () => {
  assert.equal(formatMarketValue(1_260_000_000), '€1.26 Milyar');
  assert.equal(formatMarketValue(1_000_000_000), '€1 Milyar');
  assert.equal(formatMarketValue(285_000_000), '€285 Milyon');
  assert.equal(formatMarketValue(40_000_000), '€40 Milyon');

  const formatted = formatFullCurrency(150_000_000);
  assert.ok(formatted.includes('150'), 'Currency format should include value');
  assert.ok(formatted.includes('€'), 'Currency format should include Euro sign');
});

test('index.html contains all necessary higher-lower DOM elements', () => {
  const html = fs.readFileSync(path.join(root, 'dist/games/piyasa-degeri/index.html'), 'utf8');

  assert.ok(html.includes('id="current-score"'));
  assert.ok(html.includes('id="best-score"'));
  assert.ok(html.includes('id="left-side"'));
  assert.ok(html.includes('id="right-side"'));
  assert.ok(html.includes('id="higher-btn"'));
  assert.ok(html.includes('id="lower-btn"'));
  assert.ok(html.includes('id="feedback-badge"'));
  assert.ok(html.includes('id="game-over-dialog"'));
  assert.ok(html.includes('id="restart-btn"'));
  assert.ok(html.includes('id="start-dialog"'));
  assert.ok(html.includes('id="player-name-input"'));
  assert.ok(html.includes('id="scoreboard-dialog"'));
  assert.ok(html.includes('id="scoreboard-btn"'));
  assert.ok(html.includes('id="confetti-canvas"'));
  assert.ok(html.includes('id="modal-title"'));
});

test('scoreboard management correctly tracks top 5 and outcome states', async () => {
  const {
    getScoreboard,
    recordScore,
    DEFAULT_SCOREBOARD,
    SCOREBOARD_STORAGE_KEY
  } = await import('../dist/games/piyasa-degeri/scoreboard.js');

  class MockStorage {
    constructor() { this.store = {}; }
    getItem(k) { return this.store[k] || null; }
    setItem(k, v) { this.store[k] = String(v); }
  }

  // 1. Varsayılan liste testi
  const storage = new MockStorage();
  const initial = getScoreboard(storage);
  assert.equal(initial.length, 5);
  assert.equal(initial[0].name, 'Pep');
  assert.equal(initial[0].score, 8);

  // 2. İlk 3 cevapta elenme durumu (< 3 skor): HAYAL KIRIKLIĞI
  const resDisappoint0 = recordScore(0, 'Ali', storage);
  assert.equal(resDisappoint0.outcome, 'DISAPPOINTMENT');
  assert.equal(resDisappoint0.title, 'HAYAL KIRIKLIĞI');

  const resDisappoint2 = recordScore(2, 'Veli', storage);
  assert.equal(resDisappoint2.outcome, 'DISAPPOINTMENT');
  assert.equal(resDisappoint2.title, 'HAYAL KIRIKLIĞI');

  // 3. 1. sıraya yerleşme durumu: YENİ REKOR
  const resRecord = recordScore(15, 'Şampiyon', storage);
  assert.equal(resRecord.outcome, 'RECORD');
  assert.equal(resRecord.title, 'YENİ REKOR');
  assert.equal(resRecord.rank, 1);

  // 4. 2. veya 3. sıraya yerleşme durumu: TEBRİKLER PODYUMDASIN
  // Şu anki liste: #1: Şampiyon(15), #2: Pep(8), #3: Alex(6)...
  // 9 puan alırsa 2. sıraya yerleşir
  const resPodium2 = recordScore(9, 'Efsane', storage);
  assert.equal(resPodium2.outcome, 'PODIUM');
  assert.equal(resPodium2.title, 'TEBRİKLER PODYUMDASIN');
  assert.equal(resPodium2.rank, 2);

  // 8 puan alırsa 3. sıraya yerleşir (#1: 15, #2: 9, #3: 8)
  const resPodium3 = recordScore(8, 'Usta', storage);
  assert.equal(resPodium3.outcome, 'PODIUM');
  assert.equal(resPodium3.title, 'TEBRİKLER PODYUMDASIN');
  assert.equal(resPodium3.rank, 3);

  // 5. Scoreboard tam 5 kişi tutmalı
  const saved = getScoreboard(storage);
  assert.equal(saved.length, 5);
  assert.equal(saved[0].name, 'Şampiyon');
  assert.equal(saved[0].score, 15);
});

test('global scoreboard falls back gracefully to local storage when network is offline', async () => {
  const {
    fetchGlobalScoreboard,
    recordScoreGlobal,
    FIREBASE_CONFIG
  } = await import('../dist/games/piyasa-degeri/scoreboard.js');

  class MockStorage {
    constructor() { this.store = {}; }
    getItem(k) { return this.store[k] || null; }
    setItem(k, v) { this.store[k] = String(v); }
  }

  const storage = new MockStorage();
  // Network fail durumunda bile yerel skor dönmeli
  const list = await fetchGlobalScoreboard(storage);
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 5);

  const res = await recordScoreGlobal(12, 'OnlineStar', storage);
  assert.ok(res);
  assert.equal(res.outcome, 'RECORD');
  assert.equal(res.rank, 1);
});
