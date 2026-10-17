# FUT Draft sunum ve maç modeli 6

Güncel yükseltme/kontrol kuralları: [kontrol düzeltmeleri](FUT_DRAFT_CONTROLS.md). Aşağıdaki ilk sürüm sunum notlarının yerine, tüm aşamalarda 1/2 seviye kutusu, 11 futbolcu seçimi, sabit araç çubuğu, sıralı lig sonuçları ve penaltı odağı uygulanır.

Bu sürüm lig kurasını, eleme kurasını, dakika akışını ve sahadan yükseltme seçimini ekler. Model 1–5 ile maçı başlamış kayıtlar kendi sonucunu üretmeye devam eder. Maç yapılmamış kayıtlar 6'ya yükselir; bu durumda güç torbaları ve dengeli fikstür yeniden hazırlanır. Bitmiş skorlar değişmez. Yeni modelin tamamını görmek için yeni draft başlatılır.

## Güç torbaları ve kura

36 takım, kimya/elit/açıklık etkilerini içeren **takım puanı** ile sıralanır ve dokuzar takımlı dört torbaya ayrılır. Önceki sürümün overall sıralaması yalnızca eski modellerin yeniden üretiminde korunur. Takım puanları `initialPowers` içine dondurulur; sonraki yükseltmeler torbaları ve kura zorluğu değerlendirmesini değiştirmez.

Mevcut dengeli fikstür üreticisi her takım için sekiz farklı rakip, her torbadan iki rakip, dört iç saha ve dört deplasman sağlar. Rakipler birbirini karşılıklı oynar; sunum ekranında her katılımcı için bağımsız ve çelişen kura çekilmez. Önce tutarlı fikstür bir kez üretilir, sonra her katılımcının her torbadan iki rakibi **650 ms aralıklarla** sırayla açılır. Kontrol düğmeleri sonraki topu veya tüm topları açabilir. Ekranı yenilemek yeni rakip üretmez.

Fikstürler yan yana, yalnızca açılmış rakiplerin ortalama puanına göre en zordan kolaya görünür. Henüz rakibi açılmayan katılımcı sıralamanın sonunda bekler. Tamamlanınca sekiz rakibin ortalaması belirleyicidir. Küçük emoji işaretleri, torba, hafta ve iç/dış saha bilgileri eklenmiştir. Tüm fikstür karşılaştırması daha sonra **Kura & fikstür** sekmesinde de bulunur. Eski kayıtlarda dondurulmuş puan bulunmadığında mevcut kadro puanı kullanılır.

Play-off, son 16, çeyrek, yarı final ve final eşleşmeleri, her iki takım için ayrı top halinde **1.100 ms** aralıklarla açılır. Henüz açılmayan takımın adı ekrana basılmaz. Tüm eşleşmeler görüldükten sonra kullanıcı maç merkezine geçer. Kura ilerlemesi ve eşleşmeler kaydedilir; sunum maç RNG'sini tüketmez. Yeni elemelerde yükseltme ve maç planı seçimleri kura sunumundan sonra görünür.

## Dakika akışı ve kayıt güvenliği

Alttaki simülasyon motoru zaten dakika bazlıdır. Maç günü aynı tohumla bir kez hesaplanır ve `tournament.live.result` içinde bekletilir. Henüz asıl geçmişe, eleme ağacına veya şampiyon alanına uygulanmaz. Bu, istemcide saklanan oyun verisidir; geliştirici araçlarından gizli veya sunucuda güvenli bir sır değildir.

Her maç için kompakt dakika kareleri dakika, skor, biriken beklenti ve şut/kurtarış sayaçlarını tutar. Gösterim yalnızca izlenen dakikanın karesini ve geçmiş gol olaylarını okur. Gelecek golcüler, uzatma golleri, penaltı vuruşları, tur atlayanlar ve şampiyon arayüze erkenden sızmaz. Tüm maçlar ortak saatle ilerler. 90'da biten maçlar beklerken uzatmaya gidenler 120'ye devam eder. Penaltılar vuruş vuruş açılır.

Normal hızda bir dakika **200 ms** sürer. Kontroller 0,5× / 1× / 2× / 4× / 8× ve duraklat/devam ettir seçenekleridir. Hız sonucu veya RNG'yi değiştirmez. Yenilemede bekleyen sonuç ve izlenen dakika korunur, oyun duraklatılmış açılır. Maç günü bitmeden tekrar simülasyon veya kadro değişimi yapılamaz. Süre tamamlanınca bekleyen sonuç bir kez uygulanır. Lig maçları hafta başına anında sonuçlanır; uzatılmış dakika kareleri lig geçmişinde veya tamamlanan canlı geçmişte saklanmayarak kayıt boyutu sınırlanır.

Dakika geçişleri yalnızca canlı durum kabını kopyalar; değişmeyen büyük turnuva sonucunu her karede derin kopyalamaz. Sonuç uygulanırken kopyalanır; önceki durum nesnesi değişmez. Uzatma karelerine normal sürenin skor ve sayaçları eklenir; 91'de skor sıfırlanmaz. V1/V2 kayıtlarında dakika olayları olmadığından eski goller ancak maç bitince gösterilebilir; isim/dakika uydurulmaz. V3–V5'te gol zamanları kullanılabilir, ayrıntılı şut kareleri bulunmaz.

## Yakın güçte kimya, yıldızlar ve beraberlik dağılımı

Model 5'in %80 puan / %20 özellik temeli, sınırlı gol bütçesi, ±%35 bitiricilik formu, iç saha/tempo/kondisyon ve ilk 24 riski korunur. Rakip bilgisayar kulüpleri kulüp kimyası bonusu almaz.

Yakınlık = max(0, 1 − |puan farkı| / 3). Yakın maç ek kalitesi:

`0,5 × (kulüp bonusu + milliyet bonusu) + 0,35 × (en yüksek üç overall ortalaması − kadro ortalaması) + 0,1 × (en yüksek overall − kadro ortalaması)`.

İki takımın ek kalite farkı × yakınlık ×0,09, atak girişindeki exp katsayısına zıt yönlerde eklenir. Böylece aynı takım puanında farklı kimya ve yıldız dağılımı gerçekten farklı gol beklentisi yaratır. Üç ve üzeri puan farkında bu ek katkı yoktur. Temel puandaki kimya zaten korunur; yakın maçta bilinçli ilave etki vardır.

Model 5'in birbirinden bağımsız başlangıç yuvarlama eşikleri yakın maçlarda fazla aynı skora yığılıyordu. Model 6'da yakınlık olasılığıyla iki taraf `u` ve `1−u` eşiklerini kullanır. Her tarafın kendi eşik dağılımı hâlâ uniformdur; gol veya kazanan zorla değiştirilmez, beraberlik görünce yeniden simülasyon yapılmaz. Bu negatif bağımlılık eşit güçte aynı skora yuvarlanmayı azaltır. Beraberlik tamamen kaldırılmaz; aynı kadrolarda üstün kimya/yıldız farkı icat edilmez.

## Yükseltme ekranı

Dropdown yerine, 4-3-3 sahasında on bir futbolcu da görünür. Her iki ödül seviyesinde daha yüksek üç seçenek sunulabilen futbolcular tıklanabilir; diğerleri soluktur ve devre dışıdır. Seçilen kart vurgulanır. Kutu açılırken ve üç kart arasından karar verilirken tüm mevcut kadro sahada kalır. Açık kutu boyunca değişecek futbolcu kilitlidir. Kartlar 880 ms mevcut sıralı animasyonla açılır. Son 16/çeyrek/yarı final ödül oranları ve tekrar kullanma engeli değişmez.

## Doğrulama

`npm run check`: torbaların tam güç sırası, 3/4/5 katılımcıda iki rakip/torba ve karşılıklı fikstür dengesi; kura ilerlemesi ve açılmamış takım gizleme; dakika/sonuç kayıtları; duraklama, hız, yenileme ve RNG eşitliği; uzatma/penaltı kareleri; kimya/yıldız etkisi; beraberlik dağılımı; tam kupa ve DOM olay akışı. DOM testleri gerçek tarayıcı yerleşim testi değildir. Hareket azaltma tercihi CSS animasyonlarında desteklenir.

`node scripts/calibrate-draft-v6.mjs --write`: model 5 ve 6 için aynı üç eşleşmede 10.000'er maç (60.000 maç); ayrıca aynı draft ve fikstür tohumlarıyla model başına 30 tam kupa. Kura sunumu RNG harcamadan tamamlanır. Ödüllerde en düşük uygun futbolcu değiştirilir, kutudan en yüksek overall alınır; kullanıcı planı normal/dengelidir. Rapor: `research/fut-draft-balance-v6.json`. Sonuçlar oyun dengesi ölçümüdür, gerçek maç tahmin doğruluğu değildir.

Geniş sabit eşit-güç deneyinde beraberlik oranı %56,74 → %38,30; üç ve üzeri fark %0 → %0; gol ortalaması 2,6425 → 2,6349 oldu. 30'ar kupada güç/sıra korelasyonu yaklaşık 0,969 → 0,963 kaldı. Güç etkisi korunurken yakın maçların dağılımı çeşitlendi. Bu değerler rapordaki örnekleme aittir.
