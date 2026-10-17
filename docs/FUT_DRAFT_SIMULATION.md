# FUT Draft: maç modeli 2 ve oyun akışı

Bu bir oyun dengeleme modelidir; gerçek futbol maçlarına göre eğitilmiş bir tahmin sistemi veya EA/UEFA simülasyonu değildir. Takım adına veya kullanıcı/bilgisayar olmasına bağlı ayrıcalık yoktur. Aynı kadro, adından bağımsız olarak aynı güç ve skor dağılımını alır.

## Önceki modelde skor nasıl çıkıyordu?

Hücum = %70 forvet + %30 orta saha; savunma = %65 defans + %35 kaleci. Beklenen gol `1,25 × exp((hücum − rakip savunma) × 0,055)` idi. Ev sahibine ×1,14 uygulanıyordu. İki takımın golleri ayrı Poisson çekilişleriyle belirleniyordu. Yıldız sayısı, kimya ve kadro açıklığı kullanılmıyordu. Güç farkı sınırlı kaldığından orta güçlü takımlar güçlüleri fazla sık yenebiliyordu.

## Yeni takım puanı

`Takım puanı = overall ortalaması + elit bonusu + kulüp bonusu + milliyet bonusu − dengesizlik cezası`

| Etken | Kural | Neden |
| --- | --- | --- |
| Overall ortalaması | 11 overall'ın aritmetik ortalaması | Temel belirleyici; kimya kötü kadroyu elit yapmamalı |
| Elit bonusu | 85+ her futbolcuya +0,30; en fazla +3,30 | Draft'ta 1. seviye sayısı ayrıca değer taşısın |
| Kulüp kimyası | Futbolcu başına aynı `clubId` sahibi 0/1/2/3+ takım arkadaşına 0/⅓/⅔/1 bağ puanı; 11 kişilik bağ ortalaması ×2 | Küçük kulüp kümeleri katkı sağlasın, tam kulüp avantajı sınırlı kalsın |
| Milliyet kimyası | Aynı yöntem, ülke alanıyla; ortalama ×1,20 | Milliyet kümeleri ikincil katkı sağlasın |
| Kadro dengesizliği | `min(2,8; max(0,standart sapma−3)×0,38 + max(0,aralık−10)×0,04)` | Birkaç yıldızın arkasındaki çok zayıf futbolcuları görünür kılsın |

`aralık = en yüksek overall − en düşük overall`. Eksik kulüp/ülke bilgisi kimya oluşturmaz. Kulüp kimyası sadece aynı kulübü, milliyet kimyası sadece aynı ülkeyi kullanır; mevcut veriler değiştirilmez. Gerçek kulüp kadroları da aynı kimya formülünden geçer. Kullanıcılar aynı kulüpten futbolcular seçerek aynı avantaja ulaşabilir.

## Güçten skora geçiş

Mevki eşleşmesi takım puanından ayrı bir bileşendir:

- Hücum: `%65 forvet + %35 orta saha`.
- Savunma: `%65 defans + %35 kaleci`.
- Ev gol beklentisi: `1,32 × exp(0,09 × takım puanı farkı + 0,025 × hücum/savunma farkı) × 1,10`.
- Deplasman beklentisi: ters takım puanı farkı ve kendi hücum/rakip savunma eşleşmesi; ev avantajı uygulanmaz.
- Finalde iki tarafa da ev avantajı yoktur. Beklentiler 0,12–5,20 arasında sınırlandırılır.
- Goller bu beklentilerden Poisson dağılımıyla çekilir. Tek bir güçlü takım galibiyeti garanti edilmez; güç farkı arttıkça zayıf tarafın kazanma sıklığı azalır.
- Eşit elemede 30 dakikalık uzatmanın gol beklentisi normal maçın üçte biridir. Eşitlik sürerse penaltılar kullanılır. Deplasman golü avantajı yoktur.

Takım puanının yanında mevki eşleşmesi kullanıldığı için aynı ortalamalı iki farklı 11 aynı skor dağılımını almak zorunda değildir. Örneğin zayıf kaleci karşı takımın gol beklentisini ayrıca etkiler. Sonucun rastgeleliği için tek bir kayıtlı RNG akışı kullanılır; yeniden yükleme oynanmış maçları yeniden çekmez.

## Doğrulama ve dengeleme

`node scripts/calibrate-draft.mjs --write` mevcut FC 27 görüntüsündeki Paris SG ve Man Utd kadrolarını tarafsız sahada her model için 20.000 kez karşılaştırır. Sabit tohumla tekrar üretilebilir. Ayrıntılı çıktı `research/fut-draft-balance-v2.json` dosyasındadır.

| Tarafsız saha denemesi | Önceki model | Model 2 |
| --- | --- | --- |
| Paris SG galibiyeti | %54,62 | %83,68 |
| Beraberlik | %22,71 | %11,08 |
| Man Utd galibiyeti | %22,68 | %5,25 |

Bunlar bu oyunun iki sabit kadro için deneme sonuçlarıdır; gerçek maç veya kupa kazanma olasılığı değildir. Kulübe özel yasak yoktur. Eşit kadrolar ve güçlü/zayıf kadro sıralaması, ev/tarafsız saha, tüm puan bileşenleri, model adından bağımsızlık ve skorların geçerliliği test edilir.

## Kayıt uyumluluğu

Yeni kurulan turnuvalar `simulationVersion: 2` kullanır. Eski turnuvada maç oynanmamışsa model 2'ye geçilir; oynanmışsa eski modelle tamamlanır ve arayüzde belirtilir. Eski skorlar değiştirilmez. Mevcut kayıt anahtarı korunur. Rengi olmayan eski kayıtlara farklı varsayılan renkler atanır; kullanıcı sekiz renk arasından değiştirebilir.

## İstenen arayüz düzeltmeleri

- Draft kutusu açma ve futbolcu seçme sonrasında yukarı kaydırma kaldırıldı. Draft bölümü ve ana alanın yüksekliği korunarak içerik değişimindeki kaydırma sıkışması azaltıldı.
- Kutudaki üç kart 100, 340 ve 580 ms'de sırayla açılır; son dönüş tamamlandığında, 880 ms'de seçim etkinleşir. Gizli karta klavye ile erken seçim yapılamaz. Hareket azaltma tercihinde dönüş animasyonu uygulanmaz. Eski zamanlayıcılar yeniden başlatma sırasında iptal edilir.
- İlk çalma turu `koltuk + 1`, ikinci tur `koltuk + 2` hedefini kullanır. 3, 4 ve 5 katılımcıda iki farklı rakip ve tek bir gelen saldırgan vardır. Başlamış ve seçim kilitlenmiş eski turda hedefler değiştirilmez; sonraki tura yeni kural uygulanır.
- Gizli seçim sırasında bütün katılımcı kadroları görünür. Kendi koruma kadron, çalma hedefin ve senden çalacak rakip ayrı işaretlenir; başkalarının koruma/hedef seçimi gösterilmez.
- Her katılımcı sekiz renkten benzersiz bir renk seçer. Renkler kadrolarda, katılımcı maçlarında ve puan tablosunda izlenebilir; oyun içinden değiştirilebilir.
- Katılımcı maçları ayrı bir alanda büyük skor, takım renkleri, güç puanları ve model gol beklentileriyle gösterilir. Normal maçlar alt bölümde kalır. Kadrolar görünümü puan katkılarını açıklar.
