import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MATCHES, MATCH_CATEGORIES } from '../dist/games/golcuyu-tahmin-et/matches.js';
import { LEGENDARY_PLAYERS, normalizeName } from '../dist/games/golcuyu-tahmin-et/legends.js';
import { generatePixelAvatar } from '../dist/games/golcuyu-tahmin-et/avatar.js';
import { STORAGE_KEY } from '../dist/games/golcuyu-tahmin-et/app.js';

const root = fileURLToPath(new URL('../', import.meta.url));

test('golcuyu-tahmin-et registry is valid and points to local entrypoint', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'dist/games/registry.json'), 'utf8'));
  const entry = registry.find(g => g.id === 'golcuyu-tahmin-et');
  assert.ok(entry, 'Game should be present in registry.json');
  assert.equal(entry.title, 'Golcüyü Tahmin Et');
  assert.equal(entry.href, './golcuyu-tahmin-et/index.html');
  assert.equal(STORAGE_KEY, 'pixel-scout:golcuyu-tahmin-et:v1');
});

test('curated matches dataset has at least 20 iconic matches with complete metadata, scores and goals', () => {
  assert.ok(MATCHES.length >= 20, `Should have at least 20 iconic matches, found: ${MATCHES.length}`);
  assert.ok(MATCH_CATEGORIES.length >= 3, 'Should have categories');

  for (const match of MATCHES) {
    assert.ok(match.id, 'Match must have an id');
    assert.ok(match.tournament, 'Match must have a tournament');
    assert.ok(match.date, 'Match must have a date');
    assert.ok(match.stadium, 'Match must have a stadium');
    assert.ok(match.homeTeam.name && match.awayTeam.name, 'Teams must be named');
    assert.ok(typeof match.homeTeam.score === 'number' && typeof match.awayTeam.score === 'number');
    assert.ok(Array.isArray(match.goals) && match.goals.length > 0, 'Match must have goals');

    for (const goal of match.goals) {
      assert.ok(goal.id, 'Goal must have id');
      assert.ok(typeof goal.minute === 'number', 'Goal must have minute number');
      assert.ok(goal.scorerName, 'Goal must have scorerName');
      assert.ok(typeof goal.isHome === 'boolean', 'Goal must specify isHome boolean');
      assert.ok(goal.photoUrl, 'Goal must have photoUrl');
      assert.ok(Array.isArray(goal.aliases) && goal.aliases.length > 0, 'Goal must have aliases');
      assert.ok(['FW', 'MF', 'DF', 'GK'].includes(goal.position), `Invalid position: ${goal.position}`);
      assert.ok(goal.nationality, 'Goal must have nationality');
      assert.ok(goal.nationalityCode, 'Goal must have nationalityCode');
      assert.ok(goal.description, 'Goal must have narrative description');
    }
  }
});

test('legends database and name normalization work reliably', () => {
  assert.ok(LEGENDARY_PLAYERS.length >= 50, `Should have rich legends dataset, found: ${LEGENDARY_PLAYERS.length}`);

  assert.equal(normalizeName('Zinédine Zidane'), 'zinedine zidane');
  assert.equal(normalizeName('Nihat Kahveci'), 'nihat kahveci');
  assert.equal(normalizeName('Tümer Metin'), 'tumer metin');
  assert.equal(normalizeName('Hakan Şükür'), 'hakan sukur');
  assert.equal(normalizeName('Ángel Di María'), 'angel di maria');
});

test('avatar generator creates valid pixel-art SVG string', () => {
  const sampleGoal = MATCHES[0].goals[0];
  const svg = generatePixelAvatar(sampleGoal, 'AC Milan');
  assert.ok(svg.includes('<svg'), 'Should contain svg tag');
  assert.ok(svg.includes('</svg>'), 'Should close svg tag');
  assert.ok(svg.includes('image-rendering:pixelated'), 'Should have pixelated style');
});
