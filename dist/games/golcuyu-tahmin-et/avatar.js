// Telifsiz ve çevrimdışı SVG pixel-art futbolcu portre üreticisi

const HASH_SEED = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Takım forma renkleri
const TEAM_COLORS = {
  'AC Milan': { primary: '#dc2626', secondary: '#111827' },
  'Liverpool': { primary: '#b91c1c', secondary: '#ffffff' },
  'Arjantin': { primary: '#7dd3fc', secondary: '#ffffff' },
  'Fransa': { primary: '#1e3a8a', secondary: '#dc2626' },
  'Brezilya': { primary: '#facc15', secondary: '#15803d' },
  'Almanya': { primary: '#ffffff', secondary: '#111827' },
  'Türkiye': { primary: '#dc2626', secondary: '#ffffff' },
  'Çekya': { primary: '#b91c1c', secondary: '#1d4ed8' },
  'Fenerbahçe': { primary: '#facc15', secondary: '#1e3a8a' },
  'Beşiktaş': { primary: '#111827', secondary: '#ffffff' },
  'Galatasaray': { primary: '#b91c1c', secondary: '#f59e0b' },
  'Real Madrid': { primary: '#ffffff', secondary: '#4338ca' },
  'Atlético Madrid': { primary: '#dc2626', secondary: '#ffffff' }
};

const SKIN_TONES = ['#f8d5b8', '#e8b98e', '#d29a67', '#a1683d', '#5a3825'];
const HAIR_COLORS = ['#1a110b', '#3d2314', '#6a432d', '#b8860b', '#222222', '#8b5a2b'];

export function generatePixelAvatar(player, teamName) {
  const seed = HASH_SEED(player.scorerId || player.scorerName || 'player');
  const teamColor = TEAM_COLORS[teamName] || { primary: '#22c55e', secondary: '#ffffff' };
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_COLORS[(seed >> 3) % HAIR_COLORS.length];
  const hairType = seed % 4; // 0: kısa, 1: kıvırcık/hacimli, 2: uzun/bandana, 3: kel/çok kısa

  return `
    <svg viewBox="0 0 100 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;display:block;">
      <defs>
        <pattern id="grid-${seed}" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#1b2a1e" />
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#253a29" stroke-width="0.5"/>
        </pattern>
      </defs>
      <!-- Arka Plan -->
      <rect width="100" height="110" fill="url(#grid-${seed})" />
      <circle cx="50" cy="55" r="42" fill="#243828" stroke="#3d5a42" stroke-width="2" />

      <!-- Gövde / Forma -->
      <path d="M 24 88 L 28 68 L 40 64 L 60 64 L 72 68 L 76 88 L 84 110 L 16 110 Z" fill="${teamColor.primary}" />
      <!-- Yaka / Detay -->
      <polygon points="40,64 50,76 60,64 50,68" fill="${teamColor.secondary}" />
      <rect x="47" y="78" width="6" height="32" fill="${teamColor.secondary}" opacity="0.6"/>

      <!-- Boyun -->
      <rect x="42" y="54" width="16" height="12" fill="${skin}" />

      <!-- Kafa -->
      <rect x="34" y="24" width="32" height="34" rx="4" fill="${skin}" />
      <!-- Kulaklar -->
      <rect x="30" y="34" width="4" height="12" fill="${skin}" />
      <rect x="66" y="34" width="4" height="12" fill="${skin}" />

      <!-- Saç Modelleri -->
      ${hairType === 0 ? `
        <!-- Kısa Saç -->
        <path d="M 32 26 L 32 16 L 68 16 L 68 26 L 64 22 L 36 22 Z" fill="${hair}" />
        <rect x="34" y="18" width="32" height="8" fill="${hair}" />
      ` : hairType === 1 ? `
        <!-- Hacimli / Kıvırcık Saç -->
        <circle cx="34" cy="22" r="8" fill="${hair}" />
        <circle cx="50" cy="16" r="10" fill="${hair}" />
        <circle cx="66" cy="22" r="8" fill="${hair}" />
        <rect x="30" y="20" width="40" height="8" fill="${hair}" />
      ` : hairType === 2 ? `
        <!-- Uzun / Bandana Saç -->
        <rect x="32" y="16" width="36" height="12" fill="${hair}" />
        <rect x="30" y="26" width="6" height="24" fill="${hair}" />
        <rect x="64" y="26" width="6" height="24" fill="${hair}" />
        <rect x="32" y="26" width="36" height="4" fill="${teamColor.secondary}" />
      ` : `
        <!-- Çok Kısa / Klasik Saç -->
        <path d="M 34 22 L 50 18 L 66 22 Z" fill="${hair}" />
      `}

      <!-- Kaşlar & Gözler -->
      <rect x="38" y="34" width="6" height="2" fill="#111111" />
      <rect x="56" y="34" width="6" height="2" fill="#111111" />
      <rect x="40" y="38" width="4" height="4" fill="#111111" />
      <rect x="56" y="38" width="4" height="4" fill="#111111" />
      <rect x="42" y="39" width="1" height="1" fill="#ffffff" />
      <rect x="58" y="39" width="1" height="1" fill="#ffffff" />

      <!-- Burun -->
      <rect x="48" y="42" width="4" height="4" fill="#b07d56" opacity="0.6"/>

      <!-- Ağız -->
      <rect x="44" y="50" width="12" height="2" fill="#8c4843" />

      <!-- Forma Numarası / Rozet -->
      <rect x="44" y="86" width="12" height="10" fill="#000000" opacity="0.2" rx="2"/>
      <text x="50" y="94" font-family="Silkscreen, monospace" font-size="8" fill="${teamColor.secondary}" text-anchor="middle" font-weight="bold">${player.minute}'</text>
    </svg>
  `;
}
