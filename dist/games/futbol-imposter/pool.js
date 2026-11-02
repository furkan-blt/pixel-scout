/**
 * FUTBOL IMPOSTER — Futbolcu ve Teknik Direktör Havuzu
 *
 * Her isim için tek bir net ipucu (yalnızca mevki veya rol) bulunur.
 */

export const IMPOSTER_POOL = [
  // ==================== 10 EN ÇOK BİLİNEN TEKNİK DİREKTÖR ====================
  { id: 'td-fatih-terim', name: 'Fatih Terim', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-jose-mourinho', name: 'José Mourinho', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-pep-guardiola', name: 'Pep Guardiola', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-carlo-ancelotti', name: 'Carlo Ancelotti', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-jurgen-klopp', name: 'Jürgen Klopp', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-okan-buruk', name: 'Okan Buruk', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-senol-gunes', name: 'Şenol Güneş', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-sergen-yalcin', name: 'Sergen Yalçın', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-diego-simeone', name: 'Diego Simeone', role: 'manager', hint: 'Teknik Direktör' },
  { id: 'td-alex-ferguson', name: 'Sir Alex Ferguson', role: 'manager', hint: 'Teknik Direktör' },

  // ==================== BİLİNEN TÜRK FUTBOLCULAR ====================
  { id: 'tr-arda-guler', name: 'Arda Güler', role: 'player', hint: 'On Numara' },
  { id: 'tr-hakan-calhanoglu', name: 'Hakan Çalhanoğlu', role: 'player', hint: 'Orta Saha' },
  { id: 'tr-kenan-yildiz', name: 'Kenan Yıldız', role: 'player', hint: 'Kanat' },
  { id: 'tr-ferdi-kadioglu', name: 'Ferdi Kadıoğlu', role: 'player', hint: 'Bek' },
  { id: 'tr-orkun-kokcu', name: 'Orkun Kökçü', role: 'player', hint: 'Orta Saha' },
  { id: 'tr-baris-alper', name: 'Barış Alper Yılmaz', role: 'player', hint: 'Kanat' },
  { id: 'tr-kerem-akturk', name: 'Kerem Aktürkoğlu', role: 'player', hint: 'Kanat' },
  { id: 'tr-semih-kilicsoy', name: 'Semih Kılıçsoy', role: 'player', hint: 'Santrafor' },
  { id: 'tr-ugurcan-cakir', name: 'Uğurcan Çakır', role: 'player', hint: 'Kaleci' },
  { id: 'tr-irfan-can', name: 'İrfan Can Kahveci', role: 'player', hint: 'Kanat' },
  { id: 'tr-mert-gunok', name: 'Mert Günok', role: 'player', hint: 'Kaleci' },
  { id: 'tr-abdulkerim', name: 'Abdülkerim Bardakcı', role: 'player', hint: 'Stoper' },
  { id: 'tr-yunus-akgun', name: 'Yunus Akgün', role: 'player', hint: 'Kanat' },
  { id: 'tr-ismail-yuksek', name: 'İsmail Yüksek', role: 'player', hint: 'Orta Saha' },
  { id: 'tr-mert-muldur', name: 'Mert Müldür', role: 'player', hint: 'Bek' },
  { id: 'tr-cenk-tosun', name: 'Cenk Tosun', role: 'player', hint: 'Santrafor' },
  { id: 'tr-caglar-soyuncu', name: 'Çağlar Söyüncü', role: 'player', hint: 'Stoper' },
  { id: 'tr-merih-demiral', name: 'Merih Demiral', role: 'player', hint: 'Stoper' },
  { id: 'tr-zeki-celik', name: 'Zeki Çelik', role: 'player', hint: 'Bek' },
  { id: 'tr-cengiz-under', name: 'Cengiz Ünder', role: 'player', hint: 'Kanat' },
  { id: 'tr-burak-yilmaz', name: 'Burak Yılmaz', role: 'player', hint: 'Santrafor' },
  { id: 'tr-arda-turan', name: 'Arda Turan', role: 'player', hint: 'Kanat' },
  { id: 'tr-emre-belozoglu', name: 'Emre Belözoğlu', role: 'player', hint: 'Orta Saha' },
  { id: 'tr-volkan-demirel', name: 'Volkan Demirel', role: 'player', hint: 'Kaleci' },
  { id: 'tr-nihat-kahveci', name: 'Nihat Kahveci', role: 'player', hint: 'Santrafor' },
  { id: 'tr-tuncay-sanli', name: 'Tuncay Şanlı', role: 'player', hint: 'Kanat' },
  { id: 'tr-selcuk-inan', name: 'Selçuk İnan', role: 'player', hint: 'Orta Saha' },
  { id: 'tr-gokhan-gonul', name: 'Gökhan Gönül', role: 'player', hint: 'Bek' },
  { id: 'tr-caner-erkin', name: 'Caner Erkin', role: 'player', hint: 'Bek' },
  { id: 'tr-rustu-recber', name: 'Rüştü Reçber', role: 'player', hint: 'Kaleci' },
  { id: 'tr-ilhan-mansiz', name: 'İlhan Mansız', role: 'player', hint: 'Santrafor' },
  { id: 'tr-hasan-sas', name: 'Hasan Şaş', role: 'player', hint: 'Kanat' },
  { id: 'tr-hamit-altintop', name: 'Hamit Altıntop', role: 'player', hint: 'Orta Saha' },

  // ==================== SÜPER LİG YILDIZLARI ====================
  { id: 'sl-victor-osimhen', name: 'Victor Osimhen', role: 'player', hint: 'Santrafor' },
  { id: 'sl-mauro-icardi', name: 'Mauro Icardi', role: 'player', hint: 'Santrafor' },
  { id: 'sl-fernando-muslera', name: 'Fernando Muslera', role: 'player', hint: 'Kaleci' },
  { id: 'sl-edin-dzeko', name: 'Edin Džeko', role: 'player', hint: 'Santrafor' },
  { id: 'sl-dusan-tadic', name: 'Dušan Tadić', role: 'player', hint: 'On Numara' },
  { id: 'sl-anderson-talisca', name: 'Anderson Talisca', role: 'player', hint: 'On Numara' },
  { id: 'sl-rafa-silva', name: 'Rafa Silva', role: 'player', hint: 'On Numara' },
  { id: 'sl-ciro-immobile', name: 'Ciro Immobile', role: 'player', hint: 'Santrafor' },
  { id: 'sl-gedson-fernandes', name: 'Gedson Fernandes', role: 'player', hint: 'Orta Saha' },
  { id: 'sl-fred', name: 'Fred', role: 'player', hint: 'Orta Saha' },
  { id: 'sl-lucas-torreira', name: 'Lucas Torreira', role: 'player', hint: 'Orta Saha' },
  { id: 'sl-davinson-sanchez', name: 'Davinson Sánchez', role: 'player', hint: 'Stoper' },
  { id: 'sl-en-nesyri', name: 'Youssef En-Nesyri', role: 'player', hint: 'Santrafor' },
  { id: 'sl-aboubakar', name: 'Vincent Aboubakar', role: 'player', hint: 'Santrafor' },
  { id: 'sl-felipe-melo', name: 'Felipe Melo', role: 'player', hint: 'Orta Saha' },
  { id: 'sl-gomis', name: 'Bafétimbi Gomis', role: 'player', hint: 'Santrafor' },

  // ==================== GÜNCEL DÜNYA YILDIZLARI ====================
  { id: 'eu-kylian-mbappe', name: 'Kylian Mbappé', role: 'player', hint: 'Santrafor' },
  { id: 'eu-erling-haaland', name: 'Erling Haaland', role: 'player', hint: 'Santrafor' },
  { id: 'eu-vinicius-jr', name: 'Vinícius Júnior', role: 'player', hint: 'Kanat' },
  { id: 'eu-jude-bellingham', name: 'Jude Bellingham', role: 'player', hint: 'On Numara' },
  { id: 'eu-lamine-yamal', name: 'Lamine Yamal', role: 'player', hint: 'Kanat' },
  { id: 'eu-mohamed-salah', name: 'Mohamed Salah', role: 'player', hint: 'Kanat' },
  { id: 'eu-kevin-de-bruyne', name: 'Kevin De Bruyne', role: 'player', hint: 'On Numara' },
  { id: 'eu-harry-kane', name: 'Harry Kane', role: 'player', hint: 'Santrafor' },
  { id: 'eu-robert-lewandowski', name: 'Robert Lewandowski', role: 'player', hint: 'Santrafor' },
  { id: 'eu-antoine-griezmann', name: 'Antoine Griezmann', role: 'player', hint: 'Forvet' },
  { id: 'eu-luka-modric', name: 'Luka Modrić', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-pedri', name: 'Pedri', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-rodri', name: 'Rodri', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-bukayo-saka', name: 'Bukayo Saka', role: 'player', hint: 'Kanat' },
  { id: 'eu-cole-palmer', name: 'Cole Palmer', role: 'player', hint: 'On Numara' },
  { id: 'eu-phil-foden', name: 'Phil Foden', role: 'player', hint: 'Kanat' },
  { id: 'eu-jamal-musiala', name: 'Jamal Musiala', role: 'player', hint: 'On Numara' },
  { id: 'eu-florian-wirtz', name: 'Florian Wirtz', role: 'player', hint: 'On Numara' },
  { id: 'eu-federico-valverde', name: 'Federico Valverde', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-bernardo-silva', name: 'Bernardo Silva', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-bruno-fernandes', name: 'Bruno Fernandes', role: 'player', hint: 'On Numara' },
  { id: 'eu-virgil-van-dijk', name: 'Virgil van Dijk', role: 'player', hint: 'Stoper' },
  { id: 'eu-thibaut-courtois', name: 'Thibaut Courtois', role: 'player', hint: 'Kaleci' },
  { id: 'eu-alisson-becker', name: 'Alisson Becker', role: 'player', hint: 'Kaleci' },
  { id: 'eu-donnarumma', name: 'Gianluigi Donnarumma', role: 'player', hint: 'Kaleci' },
  { id: 'eu-emi-martinez', name: 'Emiliano Martínez', role: 'player', hint: 'Kaleci' },
  { id: 'eu-achraf-hakimi', name: 'Achraf Hakimi', role: 'player', hint: 'Bek' },
  { id: 'eu-trent-arnold', name: 'Trent Alexander-Arnold', role: 'player', hint: 'Bek' },
  { id: 'eu-william-saliba', name: 'William Saliba', role: 'player', hint: 'Stoper' },
  { id: 'eu-antonio-rudiger', name: 'Antonio Rüdiger', role: 'player', hint: 'Stoper' },
  { id: 'eu-lautaro-martinez', name: 'Lautaro Martínez', role: 'player', hint: 'Santrafor' },
  { id: 'eu-rafael-leao', name: 'Rafael Leão', role: 'player', hint: 'Kanat' },
  { id: 'eu-kvaratskhelia', name: 'Khvicha Kvaratskhelia', role: 'player', hint: 'Kanat' },
  { id: 'eu-ousmane-dembele', name: 'Ousmane Dembélé', role: 'player', hint: 'Kanat' },
  { id: 'eu-rodrygo', name: 'Rodrygo', role: 'player', hint: 'Kanat' },
  { id: 'eu-julian-alvarez', name: 'Julián Álvarez', role: 'player', hint: 'Santrafor' },
  { id: 'eu-viktor-gyokeres', name: 'Viktor Gyökeres', role: 'player', hint: 'Santrafor' },
  { id: 'eu-alexander-isak', name: 'Alexander Isak', role: 'player', hint: 'Santrafor' },
  { id: 'eu-son-heung-min', name: 'Son Heung-min', role: 'player', hint: 'Kanat' },
  { id: 'eu-marcus-rashford', name: 'Marcus Rashford', role: 'player', hint: 'Kanat' },
  { id: 'eu-declan-rice', name: 'Declan Rice', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-martin-odegaard', name: 'Martin Ødegaard', role: 'player', hint: 'On Numara' },
  { id: 'eu-frenkie-de-jong', name: 'Frenkie de Jong', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-paulo-dybala', name: 'Paulo Dybala', role: 'player', hint: 'On Numara' },
  { id: 'eu-romelu-lukaku', name: 'Romelu Lukaku', role: 'player', hint: 'Santrafor' },
  { id: 'eu-sadio-mane', name: 'Sadio Mané', role: 'player', hint: 'Kanat' },
  { id: 'eu-ngolo-kante', name: 'N\'Golo Kanté', role: 'player', hint: 'Orta Saha' },
  { id: 'eu-riyad-mahrez', name: 'Riyad Mahrez', role: 'player', hint: 'Kanat' },

  // ==================== YAKIN DÖNEMİN EN BÜYÜK EFSANELERİ ====================
  { id: 'leg-cristiano-ronaldo', name: 'Cristiano Ronaldo', role: 'player', hint: 'Santrafor' },
  { id: 'leg-lionel-messi', name: 'Lionel Messi', role: 'player', hint: 'Kanat' },
  { id: 'leg-neymar', name: 'Neymar Jr', role: 'player', hint: 'Kanat' },
  { id: 'leg-ronaldinho', name: 'Ronaldinho', role: 'player', hint: 'On Numara' },
  { id: 'leg-zinedine-zidane', name: 'Zinedine Zidane', role: 'player', hint: 'On Numara' },
  { id: 'leg-ronaldo-nazario', name: 'Ronaldo Nazário (R9)', role: 'player', hint: 'Santrafor' },
  { id: 'leg-thierry-henry', name: 'Thierry Henry', role: 'player', hint: 'Santrafor' },
  { id: 'leg-zlatan', name: 'Zlatan Ibrahimović', role: 'player', hint: 'Santrafor' },
  { id: 'leg-andres-iniesta', name: 'Andrés Iniesta', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-xavi', name: 'Xavi Hernández', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-toni-kroos', name: 'Toni Kroos', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-karim-benzema', name: 'Karim Benzema', role: 'player', hint: 'Santrafor' },
  { id: 'leg-gareth-bale', name: 'Gareth Bale', role: 'player', hint: 'Kanat' },
  { id: 'leg-wayne-rooney', name: 'Wayne Rooney', role: 'player', hint: 'Santrafor' },
  { id: 'leg-didier-drogba', name: 'Didier Drogba', role: 'player', hint: 'Santrafor' },
  { id: 'leg-samuel-etoo', name: 'Samuel Eto\'o', role: 'player', hint: 'Santrafor' },
  { id: 'leg-kaka', name: 'Kaká', role: 'player', hint: 'On Numara' },
  { id: 'leg-andrea-pirlo', name: 'Andrea Pirlo', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-gianluigi-buffon', name: 'Gianluigi Buffon', role: 'player', hint: 'Kaleci' },
  { id: 'leg-iker-casillas', name: 'Iker Casillas', role: 'player', hint: 'Kaleci' },
  { id: 'leg-sergio-ramos', name: 'Sergio Ramos', role: 'player', hint: 'Stoper' },
  { id: 'leg-marcelo', name: 'Marcelo', role: 'player', hint: 'Bek' },
  { id: 'leg-roberto-carlos', name: 'Roberto Carlos', role: 'player', hint: 'Bek' },
  { id: 'leg-david-beckham', name: 'David Beckham', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-steven-gerrard', name: 'Steven Gerrard', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-frank-lampard', name: 'Frank Lampard', role: 'player', hint: 'Orta Saha' },
  { id: 'leg-wesley-sneijder', name: 'Wesley Sneijder', role: 'player', hint: 'On Numara' },
  { id: 'leg-alex-de-souza', name: 'Alex de Souza', role: 'player', hint: 'On Numara' },
  { id: 'leg-gheorghe-hagi', name: 'Gheorghe Hagi', role: 'player', hint: 'On Numara' },
  { id: 'leg-ricardo-quaresma', name: 'Ricardo Quaresma', role: 'player', hint: 'Kanat' },
  { id: 'leg-pepe', name: 'Pepe', role: 'player', hint: 'Stoper' },
  { id: 'leg-mesut-ozil', name: 'Mesut Özil', role: 'player', hint: 'On Numara' },
  { id: 'leg-robin-van-persie', name: 'Robin van Persie', role: 'player', hint: 'Santrafor' },
  { id: 'leg-franck-ribery', name: 'Franck Ribéry', role: 'player', hint: 'Kanat' },
  { id: 'leg-arjen-robben', name: 'Arjen Robben', role: 'player', hint: 'Kanat' },
  { id: 'leg-luis-suarez', name: 'Luis Suárez', role: 'player', hint: 'Santrafor' },
  { id: 'leg-sergio-aguero', name: 'Sergio Agüero', role: 'player', hint: 'Santrafor' },
  { id: 'leg-eden-hazard', name: 'Eden Hazard', role: 'player', hint: 'Kanat' },
  { id: 'leg-carles-puyol', name: 'Carles Puyol', role: 'player', hint: 'Stoper' },
  { id: 'leg-paolo-maldini', name: 'Paolo Maldini', role: 'player', hint: 'Stoper' },
  { id: 'leg-francesco-totti', name: 'Francesco Totti', role: 'player', hint: 'On Numara' },
  { id: 'leg-paul-pogba', name: 'Paul Pogba', role: 'player', hint: 'Orta Saha' }
];

/**
 * Tekrarsız rastgele bir gizli isim seçer.
 * @param {Set<string>} usedIds
 */
export function drawSecretTarget(usedIds = new Set()) {
  let available = IMPOSTER_POOL.filter((item) => !usedIds.has(item.id));
  if (available.length === 0) {
    usedIds.clear();
    available = [...IMPOSTER_POOL];
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  const picked = available[randomIndex];
  usedIds.add(picked.id);
  return picked;
}

/**
 * Oyuncular arasından rastgele imposter indekslerini seçer ve turu başlatacak oyuncuyu belirler.
 * @param {number} playerCount
 * @param {number} imposterCount
 */
export function createRoundAssignment(playerCount, imposterCount = 1) {
  const safeCount = Math.max(3, Number(playerCount) || 3);
  const maxImposters = Math.min(Math.max(1, Number(imposterCount) || 1), Math.floor((safeCount - 1) / 2));

  const indices = Array.from({ length: safeCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const imposterIndices = new Set(indices.slice(0, maxImposters));
  const starterIndex = Math.floor(Math.random() * safeCount);

  return {
    imposterIndices,
    starterIndex
  };
}
