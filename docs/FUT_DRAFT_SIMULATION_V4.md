# FUT Draft maç modeli 4

Bu bir oyun dengesi modelidir; gerçek maçlara eğitilmiş veya gerçek sonuçlar üzerinde doğruluğu ölçülmüş bir tahmin sistemi değildir. Model 1–3 ile maçı başlamış kayıtlar aynı sürümle tamamlanır. Yeni turnuvalar model 4 kullanır. Başlamamış kayıtlar model 4'e yükselir; mevcut fikstür/kulüp listesi korunur.

## Kulüpler ve veri

17 Ekim 2026'da [UEFA'nın 2026/27 katılımcı listesi](https://www.uefa.com/uefachampionsleague/news/02a8-2171a88881a0-c70193b972c6-1000--meet-the-2026-27-champions-league-league-phase-teams/) doğrulandı. Yalnızca bu 36 takım arasından EA kadrosu doğrulanmış 34 takım kullanılabilir. Sabah ve Slovan Bratislava için doğrulanmış FC27 kulüp kimliği bulunmadığından kadro uydurulmadı. 3–5 kullanıcıya kalan 31–33 yer, bu havuzun en yüksek XI ortalamalarıyla doldurulur. Havuzda yalnızca beş İngiliz katılımcı vardır.

XI seçimi gerçek birincil/alternatif mevkiler üzerinden en yüksek toplam overall sağlayan 4-3-3'tür. Oyuncu tekrar etmez. Eksik hatları tamamlamak için beş kulübün tam EA kadroları ayrıca alındı; gerektiğinde 70 altı futbolcular rakip XI'lerinde kullanılabilir. Kullanıcı draft havuzu değişmedi. `scripts/prepare-draft-season.mjs` yerel kaynak görüntülerinden season-data.js ve player-attributes.js üretir. Kaynak adresleri, SHA256 değerleri ve alan listesi `research/fut-draft-season.json` içindedir; temel sayfaların manifesti `research/fut-draft-data.json` içindedir. Lisans bilgisi THIRD_PARTY_NOTICES.md içindedir.

4.934 oyuncu kimliğine ait 17 gerçek EA özelliği ayrı dosyada tutulur; mevcut oyuncu/kayıt nesnelerinin şeması değişmez. Sahada kullanılan role ait özellikler tüm gerçek draft ve sezon futbolcularında testle doğrulanır. Eksik alan varsa overall yedeği kullanılır; bu, gerçek özellik olarak kaydedilmez. Alternatif mevkiler oyuncunun EA lisanslı alanından gelir, isimden tahmin edilmez.

## Takım gücü

Overall ortalaması + her 85+ futbolcu için 0,15 + kulüp kimyası + milliyet kimyası − kadro açıklığı cezası.

Her oyuncunun aynı kulüp/milliyetten en fazla üç takım arkadaşı kimyaya katkı yapar. Bireysel oranların ortalaması 0–1 kimya oranıdır. Kullanıcı kulüp kimyası en fazla +4 (önce +2,6); kullanıcı milliyet en fazla +2,5 (önce +1,6). Rakip kulüp bonusu **0**, rakip milliyet en fazla +1,6. Kadro açıklığı önceki azaltılmış katsayıları korur: standart sapmanın 4'ü aşan kısmı ×0,16 + aralığın 14'ü aşan kısmı ×0,015, toplam en fazla −1. Zayıf futbolcu kendi hattında da etkili olur; hat kalitesi %86 ortalama + %14 en düşük overall.

## Eklenen maç bileşenleri

- Orta saha pası: kısa pas %45, vizyon %30, top kontrolü %25.
- Forvet bitiriciliği: bitiricilik %50, pozisyon alma %20, soğukkanlılık %15, şut gücü %15.
- Defans: savunma farkındalığı %40, top kesme %30, ayakta müdahale %30.
- Kaleci: refleks %35, pozisyon %25, top tutma %25, atlama %15.
- Sprint hızı kontra eşleşmesini; saha oyuncularının kondisyonu maç içi yorgunluğu; ilk beş penaltıcının penaltı özellikleri ve rakip kaleci penaltı serisini etkiler.

Bu özellikler takım puanına tekrar bonus olarak eklenmez. Pas/defans/bitiricilik, ilgili hat overall'ıyla %35/%65; kaleci %45/%55 karıştırılır. Yorgunluk dakika ilerledikçe pas, hücum ve savunma sinyallerini azaltır; kaleciye uygulanmaz, yeni maçta sıfırlanır. Sezon boyunca biriken yorgunluk, sakatlık, kırmızı kart ve oyuncu değişikliği henüz modellenmez.

## Dakika bazlı fırsatlar ve gol beklentisi

90 adet ortak skor anlık görüntüsü kullanılır. Her iki takım aynı dakika başındaki skora tepki verir; döngüde önce işlenen takım avantajlı karar vermez. Zincir: atak → tehlikeli fırsat → şut → isabetli şut → gol veya rakip kurtarışı. Her adım koşullu rastgele çekiliştir. Model gol beklentisi bu koşullu ihtimallerin çarpımlarının dakika boyunca toplamıdır; sonradan skora eklenen bir bonus değildir. Kaleci dahil olduğu için gerçek maçların standart şut bazlı xG metriğiyle birebir karşılaştırılmamalıdır.

Güç farkı atak girişinde ×0,012, tehlikede ×0,006 ve gol dönüşümünde ×0,004 ile etkilidir (önce yalnızca girişte ×0,003). Hat eşleşmeleri ayrıca değerlendirilir. Ev sahibi avantajı yalnızca tarafsız olmayan maçta uygulanır. Ortak rastgele ortam çarpanı 0,965–1,035'tir (önce 0,84–1,16); seçilmiş tempo çarpanı bundan ayrıdır. Skorlar sonradan düzeltilmez; güçlü kulübe garantili galibiyet veya kulüp adına bağlı katsayı yoktur.

İlk 24 riski, kalan hafta ve matematiksel yetişme ihtimali her maç günü başlamadan tabloda dondurulur. Geride olan takımlar son 30 dakikada açılır. Son hafta beraberliğin yetmediği takım daha fazla risk alır. Risk hücum fırsatını artırırken rakibin tehlikeli fırsat ihtimalini de artırır. Elemelerde toplam skor dikkate alınır. Uzatmada aynı planlar ve 90'dan devam eden yorgunlukla 30 dakika daha oynanır. Penaltı dönüşümü oyuncu/kaleci farkına göre %58–90 arasında sınırlanır; eski sürümlerdeki %76 korunur.

## Çeyrek finalden itibaren maç planı

Her iki ayak ve final öncesinde hayatta kalan katılımcılar planını kilitler. Üç tempo: düşük (atak hacmi ×0,90, efor ×0,75), normal (1/1), yüksek (×1,11/×1,30). Üç tarz: dengeli, önde baskı, kontra atak. Baskı daha çok giriş/şut ve daha çok yorgunluk sağlar, rakibe boşluk verir. Kontra atak sayısını azaltır; baskılı/riskli rakip ve hız üstünlüğü karşısında fırsat kalitesini artırır. Düşük tempo beraberliğe, yüksek tempo varyansa yöneltir; hiçbiri galibiyet garantilemez.

Tüm gerekli kullanıcı planları kilitlenmeden maç günü ilerlemez. Seçimler kayda yazılır; kilitlenince arayüzde açıklanmaz ve maç sonunda görünür. Aynı cihazdaki seçim gizliliği ekran kullanımına dayanır; localStorage güvenli bir sır saklama mekanizması değildir. Bot seçimi yalnızca iki takımın maç öncesi güç/kondisyonuna dayanır, kullanıcı planını okumaz. Botlar da çeyrek final öncesi normal/dengeli kullanır. Her yeni maçta kullanıcı yeniden seçer.

## Doğrulama ve sınırlar

`npm run check`: eski model uyumluluğu, tüm veri özellikleri, sezon havuzu, 3–5 kullanıcı akışı, kimya, dakika olayları, isabet=gol+rakip kurtarışı, uzatma ve maç planı kilitleri. UI testleri DOM sınırı kullanır; gerçek tarayıcı yerleşim testi değildir.

`node scripts/calibrate-draft-v4.mjs --write`: aynı yeni kadrolarla model 3/4 için 20.000'er tarafsız Paris–Man United maçı, ardından 200 tam model 4 turnuvası. Üç sabit kullanıcı draftı (kutuda en yüksek overall, çalma atlanır), değişen fikstür/maç tohumları, kullanıcı elemelerinde normal/dengeli seçim. Toplam 37.800 maç; skorlar uzatmayı içerir. Tüm ölçümler `research/fut-draft-balance-v4.json` içindedir. Bunlar deney sonuçlarıdır; gerçek dünya olasılıkları değildir. Eski raporlar kendi kulüp havuzu/model sürümüyle yeniden üretilebilir.
