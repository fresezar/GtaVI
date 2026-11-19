---
name: shorts-plan
description: Six Star akşam rutini. Gündemin nabzını ölçer, skor tablosuna bakar ve ertesi gün için 5 "Six Star File" short planı yazar. Sezar "/shorts-plan", "akşam planı" ya da "yarının videoları" dediğinde kullan.
---

# Akşam: yarının 5 short planı

Format ve roller: `shorts/README.md`. Fikirler: `shorts/ideas.md`. Önceki planlar: `shorts/plans/`.

1. **Geçmişe bak.** `shorts/scoreboard.csv` ve son 3 planı oku. Hangi sütun, giriş tipi ve uzunluk iyi gitti?
   Veri azsa (ilk 2 hafta) karar verme, sadece not düş.
2. **Nabız (son 24 saat), WebSearch ile:**
   - Rockstar Newswire ve Rockstar'ın resmî hesapları (yeni duyuru, güncelleme, etkinlik)
   - r/GTA6 ve r/GTAVI'da en çok konuşulanlar (Reddit doğrudan açılmıyor, aramayla)
   - YouTube ve TikTok'ta öne çıkan GTA 6 kısa videoları: hangi konu, hangi giriş cümlesi
   - Büyük yayıncıların bulguları (izin gerekir; kurucuya not)
   - **Hile kodları:** `npm run cheats:check -- --write`. Yeni kod çıktıysa: commit, `npm run deploy` (arka planda,
     ~10 dk) ve yarının planına aday video ("New GTA 6 cheat code: ..."). Değişiklik yoksa sadece pazartesi deploy et
     (sitedeki "Kodlar kontrol edildi" etiketi deploy ile yenilenir). Rapor "TR çevirisi gerekli" diyorsa
     `content/cheats.json` içindeki `tr` alanlarını Türkçeye çevir, yeni hilede `effect.en`'i kendi cümlemizle yaz.
3. **5 video seç.** En az 2'si zamansız (Kaçırma/Sistem/Sayılar), en fazla 1'i haber. Her gün en az 1 Bulgu (harita pini varsa).
   Aynı sütundan art arda 3 video koyma. Bir video bir testi taşır (tek değişken).
4. **Yaz:** `shorts/plans/YYYY-MM-DD.md` (yarının tarihi), `shorts/plans/2026-11-19.md` biçiminde. Her video için:
   giriş cümlesi (İngilizce, ekranda, 10 kelimeyi geçmesin), tam olarak ne çekileceği ve kaç saniye, alt satır, harita yeri,
   hedef uzunluk, açıklama metni (İngilizce), 3-5 etiket, kaynak linki. Dosya numaraları son plandan devam eder.
   Bir yedek video ekle.
5. **Doğruluk:** kaynağı olmayan bilgiyi yazma. Basın = "reportedly". Kurucunun oyunda doğrulaması gerekenleri **kalın** işaretle.
6. **Fikir havuzu:** kullanılan fikirleri `→ #dosya` ile işaretle, gündemden çıkan yeni fikirleri ekle.
   Yayınlanan bir video bir oyuncunun bulgusunu kullandıysa `content/pins.json` içinde o pinin `tags` listesine
   `"featured"` ekle: bulan kişi Topluluk sayfasında +25 puan alır.
7. Commit et ve push'la. Sezar'a kısa özet: 5 başlık, çekim listesi (tek blok halinde, telefondan okunabilir), varsa izin istenecek yayıncılar.

Site için yeni sayfa ya da kod gerekiyorsa yazma, tek cümleyle öner.
