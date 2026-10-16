# FUT Draft: pozisyon ve ilk 24 risk modeli

Model 3, oyuna özel bir dengeleme sistemidir. Gerçek maçlara göre eğitilmiş değildir. Kullanılan futbolcu özellikleri mevcut FC 27 overall, mevki, kulüp ve ülke alanlarıdır; bu alanlardan gerçek şut/pas/kalecilik istatistikleri uydurulmaz.

## Takım puanı

`overall ortalaması + elit bonusu + kulüp bonusu + milliyet bonusu − açıklık cezası`

| Etken | Model 3 |
| --- | --- |
| Overall | 11 futbolcunun aritmetik ortalaması |
| 85+ futbolcu | Her biri +0,15; yıldız kalitesinin iki kez aşırı sayılmasını azaltır |
| Kulüp kimyası | **Yalnızca kullanıcı kadrolarına** en fazla +2,6; bilgisayar kulüplerine **0** |
| Milliyet kimyası | Kullanıcı ve bilgisayar takımlarına en fazla +1,6 |
| Kadro açıklığı | `min(1; max(0,std−4)×0,16 + max(0,aralık−14)×0,015)` |

Önceki modelde kulüp/milliyet üst sınırları +2/+1,2, kadro açıklığı cezası −2,8 idi. Kimya güçlendirildi; genel açıklık cezası azaltıldı. Kimyada her futbolcu üç aynı kulüp/ülkeden takım arkadaşıyla tam bağ katkısına ulaşır. Eksik bilgiler birbirine bağlanmaz. Takım adı herhangi bir avantaj sağlamaz; kullanıcının istediği kulüp bonusu istisnası `human === true` ile uygulanır.

Zayıf halkanın bulunduğu mevkiyi ayırmak için bölge kalitesi `%86 bölge ortalaması + %14 bölgedeki en düşük overall` olarak hesaplanır. Kalecide tek futbolcu olduğu için doğrudan onun overall'ı kullanılır. Böylece aynı açıklıkta zayıf kaleci ve zayıf forvet farklı sonuçlar doğurur.

## Skor yerine maç akışı üretme

90 dakika 18 adet beş dakikalık aralığa ayrılır. Her aralıkta iki taraf, aralığın başlangıcındaki aynı skora göre taktik seçer. Ortak maç temposu 0,84–1,16 arasında iki rastgele çekilişin ortalamasıyla oluşur.

Her taraf için sırasıyla **atak → tehlikeli fırsat → şut → gol** çekilişi yapılır. Başarısız bir adım sonraki adımlara geçmez. Goller iki bağımsız toplam Poisson sayısı olarak çekilmez. Paylaşılan tempo, skor ve risk kararları iki tarafın pozisyonlarını birlikte etkiler.

Katsayılar `simulation-v3.js` içindeki `opportunityRates` fonksiyonunda açık tutulur:

- Atak olasılığı: 0,66 tabanı; orta saha farkı ×0,011; takım puanı farkı ×0,003; ev sahibi +0,035; kendi riskin ×0,065; rakip riski ×0,035; ortak tempo çarpanı. Sınır: 0,18–0,94.
- Tehlikeli fırsat: 0,56; forvet/rakip defans farkı ×0,013; kimya bonusu ×0,003; rakibin riski ×0,10. Sınır: 0,25–0,84.
- Şut: 0,86; orta saha/rakip defans farkı ×0,002; kendi riskin ×0,02. Sınır: 0,68–0,95.
- Gole dönüşme: 0,245; forvet/rakip kaleci farkı ×0,01; kimya bonusu ×0,002. Sınır: 0,10–0,43.

Final tarafsızdır; ev sahibi artışı uygulanmaz. Skor değiştikçe sonraki aralıkların kararları değişir. Arayüzdeki gol beklentisi, oynanan aralıkların model olasılıkları toplamıdır; gerçek futbol verisinden ölçülmüş xG değildir. Atak/fırsat/şut, gol dakikaları ve risk gerekçeleri maç kartında incelenebilir.

## İlk 24 için risk

Her haftanın maçlarından **önce tek bir puan tablosu görüntüsü** alınır. On sekiz maçın tamamı bu görüntüyü kullanır; maçların kodda işlenme sırası sonraki takımlara bilgi avantajı sağlamaz. Aynı anda oynanan başka maçların canlı skorları taktik hesabına dahil değildir.

- İlk üç hafta tamamlanana kadar ilk 24 kaynaklı ek risk yoktur.
- Kalan hafta `8 − oynanan hafta`, eşik mevcut 24. takımın puanıdır.
- Takımı puanla yakalayabilecek rakip sayısı 24'ten azsa ilk 24 garantidir; eleme çizgisi kaynaklı risk 0'dır.
- Mevcut puan + kalan maçların tamamını kazanarak alınabilecek puan mevcut eşikten düşükse ilk 24 matematiksel olarak erişilemez; bu hedef için risk 0'dır.
- Dışarıdaki ve yetişebilecek takımlar için risk, kalan süre azaldıkça ve puan farkı arttıkça yükselir. Son maçta beraberliğin mevcut eşiğe yetiştirmediği durumda galibiyet ihtiyacı ayrıca işaretlenir.
- İçeride ama çizgiye üç puandan yakın takımlar sınırlı risk alır; rahat konumdakiler pozisyonunu korur.
- 60. dakikadan sonra geride kalan takım riski yükseltir. Galibiyete ihtiyaç duyarken berabere olan takım da baskıyı artırır. Öne geçen takım riski azaltır.
- Risk 0–0,95 arasında kalır. Kendi hücum ihtimalini artırırken rakibin atak ve tehlikeli fırsat ihtimalini de artırır; güç puanı veya gol garantisi vermez.

Bu kararlar gelecekteki puan durumunu bilen bir optimizasyon değil, mevcut tabloya dayanan sınırlı bir oyun taktiğidir. Puan eşitliğinde olası tüm sonuç kombinasyonlarını çözmez. Genel maç kazanma isteği, ilk 24'ü garantileyen/kaçıran takımın geriye düşünce de risk alabilmesini sağlar.

Çift maçlı elemenin rövanşında önceki maçın skoru taktik hesabına eklenir. Uzatmalar da altı beş dakikalık pozisyon aralığıyla oynanır; toplam skor, şutlar, goller ve zaman çizgisi birleştirilir. Penaltı atışları ayrı tutulur, maç golü olarak sayılmaz.

## İlk 11 kimya çizgileri

Yeşil düz çizgi ortak kulübü, mavi kesikli çizgi ortak milliyeti, kalın altın çizgi iki bağı birlikte gösterir. Her grubun bütün üyeleri en kısa bağlantıları seçen bir ağaçla bağlanır; on bir futbolcu arasında 55 üst üste çizgi çizilmez. Açılabilir metin listesinde **tüm doğrudan bağlar** bulunur. Bilgisayar kulüpleri kulüp bonusu almadığı için bu takımlarda kulüp çizgileri de çizilmez; milliyet bağlantıları gösterilir.

## Seviye olasılıkları ve kayıtlar

Yeni varsayılanlar: **%20 / %40 / %25 / %10 / %5**. Eski varsayılan olasılıklarla devam eden draft kaydı yeni dağılıma geçirilir; açılmış kutudaki futbolcular değiştirilmez. Kullanıcının başka bir özel dağılımı korunur.

Yeni turnuvalar `simulationVersion: 3` kullanır. Henüz maç oynanmamış eski turnuva yükseltilir. Oynanmış maçları olan sürüm 1/2 turnuvaları, geçmiş sonuçları ve hesap tutarlılığını korumak için kendi modelleriyle tamamlanır; arayüzde eski sürüm olduğu belirtilir. Yeni kulüp kimyası politikası model 3 içindir. Yeni modeli denemek için yeni turnuva kurulmalıdır.

## Denge deneyi

Komut: `node scripts/calibrate-draft-v3.mjs --write`. Ayrıntılı sonuçlar `research/fut-draft-balance-v3.json` dosyasındadır. Her sürüm için 20.000 tarafsız PSG–Man Utd karşılaşması; ayrıca bir tohumla oluşturulmuş, kutudan en yüksek overall'ı seçen üç sabit kullanıcı kadrosuyla **200 tam turnuva / 37.800 maç** çalıştırılır. Bu turnuva deneyinde çalmalar atlanır; fikstür ve maç tohumları değişir. Sonuçlar tüm oyuncu stratejilerine genellenmez.

- Turnuvalarda maç başına ortalama gol: **2,99** (uzatmalar dahil).
- En sık skorlar: **1–1, 2–1, 1–2**.
- 8+ puan güç farkı olan 1.833 maçta güçlü taraf 1.409, zayıf taraf 163 kez kazandı; 261 beraberlik oldu. Mevki farkı, ev sahibi ve risk sonucu etkilediği için puan farkı tek başına sonucu belirlemez.
- 200 turnuvada 51 Real Madrid, 29 PSG, 27 Barcelona şampiyonluğu; toplam 26 kullanıcı şampiyonluğu; Man Utd 1 kez kazandı. Sürprizlere kulüp bazında yasak konmaz.

Bu rakamlar oyunun sabit veri ve senaryolarındaki deneme sonuçlarıdır, gerçek maç/kupa olasılıkları değildir. Şampiyonluğu belirli bir kulübe vermek için sonuç seçilmez veya yeniden çekilmez.
