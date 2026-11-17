# Veri Şeması Taslağı v0.1 (kodsuz)

Durum: F1 kısmı TypeScript'e dönüştürüldü (`src/domain`). Kod ile çelişirse kod esastır.
Faz etiketleri: [F1] lansman, [F2] ay 1-3, [F3] ay 3-12.

## Temel Kurallar (zero-refactor için)
1. **ID'ler değişmez.** Kullanıcı ilerlemesi ID'ye bağlı. Slug (URL adı) değişebilir; eski slug yeni sayfaya 301 yönlendirir.
2. **Silme yok, devre dışı bırakma var.** Pin kaldırılırsa `status = deprecated` olur; kullanıcı kayıtları bozulmaz.
3. **Veri dilden bağımsız.** Varlıklarda yalnızca ID, koordinat, sayı, durum var. Metinler (başlık, açıklama) ayrı dil dosyalarında, ID ile anahtarlanır. Yeni dil = yeni dosya, şema değişmez.
4. **Koordinatlar normalize** (0 ile 1 arası, harita görselinin oranı). Tile çözünürlüğü veya harita görseli değişse pinler kaymaz.
5. **Resmi veri ile kullanıcı verisi ayrı.** Resmi veri git'te, salt okunur. Kullanıcı verisi `StorageAdapter` arkasında (önce yerel, sonra bulut).
6. **Her şeyin sürümü var.** `dataVersion` (resmi veri) ve `schemaVersion` (kullanıcı verisi); göç (migration) adımları listelenir.
7. **Doğrulama durumu zorunlu.** `verified / unverified / disputed`; doğrulanmamış pin arayüzde ayrı görünür.
8. **Özellik kilitleri Entitlements ile.** Ücretli özellik kodda plan adıyla değil, özellik anahtarıyla kontrol edilir.

## Resmi Veri Varlıkları

### Game [F1]
| Alan | Açıklama |
|---|---|
| id | `gta6` (ileride başka oyunlar) |
| slug, status | yayın durumu (prelaunch, live) |

### MapDef [F1]
| Alan | Açıklama |
|---|---|
| id, gameId | harita kimliği (ana harita, ileride iç mekan/ada) |
| imageSize | kaynak görsel boyutu (px) |
| tiling | tile yolu, min/max zoom |
| revision | yama sonrası harita sürümü |

### Category [F1]
| Alan | Açıklama |
|---|---|
| id, slug, sortOrder | kimlik ve sıra |
| nameKey | dil dosyası anahtarı |
| iconToken, colorToken | tasarım token'ına referans (yön C) |
| countsForProgress | ilerleme yüzdesine dahil mi |

Başlangıç kategorileri: Gizli Paketler, Easter Egg'ler, Nadir Araçlar, Silah Lokasyonları, Güvenli Evler, Yan Görevler.

### Pin [F1]
| Alan | Açıklama |
|---|---|
| id | değişmez ID |
| slug | SEO adı (değişebilir) |
| mapId, categoryId | konum bağlamı |
| coord | normalize [x, y] |
| region | bölge adı anahtarı (opsiyonel) |
| status | verified / unverified / disputed / deprecated |
| source | stream, topluluk, kendi keşfim |
| credit | bulan kişinin adı + bağlantı (atıf) |
| media | görsel/video referansları |
| tags, relatedIds | etiket ve ilişkili pinler |
| addedAt, updatedAt, dataVersion | tarih ve sürüm |
Metinler: `pin.<id>.title`, `pin.<id>.description` (dil dosyasında).

### Checklist ve ChecklistItem [F1]
| Alan | Açıklama |
|---|---|
| checklist: id, slug, titleKey, sections | bölümlere ayrılmış liste (100% Completion, Görevler, Koleksiyon) |
| item: id, labelKey, type | mission / collectible / manual |
| item.linkedPinId | varsa haritadaki pine bağlı |
| item.weight | yüzde hesabındaki ağırlık |

### Guide [F1/F2]
| Alan | Açıklama |
|---|---|
| id, slug, titleKey | rehber kimliği |
| bodyPath | MDX içerik dosyası |
| relatedPinIds, checklistId | bağlantılar |
| updatedAt | tazelik (SEO için) |
Her Guide ve Pin için statik sayfa üretilir (reklam pageview + SEO).

### Vehicle ve Weapon [F2]
| Alan | Açıklama |
|---|---|
| id, slug, classKey | sınıf |
| stats | topSpeed, acceleration, handling, braking (sayısal) |
| price, modCost | fiyatlar (oyun çıkınca doğrulanır) |
| acquisition | nasıl elde edilir, `linkedPinId` opsiyonel |
| status | verified / unverified |

### EconomyActivity ve PriceTable [F2]
Soygun, işletme, borsa: `activityId`, tür, kazanç aralığı, süre, gereksinimler. Hesaplayıcılar bu tablolardan okur; formül kodda, sayılar veride.

### MiniGame [F3]
`id, route, titleKey, difficulty`; skor tablosu ayrı kayıt.

## Kullanıcı Verisi (StorageAdapter arkasında)

### Profile [F1]
| Alan | Açıklama |
|---|---|
| id, gameId, name | profil |
| ownerId | giriş yoksa boş (yerel), giriş varsa kullanıcı |
Ücretsiz = oyun başına 1 profil, premium = çoklu. Şema baştan çoklu profili destekler.

### UserProgress [F1]
| Alan | Açıklama |
|---|---|
| profileId | hangi profil |
| ref | pinId veya checklistItemId |
| done, doneAt | durum |
| note | kişisel not (premium) |
| schemaVersion, updatedAt | göç ve senkron çakışması için |
İlerleme yüzdesi saklanmaz, her zaman hesaplanır: tamamlanan ağırlık / `countsForProgress` toplamı.

### UserMarker [F2]
Kişisel pin (premium): `id, profileId, mapId, coord, customCategory, note, imageRef`. Resmi Pin'den ayrı tür.

### Collection [F2/F3]
`profileId, entityType, entityId, flags (owned, upgraded, favorite), note, imageRef`. Net worth = sahip olunan öğe × fiyat; saklanmaz, hesaplanır.

### Export / Import Kodu [F1]
Yerel kayıt cihaz değiştirince kaybolmasın diye ilerleme tek bir kod olarak dışa aktarılır. Hesap sistemi gelene kadar yedekleme yolu.

## Hesap, Plan, Topluluk

### User ve Entitlements [F2/F3]
| Alan | Açıklama |
|---|---|
| user: id, planId, createdAt | hesap |
| plan → features | free / pro; özellik anahtarları: `multiProfile`, `userMarkers`, `cloudSync`, `adFree`, `customImages`, `netWorth` |

### Contribution [F3]
`id, proposerId, payload (önerilen pin), status (pending / approved / rejected), reviewerId, reason, createdAt`. Onaylanınca Pin'e dönüşür, `credit` alanına yazılır.

## Dil Dosyaları (i18n)
- Konum: dil başına bir dosya (`en` varsayılan, `tr` ve diğerleri sonra).
- Anahtar biçimi: `<tür>.<id>.<alan>`.
- Çevrilmemiş anahtar İngilizceye düşer (fallback).

## Açık Sorular (kullanıcı kararı)
1. İç mekan veya ayrı ada haritaları olacak mı (çoklu MapDef)?
2. ID biçimi: sıralı (`pin_000123`) mi, rastgele (ULID) mi? Öneri: ULID, yayın izlerken çakışma olmaz.
3. Hangi kategoriler %100 ilerlemeye sayılır?
4. Yerel kayıt için export kodu lansmanda şart mı?
