# FUT Draft maç modeli 5

Model 5, güç puanının lig sırası ve skorlar üzerindeki etkisini artıran bir oyun modelidir. Gerçek maçlar üzerinde eğitilmiş bir tahmin sistemi değildir. Model 1–4 ile maçı başlamış kayıtlar o sürümle sürer; maç yapılmamış kayıtlar 5'e yükseltilir. Yeni model ve tüm eleme ödülleri için yeni turnuva başlatılır. Eski gol olaylarına golcü ismi uydurulmaz.

## Güç ve gol beklentisi

Model 4'ün doğrulanmış FC27 özellikleri ve 2026/27 UEFA kulüp havuzu korunur. Veri kaynakları, kimya formülü ve özellik bileşenleri [model 4 belgesinde](FUT_DRAFT_SIMULATION_V4.md). Kullanıcı kulüp/milliyet bonusları +4/+2,5; bilgisayar kulübü kulüp bonusu sıfır, milliyet en fazla +1,6; kadro açıklığı cezası en fazla −1.

`simulation-v5.js` içindeki açık ağırlıklar: **%80 takım puanı + %20 ilgili hat/özellik**. Pas, hücum, defans ve kaleci sinyalleri bu karışımla oluşturulur. Önceki eşleşme katsayılarına ek olarak atak girişinde exp(±güç farkı ×0,035) uygulanır. Bu oran galibiyet olasılığı veya skorun istatistiksel varyansının %80'i anlamına gelmez. Takım puanı ağırlıklı bir maç girdisidir. Tempo, baskı/kontra, hız, kondisyon, iç saha ve ilk 24/toplam skor riski korunur. Rastgele ortak tempo çarpanı kaldırılır.

Her dakika iki taraf aynı dakika başı skorunu görür. Giriş × tehlike × şut × isabet × dönüşüm ihtimali gol beklentisine eklenir. Tasarım sınırı takım başına 90 dakikada en fazla 4,2 model gol beklentisidir; kuvvetli tarafın beklentisi sınırsız büyümez. Model gol beklentisi kaleci etkisini içerir; profesyonel şut bazlı xG ile birebir aynı metrik değildir.

Önceki bağımsız gol çekilişleri kaldırıldı. Her taraf bir kez üçgensel **0,65–1,35 bitiricilik formu** ve **0–1 başlangıç eşiği** çeker. Dakika başına beklenti × form gol bütçesine eklenir. Bütçe eşiğe ulaştığında gol olur, sonraki eşik bir artırılır. Böylece goller bütçenin rastgele yuvarlanmasına bağlanır; 90 dakikalık skor 0,65×beklenti−1 ile 1,35×beklenti+1 arasında kalır. Bu, modelin bilinçli biçimde azaltılmış skor varyansıdır; gerçek futbolun bütün sürprizlerini taklit etmez. Birbirine yakın beklentiler artık kolayca 4–0 olmaz. Sıralama kesin olarak güce göre dizilmez; sekiz maçlık fikstür, saha avantajı, yakın güçler ve beraberlikler hâlâ fark yaratabilir.

Gol olduğunda atak/fırsat/şut/isabet/gol sayaçları birlikte artar. Diğer fırsatlar gol dışı şut ve kurtarışları üretir. Bu istatistikler bütçeden çıkan skorla tutarlıdır; golü bağımsız şut çekilişi belirliyormuş gibi yorumlanmamalıdır. İsabetli şut = gol + rakip kurtarışı. Uzatmada aynı maç planlarıyla, 90'dan devam eden kondisyon ve ayrı 30 dakikalık bitiricilik bütçesi kullanılır; sayaçlar ve beklentiler birleşir. Eski sürümler değişmez.

## Golcüler

Her gol olayına o andaki XI'den `playerId` ve `playerName` yazılır. Seçim ağırlığı mevkide ATT 6, MID 2, DEF 0,45, GK 0,005 × (bitiricilik %65 + pozisyon alma %35). İsim veya kimlik uydurulmaz; oyuncu özellikleri yoksa mevcut overall model yedeğidir. Yeni gol listeleri dakika + futbolcu adı gösterir; eski kayıtlar takım adıyla kalır. Bu dağılım bireysel gerçek gol tahmini değildir. Penaltı serisi v4 yöntemini korur; seri vuruşları normal gol olaylarına eklenmez.

## Eleme yükseltmesi

- Son 16: %50 seviye 1, %50 seviye 2.
- Çeyrek final: %50 seviye 2, %50 seviye 3.
- Yarı final: %50 seviye 1, %50 seviye 2.

Yalnızca o aşamaya kalan kullanıcılar birinci ayak öncesinde bir kez hak kazanır. Finalde ve ikinci ayaklarda yeni ödül yoktur. Yükseltmeler sırayla yapılır; önceki kişinin açık kutusu bitmeden başka kullanıcı kutu açamaz. Böylece aynı kart iki açık seçimde rezerve edilmez. Oyuncu seçilip kutu açıldıktan sonra seviye ve üç kart kaydedilir; yenilemeyle tekrar çekilemez. Mevcut 880 ms sıralı açılma ve seçim kilidi kullanılır.

Her iki olası seviyede de aynı ana mevkiden, daha yüksek overall'lı en az üç boş kart sunulabilen futbolcular seçilebilir. Katılımcılarda bulunan kartlar çıkmaz. Bir kart seçilince eski futbolcunun yerine geçer; hem kullanıcı kadrosu hem turnuva kadrosu güncellenir. Overall/hattın ortalaması ve kimya yeniden hesaplanır. Daha yüksek overall, değişen kimya nedeniyle takım puanının mutlaka artacağını garanti etmez; kullanıcı üç seçenekten kimyasına uygun olanı seçer. Tüm kadro ödül seviyesinin üstündeyse düşürme yapılmaz. Pas geçmek hakkı tüketir, yeniden çekiliş sağlamaz. Ödüller tamamlanmadan maç planı kilitlenmez ve maçlar ilerlemez.

## Ölçüm

`node scripts/calibrate-draft-v5.mjs --write`: 3 eşleşme × 10.000 maç × model 4/5 = 60.000 tarafsız maç. Ardından aynı fikstür tohumu kümesiyle her modelde 100 tam turnuva (toplam 37.800 maç). Sonuçlar `research/fut-draft-balance-v5.json` içindedir. Üç kullanıcı aynı sabit draftı kullanır; çalma atlanır. V5 ödüllerinde en düşük uygun futbolcu seçilip kutudaki en yüksek overall alınır. İnsan maç planları normal/dengelidir. Lig güç sırası ödüllerden önce dondurulur.

Bu örneklemde ligdeki ortalama mutlak güç/sıra farkı **4,23 → 1,96**, Spearman sıra korelasyonu **0,858 → 0,967**. Eşit güçte üç ve üstü skor farkı **%12,27 → %0**; gol-beklenti ortalama mutlak farkı **0,93 → 0,44**. 2,4 puanlık sentetik güç farkında güçlü taraf galibiyeti **%53,35 → %79,67**. Bunlar sabit deneyin oyun dengesi ölçümleridir; gerçek dünya oranı veya her kadro için garanti değildir. Yeni model özellikle belirgin güç farklarında çok daha belirleyicidir.

Testler: model ağırlığı ve bütçe sınırları, gerçek XI golcüsü, şut/kurtarış eşitliği, ödül seviyeleri/adil yazı tura, aynı mevki ve kesin overall artışı, tekrar kullanma engeli, kadro tekilliği, açık kutunun kaydı, eski sürüm uyumluluğu, tam kupa ve DOM olay akışı. DOM testleri görsel tarayıcı testi değildir.
