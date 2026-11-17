# Fikir Havuzu (Backlog)

Eklenebilecek her şey burada birikir; sıra değişebilir. Kaynak sütunu fikrin nereden geldiğini gösterir.
Bir madde yapılınca `[x]` olur ve tarih düşülür. Kararlar: `docs/DECISIONS.md`. Rakip bulguları: `docs/COMPETITORS.md`.

Hedef: rakiplerle en az eşit seviye ("giriş bileti"), üstüne sürekli güncel ve bol içerik, topluluk ve online tarafı.

## Giriş bileti (rakip seviyesi, çıkış haftası)

- [ ] Hub ana sayfa: geri sayım (çıkıştan sonra "Gün N"), son haberler, doğrulananlar zaman çizelgesi, harita CTA (LeonidaMap)
- [ ] Haber akışı: her maddede CONFIRMED/RUMOR rozeti, tarih ve birincil kaynak linki (LeonidaMap, bizim kuralımızla daha sıkı)
- [ ] "What's confirmed" sayfası ve söylenti takibi (LeonidaMap)
- [ ] Site geneli arama (⌘K): pinler, sayfalar, veritabanı (LeonidaMap, GTABase)
- [ ] Harita: kümeleme (cluster), lejant paneli, "sıradaki bulunmamış" oku, pin linki paylaşma (GTABase, LeonidaMap)
- [x] Harita: arama, All/None, gizli katmanlar, ücretsiz sınırsız takip (2026-11-17)
- [ ] Mobil kusursuz: yatay taşma yok, başparmakla kullanım (rakiplerin zayıf noktası)
- [ ] EN + TR çift dil, dil seçici, hreflang (karar: DECISIONS)
- [ ] Discord, X ve bağış linkleri; e-posta veya push kaydı (değer gösterildikten sonra sorulur)
- [ ] SSS, çıkış saati (bölgelere göre), karakterler, mekanlar (Leonida, Vice City, Keys) sayfaları

## Farkımız (rakiplerde görülmedi ya da zayıf)

- [ ] "Found by @yayıncı" + zaman damgalı klip her pinde (altyapı hazır, 2026-11-17)
- [ ] Yayıncı liderlik tablosu: en çok bulgu, ilk bulan; yayıncı kendi sayfasını paylaşır
- [ ] "Son bulgular" canlı akışı ana sayfada (yayıncı kaynaklı, zaman damgalı)
- [ ] Kaynak şeffaflığı: verified/unverified/disputed her yerde; "neden doğrulandı" notu
- [ ] Türkçe ilk günden (rakiplerin hepsi İngilizce)

## Faz 2 (ay 1-3): veritabanları ve derinlik

- [ ] Araç veritabanı: stat başına {değer, yöntem, kaynak, örnek sayısı}; kıyaslama (2-3 araç). Ölçüm için atıflı test ortağı (Broughy1322 modeli)
- [ ] Silah, görev, karakter, mülk, hayvan, hile veritabanları (GTABase)
- [ ] Radyo ve müzik listesi (GTABase, Vice City Tracker)
- [ ] Hesaplayıcılar: soygun, işletme, ekonomi; yalnızca doğrulanmış veriyle (GTA BOOM; rakiplerde rakamlar birbirini tutmuyor)
- [ ] Konum önerme formu: ekran görüntüsü veya klip linki, moderasyon kuyruğu (GTABase)
- [ ] Katkıcı liderlik tablosu, dönemsel yarışmalar (GTABase)
- [ ] Kişisel işaret, not, favori; çoklu profil (GTABase VIP; ücretli plan adayları)
- [ ] Rota üretici: seçili kategorideki bulunmamışlar için en kısa tur (RDR2 Collectors Map)
- [ ] Ayar ve ilerleme içe-dışa aktarma (RDR2 Collectors Map; temel yedekleme kodu var)
- [ ] Anket ve quiz (etkileşim; LeonidaMap)
- [ ] Yama notları ve değişiklik geçmişi (harita revizyonu ile bağlantılı)
- [ ] Hesap ve bulut senkron (Supabase; StorageAdapter hazır)

## Faz 3 (ay 3-12): online ve canlı topluluk

- [ ] Haftalık güncelleme sayfası: bonuslar, indirimler, ödül araçları (GTA Online yazıları); her hafta yeni sayfa
- [ ] Günlük değişen içerik takipçileri ("bugün nerede"; Madam Nazar sayfaları, RDR2 günlük döngüler)
- [ ] Etkinlik takvimi ve bildirim (push / Discord)
- [ ] Discord botu: günlük ve haftalık değişenleri, yeni pinleri kanala yazar
- [ ] Envanter ve koleksiyon değeri, net worth (RDR2 Collectors Map, GTABase VIP)
- [ ] Topluluk çeviri katkısı (Crowdin benzeri; RDR2 Collectors Map 35 dil)
- [ ] Açık veri / API (GTADB modeli): güven ve geri link kazandırır
- [ ] Mini oyunlar ve simülatörler (ilk brief)
- [ ] PWA çevrimdışı, ikinci ekran modu (oyun açıkken telefonda)
- [ ] Paylaşılabilir ilerleme kartı, arkadaşla ortak checklist (ilk brief, viral döngü)

## Gelir (kalite ve kapsama göre sonra belirlenir)

- [ ] Bağış linki (ilk aşama, onaylandı)
- [ ] Reklam: trafik oluşunca; harita sayfasında minimal, rehber ve veritabanı sayfalarında ana yerleşim
- [ ] Affiliate (ön sipariş, donanım; Vice City Tracker)
- [ ] Ücretli plan adayları: reklamsız, çoklu profil, sınırsız kişisel işaret/not, bulut senkron (GTABase VIP, Mapmaster PRO yılda 9,99 $)
