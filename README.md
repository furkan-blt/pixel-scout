# Pixel Scout

[⚽ Canlı Oyun: Golcüyü Tahmin Et](https://yasirertan.github.io/pixel-scout/games/golcuyu-tahmin-et/) · [🎮 Tüm Oyunlar](https://yasirertan.github.io/pixel-scout/games/) · [Katkı rehberi](CONTRIBUTING.md) · [Mini oyun ekleme](docs/ADDING_GAMES.md) · [Ajan yönergeleri](AGENTS.md)

Codex, Antigravity veya herhangi bir editörle geliştirebilirsin. Node.js 22+ yeterli; yerel kullanım için hesap, API anahtarı, e-posta veya bağımlılık kurulumu gerekmiyor. `npm run dev` ile başlat, `/games/` adresinde oyun listesini aç. Yeni oyun: `npm run game:new -- oyun-adi "Oyun Adı"`. Kontroller: `npm run check`.

Bu depo canlı sitenin temiz kaynak paylaşımıdır; eski Git geçmişi, hesap bağlantıları ve yerel harness ayarları dahil değildir. Orijinal kod MIT lisanslıdır; medya ve veri koşulları için [üçüncü taraf bildirimlerine](THIRD_PARTY_NOTICES.md) bak.

Türkçe pixel art futbolcu tahmin oyunu. 125 gerçek, ücretsiz lisanslı portre; 2.329 oyunculuk Big4 araması; 8 tahmin; beş karşılaştırma kategorisi; isteğe bağlı ülke ipucu; fotoğrafsız mod; lig filtresi; sınırsız turlar ve tarayıcıda kayıtlı istatistikler.

GitHub sürümünde her sayfa açılışında kurgusal Bonus Oyuncu demosu gösterilir. Canlı sitedeki kişisel fotoğraf ve kimlik bilgileri bu depoda bulunmaz. Orijinal bir SVG demo görseli kullanılır; tüm futbolcu özellikleri bilinmiyor (—). Bonus çözüldüğünde veya geçildiğinde normal 125 kişilik oyun başlar. Bonus normal istatistiklere dahil edilmez; Demo normal hedef ve arama havuzuna katılmaz. Yenileme normal turu sürdürmek yerine yeniden bonusu açar; skorlar ve çekiliş torbası korunur.

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
