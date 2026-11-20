# Sezar'ın yapacakları

Kurucunun yapması ya da karar vermesi gereken açık işler. Claude her oturumda günceller; biten iş silinmez, "Bitti" bölümüne taşınır.
Son güncelleme: 2026-11-20.

## Acil

1. **Bot doğrulaması (Turnstile).** Cloudflare paneli > Turnstile > Add widget. Ad: `Six Star suggest`. Hostname: `sixstargta.com` ve `www.sixstargta.com`. Mod: Managed.
   - Site key'i Claude'a gönder (herkese açık bir anahtar).
   - Secret key'i Claude'a yazma. Proje klasöründe `npx wrangler secret put TURNSTILE_SECRET` komutunu çalıştır, sorunca yapıştır.
   - İkisi aynı gün yapılmalı: sadece secret girilirse öneri formu çalışmaz.
2. **Süresi dolmayan Discord davet linki.** Şu anki `discord.gg/tDg6hTqFk` varsayılan ayarlarla oluşturulduysa 7 günde geçersiz olur ve sitedeki tüm Discord düğmeleri bozulur. Discord > davet ayarları > "Süresi dolmasın" seçeneğiyle yeni link oluştur, Claude'a gönder.
3. **Gaming Universe'e cevap.** "What type of advantage?" sorusu cevapsız. Önerilen mesaj: `docs/partners/outreach.md` bölüm 4. Partner sayfası sadece anlaşma olursa açılır.

## Karar bekleyenler

4. **Öneri formunda kanıt linki isteğe bağlı olsun mu?** Telefondan gelen kullanıcı ekran görüntüsü linki bulamayıp vazgeçebilir. İsteğe bağlı olursa onay sırasında daha dikkatli bakarsın. Daha iyi çözüm: formdan doğrudan ekran görüntüsü yükleme; bunun için Cloudflare R2 depolama alanının açılması gerekiyor.
5. **Topluluk Aşama 2'ye geçelim mi?** Discord ile giriş, "Ben de buldum" onayları, hesaba bağlı rütbe ve puan (düzeltme +5, onay +2 puanları bununla açılır).

## İletişim

6. **GTA 6 Intel kurucusu.** Pinlerini (248 adet) atıfla kullanmak için izin iste. Hile sayfası için teşekkür etmek iyi bir giriş olur.
7. **Partner adayları.** 10 bin+ takipçili 3-5 GTA hesabı seç, `docs/partners/outreach.md` 1. mesajı gönder. Mesajı göndermeden önce kişiye özel ikinci satırı yaz. Olumlu cevap gelince Claude'a hesabın adını, profil linkini ve logosunu ver; partner sayfası öyle açılır.

## Kontrol

8. **Sekme ve sayfa geçiş animasyonu.** Telefonda ve bilgisayarda bir kez dene; Claude ekran görüntüsüyle hareketi test edemiyor.
9. **Onay kuyruğu (`/admin`).** Gelen önerileri düzenli onayla ya da reddet. "Yakında N kayıt var" uyarısı kopya olabilecek önerileri gösteriyor.

## Hatırlatma

10. **FiveM pazar araştırması.** Harita işi büyük ölçüde bitti; plan `docs/BACKLOG.md` "Mod ve sunucu" bölümünde. Ne zaman başlamak istediğini söyle.

## Bitti

- Search Console kurulumu ve site haritası (52 sayfa kabul edildi).
- Logo seçimi, YouTube ve Discord hesapları.
