# Karar Günlüğü

Konuşulan ve itiraz edilmeyen her öneri buraya tarihle yazılır. Yeni karar en üste eklenir.
Bir karar değişirse eskisi silinmez: üstü çizilir (~~...~~), yanına yeni kararın tarihi yazılır.
Durum: **Kabul** = uygulanabilir · **Onay bekliyor** = "Uygula" denene kadar kod yok · **Açık** = karar verilmedi.

İlgili: `CONTEXT.md` (kısa devir notu), `docs/BACKLOG.md` (fikir havuzu), `docs/COMPETITORS.md` (rakipler),
`docs/PROJECT_BRIEF.md` (ilk brief ve ilk kararlar, 2026-11-16).

## 2026-11-17

| Karar | Neden | Durum |
|---|---|---|
| Türkçe sürüm: İngilizce kökte (`/map`), Türkçe `/tr/` altında; hreflang ve sitemap iki dili bağlar; sayfada EN/TR geçiş düğmesi | Arama motorlarında iki dil ayrı sayfa; İngilizce adresler değişmedi | Kabul, uygulandı |
| Türkçe arayüz metinleri tam; içerik metinleri (pin başlığı/açıklaması) tabloda isteğe bağlı `title_tr` / `description_tr` sütunlarıyla gelir, yoksa İngilizcesi gösterilir | Türkçe iş yükü kurucunun zamanını yemesin | Kabul, uygulandı |
| Türkçe dizgide tipografik kesme işareti (’) kullanılır | Başlık fontunda düz kesme bozuk görünüyor; Türkçe dizgide doğrusu da bu | Kabul |
| Pin sayfaları kalır (Google, paylaşım, sayfa görüntülemesi); oyuncunun asıl deneyimi haritadaki zengin kart olacak (görsel/video küçük resmi, açıklama, kaynak, bulan) | Kurucu "pin sayfasına gerek var mı" diye sordu; 2026-11-16 kararıyla uyumlu | Önerildi, kurucunun yanıtı bekleniyor |
| Rockstar'ın resmi GTA VI sanatı (kurucunun `.next/Media` klasörüne koyduğu 18 görsel) arka plan veya marka öğesi olarak KULLANILMAZ. Görseller git dışında `media-src/` klasöründe saklanır | Rockstar politikası yalnızca ticari olmayan kullanıma göz yumuyor; sitemiz bağış/reklam hedefliyor. Logo kullanımı ayrıca marka kuralımıza aykırı | Kabul |
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
- Topluluk haritası kaynağı (GTADB / Leonida Atlas / diğer) ve lisans doğrulaması.
- Domain ve nihai marka.
