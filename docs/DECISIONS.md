# Karar Günlüğü

Konuşulan ve itiraz edilmeyen her öneri buraya tarihle yazılır. Yeni karar en üste eklenir.
Bir karar değişirse eskisi silinmez: üstü çizilir (~~...~~), yanına yeni kararın tarihi yazılır.
Durum: **Kabul** = uygulanabilir · **Onay bekliyor** = "Uygula" denene kadar kod yok · **Açık** = karar verilmedi.

İlgili: `CONTEXT.md` (kısa devir notu), `docs/BACKLOG.md` (fikir havuzu), `docs/COMPETITORS.md` (rakipler),
`docs/PROJECT_BRIEF.md` (ilk brief ve ilk kararlar, 2026-11-16).

## 2026-11-17

| Karar | Neden | Durum |
|---|---|---|
| Sızıntı kuralı sorusu kapandı: oyun 2026-11-19'da çıkıyor, çıkış öncesi materyal konusu fiilen bitti | Kurucu: "24 saat içinde hiçbir şey olmaz" | Kapandı |
| Cloudflare Web Analytics açık (token `SITE.analytics`) | Çıkış günü trafiği ölçmek | Kabul, uygulandı |
| ~~Domain ve markada oyun markası yok~~ → Kurucu domainde "gta6" (ya da onu çağrıştıran bir ad) istiyor; domain çıkış günü alınacak. Öneri: görünen marka "Atlas" kalsın (logo gibi "GTA" kullanılmaz), gta6'lı domain + markasız yedek domain birlikte alınsın; itiraz gelirse 301 ile yedeğe geçilir. Araştırma: Take-Two oyun kodu/varlığı dağıtanları, sahte sızıntıyı, hile satışını ve dolandırıcı domainleri hedefliyor; bilgi/rehber siteleri (GTAForums, GTABase, GTA BOOM) yıllardır duruyor. UDRP'de hayran sitesi savunması "aktif, gerçekten ticari olmayan, resmî siteden açıkça ayrı" olmayı istiyor; reklam bu savunmayı zayıflatır | Akılda kalıcılık; risk = domaini kaybetmek, siteyi değil | Önerildi |
| Harita kaynağı çıkıştan sonraki ilk 2 günde piyasanın hareketine göre seçilir (hangi topluluk haritası öne çıkarsa) | Kurucunun kararı; çıkış öncesi seçim tahmin olurdu | Kabul |
| Harita gelene kadar bulgular **konumsuz** yayınlanır: pin sayfası, listeler, ilerleme; haritada görünmez. Konum sonra verilir, aynı liste tekrar gönderilince içe aktarma konumu mevcut pine yazar (yeni pin açmaz) | İlk gün içerik kaçmasın; harita gecikmesi içeriği durdurmasın | Kabul, uygulandı |
| Veri girişine "Hızlı not" eklendi: yalnızca link + zaman + birkaç kelime (taslak). Taslak sonra listeden açılır, kategori/başlık yazılır, haritaya tıklanarak yerleştirilir. "Sıradakini aç" bekleyenleri sırayla getirir | Kurucu yayın izlerken hızlı not almak istedi | Kabul, uygulandı |
| İndirilen CSV her satırı (taslaklar dahil) içerir ve yedektir: "CSV'den geri yükle" tarayıcı verisi silinirse listeyi geri getirir. İçe aktarma taslakları ve önceden eklenenleri sessizce atlar | Kayıp riskini kapatmak, tekrar göndermeyi güvenli yapmak | Kabul, uygulandı |
| Sosyal medya: şimdilik yalnızca TikTok (İngilizce). Her bulgu bir short; kullanıcı içerikten gelecek. Video üretim/düzenleme araçlarına sonra birlikte bakılacak | Kurucunun kararı | Kabul |
| Arama motorları domain gelene kadar kapalı (`SITE.indexable = false`: robots.txt + noindex). Domain bağlanınca tek satırla açılır | Sıralamayı geçici workers.dev adresinde kurmamak | Kabul, uygulandı |
| Paylaşım önizleme görseli (1200×630, resmi çizim + başlık; kapatma anahtarı kapalıysa kendi degrade görselimiz). Cloudflare Web Analytics için yer hazır, token kurucudan gelecek | Çıkış öncesi altyapı | Kabul, uygulandı |
| Kullanıcı hesapları: çıkışta yok. Tetikleyici: düzenli geri gelen kullanıcı oluşunca ya da kimlik isteyen ilk özellik (konum önerme, yorum) gelince; tahmini ay 1-2. İlerleme şimdilik tarayıcıda + yedek kodu | Hesap kullanıcı getirmez, içerik getirir; çıkış haftasında moderasyon/güvenlik yükü riskli | Önerildi |
| ~~Rockstar görselleri fan içerik politikası kontrol edilmeden kullanılmaz~~ → Telif konusunda kendi kuralımız yok: sorun çıkmayacağına inandığımız her materyal kullanılır (kurucu: "bizim sattığımız şey o görseller olmayacak") | Kurucunun kararı | Kabul |
| Resmî GTA VI çizimleri sitede tematik kullanılıyor: arka plan, ana sayfa posteri, keşfet kartları, haber ve liste bantları. Alt bilgide "© Rockstar Games" atfı. GTA VI logosu kullanılmaz (siteyi resmî gibi gösterir), RDR2/GTA V görselleri konu dışı | Atmosfer; atıf dürüst ve riski azaltır | Kabul, uygulandı |
| Kapatma anahtarı: `SITE.officialArt = false` tüm resmî görselleri tek adımda kaldırır, kendi SVG sahnemiz geri gelir. Kaynak JPG'ler `media-src/` (git dışı), web sürümleri `npm run media` ile `public/media/` | Kaldırma talebi gelirse dakikalar içinde uyum | Kabul, uygulandı |
| Site içi veri girişi (`/map?dev=true`): haritaya tıkla → form → listeye ekle → CSV indir → `inbox/`. Google Sheet artık isteğe bağlı | Kurucu "site içinde yapamaz mısın" diye sordu; koordinat kopyala-yapıştır derdi bitti | Kabul, uygulandı |
| Açık soru: "çıkış öncesi sızıntı materyali kullanılmaz" kuralı (2026-11-16) duruyor mu? | Telif kuralı kaldırıldı; sızıntı ayrı bir konu | Açık |
| Bulgu: GTADB / map.gtadb.org GTA VI haritası çıkış öncesi bir rekonstrüksiyon (fragman ve ekran görüntülerinden üçgenleme, gerçek Florida eşleştirmesi, kısmen sızıntı verisi). Lisans: kod MIT, veri CC BY 4.0 ("gtadb.org and all contributors"); döşemelerin lisansı belirtilmemiş | Kurucu sordu | Bilgi |
| GTADB haritası taban harita olarak kullanılmaz | Asıl neden: gerçek pinler çıkıştan sonra gelecek ve gerçek oyun haritasına göre girilmeli; rekonstrüksiyon o gün eskiyor. Ayrıca kısmen sızıntıya dayanıyor (sızıntı kuralı açık soru) | Önerildi |
| Harita planı önerisi: (1) çıkış haftası: topluluğun oyundan birleştirdiği harita, izin + atıfla, site reklamsız ve bağışsızken; (2) paralelde kendi vektör haritamız (referanstan su/kara/yol otomatik çıkarım + elle düzeltme, kendi stilimiz); (3) kendi haritamız hazır olunca kalibrasyonla geçiş, ancak ondan sonra reklam/bağış | Rockstar'ın harita çizimi telifli; ticari olmayan kullanım hoş görülüyor | Önerildi, kurucunun yanıtı bekleniyor |
| `inbox/` klasörü: kurucunun gönderdiği CSV ve link listeleri buraya bırakılır, git'e girmez; Google Sheet'te iki sekme: pins + news | Claude Google Drive'ı okuyamıyor; tek, basit teslim yolu | Kabul, uygulandı |
| Türkçe sürüm: İngilizce kökte (`/map`), Türkçe `/tr/` altında; hreflang ve sitemap iki dili bağlar; sayfada EN/TR geçiş düğmesi | Arama motorlarında iki dil ayrı sayfa; İngilizce adresler değişmedi | Kabul, uygulandı |
| Türkçe arayüz metinleri tam; içerik metinleri (pin başlığı/açıklaması) tabloda isteğe bağlı `title_tr` / `description_tr` sütunlarıyla gelir, yoksa İngilizcesi gösterilir | Türkçe iş yükü kurucunun zamanını yemesin | Kabul, uygulandı |
| Türkçe dizgide tipografik kesme işareti (’) kullanılır | Başlık fontunda düz kesme bozuk görünüyor; Türkçe dizgide doğrusu da bu | Kabul |
| Pin sayfaları kalır (Google, paylaşım, sayfa görüntülemesi); oyuncunun asıl deneyimi haritadaki zengin kart | Kurucu "pin sayfasına gerek var mı" diye sordu; "yap devam et" ile onayladı | Kabul, uygulandı |
| Haritada pin kartı: masaüstünde sağda yüzen kart, mobilde alttan panel. YouTube küçük resmi tıklanınca kartta oynar (tıklanana kadar YouTube yüklenmez), spoiler kapısı, bulan, kaynak, Buldum / Paylaş / Sayfayı aç. Seçili pin adres çubuğunda (`?pin=`), kopyalanan link aynı kartı açar | Kurucunun fikri | Kabul, uygulandı |
| Haber arşivi `/news` ve `/tr/news`: en yeni üstte, rozet + kaynak; yanında "GTA VI'ya giden yol". Haberleri kurucu link olarak gönderir, Claude özgün özet yazar (metin kopyalanmaz) | İçerik akışı ve tekrar eden ziyaret | Kabul, uygulandı |
| ~~Rockstar'ın resmi GTA VI sanatı (kurucunun `.next/Media` klasörüne koyduğu 18 görsel) arka plan veya marka öğesi olarak KULLANILMAZ~~ (aynı gün kurucunun kararıyla değişti, yukarıda). Görseller git dışında `media-src/` klasöründe saklanır | Rockstar politikası yalnızca ticari olmayan kullanıma göz yumuyor; sitemiz bağış/reklam hedefliyor. Logo kullanımı ayrıca marka kuralımıza aykırı | Kabul |
| Atmosfer kendi çizdiğimiz SVG sahneyle (gün batımı, şehir silueti, palmiyeler) kurulur | Telif riski yok, hafif (~6 KB) | Kabul, uygulandı |
| Açık konu: resmi görsellerin haber sayfalarında "© Rockstar Games" atfıyla haber amaçlı kullanımı | Haber sitelerinde yaygın; ticari risk değerlendirilmeli | Açık |
| Tek, koyu tema (açık tema kaldırıldı) | Oyun gecesi atmosferi; tasarım işini yarıya indirir | Kabul, uygulandı |
| Hub tasarımı uygulandı: ana sayfa (geri sayım → "Gün N", istatistikler, son bulgular, Road to GTA VI zaman çizelgesi, keşfet kartları), yapışkan üst menü, harita kümeleme, lejant, "sıradaki bulunmamış" | "Uygula" onayı | Kabul, uygulandı |
| Zaman çizelgesine yalnızca birinci elden (Rockstar) kaynaklı olaylar girer; 2026 ön sipariş/ön yükleme tarihleri kaynaklar çeliştiği için girmedi | Kaynak şeffaflığı farkımız | Kabul |
| Uygulama sırası: tasarım + ana sayfa + harita (yapıldı) → Türkçe → haber arşivi | Çıkışa 2 gün | Kabul |
| Site yıllar içinde GTA VI ile ilgili her şeyi kapsayacak; tek bir nişe kısıtlanmayacak. Harita yalnızca başlangıç | Kurucunun vizyonu; hub sayfa görüntülemesi ve arama girişi üretir | Kabul |
| Ağırlık topluluk ve online tarafında: oyuncuların güncel tükettiği, etkileşimle büyüyen içerik | Tekrar eden trafik değişen içerikten gelir (rakip analizi) | Kabul |
| Hedef: rakiplerle en az eşit seviye (giriş bileti), üstüne sürekli güncel ve bol içerik. Farklılaşma şart değil ama fırsat oldukça eklenir | Pazarda yer tutmak | Kabul |
| LeonidaMap.org benzeri hub yapısına ve neon gün batımı atmosferine geçilecek. Görsel ve metin kopyalanmaz, Rockstar görselleri kullanılmaz | Mevcut tasarım zayıf bulundu; hub yapısı içerik yoğunluğunu taşır | Yön kabul, uygulama planı onay bekliyor |
| ~~Yalnızca İngilizce, Türkçe %10 trafik eşiğinde~~ → EN + TR çift dil | Rakiplerin hepsi İngilizce; TR'de rekabet neredeyse yok | Kabul |
| Sosyal medya hesabı yalnızca İngilizce; ayrı Türkçe hesap yok | Kurucunun zamanı tek hesaba yetiyor | Kabul |
| Gelir modeli ürünün kalitesi ve kapsamı netleşince belirlenecek; ilk etapta bağış | Henüz trafik ve ürün yok | Kabul |
| Rakip bulguları `docs/COMPETITORS.md`, eklenebilecek fikirler `docs/BACKLOG.md`, kararlar bu dosyada tutulur | Uzun vadeli proje, unutulmasın | Kabul |
| Veri akışı tablo üzerinden: Google Sheet → CSV → `npm run import:pins` (önce kuru çalıştırma) → doğrulama → build → deploy | Hızlı, hatası raporlanan, tekrarlanabilir | Kabul, uygulandı |
| 12 başlangıç kategorisi (story/side missions, activities, collectibles, stunt jumps, random events, rare vehicles, easter eggs, weapon pickups, safehouses, shops, landmarks). Oyun çıkınca eklenir ya da kullanılmadan bırakılır, silinmez | Kalıcı ID; ilerleme ID'ye bağlı | Kabul, uygulandı |
| İlk harita topluluk haritası (izin ve atıfla); sonra sıfırdan kendi haritamız. Geçiş kalibrasyonla yapılır, pinler değişmez | Telif riski yok, ilk gün hazır | Kabul, uygulandı (kalibrasyon aracı) |
| Topluluk haritası ilk gerçek pinlerden ÖNCE yerine konur | Pin koordinatları ilk haritanın çerçevesinde | Kabul |
| Hosting: Cloudflare Workers Static Assets (Pages değil), Worker adı `atlas` | Cloudflare'in güncel önerisi; markada oyun adı yok | Kabul, uygulandı |
| Cloudflare hesabı theshamsfr, GitHub hesabı fresezar | Kurucunun tercihi | Kabul |
| Canlı adres (paylaşılmıyor): https://atlas.theshamsfr.workers.dev | Domain çıkıştan sonra seçilecek | Kabul |
| Link gerçek veri gelene kadar paylaşılmayacak | İlk izlenim örnek veriyle bozulmasın | Kabul |
| Deploy şimdilik elle (`wrangler deploy`); Git'e bağlı otomatik deploy isteğe bağlı | Panel bağlantısı kurucuda | Kabul |

## 2026-11-16 (özet, ayrıntı `docs/PROJECT_BRIEF.md`)

| Karar | Durum |
|---|---|
| Domain ve markada `gta`, `vice`, `leonida`, karakter adı yok; "unofficial" ibaresi her yerde | Kabul |
| Pin ID'leri değişmez (`pin_<ULID>`), silme yok (`deprecated`), koordinatlar 0..1 | Kabul, uygulandı |
| Yeni veri `unverified` başlar; verified = 2 bağımsız kaynak ya da topluluk onayı; AI verisi kaynak linki ve güven derecesi taşır | Kabul, uygulandı |
| Başka sitelerden metin kopyalanmaz; sızıntı/çalıntı materyal kullanılmaz; Rockstar görselleri fan içerik politikası kontrol edilmeden kullanılmaz | Kabul |
| Kullanıcı verisi yalnızca StorageAdapter üzerinden; tamamlanma yüzdesi saklanmaz, hesaplanır; ücretli özellikler entitlement anahtarlarıyla | Kabul, uygulandı |
| Hedefler: 1) büyüyen topluluk 2) reklam geliri, abonelik sonra | Kabul |
| PS5 yok; ilk veriler yayıncı ve topluluk takibinden | Kabul |
| Her bulgu = bir pin + bir kısa video (TikTok/Reels/Shorts) | Kabul |
| Spoiler kapısı zorunlu (none/mild/major), varsayılan gizli | Kabul, uygulandı |
| "Uygula" denene kadar kod yok; beyin fırtınası ve notlar devam | Kabul (çalışma kuralı) |
| Domain kararı oyun çıkınca; adaylar `docs/PROJECT_BRIEF.md` içinde | Açık |

## Açık konular

- Çift dilli topluluk modeli: önerildi (2026-11-17), kurucunun görüşü bekleniyor.
- ~~Hub tasarımına geçiş planı~~ → uygulandı (2026-11-17).
- Topluluk haritası kaynağı ve lisans doğrulaması: çıkıştan sonraki ilk 2 günde seçilecek (2026-11-17).
- Domain: TikTok'tan gelecek trafik için çıkış haftasında gerekli; arama motorları domain gelince açılır.
- Cloudflare Web Analytics token'ı (kurucu panelden alacak).
- Domain ve nihai marka.
