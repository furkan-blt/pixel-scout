# FUT Draft kontrol ve yükseltme düzeltmeleri

Bu güncelleme maç modeli 6'nın skor motorunu değiştirmez. Mevcut kayıtlardaki henüz kullanılmamış yükseltmelere ve sonraki maçların sunumuna uygulanır; yeni draft zorunlu değildir. Önceden açılmış kutular tekrar çekilmez, geçmiş skorlar değişmez.

## Yükseltmeler

Son 16, çeyrek final ve yarı finalin her birinde **%50 seviye 1 / %50 seviye 2**. 11 futbolcunun tamamı seçilebilir; eski 'iki seviyede de daha yüksek overall üç aday' filtresi kaldırılmıştır. Her kutu seçilen futbolcuyla aynı ana mevkiden üç farklı, diğer kullanıcıların kadrolarında bulunmayan gerçek kart sunar.

Seviye 2 kartlar 90+ bir futbolcudan daha düşük olabildiği için kesin overall artışı vaat edilmez. Kullanıcı istediği kartı alabilir veya **Mevcut futbolcumu koru** diyebilir. Korumak/pas geçmek o aşamanın hakkını tüketir, kutuyu yeniden açtırmaz. Kutu açılınca değişecek futbolcu kilitlenir. Önceki kalibrasyon raporlarını yeniden üretmek isteyen scriptler açıkça `upgradePolicy:1` kullanır; eksik politika alanı bulunan kullanıcı kayıtları yeni kurala tabidir.

## Tek tık hız kontrolü

Eski render her dakika `main.innerHTML` alanını baştan oluşturup hız düğmelerini de siliyordu. Pointer-down ile click arasında geçen bir dakika güncellemesi tıklamayı düşürebiliyordu. Canlı araç çubuğu artık aynı DOM düğümlerini korur. Yalnızca maç içeriği değiştirilir; saat, hız etiketi, progress ve düğme durumları doğrudan güncellenir.

Yavaşlat/hızlandır düğmelerine ek olarak 0,5×–8× sürgüsü vardır. `input` olayı hızı anında uygular; bırakmayı beklemez. Hız, aynı kayıtlı maç sonucu üzerinde çalışır ve yeni rastgele sayı çekmez. Duraklatma ve yenilemede duraklatılmış geri dönüş korunur.

## Direkt simülasyon

Maç öncesinde ve canlı araç çubuğunda **Direkt simüle et** bulunur. Kayıtlı sonucu yeniden üretmeden uygular. Bekleyen kullanıcı penaltısı varsa 120. dakikaya geçer ve penaltı odağını başlatır; seriyi atlamaz. Penaltı odağında direkt simülasyon ve hız kontrolleri devre dışıdır, duraklat/devam et kullanılabilir. Kullanıcı penaltısı yoksa diğer süreleri ve bilgisayar penaltılarını beklemeden tamamlar.

## Penaltı odağı

Kullanıcının serisi başladığında tüm maç listesi yerine tek büyük penaltı ekranı gösterilir. İki takım, yalnızca açıklanmış penaltı skoru, her vuruş için gol/kaçırma işaretleri ve son vuruş anonsu bulunur. Vuruşlar, normal maç hızı 8× olsa da **1.800 ms** aralıkla akar. Son vuruştan sonra kısa kutlama beklenir. Aynı maç gününde birden fazla kullanıcı serisi varsa sırayla odaklanılır; birbirlerinin sonucunu erkenden göstermezler.

Yeni hesaplanan eski model maçları da RNG sırasını değiştirmeden vuruş kayıtları tutar. Önceden kaydedilip vuruş ayrıntısı bulunmayan çok eski bir seriye uydurma vuruş eklenmez; yalnızca mevcut sonuç uygun anda açıklanabilir. Bekleyen eski canlı kayıtların süresi kullanıcı serilerinin toplamına göre uzatılır.

## Lig sonuçlarının açılması

Lig maçları aynı motorla bir kez hesaplanıp bekletilir. Her **650 ms** bir sonuç açılır; kullanıcı maçları önce gelir. Son açılan maç üstte, önceki açılanlar aşağıda görünür. Henüz açılmayan skor ve golcüler DOM'a eklenmez. Kalan sonuçlar direkt simülasyonla açılabilir. Tüm sonuçlar açılana kadar geçmiş ve puan tablosu maç gününü işlemez. Yenilemede kaç sonuç açıldığı korunur ve duraklatılmış geri dönülür. Maç motoru ve RNG, normal/direkt/yenileme hızlarından etkilenmez.

## Doğrulama

Testler; üç aşamada 11 yüksek kartın tamamının seçilmesi, düşük seviye 2 kartını seçme veya eski kartı koruma, lig sonuç sayacı/yenileme, aynı RNG ve sonuçların korunması, araç çubuğunun dakika değişimlerinde yeniden yazılmaması, tek tık/sürgü hızı, çoklu penaltı odağı ve 8× hızda bile 1,8 saniyelik vuruş aralığını kapsar. UI testleri DOM sınırı kullanır; gerçek tarayıcı yerleşim doğrulaması değildir.

Beş katılımcının 20 elit defans kartını kullandığı uç durumda havuzda yalnızca iki boş elit defans kalabilir. Üçüncü seçenek, seçilen mevcut kartı açıkça koruma seçeneğidir; başka bir kullanıcıdan kart kopyalanmaz. Bu durum da test edilir.
