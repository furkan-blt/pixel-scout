const GAME_BADGES = {
  'who-are-ya': 'TEK OYUNCULU • KEŞİF',
  'piyasa-degeri': 'TEK OYUNCULU • REKOR',
  'cok-oyunculu': 'CANLI ODA • 1-6 OYUNCU',
  'futbol-imposter': 'TEK TELEFON • PARTİ',
  'fut-draft': 'AYNI CİHAZ • 3–5 OYUNCU'
};

async function loadGames() {
  try {
    const response = await fetch('./registry.json');
    if (!response.ok) throw new Error('Registry unavailable');
    const games = await response.json();
    const container = document.getElementById('games');
    let index = 1;
    for (const game of games) {
      const url = new URL(game.href, location.href);
      if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) continue;
      const card = document.createElement('a');
      card.className = 'game';
      card.href = game.href === '../index.html' ? '../index.html?play=1' : game.href;

      const topRow = document.createElement('div');
      topRow.className = 'game-top';

      const num = document.createElement('span');
      num.className = 'game-num';
      num.textContent = String(index++).padStart(2, '0');

      const badge = document.createElement('span');
      badge.className = 'game-badge';
      badge.textContent = GAME_BADGES[game.id] || 'FUTBOL OYUNU';

      topRow.append(num, badge);

      const title = document.createElement('h2');
      title.textContent = game.title;

      const description = document.createElement('p');
      description.textContent = game.description;

      const action = document.createElement('span');
      action.className = 'game-action';
      action.textContent = 'OYNA →';

      card.append(topRow, title, description, action);
      container.append(card);
    }
  } catch {
    document.getElementById('message').textContent = 'Oyun listesi yüklenemedi. Sayfayı yenileyebilirsin.';
  }
}
loadGames();
