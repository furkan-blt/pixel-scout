# Üçüncü taraf içerikler

Orijinal kod ve dokümantasyon MIT lisanslıdır. Bu izin aşağıdaki içerikleri otomatik olarak kapsamaz.

## Futbolcu portreleri

`dist/assets/portraits/` görsellerinin her biri kendi kaynak lisansına tabidir. 125 kullanılan portrenin hak sahibi, Commons kaynak sayfası, lisansı ve varsa lisans bağlantısı `dist/players.json` içindeki `players[].photo` alanında ve oyunun “Fotoğraf kaynakları” ekranında yer alır. Aday/inceleme kayıtları `research/portraits*.json` dosyalarındadır. Dağıtırken atıfları ve ilgili CC BY/CC BY-SA koşullarını koru. CSS yakın kadraj ve bulanıklaştırma, görsel sunumundaki değişikliklerdir; CC BY-SA uyarlamalarının kaynak lisansını koru.

Bir portredeki gömülü e-posta alanı, GitHub paylaşımı öncesinde metadata bloğundan kaldırılmıştır; JPEG görüntü verisi değiştirilmemiştir. Fotoğrafçı ve kaynak lisans atıfları oyuncu kayıtlarında korunur.

## Demo açılış bonusu

`dist/assets/bonus/demo-player.svg` bu proje için kodla çizilmiş kurgusal bir oyuncudur ve MIT lisanslıdır. Gerçek bir kişinin fotoğrafı veya kimliği değildir. Canlı sitenin kişisel açılış fotoğrafı bu GitHub paketine alınmamıştır.

## Yazı tipi

Silkscreen: Jason Kottke, SIL Open Font License 1.1. Tam lisans: `dist/assets/Silkscreen-OFL.txt`. Font dosyasıyla birlikte tut.

## Oyuncu verileri

`dist/players.json` ve `research/catalogue.json`, kaynak tarihi 15 Ekim 2026 olan 2026/27 kadro görünümüdür. Kaynak bağlantıları oyuncu kayıtları ve kapsam kayıtlarında korunur. ESPN/Wikipedia/Wikimedia içerikleri için üçüncü taraf hakları ve kaynak koşulları geçerlidir; bu repo bunlara MIT lisansı vermez. Bilgiler otomatik güncellenmez. Biyografik bilgilerin kaynağı ve bilinmeyen alanlar korunmalıdır.

## FUT Draft FC 27 verileri

`dist/games/fut-draft/players.json`, EA SPORTS'un [FC 27 herkese açık rating sayfalarından](https://www.ea.com/games/ea-sports-fc/ratings) 16 Ekim 2026 tarihinde derlenen 4.847 erkek futbolcuya ait isim, kulüp, ülke, mevki ve standart kart overall değerlerini içerir. İlk 60 sayfadaki 70+ oyuncular seçilmiştir; tüm veri tabanı olduğu iddia edilmez. Kaynak sayfalar, SHA-256 görüntü kayıtları ve oyuna özgü mevki gruplaması `research/fut-draft-data.json` içindedir. EA kart görselleri, logoları, portreleri veya sayfa kodu dağıtılmaz. Kart görünümü özgün HTML/CSS ile çizilir. Bu depo üçüncü taraf verilerine veya EA SPORTS/FIFA/UEFA markalarına MIT lisansı vermez; oyun bağımsızdır ve bu kuruluşlarla bağlantılı değildir.

## Oyun fikri ve uygulama

Who Are Ya oyununun gözlenen davranışı referans alınmış, uygulama bağımsız geliştirilmiştir. Orijinal oyunun kodu, markası veya görsel varlıkları dağıtılmaz. Kamuya açık davranış inceleme notları `research/reverse/behavior-notes.md` dosyasındadır.

FUT Draft model 4 additionally uses factual FC 27 player subattributes and verified primary/alternate positions from the same public EA ratings source. The current UEFA participant list and supplementary full-club sources are recorded in research/fut-draft-season.json. These third-party data are not relicensed under the code's MIT license.
