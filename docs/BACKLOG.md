# Fikir Havuzu (Backlog)

Eklenebilecek her şey burada birikir; sıra değişebilir. Kaynak sütunu fikrin nereden geldiğini gösterir.
Bir madde yapılınca `[x]` olur ve tarih düşülür. Kararlar: `docs/DECISIONS.md`. Rakip bulguları: `docs/COMPETITORS.md`.

Hedef: rakiplerle en az eşit seviye ("giriş bileti"), üstüne sürekli güncel ve bol içerik, topluluk ve online tarafı.

## Giriş bileti (rakip seviyesi, çıkış haftası)

- [x] Hub ana sayfa: geri sayım (çıkıştan sonra "Gün N"), son bulgular, doğrulananlar zaman çizelgesi, harita CTA (2026-11-17)
- [x] Haber arşivi `/news` + `/tr/news`, rozet ve kaynak; ana sayfada son 5 haber (2026-11-17). İçerik yok, ilk haberler bekleniyor
- [ ] Haberler için tablo aktarımı (`import:news`), haber sayısı artınca
- [ ] Haber başına ayrı sayfa (SEO), haber sayısı artınca
- [ ] "What's confirmed" sayfası ve söylenti takibi (LeonidaMap)
- [ ] Site geneli arama (⌘K): pinler, sayfalar, veritabanı (LeonidaMap, GTABase)
- [x] Harita: kümeleme, lejant paneli, "sıradaki bulunmamış" oku (2026-11-17)
- [x] Harita: pin linki paylaşma butonu (2026-11-17, kartta)
- [ ] Harita görseli gelince ana sayfa sahnesine uyumlu renk ayarı (yer tutucu harita eski broşür renklerinde)
- [x] Harita: arama, All/None, gizli katmanlar, ücretsiz sınırsız takip (2026-11-17)
- [x] Mobil: 390 px'te taşma yok, menü kaydırılabilir satır, harita üstte panel altta (2026-11-17)
- [ ] Discord ve bağış hesapları açılınca `src/config/site.ts` > `links` doldurulur (alt bilgide otomatik görünür)
- [x] EN + TR çift dil, dil seçici, hreflang, iki dilli sitemap (2026-11-17)
- [x] Haritada zengin pin kartı: video küçük resmi, açıklama, kaynak, "Found by", paylaş (2026-11-17)
- [ ] Pin kartında kendi ekran görüntülerimiz (`media` alanı hazır; görsel yükleme akışı yok)
- [ ] Footer'daki "Support us" gibi sosyal link etiketlerini çevir (linkler açılınca)
- [ ] İçerik büyüyünce: her dilin sözlüğünü yalnızca kendi sayfasına yükle (şu an iki dil de istemci paketinde)
- [ ] Discord, X ve bağış linkleri; e-posta veya push kaydı (değer gösterildikten sonra sorulur)
- [ ] SSS, çıkış saati (bölgelere göre), karakterler, mekanlar (Leonida, Vice City, Keys) sayfaları

## Çıkış araştırmasından (2026-11-18, `docs/research/2026-11-18-cikis.md`)

Öncelik sırasıyla:
- [ ] **Kaçırılabilirler listesi**: hikâye görevleri tekrar oynanamıyor (IGN). "Bunu yapmadan ilerleme" uyarıları, spoiler kapılı. Rakiplerde yok; en çok aranacak rehber türü
- [ ] **Para haritası**: Smash 'n' Grab (35), büyük/küçük banka (8/14), Payday Loans (7), ATM (167), suç üsleri (~24). Kategori önerisi DECISIONS'ta
- [ ] **Ulaşım katmanı**: hızlı yolculuk yok. Tren istasyonu (25), feribot (2), araç çağırma; "en hızlı yol" ipuçları. Rota üretici (Faz 2) öne çekilebilir
- [ ] **Heat rehberi**: aranma nasıl soğur (kılık, araç, silah, partnerden ayrılma) + suçlu profili (Professional → Psycho). Kalıcı arama trafiği, kısa video konusu
- [ ] **Neyin ne zaman açıldığı**: yan aktivitelerin çoğu hikâyeye bağlı; bölüme göre tablo (spoiler kapılı)
- [ ] **Kalıcı gelişim**: meditasyon noktaları (Focus), spor salonları (9) + açık hava aletleri, su altı keşifleri (6)
- [ ] **Aktivite listesi**: yarışlar, drone zaman yarışları (8), poligon, golf, balık (6), Thrillbilly Mud Club
- [x] Haber/takip sayfaları: "GTA 6 Online ne zaman", "GTA 6 PC ne zaman" (2026-11-18, /guides/pc-online-fivem-release-tracker) (arama hacmi yüksek, her yeni bilgiyle güncellenir)
- [ ] Ayarlar rehberi: 30 FPS'te daha akıcı his (hareket bulanıklığı vb.), kontrol önerileri (eleştirilerin ortak noktası)

## Tasarım ve kimlik (konsept onaylandı, 2026-11-18)

Konsept: "Six Star = en yüksek aranma seviyesi + Leonida saha rehberi". Hazır şablon görünümünden çıkış (sixstarsapp.com benzerliği).
- [ ] Ana sayfa için 2-3 farklı yönde taslak (yol atlası / polis dosyası / gazete manşeti); kurucu seçer, sonra tüm siteye
- [ ] Referans görseller: kurucu gönderirse onlarla, yoksa Claude seçer (oyun siteleri dışından)
- [ ] Renk, yazı tipi ve bileşen sistemi konseptten (Inter + koyu kart şablonu yerine)
- [ ] İmza öğe: her pin ve rehbere "dava numarası" (Six Star Dosya #0142); paylaşılan linkte de görünür
- [ ] Logo turu 2: daha dolgun şerif yıldızı ("classic sheriff star with thick rounded arms, not two overlapping triangles"); iki üçgenli yıldızın Davut Yıldızı'na benzeme riski
- [ ] Kimlik oturunca imza görseller için bir kez gerçek illüstratör

## Topluluk (kurucu istedi, 2026-11-19)

Amaç: sosyal medyadan gelen ziyaretçiyi sitede tutmak, pinleri tek kişiden değil topluluktan toplamak.
- [ ] Aşama 1: haritada "Pin öner" (kategori, başlık, klip/ekran görüntüsü linki, not, takma ad), Turnstile, D1 onay kuyruğu, korumalı onay sayfası; onaylanan pinde "Found by @kişi"
- [ ] Aşama 2: Discord ile giriş; profil (bulduklarım, önerilerim, ilerleme senkronu); "Ben de buldum" onayı: farklı kullanıcılardan N onay = doğrulandı; yıldız rütbeleri (1-6 yıldız, Six Star en üst); haftalık ve tüm zamanlar sıralaması
- [ ] Aşama 3: Discord sunucusu + bot (yeni pin, haftalık en iyi bulgular); haftalık bulgu etkinlikleri; güvenilir kullanıcılar (4+ yıldız) onay beklemeden yayınlar
- [ ] Her pin için paylaşılabilir kart görseli ("Found by @kişi"): bulan kişi paylaşır, trafik gelir
- [ ] Hesap açılınca: gizlilik metni, veri silme talebi (KVKK/GDPR)

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
- [x] Short video hattı: "Six Star File" formatı, `npm run short`, akşam rutini `/shorts-plan` (2026-11-18, `shorts/README.md`)
- [ ] Harita yakınlaşması için temiz harita görüntüsü: `/map?pin=` sayfasından panelsiz dikey ekran görüntüsü (gerçek harita gelince; site kodu, onay gerekir)
- [ ] Akşam rutinini bulutta zamanlanmış göreve çevirmek (her akşam 20:00, plan GitHub'a düşer); kurucu isterse
- [ ] Veri girişi sunucuda: `/map?dev=true` satırları tarayıcı yerine Cloudflare D1'e yazılsın, giriş Cloudflare Access ile korunsun; CSV indirme/inbox adımı kalkar, tarayıcı verisi silinince kayıp olmaz. Gönüllü editör eklenince şart.

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

## Mod ve sunucu (2026-11-18 araştırması, kurucu sordu)

Durum: GTA VI'da mod yok (yalnızca PS5/Xbox, PC duyurulmadı; tahmin 2027-2028). Konsolda mod mümkün değil
(jailbreak = kullanım şartı ihlali ve ban). Rockstar 2023'te FiveM'in sahibi Cfx.re'yi aldı; çok oyunculu modlar yalnızca
FiveM/RedM üzerinden serbest. Ocak 2026'da Cfx Marketplace açıldı (ücretli mod satışı); sunucu gelirinde tek yol Tebex,
oyun içi para/eşya satışı kısıtlı. GTA VI için FiveM desteği açıklanmadı.
- [ ] GTA V FiveM üzerinde kendi script/kaynak paketlerimiz, Cfx Marketplace'te satış (Lua/JS). GTA VI'ya geçişte hazır ekip ve müşteri
- [x] Sitede "GTA VI RP / FiveM / PC ne zaman" takip sayfası (2026-11-18) (arama hacmi yüksek, her yeni bilgiyle güncellenir)
- [ ] RP sunucu dizini (GTA VI desteği gelince; şimdiden GTA V RP ile başlanabilir)

**FiveM hazırlık planı (kurucu onayladı, 2026-11-18).** Başlangıç şartı: harita işi bitince (resmî/GTADB harita
yerleşti, pin girişi oturdu). O zaman Claude hatırlatır. Amaç: GTA VI'ya FiveM desteği geldiğinde hazır olmak.
1. Pazarı öğren: Cfx Marketplace'te en çok satan script türleri, fiyat aralıkları, ESX/QBCore/Qbox çatıları,
   açık kaynak rakipler (ox_*), yorumlarda en çok şikâyet edilen eksikler.
2. Kuralları netleştir: fivem.net/terms (Creator PLA), Tebex şartları, Rockstar mod kuralları; neyin satılabildiği.
3. Test sunucusu kur, 1 küçük script yaz ve yayınla (ücretsiz), geri bildirim topla.
4. 2-3 ücretli script; site ile çapraz tanıtım (RP takip sayfası, sunucu dizini).
5. GTA VI FiveM duyurusunu takip et; geçiş planı.

## Gelir (kalite ve kapsama göre sonra belirlenir)

- [ ] Bağış linki (ilk aşama, onaylandı)
- [ ] Reklam: trafik oluşunca; harita sayfasında minimal, rehber ve veritabanı sayfalarında ana yerleşim
- [ ] Affiliate (ön sipariş, donanım; Vice City Tracker)
- [ ] Ücretli plan adayları: reklamsız, çoklu profil, sınırsız kişisel işaret/not, bulut senkron (GTABase VIP, Mapmaster PRO yılda 9,99 $)
