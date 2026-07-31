# Başarı İnşaat — Web Sitesi

Eskişehir merkezli Başarı İnşaat'ın kurumsal web sitesi ve yönetim paneli.

- **Site:** ana sayfa, projeler, proje detay + fotoğraf galerisi, hakkımızda, iletişim
- **Panel:** `/admin` — projeler, fotoğraflar, gelen mesajlar, site metinleri, iletişim bilgileri

---

## Hızlı başlangıç

```bash
npm install
```

Parola ve oturum anahtarı üretin:

```bash
npm run parola -- "secilen-parolaniz"
```

Çıkan iki satırı `.env.local` dosyasına yapıştırın (`.env.example` dosyasını örnek alın).
Sonra:

```bash
npm run dev
```

Site `http://localhost:3000`, panel `http://localhost:3000/admin` adresinde.

---

## Yayına alma (VPS + Docker)

Sunucuda `.env` dosyası oluşturun:

```
ADMIN_PAROLA_HASH=...
OTURUM_ANAHTARI=...
SITE_URL=https://basariinsaat.com
```

Sonra:

```bash
docker compose up -d --build
```

Site `3000` portunda çalışır. Önüne HTTPS sonlandırması yapan bir ters vekil
(Caddy, Nginx veya Coolify) koyun.

### ⚠️ Volume'ler hakkında

`compose.yaml` içindeki iki volume **veri kaybını önleyen tek şeydir**:

| Volume | İçerik |
|---|---|
| `basari-veri` → `/app/data` | Projeler, mesajlar, ayarlar (SQLite) |
| `basari-fotograflar` → `/app/public/uploads` | Yüklenen tüm fotoğraflar |

Bunlar kaldırılırsa her `--build` işleminde tüm içerik silinir.

### Yedekleme

```bash
docker compose exec site tar czf - /app/data /app/public/uploads > yedek-$(date +%F).tar.gz
```

SQLite tek dosyadır; yedeklemek onu kopyalamaktan ibarettir.

---

## Testler

```bash
npm test
```

Kapsam: parola doğrulama, oturum jetonu imzalama (kurcalama ve süre aşımı dahil),
Türkçe karakterli başlıklardan URL üretimi.

---

## Yapı

```
app/
  (site)/        public sayfalar — header/footer bu grupta
  admin/         yönetim paneli (site kabuğunu miras almaz)
lib/
  db.ts          SQLite bağlantısı + şema
  queries.ts     tüm SQL burada
  oturum.ts      saf kripto (test edilebilir, Next'ten bağımsız)
  auth.ts        Next'e bağlı kimlik doğrulama
  yukleme.ts     fotoğraf yükleme + doğrulama
  icerik.ts      varsayılan metinler ve iletişim bilgileri
components/      arayüz bileşenleri
```

### Bilinçli olarak kullanılmayanlar

| Yok | Yerine | Neden |
|---|---|---|
| ORM (Prisma/Drizzle) | düz SQL | 4 tablo için migration altyapısı gereksiz |
| NextAuth | `node:crypto`, ~30 satır | tek admin kullanıcı |
| Animasyon kütüphanesi | CSS `animation-timeline` | native, 0 KB |
| Google Maps SDK | `<iframe>` gömme | API anahtarı ve kota yok |
| reCAPTCHA | honeypot alanı | erişilebilirlik sorunu çıkarmaz |
| S3 / Blob servisi | disk + volume | VPS'te dosya sistemi zaten kalıcı |

---

## Bakım notları

**İçerik değişiklikleri kod gerektirmez.** Telefon, adres, hakkımızda metni ve
ana sayfa tanıtımı panelden `/admin/icerik` üzerinden düzenlenir. Bir alan
boş bırakılırsa `lib/icerik.ts` içindeki varsayılana döner — yanlışlıkla
silinen bir telefon numarası siteden kaybolmaz.

**Hizmet listesi ve rakamlar** `lib/icerik.ts` içinde sabittir (nadiren değişir).
Değiştirmek için o dosyayı düzenleyip yeniden dağıtın.

**Fotoğraf boyutu:** yüklenen dosyalar olduğu gibi saklanır; `next/image`
gösterim anında küçültüp önbelleğe alır. Yükleme sınırı dosya başına 15 MB
(`lib/yukleme.ts`), tek seferde toplam 60 MB (`next.config.ts`).

**Next.js yükseltirken:** `package.json` içindeki `overrides` bloğunu kontrol edin.
`sharp` ve `postcss` sürümleri, Next'in içinde gelen açıklı sürümleri ezmek için
sabitlenmiş durumda; yeni Next sürümü bunları zaten güncellemişse blok kaldırılabilir.
