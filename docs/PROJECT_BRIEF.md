# Proje Brief: GTA VI (Leonida / Vice City) Oyuncu Platformu

> Durum: NOT ALINDI, kod henüz yazılmadı. Kod için onay: "Tamam, koda geçelim" / "Uygula".

## Rol
Kıdemli Full-Stack Yazılım Mimarı ve Ürün Tasarımcısı.

## Vizyon
Zamanla büyüyen, yüksek trafik kaldırabilen, modüler ve veri odaklı bir oyuncu platformu.
İlk gün yayına alınabilecek yalın ve hızlı bir MVP; arka plan veri yapısı ve komponent mimarisi
gelecek 1 yıl içindeki karmaşık modülleri (ekonomi simülatörleri, araç veri tabanları,
tarayıcı tabanlı mini oyunlar) sıfır yeniden yazım (zero-refactor) ile karşılamalı.

## Teknoloji Yığını ve Mimari Kurallar
- Framework & Dil: Next.js (App Router), TypeScript, Tailwind CSS
- Harita Motoru: Leaflet.js veya MapLibre GL (CRS.Simple destekli, yüksek çözünürlüklü tile-based katmanlara hazır)
- Veri ve State: İlk aşamada statik JSON/TypeScript veri şemaları + kullanıcı ilerlemesi için `localStorage`.
  İleride Supabase/PostgreSQL senkronizasyonuna geçmeye hazır, soyutlanmış bir `StorageAdapter` katmanı.
- Tasarım Dili: Vice City / Leonida estetiği; modern, karanlık mod odaklı, neon vurgulu ama göz yormayan,
  mobil öncelikli, PWA uyumlu.

## Fazlandırılmış Yol Haritası (mimari buna göre kurulmalı)

### FAZ 1: İlk Gün Yayını (MVP)
1. İnteraktif Leonida Haritası
   - Özel harita görseli/tile katmanı üzerinde zoom, pan ve koordinat (`[x, y]`) alma
   - Kategori filtreleme: Gizli Paketler, Easter Egg'ler, Nadir Araçlar, Silah Lokasyonları, Güvenli Evler, Yan Görevler
   - Kullanıcı bulduğu noktaları "Tamamlandı" işaretler; ilerleme yüzdesi görür (`%14 Tamamlandı`)
   - Hızlı Veri Giriş Modu (Admin/Contributor Helper): `?dev=true` ile açılan gizli geliştirici modu.
     Haritaya tıklayınca koordinat + JSON şablonu tek tıkla kopyalanır (yayın izlerken saniyeler içinde pin ekleme).
2. Hızlı Rehberler ve Kontrol Listeleri
   - %100 Completion takibi için interaktif checklist'ler

### FAZ 2: İlk 1-3 Ay (Veri Tabanı Genişlemesi)
3. Araç ve Silah Karşılaştırma Veri Tabanı
   - Hız, ivmelenme, yol tutuş, fiyat, modifiye maliyetine göre filtreleme; yan yana 2-3 araç kıyaslama
4. Oyun İçi Ekonomi ve Para Kazanma Hesaplayıcıları
   - Soygun, işletme gelirleri, varsa borsa/yatırım getirisi hesaplayıcıları

### FAZ 3: 3-12 Ay (Topluluk ve Etkileşim)
5. Tarayıcı Tabanlı Mini Oyunlar ve Simülatörler
   - Hacking, kilit açma, sosyal medya parodisi mekaniklerini pratik eden bağımsız rotalar (`/minigames/hacking` vb.)
6. Topluluk Katkı Sistemi
   - Kullanıcılar haritaya yeni pin önerisi gönderir; moderasyon kuyruğu

## İlk Görev (kod onayından sonra)
1. Tüm fazları destekleyen klasör yapısı (Directory Tree) + temel TypeScript şemaları
   (`MapPin`, `Category`, `UserProgress`, `Vehicle` vb.)
2. Faz 1 için eksiksiz İnteraktif Harita bileşeni
3. `?dev=true` koordinat kopyalama aracı (eksiksiz kod)

## Açık Kararlar
- Domain ismi (niche kimlik, hatırlanabilir, ilk kullanıcıların keşfedeceği)

## Domain Brainstorm Notları
- Kural: `gta`, `vice`, `leonida`, karakter adları domain'de olmamalı (Take-Two trademark riski). Marka bağımsız, alt başlıkta "unofficial" ibaresi.
- Karar yaklaşımı: Oyun hikayesi görüldükten sonra nihai marka seçilecek, hemen yayın. Beklerken 2-3 aday ucuz domain rezerve edilebilir (opsiyon).
- Aday havuzu 1 (şehir/iklim/Florida esintisi): Glades, Sawgrass, Mangrove, Palmetto, Sunburn, Stormline, Coral Ledger
- Aday havuzu 2 (kaçak çift / hapisten çıkış teması): Parole, Getaway Pair, Second Chance, Runaway Ledger, Two Of A Kind
- Önceki havuz: Gazetteer, Dead Drop, Stash House, Blind Spot, Neon Ledger, Pinboard Noir
- Uygulama: Her aday için domain + X + TikTok handle müsaitliği kontrol edilecek.
- Ceplenen adaylar: viceamir.com, amirvc.com (biri alınacak). Not: viceamir.com "vice" nedeniyle daha riskli; amirvc.com daha güvenli, "unofficial" ibaresi şart.
- Sepette (geçici, 2026-11-16): gtamir.vip. Nihai karar oyun çıktığı gün. Riskler: "gta" trademark içeriyor, .vip TLD güven/yenileme fiyatı, Türkçe kelime oyunu sadece TR kitlesine hitap eder.

## PM Kararları ve Plan Taslağı (2026-11-16)
- Roller: Kullanıcı = kurucu/yayın izleyici/içerik. Claude = Product Manager + mimari.
- Kural: "Uygula" denene kadar kod yok; brainstorm + notlar devam.
- Veri toplama: PS5 yok, ilk haftalar yayıncı ve topluluk takibiyle (VOD -> timestamp -> pin).
- Sosyal: TikTok + Instagram Reels kısa videolar (her bulgu = bir pin + bir kısa video).
- Teknik riskler: pin ID'leri değişmez olmalı (kullanıcı ilerlemesi ID'ye bağlı); i18n yönlendirmesi baştan; içerik git'te (MDX/JSON), sonra CMS; harita görseli telif riski.
- Gelir yolları (eklenecek): reklam, affiliate, premium üyelik (senkron, reklamsız).
- Kimlik: diğer AI sitelerine benzemeyen özgün UI; 3 yön önerildi (Surveyor Chart / Evidence Board / 80s Florida broşür), seçim bekleniyor.

## Kararlar (2026-11-16, 2. tur)
- Kimlik yönü: C (80s Florida broşürü; pastel mercan/turkuaz/krem, halftone, iri tipografi). Dark mode ikinci tema. Tasarım token'ları tek dosyada.
- Domain: viceamir.com yönelimi (kullanıcı marka riskini kendisi kontrol edecek); alternatif amirvc.com. Marka riski: telif değil, trademark; "unofficial" ibaresi şart.
- Dil: varsayılan İngilizce. Türkçe lansmanda yok; i18n altyapısı baştan hazır (UI metinleri ayrı dosyada, pin verisi dilden bağımsız: ID + koordinat). Yeni dil tetik eşiği: trafikte bir dilin payı belirgin artarsa (örn. %10+).

## Abonelik Fikirleri (rakip analizi, 2026-11-16)
- Rakip referans: köklü bir GTA veri sitesi (Free + VIP yıllık ~$2.99/ay, aylık ~$4.99). Free: checklist + hesapta saklama, koleksiyonlar, favoriler, profil. VIP: reklamsız, oyun başına çoklu profil, harita ekstraları (kişisel marker/not/screenshot/özel kategori), özel resim yükleme, net worth, rozet.
- Para kazandıran kaldıraçlar: reklamsız deneyim, çoklu profil, kişisel harita işaretleri + notlar, cihazlar arası senkron, koleksiyon/net worth.
- Mimari sonuçlar (zero-refactor): UserProgress profileId ile anahtarlanır (free = 1 profil, premium = çoklu); resmi pin ile kullanıcıya ait pin (userMarker) ayrı tablo/tip; Entitlements katmanı (plan -> özellik bayrakları) ile paywall sonradan kodu bozmadan açılır; genel Collection modeli (profil + öğe + durum: owned/upgraded/favorite/note/image); net worth = koleksiyon x fiyat verisi (oyun çıkınca fiyatlar gelir).
- Farklılaşma fikri: paylaşılabilir ilerleme kartı / arkadaşla paylaşılan checklist linki (viral döngü).
- Riskler: resim yükleme = moderasyon + depolama maliyeti (geç aşama); ödeme için merchant-of-record (Lemon Squeezy/Paddle) vergi yükünü azaltır; abonelik için önce trafik gerekir.
- Zamanlama: ödeme sistemi Faz 2 sonu / Faz 3; lansmanda yalnızca ücretsiz + yerel kayıt.

## Ana Hedefler (2026-11-16)
1. Sürekli büyüyen topluluk. 2. Reklam geliri (abonelik sonra).
- Büyüme kanalları: kısa video (TikTok/Reels/Shorts), Reddit (kurallara uygun), Discord (lansmandan önce açılır), yayıncı iş birliği ("found by" atıfı), PWA bildirimi/newsletter.
- Büyüme döngüleri: bulgu -> pin + kısa video -> site; paylaşılabilir ilerleme kartı; katkıcı kredisi/liderlik tablosu.
- Reklam gerçeği: gelir = sayfa görüntüleme x RPM/1000. Tek sayfalık harita az sayfa görüntüleme üretir; bu yüzden pin/rehber başına ayrı statik URL (/pins/[slug], /guides/[slug]) verilerden otomatik üretilmeli (SEO + pageview). Harita sayfasında reklam minimal, rehber/checklist sayfalarında ana yerleşim.
- Reklam ağı eşikleri sık değişir; başvurmadan önce güncel şartlar doğrulanacak (başlangıç: düşük eşikli ağ, trafik büyüyünce premium ağ).
- Metrikler: haftalık aktif kullanıcı, geri dönen oran, Discord üye sayısı, e-posta/bildirim abonesi, sayfa/oturum, RPM. Hedef sayıları ilk 2 haftalık ölçümden sonra konur.
- Risk: yanlış pin güveni öldürür; doğrulama durumu (verified/unverified) alanı şemada olmalı. Yeni domain SEO'su aylar sürer; ilk trafik sosyal ve topluluktan gelir.

## Takvim Notu (2026-11-16, doğrulandı)
- GTA VI çıkış: 19 Kasım 2026 (Rockstar duyurusu); pre-load 10 Kasım. Hafta 0 planı: domain + handle + Discord + coming-soon/e-posta; çıkış günü veri ham tabloda (pin ID, zaman, kaynak, doğrulandı mı).
- Repo erişimi: fresezar/GtaVI oturuma eklenemedi (private/bağlantı eksik). GitHub connector bağlanınca tekrar denenecek.

## Araç Verisi Stratejisi (taslak)
- Gerçek: GTA oyunlarında hız/ivme sayısal gösterilmez; veri topluluk ölçümünden gelir. Lansmanda ilk saatlerde ölçüm yok, fotoğraf/isim/fiyat önce gelir.
- Alan yapısı: her stat = {değer, yöntem, kaynak, örnek sayısı, doğrulandı}. Standart test protokolü (aynı yol, aynı hava, aynı prosedür) = güven farkı.
- Fotoğraf: kendi/katkıcı ekran görüntüsü en güvenli; resmi görsel kullanımı için Rockstar/Take-Two fan içerik politikası kontrol edilecek.
- Lansman sırası: isim + fotoğraf + fiyat -> ilk ölçümler (unverified) -> doğrulanmış karşılaştırma.

## Hikaye ve Seçim Şeması (taslak)
- Varlıklar: Mission, Choice (missionId, optionKey, sonuçlar), Branch/Ending, Flag. Kullanıcı ilerlemesi: seçilen yol (pathTaken).
- Oyunda dallanma olup olmadığı lansmanda doğrulanacak; şema genel tutulur, doğrusal hikaye de çalışır.
- Spoiler kapısı zorunlu: her içerik spoilerLevel taşır (none / mild / major), arayüzde varsayılan gizli, tıkla göster.
- Görselleştirme: dal akış şeması (flowchart) sayfası; SEO için mission başına ayrı sayfa.

## Özellik Havuzu (SEO/gelir sırasına göre aday)
1. Trophy/Achievement rehberi 2. Hile ve telefon kodları 3. Mission walkthrough 4. Koleksiyon haritası (Faz 1) 5. Araç DB 6. Radyo/müzik listesi 7. Hayvan/koleksiyon takibi 8. Ekonomi hesaplayıcı 9. Yama notları/haber akışı 10. Topluluk ekran görüntüsü galerisi
- Not: özellik oyunda varsa eklenir; lansmanda doğrulanır.

## Kör Veri Hattı (Blind Ingestion) ve Ölçek Mimarisi (2026-11-16)
- Fikir: Claude web kaynaklarından (yalnızca çıkış sonrası, kamuya açık) veri toplar; kullanıcı spoiler görmeden yalnızca meta rapor (adet, kaynak güvenilirliği, çelişki işareti) görür.
- Her kayıt provenance taşır: sourceUrl, retrievedAt, confidence (low/med/high), extractedBy (ai/human), status (unverified varsayılan), spoilerLevel.
- Kurallar: AI'ın topladığı veri doğrulanana kadar "unverified" ve ayrı rozetli; 2 bağımsız kaynak veya topluluk onayı ile "verified". Metin kopyalanmaz (yalnızca olgular, özgün anlatım). Çıkış öncesi sızıntı/çalıntı materyal kullanılmaz.
- Doğrulama: kullanıcı rastgele örnek (spot check) + Discord topluluk onayı. Kullanıcı görmeden yayın = yalnızca düşük riskli alanlar (isim, konum, kategori); yüksek riskli (hikaye, sayısal stat) doğrulamadan yayına çıkmaz.
- Ölçek: içerik = veri dosyaları + şablon sayfalar; yeni içerik türü = yeni koleksiyon, kod değişmez. Veri kontrat testi (şema doğrulama) CI'da çalışır; hatalı kayıt yayına çıkmaz.
