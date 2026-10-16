// Tarihi efsaneler havuzu - Arama veritabanını genişletmek için

export const LEGENDARY_PLAYERS = [
  // Maçlardaki Golcüler
  { id: 'paolo-maldini', name: 'Paolo Maldini', nationality: 'İtalya', nationalityCode: 'IT', position: 'DF', era: 'Efsane' },
  { id: 'hernan-crespo', name: 'Hernán Crespo', nationality: 'Arjantin', nationalityCode: 'AR', position: 'FW', era: 'Efsane' },
  { id: 'steven-gerrard', name: 'Steven Gerrard', nationality: 'İngiltere', nationalityCode: 'ENG', position: 'MF', era: 'Efsane' },
  { id: 'vladimir-smicer', name: 'Vladimír Šmicer', nationality: 'Çekya', nationalityCode: 'CZ', position: 'MF', era: 'Efsane' },
  { id: 'xabi-alonso', name: 'Xabi Alonso', nationality: 'İspanya', nationalityCode: 'ES', position: 'MF', era: 'Efsane' },
  { id: 'lionel-messi', name: 'Lionel Messi', nationality: 'Arjantin', nationalityCode: 'AR', position: 'FW', era: 'Efsane' },
  { id: 'angel-di-maria', name: 'Ángel Di María', nationality: 'Arjantin', nationalityCode: 'AR', position: 'MF', era: 'Efsane' },
  { id: 'kylian-mbappe', name: 'Kylian Mbappé', nationality: 'Fransa', nationalityCode: 'FR', position: 'FW', era: 'Efsane' },
  { id: 'thomas-muller', name: 'Thomas Müller', nationality: 'Almanya', nationalityCode: 'DE', position: 'FW', era: 'Efsane' },
  { id: 'miroslav-klose', name: 'Miroslav Klose', nationality: 'Almanya', nationalityCode: 'DE', position: 'FW', era: 'Efsane' },
  { id: 'toni-kroos', name: 'Toni Kroos', nationality: 'Almanya', nationalityCode: 'DE', position: 'MF', era: 'Efsane' },
  { id: 'sami-khedira', name: 'Sami Khedira', nationality: 'Almanya', nationalityCode: 'DE', position: 'MF', era: 'Efsane' },
  { id: 'andre-schurrle', name: 'André Schürrle', nationality: 'Almanya', nationalityCode: 'DE', position: 'FW', era: 'Efsane' },
  { id: 'oscar', name: 'Oscar', nationality: 'Brezilya', nationalityCode: 'BR', position: 'MF', era: 'Efsane' },
  { id: 'jan-koller', name: 'Jan Koller', nationality: 'Çekya', nationalityCode: 'CZ', position: 'FW', era: 'Efsane' },
  { id: 'jaroslav-plasil', name: 'Jaroslav Plašil', nationality: 'Çekya', nationalityCode: 'CZ', position: 'MF', era: 'Efsane' },
  { id: 'arda-turan', name: 'Arda Turan', nationality: 'Türkiye', nationalityCode: 'TR', position: 'MF', era: 'Efsane' },
  { id: 'nihat-kahveci', name: 'Nihat Kahveci', nationality: 'Türkiye', nationalityCode: 'TR', position: 'FW', era: 'Efsane' },
  { id: 'tumer-metin', name: 'Tümer Metin', nationality: 'Türkiye', nationalityCode: 'TR', position: 'MF', era: 'Efsane' },
  { id: 'fabio-luciano', name: 'Fábio Luciano', nationality: 'Brezilya', nationalityCode: 'BR', position: 'DF', era: 'Efsane' },
  { id: 'john-carew', name: 'John Carew', nationality: 'Norveç', nationalityCode: 'NO', position: 'FW', era: 'Efsane' },
  { id: 'alex-de-souza', name: 'Alex de Souza', nationality: 'Brezilya', nationalityCode: 'BR', position: 'MF', era: 'Efsane' },
  { id: 'ibrahim-akin', name: 'İbrahim Akın', nationality: 'Türkiye', nationalityCode: 'TR', position: 'FW', era: 'Efsane' },
  { id: 'koray-avci', name: 'Koray Avcı', nationality: 'Türkiye', nationalityCode: 'TR', position: 'MF', era: 'Efsane' },
  { id: 'tuncay-sanli', name: 'Tuncay Şanlı', nationality: 'Türkiye', nationalityCode: 'TR', position: 'FW', era: 'Efsane' },
  { id: 'ariel-ortega', name: 'Ariel Ortega', nationality: 'Arjantin', nationalityCode: 'AR', position: 'MF', era: 'Efsane' },
  { id: 'serhat-akin', name: 'Serhat Akın', nationality: 'Türkiye', nationalityCode: 'TR', position: 'FW', era: 'Efsane' },
  { id: 'ceyhun-eris', name: 'Ceyhun Eriş', nationality: 'Türkiye', nationalityCode: 'TR', position: 'MF', era: 'Efsane' },
  { id: 'umit-ozat', name: 'Ümit Özat', nationality: 'Türkiye', nationalityCode: 'TR', position: 'DF', era: 'Efsane' },
  { id: 'diego-godin', name: 'Diego Godín', nationality: 'Uruguay', nationalityCode: 'UY', position: 'DF', era: 'Efsane' },
  { id: 'sergio-ramos', name: 'Sergio Ramos', nationality: 'İspanya', nationalityCode: 'ES', position: 'DF', era: 'Efsane' },
  { id: 'gareth-bale', name: 'Gareth Bale', nationality: 'Galler', nationalityCode: 'GB-WLS', position: 'FW', era: 'Efsane' },
  { id: 'marcelo', name: 'Marcelo', nationality: 'Brezilya', nationalityCode: 'BR', position: 'DF', era: 'Efsane' },
  { id: 'cristiano-ronaldo', name: 'Cristiano Ronaldo', nationality: 'Portekiz', nationalityCode: 'PT', position: 'FW', era: 'Efsane' },
  { id: 'zinedine-zidane', name: 'Zinedine Zidane', nationality: 'Fransa', nationalityCode: 'FR', position: 'MF', era: 'Efsane' },
  { id: 'emmanuel-petit', name: 'Emmanuel Petit', nationality: 'Fransa', nationalityCode: 'FR', position: 'MF', era: 'Efsane' },
  { id: 'ronaldo-nazario', name: 'Ronaldo Nazário', nationality: 'Brezilya', nationalityCode: 'BR', position: 'FW', era: 'Efsane' },
  { id: 'teddy-sheringham', name: 'Teddy Sheringham', nationality: 'İngiltere', nationalityCode: 'ENG', position: 'FW', era: 'Efsane' },
  { id: 'ole-gunnar-solskjaer', name: 'Ole Gunnar Solskjær', nationality: 'Norveç', nationalityCode: 'NO', position: 'FW', era: 'Efsane' },
  { id: 'mario-basler', name: 'Mario Basler', nationality: 'Almanya', nationalityCode: 'DE', position: 'MF', era: 'Efsane' },
  { id: 'pedro-rodriguez', name: 'Pedro Rodríguez', nationality: 'İspanya', nationalityCode: 'ES', position: 'FW', era: 'Efsane' },
  { id: 'david-villa', name: 'David Villa', nationality: 'İspanya', nationalityCode: 'ES', position: 'FW', era: 'Efsane' },
  { id: 'wayne-rooney', name: 'Wayne Rooney', nationality: 'İngiltere', nationalityCode: 'ENG', position: 'FW', era: 'Efsane' },
  { id: 'luis-suarez', name: 'Luis Suárez', nationality: 'Uruguay', nationalityCode: 'UY', position: 'FW', era: 'Efsane' },
  { id: 'neymar-jr', name: 'Neymar Jr', nationality: 'Brezilya', nationalityCode: 'BR', position: 'FW', era: 'Efsane' },
  { id: 'sergi-roberto', name: 'Sergi Roberto', nationality: 'İspanya', nationalityCode: 'ES', position: 'MF', era: 'Efsane' },
  { id: 'edinson-cavani', name: 'Edinson Cavani', nationality: 'Uruguay', nationalityCode: 'UY', position: 'FW', era: 'Efsane' },
  { id: 'raul-gonzalez', name: 'Raúl González', nationality: 'İspanya', nationalityCode: 'ES', position: 'FW', era: 'Efsane' },
  { id: 'lucio', name: 'Lúcio', nationality: 'Brezilya', nationalityCode: 'BR', position: 'DF', era: 'Efsane' },
  { id: 'marco-materazzi', name: 'Marco Materazzi', nationality: 'İtalya', nationalityCode: 'IT', position: 'DF', era: 'Efsane' },
  { id: 'andres-iniesta', name: 'Andrés Iniesta', nationality: 'İspanya', nationalityCode: 'ES', position: 'MF', era: 'Efsane' },
  { id: 'antoine-griezmann', name: 'Antoine Griezmann', nationality: 'Fransa', nationalityCode: 'FR', position: 'FW', era: 'Efsane' },
  { id: 'paul-pogba', name: 'Paul Pogba', nationality: 'Fransa', nationalityCode: 'FR', position: 'MF', era: 'Efsane' },
  { id: 'ivan-perisic', name: 'Ivan Perišić', nationality: 'Hırvatistan', nationalityCode: 'HR', position: 'MF', era: 'Efsane' },
  { id: 'mario-mandzukic', name: 'Mario Mandžukić', nationality: 'Hırvatistan', nationalityCode: 'HR', position: 'FW', era: 'Efsane' },
  { id: 'mario-jardel', name: 'Mário Jardel', nationality: 'Brezilya', nationalityCode: 'BR', position: 'FW', era: 'Efsane' },
  { id: 'max-kruse', name: 'Max Kruse', nationality: 'Almanya', nationalityCode: 'DE', position: 'FW', era: 'Efsane' },
  { id: 'ryan-donk', name: 'Ryan Donk', nationality: 'Surinam', nationalityCode: 'SR', position: 'DF', era: 'Efsane' },
  { id: 'radamel-falcao', name: 'Radamel Falcao', nationality: 'Kolombiya', nationalityCode: 'CO', position: 'FW', era: 'Efsane' },
  { id: 'henry-onyekuru', name: 'Henry Onyekuru', nationality: 'Nijerya', nationalityCode: 'NG', position: 'FW', era: 'Efsane' },
  { id: 'sergen-yalcin', name: 'Sergen Yalçın', nationality: 'Türkiye', nationalityCode: 'TR', position: 'MF', era: 'Efsane' },
  { id: 'didier-drogba', name: 'Didier Drogba', nationality: 'Fildişi Sahili', nationalityCode: 'CI', position: 'FW', era: 'Efsane' },
  { id: 'divock-origi', name: 'Divock Origi', nationality: 'Belçika', nationalityCode: 'BE', position: 'FW', era: 'Efsane' },
  { id: 'georginio-wijnaldum', name: 'Georginio Wijnaldum', nationality: 'Hollanda', nationalityCode: 'NL', position: 'MF', era: 'Efsane' },
  { id: 'diego-maradona', name: 'Diego Maradona', nationality: 'Arjantin', nationalityCode: 'AR', position: 'FW', era: 'Efsane' },
  { id: 'gary-lineker', name: 'Gary Lineker', nationality: 'İngiltere', nationalityCode: 'ENG', position: 'FW', era: 'Efsane' },
  { id: 'hakan-sukur', name: 'Hakan Şükür', nationality: 'Türkiye', nationalityCode: 'TR', position: 'FW', era: 'Efsane' },
  { id: 'gheorghe-hagi', name: 'Gheorghe Hagi', nationality: 'Romanya', nationalityCode: 'RO', position: 'MF', era: 'Efsane' },
  { id: 'ronaldinho', name: 'Ronaldinho', nationality: 'Brezilya', nationalityCode: 'BR', position: 'MF', era: 'Efsane' },
  { id: 'thierry-henry', name: 'Thierry Henry', nationality: 'Fransa', nationalityCode: 'FR', position: 'FW', era: 'Efsane' }
];

// İsim normalize etme (Türkçe karakterler, aksanlar ve küçük harf uyumu)
export function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
