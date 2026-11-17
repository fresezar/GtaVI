# Veri akışı: kaynaktan siteye

Sezar kaynakları tabloya yazar, Claude tabloyu içe aktarır, doğrular, build alır ve yayınlar.

## 1. Tablo (Google Sheets)

Şablon: `content/import-template.csv`. Sheets'te **File > Import** ile aç, örnek satırı sil.
Gönderirken: **File > Download > CSV** ya da satırları kopyalayıp yapıştır (sekmeyle ayrılmış metin de kabul edilir).
Her seferinde yalnızca **yeni ya da değişen satırları** gönder.

| Sütun | Zorunlu | Örnek | Not |
|---|---|---|---|
| category | evet | Collectibles | Kategori adı ya da slug'ı (liste aşağıda) |
| title | evet | Rooftop package behind the motel sign | İngilizce, kendi cümlemiz (kopya metin yok) |
| description | | Climb the fire escape, north side. | Kısa tarif |
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
- Her pin için `/pins/<slug>/` sayfası: video (zaman damgalı), "Found by", doğrulama rozeti, yakındaki pinler.
- Checklist'ler pinlerden üretilir: `/checklists/100-percent-completion/` ve ilerlemeye sayılan her kategori için bir liste.
- Sitemap tüm pin ve checklist sayfalarını içerir.

## 4. Harita

İlk harita: topluluk haritası. Kaynak sahibinden izin alınır ve atıf verilir (`src/data/maps.ts` > `attribution`).
Pin koordinatları **ilk gerçek haritanın** çerçevesindedir. Bu yüzden ilk pinler girmeden önce harita yerine konmalı.

Daha iyi bir harita gelince (kenarları ya da ölçeği farklı olsa bile):
1. Yeni görseli `public/maps/` içine koy, `maps.ts` içinde `source.url` ve `imageSize` değerlerini güncelle.
2. `/map?dev=true` > **Calibrate map**. Sırayla gelen Landmarks pinlerini yeni görselde gerçek yerlerine tıkla.
   Haritaya yayılmış en az 3 nokta gerekir (köşeler ve kenarlar en iyisi).
3. **Copy calibration** > `maps.ts` içindeki harita kaydına yapıştır. Pinlerin hiçbiri değişmez.

Bu yüzden ilk gün haritanın köşelerine yakın 4-6 belirgin yer (köprü, deniz feneri, havalimanı) Landmarks olarak girilmeli.
