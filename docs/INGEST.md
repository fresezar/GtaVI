# Veri akışı: kaynaktan siteye

Sezar kaynakları tabloya yazar, Claude tabloyu içe aktarır, doğrular, build alır ve yayınlar.

## 1. Tablo (Google Sheets)

Kurulum (bir kez):
1. Tarayıcıda `sheets.new` aç (boş tablo açılır). Adını ver, ör. "Atlas veri".
2. **File > Import > Upload** > `content/import-template.csv` dosyasını seç > "Replace spreadsheet" > **Import data**.
3. Alttaki sekmenin adını **pins** yap. Örnek satırı sil, başlık satırı kalsın. Başlık satırını dondur: **View > Freeze > 1 row**.
4. Yine **File > Import > Upload** > `content/news-template.csv` > bu sefer **"Insert new sheet(s)"** seç. Yeni sekmenin adını **news** yap, örnek satırı sil.

Gönderme:
- **File > Download > Comma-separated values (.csv)**: yalnızca açık olan sekmeyi indirir. Dosyayı
  `inbox/` klasörüne koy (ör. `inbox/pins-2026-11-19.csv`) ve "inbox'a koydum" de.
- Az satır için: hücreleri seçip kopyala, sohbete yapıştır (sekmeyle ayrılmış metin de kabul edilir).
- Her seferinde yalnızca **yeni ya da değişen satırları** gönder (ya da gönderdiklerine "notes" sütununda "gönderildi" yaz).
- Claude Google Drive'ı doğrudan okuyamaz; dosya `inbox/` üzerinden ya da sohbetle gelir.

| Sütun | Zorunlu | Örnek | Not |
|---|---|---|---|
| category | evet | Collectibles | Kategori adı ya da slug'ı (liste aşağıda) |
| title | evet | Rooftop package behind the motel sign | İngilizce, kendi cümlemiz (kopya metin yok) |
| title_tr | | Motel tabelasının arkasındaki çatı paketi | Türkçe başlık; boşsa Türkçe sayfada İngilizcesi görünür |
| description | | Climb the fire escape, north side. | Kısa tarif |
| description_tr | | Kuzey taraftaki yangın merdiveninden tırman. | Türkçe tarif (isteğe bağlı) |
| coord | evet* | 0.4512, 0.3381 | `/map?dev=true` ekranında haritaya tıkla, kopyalanan değeri yapıştır |
| source_url | önerilir | YouTube/Twitch/Reddit linki | Video sayfada gömülü gösterilir |
| timestamp | | 1:02:33 | Videoda anın zamanı; linke otomatik eklenir |
| finder | önerilir | StreamerName | "Found by" atfı |
| finder_url | | https://twitch.tv/... | Bulan kişinin kanalı |
| spoiler | | none / mild / major | Varsayılan none. Hikaye detayı varsa mild/major |
| status | | unverified / verified / disputed | Varsayılan unverified. verified = 2 bağımsız kaynak ya da topluluk onayı |
| confidence | | low / medium / high | Varsayılan medium |
| region | | Downtown | İsteğe bağlı |
| id | | pin_01... | Doluysa yeni pin açılmaz, o pin güncellenir (yalnızca dolu hücreler) |
| notes | | | Sana özel; içe aktarılmaz |

\* Koordinatı olmayan satır reddedilmez; "konum bekliyor" listesinde raporlanır. Koordinatı ekleyip tekrar gönderirsin.

Kategoriler (ID'ler kalıcı, adlar değişebilir):
Story missions, Side missions, Activities, Collectibles, Stunt jumps, Random events, Rare vehicles,
Easter eggs, Weapon pickups, Safehouses, Shops & services, Landmarks.
İlerleme yüzdesine sayılanlar: ilk altısı. Shops ve Landmarks haritada varsayılan kapalı.
Oyunda olmayan kategori kullanılmadan kalır (silinmez). Yeni kategori: `content/categories.json` + `content/text.en.json`.

## 2. Claude'un yaptığı (komutlar)

```
npm run import:pins -- yol/tablo.csv            # kuru çalıştırma: rapor, hiçbir şey yazmaz
npm run import:pins -- yol/tablo.csv --write    # uygula
npm run validate                                # içerik sözleşmesi (build öncesi otomatik de çalışır)
```

Rapor şunları ayırır: yeni pinler, güncellenenler, konum bekleyenler, olası kopyalar (aynı kategoride çok yakın
pin; güncellemek için `id` sütununa mevcut ID yazılır ya da `--allow-near`), hatalı satırlar (satır numarasıyla).

Kurallar (otomatik denetlenir):
- Pin ID'si kalıcıdır, pin asla silinmez: `"status": "deprecated"`. Commit'li bir ID kaybolursa build durur.
- AI'ın topladığı satırda (`extracted_by: ai`) kaynak linki zorunludur ve durum unverified kalır.
- Başka sitelerden metin kopyalanmaz; yalnızca olgular, kendi anlatımımızla.

## 3. Otomatik olanlar

- İlk gerçek pin girdiği anda örnek veri sitenin her yerinden kalkar (ayrıca temizlik adımı yok).
- Her sayfa iki dilde: İngilizce kökte (`/map`), Türkçe `/tr/` altında (`/tr/map`). Arayüz metinleri
  `src/i18n/ui.en.ts` ve `ui.tr.ts`'de (TR'de eksik anahtar derlemeyi durdurur); içerik metinleri `content/text.<dil>.json`.
- Her pin için `/pins/<slug>/` sayfası: video (zaman damgalı), "Found by", doğrulama rozeti, yakındaki pinler.
- Checklist'ler pinlerden üretilir: `/checklists/100-percent-completion/` ve ilerlemeye sayılan her kategori için bir liste.
- Sitemap tüm pin ve checklist sayfalarını içerir.

## 4. Haberler

Haber linkini gönder: sohbete yapıştır (en kolayı) ya da Sheet'in **news** sekmesini (`url, kind, note`) CSV olarak
`inbox/` klasörüne koy. "Doğrulandı mı, söylenti mi" notu isteğe bağlı; karar kaynağa göre verilir. Claude:
- özgün bir başlık ve 1-2 cümlelik özet yazar (kaynak metin kopyalanmaz), EN ve TR;
- `content/news.json` kaydı açar: tarih, `confirmed` / `rumor`, kaynak adı ve linki;
- metinleri `content/text.en.json` ve `text.tr.json` dosyalarına `news.<id>.title|summary` anahtarlarıyla yazar.

`confirmed` yalnızca birinci elden kaynakla (Rockstar, Take-Two) verilir; diğer her şey `rumor` olarak etiketlenir.
Haber ana sayfada (son 5) ve `/news` sayfasında görünür.

## 5. Harita

İlk harita: topluluk haritası. Kaynak sahibinden izin alınır ve atıf verilir (`src/data/maps.ts` > `attribution`).
Pin koordinatları **ilk gerçek haritanın** çerçevesindedir. Bu yüzden ilk pinler girmeden önce harita yerine konmalı.

Daha iyi bir harita gelince (kenarları ya da ölçeği farklı olsa bile):
1. Yeni görseli `public/maps/` içine koy, `maps.ts` içinde `source.url` ve `imageSize` değerlerini güncelle.
2. `/map?dev=true` > **Calibrate map**. Sırayla gelen Landmarks pinlerini yeni görselde gerçek yerlerine tıkla.
   Haritaya yayılmış en az 3 nokta gerekir (köşeler ve kenarlar en iyisi).
3. **Copy calibration** > `maps.ts` içindeki harita kaydına yapıştır. Pinlerin hiçbiri değişmez.

Bu yüzden ilk gün haritanın köşelerine yakın 4-6 belirgin yer (köprü, deniz feneri, havalimanı) Landmarks olarak girilmeli.
