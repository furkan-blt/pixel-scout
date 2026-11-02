import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  IMPOSTER_POOL,
  drawSecretTarget,
  createRoundAssignment
} from '../dist/games/futbol-imposter/pool.js';

test('FUTBOL IMPOSTER havuzu 10 teknik direktör, Türk futbolcular, güncel yıldızlar ve yakın dönem efsanelerini içerir', () => {
  assert.ok(IMPOSTER_POOL.length >= 120, 'Havuzda en az 120 bilinen isim olmalı');

  const ids = new Set(IMPOSTER_POOL.map((x) => x.id));
  assert.equal(ids.size, IMPOSTER_POOL.length, 'Tüm IDler benzersiz olmalı');

  const managers = IMPOSTER_POOL.filter((x) => x.role === 'manager');
  assert.equal(managers.length, 10, 'Tam 10 bilinen teknik direktör bulunmalı');

  for (const item of IMPOSTER_POOL) {
    assert.ok(item.name && item.name.length > 2);
    assert.ok(item.hint && item.hint.length > 2);
    assert.ok(!item.hint.includes('•') && !item.hint.includes('/'), `Tek bir ipucu olmalı (${item.name}: ${item.hint})`);
  }
});

test('drawSecretTarget tüm havuz bitene kadar aynı ismi tekrar seçmez', () => {
  const used = new Set();
  const seen = new Set();

  for (let i = 0; i < 50; i++) {
    const picked = drawSecretTarget(used);
    assert.ok(!seen.has(picked.id), 'Aynı isim tekrar seçilmemeli');
    seen.add(picked.id);
  }
});

test('createRoundAssignment doğru sayıda Imposter ve başlangıç oyuncusu seçer', () => {
  const r1 = createRoundAssignment(5, 1);
  assert.equal(r1.imposterIndices.size, 1);
  assert.ok(r1.starterIndex >= 0 && r1.starterIndex < 5);

  const r2 = createRoundAssignment(6, 2);
  assert.equal(r2.imposterIndices.size, 2);
  assert.ok(r2.starterIndex >= 0 && r2.starterIndex < 6);
});

test('FUTBOL IMPOSTER arayüz ve registry.json entegrasyonu', () => {
  const html = fs.readFileSync(path.resolve('dist/games/futbol-imposter/index.html'), 'utf8');
  const registry = JSON.parse(fs.readFileSync(path.resolve('dist/games/registry.json'), 'utf8'));

  const entry = registry.find((g) => g.id === 'futbol-imposter');
  assert.ok(entry, 'registry.json içinde futbol-imposter kayıtlı olmalı');
  assert.equal(entry.title, 'FUTBOL IMPOSTER');

  assert.ok(html.includes('FUTBOL IMPOSTER'));
  assert.ok(html.includes('turu başlatır'));
  assert.ok(html.includes('🗳️ Oylamaya Geç'));
  assert.ok(html.includes('id="inlineVoteSection"'));
});
