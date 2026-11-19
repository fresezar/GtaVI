# Rakip Analizi

Tarih: 2026-11-17 (çıkıştan 2 gün önce). Yeni bulgu çıktıkça bu dosyaya eklenir; tarihli not düşülür.
Fikir havuzu: `docs/BACKLOG.md`. Kararlar: `docs/DECISIONS.md`.

## Özet

- GTA VI harita ve rehber alanı çıkıştan önce dolu: en az 9 hayran sitesi, 1 mobil uygulama, GTABase ve muhtemelen MapGenie.
- Yeni bir domain'in ilk haftalarda arama trafiği alması zor. İlk trafik yayıncı, sosyal medya ve topluluktan gelir.
- Uzun ömürlü siteler ya bir işte çok derin (RDR2 Collectors Map) ya da ölçüm yöntemiyle güvenilir (Broughy1322). Genel ve sığ siteler unutuluyor.
- Ücretsiz ve sınırsız ilerleme takibi artık standart. Ücretli plan; reklamsızlık, çoklu profil ve kişisel işaret/not üzerinden satılıyor.

## GTA VI rakipleri

| Site | Ne sunuyor | Gelir | Not |
|---|---|---|---|
| GTABase (`gtabase.com/gta-6/map`) | Harita: arama, "sıradaki bulunmamış" oku, pin paylaşma, kişisel işaret/favori/not, ekran görüntüsüyle konum önerme (ekip onaylı), katkıcı liderlik tablosu (ödüllü yarışmalar). Veritabanları: araç, silah, görev, karakter, hayvan, mülk, hile. Haber, radyo, diğer oyunlar | VIP: reklamsız; 100 kişisel işaret, favori ve not (ücretsizde 5); işaretlere ekran görüntüsü ve özel kategori; 4 harita profili | En güçlü rakip. Domain otoritesi yüksek, GTA V'den beri var |
| Vice City Tracker | 2.875 yer işareti (GTADB verisi, CC BY 4.0 olduğunu söylüyor), "keşfedildi %" takibi (tarayıcıda), karakter, araç, müzik, ekran görüntüsü, bölgelere göre çıkış saati, RSS, geri sayım widget'ı, e-posta listesi | Ön sipariş affiliate linkleri | Ayrı checklist yok |
| LeonidaMap.org | Ayrıntısı aşağıda | Ücretsiz; "reklam gösterebiliriz" onayı, bağış | Tasarımı referans alıyoruz |
| GTA BOOM | ~1.600 işaretli yer haritası, gerçek dünya karşılıkları, soygun kazanç hesaplayıcısı | Reklam | GTA V'den beri hesaplayıcı uzmanı |
| leonidacompanion, gta6map.co, exploregta6, theleonidamap, gta6maps.online | Harita ve %100 listesi (çoğu çıkışta açılacak) | Çoğu ücretsiz | Birbirine benziyor |
| Leonida Map & Collectibles (Android) | Takip, hesapla cihazlar arası senkron | Uygulama | Mobil kanal |
| GTADB (`gtadb.org`) | 2013'ten beri açık kaynak GTA coğrafi veritabanı: harita, API (yükselti, geocoding, rota), işaretleme aracı | Ücretsiz | Harita kaynağı adayı, lisans doğrulanmalı |
| Leonida Atlas | Açık kaynak, 2.204 kaynaklı yer | Ücretsiz | Harita/veri kaynağı adayı |
| Çıkış günü yeni gelenler (2026-11-18): leonidaverse.com, sixintelhq.com, vicesixmap.com, gta6collectiblesmap.com, map-6.com, thegtamap.com, gtaintel.com, sixhype.com | Harita + %100 listesi; Map-6: 1.900 gerçek dünya eşleşmesi, mesafe ölçme, "yalnızca resmî" görünümü; çoğu GTADB karosu | Reklam, Amazon affiliate, bazı ücretli katmanlar | Pazar çok kalabalık. Fark hız, kaynaklı klip ve Türkçe olmalı. "Six" önekli iki site var: marka karışabilir |
| MapGenie | Siteye erişilemedi, GTA VI durumu doğrulanamadı | Pro üyelik | Büyük oyunlarda genelde ilk gün hazır olur |

## LeonidaMap.org yakın inceleme

Yapı:
- Ana sayfa bir **hub**: geri sayım, iki büyük çağrı butonu (harita / doğrulananlar), "Road to GTA 6" zaman çizelgesi.
- Masaüstünde 3 sütun: solda haber akışı, ortada zaman çizelgesi, sağda menü ve sosyal linkler.
- Mobilde üstte kayan haber bandı, butonlar ve menü kartları.
- Her haber ve olayda **CONFIRMED / RUMOR** rozeti, tarih ve "Source:" satırı.
- Menü: What's Confirmed, Characters, Setting, News, Release Date, FAQ, Polls, Quiz, Rumor Tracker, Database.
- Harita sayfası: tam ekran harita, solda arama ve %100 kutusu ("hide found", reset), kategori sayaçları, All/None. Lejant paneli, kümeleme (cluster), yükselti göstergesi; popup'ta video rehber.
- Üst menüde ⌘K arama.
- Push bildirim izni ve çerez onayı ilk girişte çıkıyor.

Görsel dil: koyu zemin üstünde gün batımı ve palmiye fotoğrafı, neon pembe butonlar, turkuaz noktalar, yuvarlak kartlar, kalın sans-serif başlıklar. Oyunun atmosferine uyuyor, yoğun ve "canlı" görünüyor.

Zayıf noktaları (bizim fırsatımız):
- ~~Mobilde yatay taşma~~ (düzeltme, 2026-11-17: ekran görüntüsü aracımızın hatasıydı; headless Chrome'un asgari
  pencere genişliği 390 px'ten büyük. Site iframe'e izin vermediği için gerçek 390 px'te doğrulanamadı.)
- "Confirmed" etiketli maddelerin bir kısmı Rockstar'a değil üçüncü taraf sitelere dayanıyor.
- Harita görseli "Map © Rockstar Games" notuyla Rockstar'ın haritası. Hukuki risk; bunu kopyalamayız.
- Bildirim ve çerez pencereleri ilk saniyede ekranı kapatıyor.
- Ön izleme döneminde GTA V verisi gösteriyor, ama "tüm veri bizim" diyor (çelişki).

## GTA V ve RDR2'den kalıcı örnekler

| Örnek | Neden kalıcı |
|---|---|
| Jean Ropke RDR2 Collectors Map (açık kaynak, 612 yıldız, 8.800+ commit) | Tek bir işte derinlik: günlük döngüler (toplulukça bildirilen), envanter ve toplam satış değeri, rota üretici, ayar/işaret içe-dışa aktarma, 35 dil (Crowdin), sorun giderme rehberleri, Discord. Ayrı bir RDO haritası da var |
| Broughy1322 (gtacars.net) | Standart test yöntemiyle tur süresi ve azami hız. Sektör bu veriyi kullanıyor; GTABase oyundaki stat çubuklarının yanlış olduğunu yazıyor |
| Madam Nazar "bugün nerede" sayfaları | Günlük değişen bilgi = her gün dönen ziyaretçi. Birçok site aynı sayfayı her sabah güncelliyor |
| GTA Online haftalık güncelleme yazıları | Her hafta yeni sayfa (podyum aracı, indirimler, bonuslar). Kalabalık ama sürekli trafik |
| GTA BOOM hesaplayıcıları | Soygun ve işletme kazancı. Kaynaklar birbirini tutmuyor: doğru ve güncel veri farkı yaratır |
| Mapmaster | PRO yılda 9,99 $. Ücretsiz kayıtlı kullanıcıya 50 işaret ve 3 kategori sınırı (kısıtlayıcı model) |
| Gamer Guides | Reklamsız plan yılda 34,99 $, özel harita notları dahil |

## GTA 6 Intel yakın inceleme (2026-11-19)

gta6intel.com. Kurucusu hile sayfasını başkaları kullansın diye paylaşmış (Sezar iletti). Hile kodları ve açılma koşulları oradan alındı, sayfamızda atıf var.

| Alan | Ne var |
|---|---|
| Veritabanı | 18 kategori: araç (322), karakter (73), silah (35), işletme (101), konum (111), görev (137), hile (61), çete (12), radyo, telefon uygulamaları, kupalar, sürümler. Karşılaştırma aracı |
| Her kayıt sayfası | "Suggest an edit" (kaynak zorunlu), özel not, kaydet ve takip et, Discord ile senkron yorumlar, "Actively monitored · updated 19 hours ago" damgası |
| Topluluk | Rep puanı: pin +60, düzeltme +40, fikir +25, yorumda Respect +2 (günde en fazla 20), Discord bağlama +25, haftanın birincisi +500. 91 seviyeli rütbe (Thug ile Kingpin arası), Discord'da rol olarak görünür. Puanı sadece ilk öneren alır |
| Araçlar | Oyuncu sayısı, sunucu durumu, oyunun kaç saatte bittiği, harita büyüklüğü, satış rakamları, geri sayım, "Ask The Informant" |
| Hile sayfası | PS5/Xbox geçişi, arama, tür filtresi, kopyala, kumandada adım adım gösterim, yıldızla favori, her hileye ayrı sayfa |
| Gelir | Görünür reklam ya da abonelik yok |

**Dersler:**
1. **Her kayda ayrı sayfa, arama trafiği getirir.** 61 hile, 322 araç ve 137 görevin her birinin kendi adresi var. Biz hileleri tek sayfada tuttuk; arama trafiği için `/cheats/<slug>` sayfaları sonra eklenmeli.
2. **Tazelik damgası güven veriyor.** "19 saat önce güncellendi" yazısı sayfayı canlı gösteriyor. Bizde pin ve rehberlerde güncelleme tarihi var ama görünmüyor.
3. **Puan tablosu açık.** Hangi iş kaç puan getiriyor, sayfada yazıyor. "Puanı sadece ilk öneren alır" kuralı aynı önerinin tekrar tekrar gelmesini engelliyor. Bizim rütbeler bulgu sayısına bağlı; puan tablosu daha açık bir teşvik.
4. **Discord siteye bağlı.** Yorumlar Discord ile senkron, rütbe Discord'da rol olarak görünüyor. Discord'daki hareketi site besliyor, tersi değil.
5. **Her bilgiye düzeltme önerisi.** Sadece pin değil, her kayıt düzeltilebiliyor; veriyi topluluk temizliyor.
6. **Kişisel not ve kaydetme kullanıcıyı hesap açmaya itiyor.** Bizde ilerleme takibi aynı rolü oynayabilir.
7. **Zayıf yanları:** harita 224 pin (bizde 190 artı topluluk pinleri, yakın), koleksiyonlar ve akrobatik atlayışlar "yakında", partner ya da içerik üreticisi programı yok, Türkçe yok.

## Dersler

1. **Harita tek başına fark değil, giriş biletidir.** Rakip seviyesinde olmak için tam ekran harita, arama, kümeleme, lejant, "sıradaki bulunmamış", paylaşılabilir pin linki ve ücretsiz sınırsız takip şart.
2. **Hub olmak trafiği tutar.** Haber, doğrulananlar, zaman çizelgesi, SSS ve veritabanları; tek sayfalık bir haritadan çok daha fazla sayfa görüntülemesi ve arama girişi üretir.
3. **Güven, kaynak şeffaflığından gelir.** Rozet (confirmed/rumor/verified) her yerde olmalı ve gerçekten birincil kaynağa dayanmalı. Rakiplerin zayıf noktası burası.
4. **Tekrar eden trafik, değişen içerikten gelir:** günlük döngüler, haftalık güncellemeler, etkinlik takvimi. Online tarafı açıldığında bu bizim motorumuz olur.
5. **Topluluk katkısı ölçek sağlar:** konum önerme, liderlik tablosu, çeviri katkısı, Discord. Ama moderasyon kuyruğu ve kaynak zorunluluğu olmadan güveni bozar.
6. **Derinlik kazanır.** Genel kapsamı koruyup her alanda "en iyi" olabilecek bir derinlik katmanı eklenmeli (rota üretici, ölçüm yöntemi, envanter değeri).
7. **Ölçülmüş veri, ölçeni ortak yapmakla gelir.** PS5 olmadan araç verisi için test yapan biriyle atıflı ortaklık gerekir.
8. **Hukuki çizgi:** Rockstar'ın harita ve sanat görselleri kullanılmaz. Topluluk haritası lisansla ve atıfla kullanılır.
9. **Mobil kusursuz olmalı.** Oyuncu siteyi telefonda, oyun açıkken kullanır. Mobil test gerçek genişlikte yapılır
   (390 px iframe ya da cihaz emülasyonu); dar pencereli headless ekran görüntüsü yanıltıcıdır.
10. **Rahatsız etme.** İlk saniyede bildirim ve çerez pencereleri çıkmamalı; değer gösterildikten sonra sorulmalı.

## Kaynaklar

- https://www.gtabase.com/gta-6/map/
- https://www.vicecitytracker.com/map
- https://leonidamap.org/ ve https://leonidamap.org/map/ (ekran görüntüleriyle incelendi)
- https://leonidacompanion.com/map/ · https://gta6map.co/ · https://www.exploregta6.com/map
- https://play.google.com/store/apps/details?id=at.horizonapps.gta6map
- https://gtadb.org/
- https://www.gtaboom.com/fans-have-built-a-fully-interactive-gta-6-map-already-1016
- https://www.gtaboom.com/heist-earnings-calculator-h4bd
- https://mapmaster.io/pricing · https://www.gamerguides.com/premium
- https://github.com/jeanropke/RDR2CollectorsMap · https://jeanropke.github.io/RDR2CollectorsMap/
- https://gtacars.net/gta5/topspeed
- https://holdtoreset.com/where-is-madam-nazar-today-in-red-dead-online/
