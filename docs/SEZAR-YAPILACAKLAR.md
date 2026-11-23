# Sezar'ın yapacakları

Kurucunun yapması ya da karar vermesi gereken açık işler. Claude her oturumda günceller; biten iş silinmez, "Bitti" bölümüne taşınır.
Son güncelleme: 2026-11-23.

## Açık

0. **Yeni arayüzü incele (ön izleme).** https://atlas-preview.theshamsfr.workers.dev adresini telefonda ve bilgisayarda gez. Beğendiğin, beğenmediğin her şeyi yaz. Onay verirsen Claude canlıya alır; canlı site o zamana kadar eski haliyle kalır. (Ön izlemede formlar bilerek çalışmaz.)
1. **R2 aç (ekran görüntüsü yükleme + 2 kat keskin harita).** Cloudflare paneli > R2 Object Storage > "Purchase R2" / "Enable". Ücretsiz katman (10 GB) yeter; Cloudflare kart bilgisi isteyebilir. Açınca Claude'a haber ver: kovayı oluşturup yüklemeyi yayına alır. (Claude açamıyor: API "R2'yi panelden etkinleştirin" diyor.)
2. **GTA 6 Intel kurucusu** (Sezar). Pin ihtiyacı kalmadı (Open GTA 6 Map ile 3.398 pin). Hile sayfası için teşekkür edip iş birliği (karşılıklı bağlantı, bulgu paylaşımı) önermek yeterli.
3. **Partner adayları** (Sezar: yarın). 10 bin+ takipçili 3-5 GTA hesabına `docs/partners/outreach.md` 1. mesajı. Olumlu cevapta Claude'a ad, profil linki, logo.
4. **Bot doğrulamasını bir kez dene.** Telefonda ve bilgisayarda `sixstargta.com/map?suggest=1` aç. "Gönder" düğmesinin üstünde Cloudflare kutusu ve yeşil tik görünmeli. Görünmüyorsa Turnstile panelinde hostname listesinde `sixstargta.com` ve `www.sixstargta.com` olduğunu kontrol et. Kutu çıkmazsa öneri gönderilemez.
5. **Onay kuyruğu (`/admin`).** Gelen önerileri düzenli onayla ya da reddet. E-posta listesinin sayıları da artık burada.
7. **Karar: e-posta gönderici.** Liste toplanıyor ama henüz mail gönderilemiyor. İlk mail (Online çıkışı ya da ilk haftalık bülten) öncesi bir gönderici gerekiyor: Cloudflare Email Service (alan adı DNS ayarı ister) ya da bülten servisi (Buttondown, Brevo gibi). Claude karşılaştırmayı hazırlar.
8. **Oyun modunu telefonda dene.** `sixstargta.com/map?play=1`: kategori seç, "Sıradaki"ye bas, ekran kapanmıyor mu bak. Haritayı ana ekrana ekle ve oradan aç.
9. **Karar: Workers Paid (aylık 5 $).** Ücretsiz planda 20.000 dosya sınırı var; şu an 11.931. Ücretli planla sınır 100.000 olur: bütün pinlere 3 dilde sayfa ve keskin karolar R2 olmadan sığar. Acil değil.

## Hatırlatılacak

- **2026-11-21: Topluluk Aşama 2** (Sezar: "yarın geçeriz, hatırlat"). Discord ile giriş, "Ben de buldum" onayları, hesaba bağlı puan ve rütbe.
- **Gelir ve FiveM konuşması.** Notlar `docs/business/GELIR.md`; Claude arka planda geliştiriyor.

## Bitti

- 2026-11-22: Gizlilik sayfası (EN/TR/ES) ve veri kaynakları/atıflar bölümü yayında: `/privacy`.
- 2026-11-22: İspanyolca site (`/es`), Open GTA 6 Map'ten 3.208 pin, yeniden çizilmiş bölgeler.

- 2026-11-20: Turnstile anahtarları (site key sitede, secret Worker'da). Yeni Discord linki `discord.gg/UXjhBDaXMH` sitede.
- 2026-11-20: Kanıt için ekran görüntüsü yükleme kararı: R2, doğrulamadan sonra görsel silinir.
- 2026-11-20: Animasyonlar kontrol edildi (şimdilik tamam).
- İptal: Gaming Universe sohbeti (Sezar: geçersiz).
- Search Console kurulumu ve site haritası (52 sayfa kabul edildi).
- Logo seçimi, YouTube ve Discord hesapları.
