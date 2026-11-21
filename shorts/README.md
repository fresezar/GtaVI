# Six Star File: shorts

Kendi formatımız (kurucu onayladı, 2026-11-18): her video tek bir bulgu, sırası hep aynı.

1. **Giriş (ilk 3 sn):** büyük giriş cümlesi, oyun görüntüsünün üstünde. Boş açılış yok.
2. **Görüntü:** izinli klip (altında "Clip: @kişi"), Rockstar resmî materyali ya da sitenin haritası; altında tek satır bilgi.
3. **Harita yakınlaşması (3,5 sn):** sixstargta.com haritasında noktaya yakınlaşma, yer adı. Yer yoksa atlanır.
4. **Bitiş kartı (2,5 sn):** logo, dosya numarası, "sixstargta.com".

**Seslendirme (2026-11-21):** her video İngilizce seslendirmeli. Ses girişle başlar, görüntü ve harita boyunca sürer,
bitiş kartından önce biter. Konuşma kelime kelime altyazı olarak ekrana basılır (Whisper, yerel). Oyun sesi konuşmanın
altında kısılır; bitmiş video -14 LUFS'a ayarlanır. Metin planda "Seslendirme" satırında yazar; hız ~2,5 kelime/sn.

**Kitle dağılımı (2026-11-21):** videoların ~%70'i geniş kitle (mit testi, sırlar, sıralama, komik an, önce/sonra);
bunlarda harita adımı zorunlu değil, ses "link in bio" ile biter. ~%30 site rehberi (harita pini + bitiş kartı).

**Görüntü kaynağı (2026-11-21):** kurucu oyunu oynamıyor. Kaynaklar, güvenliden riskliye:
1. Sitenin haritası ve kendi kartlarımız (ekran kaydı): tamamen bizim.
2. İzinli klip: küçük yayıncıya DM, yazılı "evet"in ekran görüntüsü `raw/izinler/` içine, videoda "Clip: @kişi".
3. Topluluk klibi: Discord'da klip paylaşan oyuncu, gönderirken kullanım iznini yazar.
4. Rockstar resmî fragman/ekran görüntüsü: kısa kesit + kendi yorumumuz. Content ID uyarısı gelebilir.

İzinsiz klip kullanılmaz: telif ihtarı (3'ü kanalı kapatır) ve "yeniden kullanılmış içerik" kuralı gelir ortaklığını
kapatır. Seste "we tried" yalnızca klibi biz çektiysek; başkasınınsa "@kişi tried".

Videodaki yazılar ve ses İngilizce (sosyal medya dili). Dosya numarası sıralı ve hiç tekrar edilmez: #0001, #0002...

## Kim ne yapar

| Kurucu | Claude |
|---|---|
| Hesaplar, paylaşım, yorumlar | Akşam nabız ölçümü + ertesi günün 5 video planı |
| Canlı yayın takibi, klip kaydı, izinler | Fikir havuzu (`ideas.md`) |
| Klip izinleri (DM), Discord klip kanalı | Plan → video dosyası (`npm run short`) |
| Sonuçları `scoreboard.csv`'ye yazmak | Haftalık değerlendirme, formatın ayarı |

## Günlük akış

1. **Akşam:** Claude'a `/shorts-plan` yaz. Gündemi tarar, skor tablosuna bakar, `plans/YYYY-MM-DD.md` dosyasına yarının 5 videosunu yazar: giriş cümlesi, ne çekileceği (tam olarak), metin, etiketler, kaynak.
2. **Gün içinde:** planlardaki klipler için izin al (DM şablonu planda yazar), klibi indirip `shorts/raw/` klasörüne koy (git'e girmez).
3. **Seslendirme:** planın "Seslendirme" metnini oku, `shorts/raw/0003-vo.wav` (ya da .m4a) olarak koy.
4. **Kurgu:** Claude'a "0003'ü yap" de; Claude `specs/0003.json` dosyasını klip süreleriyle doldurur ve videoyu üretir:
   `npm run short -- shorts/specs/0003.json` → `shorts/out/0003.mp4`. Claude `work/0003/sheet.jpg` kare kâğıdına bakıp kontrol eder.
5. **Paylaşım:** YouTube Shorts + TikTok + Instagram Reels, aynı video. Son dakika haberi X'e de.
6. **Ölçüm:** 24 ve 72 saat sonra izlenmeleri `scoreboard.csv`'ye yaz (boş bırakılabilir, uydurma yok).

## Kurallar

- Kaynağı belirsiz bilgi videoya girmez. Basın haberi "reported" diye söylenir; söylenti varsa "rumor".
- Sızıntı, korsan, hile, sahte "gameplay" yok. Spoiler varsa giriş cümlesinde değil, videoda uyarıyla.
- Başkasının klibi: önce izin, sonra "Clip: @kişi". İzin yoksa kullanılmaz.
- Her testte tek değişken (giriş cümlesi tipi, uzunluk, saat). Neyi denediğini `test_name` sütununa yaz.

## Dosyalar

- `ideas.md`: fikir havuzu (sütunlara göre)
- `plans/`: günlük 5'li planlar
- `specs/`: video tarifleri (`example.json` örnek)
- `scoreboard.csv`: sonuçlar
- `template/card.html`: yazı kartlarının tasarımı (renk, yazı tipi)
- `raw/`, `work/`, `out/`: kayıtlar, ara dosyalar ve bitmiş videolar; git'e girmez
