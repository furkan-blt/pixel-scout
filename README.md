# Pixel Scout

[⚽ Canlı Oyun: Golcüyü Tahmin Et](https://yasirertan.github.io/pixel-scout/games/golcuyu-tahmin-et/) · [🎮 Tüm Oyunlar](https://yasirertan.github.io/pixel-scout/games/) · [Katkı rehberi](CONTRIBUTING.md) · [Mini oyun ekleme](docs/ADDING_GAMES.md) · [Ajan yönergeleri](AGENTS.md)

Codex, Antigravity veya herhangi bir editörle geliştirebilirsin. Node.js 22+ yeterli; yerel kullanım için hesap, API anahtarı, e-posta veya bağımlılık kurulumu gerekmiyor. `npm run dev` ile başlat, `/games/` adresinde oyun listesini aç. Yeni oyun: `npm run game:new -- oyun-adi "Oyun Adı"`. Kontroller: `npm run check`.

Bu depo canlı sitenin temiz kaynak paylaşımıdır; eski Git geçmişi, hesap bağlantıları ve yerel harness ayarları dahil değildir. Orijinal kod MIT lisanslıdır; medya ve veri koşulları için [üçüncü taraf bildirimlerine](THIRD_PARTY_NOTICES.md) bak.

Türkçe pixel art futbolcu tahmin oyunu. 125 gerçek, ücretsiz lisanslı portre; 2.329 oyunculuk Big4 araması; 8 tahmin; beş karşılaştırma kategorisi; isteğe bağlı ülke ipucu; fotoğrafsız mod; lig filtresi; sınırsız turlar ve tarayıcıda kayıtlı istatistikler.

GitHub sürümünde her sayfa açılışında kurgusal Bonus Oyuncu demosu gösterilir. Canlı sitedeki kişisel fotoğraf ve kimlik bilgileri bu depoda bulunmaz. Orijinal bir SVG demo görseli kullanılır; tüm futbolcu özellikleri bilinmiyor (—). Bonus çözüldüğünde veya geçildiğinde normal 125 kişilik oyun başlar. Bonus normal istatistiklere dahil edilmez; Demo normal hedef ve arama havuzuna katılmaz. Yenileme normal turu sürdürmek yerine yeniden bonusu açar; skorlar ve çekiliş torbası korunur.

## FUT Draft

`/games/fut-draft/`: aynı cihazda 3–5 kişiyle oynanan 4-3-3 draft ve Avrupa Kupası oyunu. 11 seçim turunda ilk seçen her tur kayar. Her kutu aynı seviyeden üç futbolcu açar; varsayılan seviye olasılıkları %20 / %40 / %25 / %10 / %5'tir ve oyun öncesi düzenlenebilir. Her katılımcının her mevkide bir kez kullanabileceği 1. seviye jokeri vardır. Seçilmeyen futbolcular havuza döner; katılımcı kadrolarında aynı futbolcu tekrar etmez.

Ardından iki tur gizli koruma/çalma yapılır. İlk tur sıradaki bir sonraki, ikinci tur iki sonraki katılımcı hedeflenir; rakip değişir. Koruma ve çalma hedefi birlikte kilitlenir; tüm katılımcılar bitirmeden açıklanmaz. Seçim ekranında tüm kadrolar ve senden çalacak rakip görünür, seçimler gizlidir. Korunan hedefe yapılan çalma yanar. Başarılı hedefler önce ayrılır, çalanlar aynı mevkiden karşılık verir. Diğer başarılı hedefler karşılık olamaz; başka uygun futbolcu yoksa yeni gelen geri verilir. Tur sonunda herkes 11 kişidir. Her tur koruma yeniden seçilir.

Tüm katılımcılar aynı 36 takımlı turnuvaya girer. Kalan yerler 2026/27 Şampiyonlar Ligi katılımcılarından doğrulanmış FC 27 kadrosu bulunan 34 kulübün en yüksek kadro ortalamalılarıyla doldurulur. LM/RM dahil kanatlar forvet grubundadır. Lig aşaması sekiz hafta; her torbadan iki farklı rakip, dört iç saha ve dört deplasmandır. İlk 8 son 16'ya; 9–24 çift maçlı play-off'a gider. Son 16, çeyrek ve yarı final çift maç; final tek maçtır. Deplasman golü avantajı yoktur. Eşitlikte uzatma ve penaltılar uygulanır. Model 5, %80 takım gücü / %20 özellik ağırlığı, gol beklentisine bağlı sınırlı bitiricilik bütçesi ve golcü isimleri kullanır. Son 16 ve yarı finalde %50 seviye 1 / %50 seviye 2; çeyrekte %50 seviye 2 / %50 seviye 3 yükseltme kutusuyla bir futbolcu aynı mevkide daha yüksek overall karta değiştirilebilir. Kullanıcı pas geçebilir. Model 5, güç farkını ve kullanıcı kimyasını daha fazla önemser; kulüp bonusu kullanıcılar için en fazla +4, milliyet +2,5, rakip milliyet +1,6; rakip kulüp bonusu sıfırdır. Dakika bazlı gol beklentisi ve fırsat modelinde gerçek EA pas, savunma, bitiricilik, kaleci, hız, kondisyon ve penaltı özellikleri kullanılır. İlk 24 riski haftanın başındaki tabloda dondurulur. Çeyrek finalden itibaren her maçta kullanıcı tempo ve üç oyun tarzından birini kilitler. İlk 11 kimya bağları sahada ve metinde gösterilir. Ayrıntılar ve karşılaştırmalı denge deneyi [model planında](docs/FUT_DRAFT_SIMULATION_V5.md) açıklanır. Eski modelle başlamış turnuvalar o modelle tamamlanır; geçmiş skorlar değiştirilmez. Kulüp kadroları gerçek kulüp listeleridir ve draft kadrolarıyla ortak futbolcular içerebilir.

Katılımcılar sekiz farklı renk arasından benzersiz bir renk seçer; oyun içinde “Takım renkleri” menüsünden değiştirilebilir. Katılımcı maçları büyük skor kartları ve takım renkleriyle ayrı gösterilir. Kutuların üç kartı toplam 880 ms içinde sırayla açılır; kart açma/seçim sonrasında sayfa konumu korunur.

Kullanıcılar arasında en ileri aşamaya ulaşan kazanır; aynı aşamada elenenlerde lig sırası belirleyicidir. Lig sırası puan, averaj, atılan gol, deplasman golü, galibiyet, deplasman galibiyeti, rakiplerin puan/averaj/gol toplamları ve son olarak sabit takım kimliğiyle çözülür. Disiplin puanı ve kulüp katsayısı uygulanmaz. Bu, UEFA'dan bağımsız bir oyun uyarlamasıdır.

4.847 futbolculuk ayrı FC 27 standart kart görüntüsü `dist/games/fut-draft/players.json` içindedir. Kaynak ve sayfa SHA-256 kayıtları `research/fut-draft-data.json` dosyasındadır; seçki tüm FC veri tabanı değildir. Seviyeler: 85+, 81–84, 77–80, 73–76, 70–72. Ham EA `ratingDetails` görüntülerinden yeniden üretim: `node scripts/prepare-draft-data.mjs <snapshot-directory>`. Ana oyunun futbolcu verileri değiştirilmez. Kayıt anahtarı `pixel-scout:fut-draft:v1`; cihazlar arası bağlantı yoktur. Aynı cihazdaki gizlilik, ekranı sırayla kullanmaya dayanır; yerel kayıt ve istemci kodu güvenli çok oyunculu sunucu değildir.

## Çalıştırma

Node.js ile `npm run dev`, ardından http://127.0.0.1:4173 adresini açın. Uygulama build gerektirmez; `dist/` doğrudan statik olarak sunulabilir. `index.html` dosyasını çift tıklamak yerine HTTP sunucusu kullanın (ES modules ve JSON yükleme).

## Doğrulama

`npm test` motor ve veri bütünlüğü kontrollerini çalıştırır. Tarayıcıda arama/Enter, tekrar tahmin, açılış bonusu, ülke ipucu, kazanma, 8 yanlış tahminde kaybetme, istatistik, lig filtresi, fotoğrafsız mod ve mobil taşma test edildi.

## Veri ve görseller

Portre hedef havuzu 125 oyuncudur. Arama bundan bağımsızdır: Premier League, LaLiga, Serie A ve Ligue 1'in 78 kulübünün ESPN kadro kaynağında listelenen 2.329 oyuncusunun tamamı aranabilir ve tahmin edilebilir. Kapsam 20+20+20+18 kulüp, başarısız endpoint yok. Bu, seçilen kaynağın tam taranmasıdır; ayrı bir resmî kayıt sicili denetimi değildir. Oyuncu bilgilerinin kaynak tarihi 15 Ekim 2026; sezon 2026/27. Yaş bu sabit tarihe göre hesaplanır. Kaynak ve takım kapsamı `research/catalogue.json` ve `research/catalogue-notes.md` içinde saklanır. Güncellemeler otomatik değildir; `node scripts/fetch-catalogue.mjs` ile bilinçli yeniden toplanır. Kaynaktaki bilinmeyen değerler uydurulmaz ve arayüzde — gösterilir.

Portre adayları tanınmış takım ve millî oyuncular üzerinden derlenip gerçek yakın çekim kalitesi ve lisans bilgileri incelenir. 125 kişilik son seçim, kullanıcının hariç tuttukları çıkarılıp doğrulanmış ilk20 korunarak, uygun adaylar arasında İngilizce Wikipedia'nın son30 günlük görüntülenme toplamlarını önceliklendirmek için kullanır. Bu yalnızca ilgi göstergesidir; mutlak dünyadaki en ünlü125 kişi iddiası değildir. Seçim ve ölçüm kayıtları `research/target-selection.json` ve `research/fame-ranking.json` içinde saklanır.

Portreler Wikimedia Commons'tan alınır, görseller siteyle birlikte sunulur; API anahtarı veya ücretli görsel aboneliği yoktur. Her görselin fotoğrafçısı, kaynağı ve lisansı `research/portraits.json` ve oyunun Fotoğraf kaynakları ekranında yer alır. CSS ile yakın kadraj ve geçici bulanıklık uygulanır. CC BY-SA fotoğraflarındaki uyarlamalar aynı kaynak lisans koşullarıyla sunulur. Silkscreen fontu SIL OFL 1.1 lisansıyla dağıtılır; lisans `dist/assets/Silkscreen-OFL.txt` içindedir. Kulüp logoları kullanılmaz; bayraklar ve pixel ikonlar CSS/SVG ile çizilir.

`node scripts/prepare-data.mjs` araştırma kayıtlarını birleştirerek `dist/players.json` içinde ayrı `players` ve `searchPlayers` dizilerini üretir. 125 lisanslı/onaylı ve tüm ipucu bilgileri mevcut hedef bulunamazsa üretim komutu durur; düşük sayıyı sessizce yayımlamaz. Brian Madjo (Brayan yazımı dahil), Malick Thiaw, Conor Bradley, Dan Burn, Ibrahim Mbaye, Gerónimo Rulli ve Mile Svilar normal hedef havuzundan çıkarılmıştır; tam kadro aramasında bulunabilir ve tahmin edilebilirler. Portresiz kadro üyeleri geçerli tahmindir; hedef seçilemezler. Havuz güncellenirken hazırlama komutunu ve testleri çalıştırın.

## Sıralı ipucu açılışı ve referans incelemesi

Referans Who Are Ya oyununun tarayıcıya açık bileşenleri statik olarak incelendi. Hücre bazında indeks gecikmesi, animasyon sırasında tahmin kilidi ve sonuca ait fotoğrafın geciktirilmesi, özgün kodla yeniden uygulandı. İnceleme notları `research/reverse/behavior-notes.md` içindedir. Orijinal kod ve medya uygulamaya kopyalanmaz; indirilen inceleme kopyaları Git'e dahil edilmez.

Yeni tahminin kulüp/ülke/mevki/yaş/forma hücreleri 240ms ön gecikmeden sonra 720ms aralıkla, 560ms dönüş animasyonuyla açılır. Toplam3.680ms boyunca arama, lig/mod değişimi ve ek ipucu bekler. Fotoğrafın netleşmesi, sonuç ve kazanma göstergeleri en son açılır. Eski satırlar yeniden animasyon oynatmaz. Hareket azaltma tercihi görsel dönüşü kaldırır; sıralı açılma korunur. Sayfa yenilendiğinde açılış bonusu sıfırdan başlar.

## Davranış ve sınırlar

Oyuncular seçilen havuz bitene kadar tekrarlanmaz. Havuz yeniden karıştırıldığında önceki turun oyuncusu hemen seçilmez. Lig değiştirmek yeni tur başlatır; bitmemiş turlar istatistiklere sayılmaz. Oyun durumu ve skorlar bu tarayıcıda localStorage ile saklanır; cihazlar arası hesap sistemi yoktur. Bu bir casual oyun; istemci verileri incelenerek cevap bulunabilir. Rekabetçi sıralama için sunucuda tur seçimi ve doğrulama gerekir.

Kaynak kodu orijinal Who Are Ya uygulamasından kopyalanmamıştır. Oyun, gözlenen kurallara göre bağımsız geliştirilmiştir.

## Vercel üretim yayını

Herkese açık adres: https://pixel-scout-nine.vercel.app

Vercel için `vercel.json` derlemesiz statik `dist/` yayını kullanır. Kendi fork'unu kendi hesabında yeni bir projeye bağlayabilirsin. Bu depoda üretim hesabının kimliği veya erişim bilgileri bulunmaz.
