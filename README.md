# Başarı İnşaat — Web Sitesi

Eskişehir merkezli Başarı İnşaat'ın kurumsal web sitesi ve yönetim paneli.

- **Site:** ana sayfa, projeler, proje detay + fotoğraf galerisi, hakkımızda, şirket bilgileri, iletişim
- **Panel:** `/admin` — projeler, fotoğraflar, site metinleri, iletişim bilgileri, parola

Site tek bir Node.js sürecinde çalışır, verisini yanındaki bir SQLite dosyasında
tutar ve fotoğrafları diske yazar. Harici hiçbir servise bağlı değildir:
veritabanı sunucusu, nesne deposu, e-posta sağlayıcısı, kimlik doğrulama servisi
yok. Bunun tek bir sebebi var — **teslimden sonra kimsenin bakması gereken bir
parça kalmasın.**

---

## Teknoloji seçimleri

| Ne | Neden |
|---|---|
| **Next.js 16 (App Router)** | Sunucu bileşenleri sayesinde veri okuması doğrudan sayfa içinde yapılıyor; ayrı bir API katmanı yok. Server Actions form gönderimlerini de aynı şekilde karşılıyor. |
| **React 19** | Next 16'nın gerektirdiği sürüm. `useActionState` / `useFormStatus` panel formlarının tamamını istemci tarafı state yönetimi olmadan çalıştırıyor. |
| **TypeScript** | Veritabanı satırları ile arayüz arasındaki tip uyuşmazlıklarını derlemede yakalıyor. |
| **SQLite (better-sqlite3)** | Tek dosya, tek süreç, sıfır yönetim. Yedeklemek dosyayı kopyalamaktan ibaret. Senkron API olduğu için sunucu bileşenlerinde `await` zinciri kurmaya gerek kalmıyor. |
| **Tailwind CSS 4** | PostCSS eklentisi olarak çalışıyor, ayrı yapılandırma dosyası yok. Renkler ve tipografi `app/globals.css` içindeki CSS değişkenlerinde. |
| **sharp** | Yüklenen fotoğrafları kaydetmeden önce küçültüp WebP'ye çeviriyor ve EXIF verisini (GPS dahil) düşürüyor. |
| **node:crypto** | Parola özeti (scrypt) ve oturum jetonu imzalama (HMAC). Kimlik doğrulama için kütüphane yok. |
| **node:test** | Testler Node'un gömülü test koşucusuyla çalışıyor; Jest/Vitest kurulumu yok. |

### Bilinçli olarak kullanılmayanlar

| Yok | Yerine | Neden |
|---|---|---|
| ORM (Prisma/Drizzle) | düz SQL | 4 tablo ve sabit bir şema için migration altyapısı, kod üretimi ve ekstra build adımı gereksiz |
| NextAuth / Auth.js | `node:crypto`, ~40 satır | tek admin kullanıcı, tek parola — OAuth sağlayıcı, kullanıcı tablosu, oturum deposu yok |
| Ayrı veritabanı sunucusu | SQLite dosyası | ikinci bir servis, ikinci bir fatura, ikinci bir arıza noktası |
| S3 / Blob servisi | disk + kalıcı volume | fotoğraflar veritabanının yanındaki klasörde; ikisi tek yedeğe giriyor |
| E-posta sağlayıcısı | WhatsApp yönlendirmesi | aylık kota, alan adı doğrulaması, spam kutusu sorunu yok |
| Animasyon kütüphanesi | CSS `animation-timeline` | native, 0 KB |
| Google Maps SDK | `<iframe>` gömme | API anahtarı ve kota yok |
| Durum yönetimi (Redux/Zustand) | sunucu bileşenleri + `useActionState` | paylaşılacak istemci state'i neredeyse yok |

---

## Dizin yapısı

```
app/
  (site)/                  ziyaretçiye açık sayfalar — header/footer bu grubun layout'unda
    page.tsx               ana sayfa
    projeler/              liste + [slug] detay sayfası (galeri)
    hakkimizda/
    sirket-bilgilerimiz/
    iletisim/
  admin/
    giris/                 parola ekranı — panel kabuğunun DIŞINDA
    (panel)/               giriş yapılmış alan; layout'u yetki kontrolü yapar
      page.tsx             özet
      projeler/            liste, yeni, [id] düzenle
      icerik/              site metinleri, iletişim bilgileri, parola
      */actions.ts         o ekrana ait Server Action'lar
  layout.tsx               kök: fontlar, meta, globals.css
  sitemap.ts robots.ts     dinamik SEO çıktıları
  not-found.tsx

lib/
  db.ts                    SQLite bağlantısı + şema (CREATE TABLE'lar burada)
  queries.ts               TÜM SQL burada — başka hiçbir dosyada sorgu yok
  oturum.ts                saf kripto: parola özeti, jeton imzalama (Next'ten bağımsız)
  auth.ts                  Next'e bağlı katman: çerez, yönlendirme, hız sınırı
  yukleme.ts               fotoğraf doğrulama, küçültme, diske yazma
  icerik.ts                düzenlenebilir metinlerin VARSAYILAN değerleri
  metin.ts                 Türkçe slug üretimi, tarih biçimleme
  vitrin.ts                vitrin fotoğraflarının sayfalara dağıtılması
  *.test.ts                testler kendi modüllerinin yanında

components/
  site-header/footer, galeri, gorsel, iletisim-formu, yapisal-veri
  admin/                   panel formları (proje, galeri, içerik, parola)

scripts/parola.mjs         parola özeti ve oturum anahtarı üretir
Dockerfile compose.yaml    dağıtım
```

### Neden route grupları

`app/(site)` ve `app/admin/(panel)` parantezli klasörler — URL'e girmezler,
sadece **layout paylaşımı** sağlarlar. Böylece panel, sitenin header/footer'ını
miras almaz ve `/admin/giris` de panelin yetki kontrolü yapan layout'unun
dışında kalır. Giriş sayfası o layout'un içinde olsaydı, giriş yapmak için
giriş yapmış olmak gerekirdi.

### Neden `lib/oturum.ts` ile `lib/auth.ts` ayrı

`oturum.ts` saf fonksiyonlardan oluşur — `next/headers` import etmez, bu yüzden
düz Node'da test edilebilir. `auth.ts` ise çerez okur, yönlendirme yapar,
veritabanına bakar. Kriptografi mantığı test edilebilir tarafta, çerçeveye bağlı
kısım ayrı.

---

## Veri modeli

Üç tablo, tamamı `lib/db.ts` içinde tanımlı:

| Tablo | İçerik |
|---|---|
| `projeler` | başlık, slug, konum, durum, yıl, özet, açıklama, kapak, sıra, yayında |
| `proje_gorseller` | proje fotoğrafları; `ON DELETE CASCADE` ile projeye bağlı |
| `ayarlar` | `anahtar/değer` — panelden düzenlenen metinler ve parola özeti |

Şema `CREATE TABLE IF NOT EXISTS` ile her açılışta çalışır; migration aracı yok.
Sütun eklemek gerekirse `db.ts` içine bir `ALTER TABLE` eklemek yeterli.

**Yabancı anahtarlar her bağlantıda elle açılıyor** (`PRAGMA foreign_keys = ON`).
SQLite'ta bu ayar varsayılan olarak kapalıdır ve açılmazsa `ON DELETE CASCADE`
sessizce çalışmaz — silinen projelerin fotoğraf kayıtları öksüz olarak birikirdi.

> **Mesaj tablosu neden yok:** iletişim formu sunucuya hiç uğramıyor,
> ziyaretçinin kendi WhatsApp'ını açıyor. Mesajlar WhatsApp'ta durduğu için
> sitede saklanacak bir şey kalmıyor. Eskiden var olan `mesajlar` tablosu ve
> panel ekranı bu yüzden kaldırıldı.

---

## Canlı önizleme (İçerik ekranı)

`/admin/icerik` bölünmüş bir ekran: solda form, sağda sitenin gerçek
önizlemesi. İki yönlü çalışır — forma yazdıkça önizleme güncellenir,
önizlemedeki metne tıklayıp doğrudan düzenlerseniz formdaki alan güncellenir.
Önizleme sayfası seçilebilir (ana sayfa, hakkımızda, iletişim, şirket
bilgileri) ve mobil/tablet/tam genişlikte görüntülenebilir.

**Hiçbir şey anında kaydedilmez.** Kalıcı değişiklik yalnızca "Kaydet"e
basıldığında, mevcut `icerikKaydetAction` üzerinden olur.

Nasıl çalışıyor:

| Parça | İşi |
|---|---|
| `components/onizleme-koprusu.tsx` | Site tarafı. `iframe` içinde çalışır, metinleri düzenlenebilir yapar, değişikliği panele yollar. |
| `components/admin/icerik-duzenleyici.tsx` | Panel tarafı. Bölünmüş yerleşim; form ile `iframe` arasında `postMessage` köprüsü. |
| `data-alan="<anahtar>"` | Site şablonlarındaki işaretler. Hangi HTML düğümünün hangi ayar alanına karşılık geldiğini söyler. |

**Sayfa HTML'i saklanmıyor.** İçerik veritabanında alan olarak duruyor;
düzenlenen şey ekrandaki HTML değil, o alanın değeri. Bileşenler her istekte
yeniden basıldığı için tasarım değişiklikleri içerikle çakışmaz.

Köprü iki kapıdan geçiyor: sunucu betiği yalnızca **oturum açıkken** sayfaya
koyuyor (ziyaretçinin aldığı HTML'de izi yok), betik de yalnızca **panelin
`iframe`i içinde** kendini bağlıyor. Yönetici siteyi normal gezerken metinler
tıklanınca düzenlenebilir hale gelmez.

Yeni bir alanı önizlemede düzenlenebilir yapmak için, siteyi basan bileşende
o değeri gösteren elemana `data-alan="<ayar anahtarı>"` eklemek yeterli. Çok
paragraflı alanlarda `data-alan-tip="paragraf"` de eklenir.

> `data-alan` işaretleri herkese giden HTML'de de var; davranış taşımadıkları
> için zararsızlar, önizleme betiği olmadan hiçbir şey yapmazlar.

---

## Güvenlik

Sitede dikkat edilmiş noktalar ve sebepleri:

- **Parola düz metin olarak hiçbir yerde yok.** scrypt ile özetleniyor,
  karşılaştırma `timingSafeEqual` ile yapılıyor (zamanlama saldırısına kapalı).
- **Oturum jetonu HMAC ile imzalı**, çerez `httpOnly` + `sameSite=lax`
  (üretimde `secure`), 12 saat ömürlü.
- **Her Server Action kendi içinde `yetkiGerekli()` çağırıyor.** Server
  action'lar layout hiyerarşisinden bağımsız çalışır: Next bunları, action
  kimliğini bilen herkesin doğrudan POST edebileceği uç noktalar olarak
  yayınlar. Kontrolü yalnızca layout'a bırakmak App Router'da en sık yapılan
  güvenlik hatasıdır.
- **Fotoğraf türü magic byte ile doğrulanıyor**, tarayıcının bildirdiği
  `Content-Type` başlığına göre değil — o başlık tamamen istemci
  kontrolündedir.
- **Dosya adı tamamen sunucuda üretiliyor.** Kullanıcının verdiği ad yola hiç
  karışmıyor; bu, dizin gezinme (`../../`) saldırılarını ad temizlemeye
  çalışmadan imkânsız kılıyor.
- **EXIF verisi düşürülüyor** — telefon fotoğrafları GPS koordinatı taşır.
- **Veritabanı `public/` dışında.** `public/` altındaki her şey statik olarak
  sunulur; `basari.db` oraya konsaydı tüm kayıtlar internetten indirilebilirdi.
- **Panel formuna gelen alanlar beyaz listeye göre süzülüyor**
  (`VARSAYILAN` anahtarları). Parola özeti bilerek bu listenin **dışında**
  tutuluyor: `ayarlariGetir()` sonucu istemci bileşenlerine kadar gidiyor,
  anahtar listede olsaydı özet her sayfa render'ında tarayıcıya gönderilirdi.
- **Giriş hız sınırı:** 15 dakikada 8 deneme (bellek içi, süreç başına).

---

## Hızlı başlangıç

```bash
npm install
```

Parola ve oturum anahtarı üretin:

```bash
npm run parola -- "secilen-parolaniz"
```

Çıkan iki satırı `.env.local` dosyasına yapıştırın (`.env.example` dosyasını
örnek alın). Sonra:

```bash
npm run dev
```

Site `http://localhost:3000`, panel `http://localhost:3000/admin` adresinde.
Veritabanı ilk çalıştırmada `data/basari.db` olarak kendiliğinden oluşur.

---

## Yayına alma

Uygulama bir Docker imajı olarak paketleniyor. Aynı imaj Railway, Render,
Fly.io veya kendi VPS'inizde çalışır.

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `ADMIN_PAROLA_HASH` | ilk kurulumda | `npm run parola` çıktısı. Panelden parola değiştirildikten sonra devre dışı kalır, silinebilir. |
| `OTURUM_ANAHTARI` | evet | En az 32 karakter. Değiştirilirse açık tüm oturumlar düşer. |
| `SITE_URL` | evet | Sitemap, robots.txt ve paylaşım önizlemeleri bunu kullanır. |
| `DB_YOLU` | hayır | Docker imajında `/app/veri/basari.db` olarak sabitlenmiştir. |

### Docker Compose (VPS)

Sunucuda bir `.env` dosyası oluşturup:

```bash
docker compose up -d --build
```

Site `3000` portunda çalışır. Önüne HTTPS sonlandırması yapan bir ters vekil
(Caddy, Nginx veya Coolify) koyun.

### ⚠️ Kalıcı disk — veri kaybını önleyen tek şey

Konteyner içi dosya sistemi her yeniden dağıtımda sıfırlanır. Tüm kalıcı veri
**tek bir klasörde** toplanmıştır:

```
/app/veri/basari.db     projeler, ayarlar, parola
/app/veri/uploads       yüklenen fotoğraflar
```

`public/uploads`, `/app/veri/uploads` klasörüne bir **symlink**'tir. Sebebi:
Railway, Render ve Fly.io servis başına **tek** kalıcı disk veriyor; ayrı ayrı
`/app/data` + `/app/public/uploads` bağlamak bu platformlarda mümkün değil,
biri mutlaka volume'süz kalır ve her dağıtımda silinir.

`compose.yaml` içindeki `basari-veri:/app/veri` satırı ya da platformdaki
karşılığı kaldırılırsa **tüm içerik her güncellemede silinir.**

> Volume'ü asla `public/uploads` üzerine bağlamayın — veritabanı o klasörün
> içine düşerse internetten indirilebilir hale gelir.

### Railway / Render

1. Depoyu bağlayın; platform `Dockerfile`'ı kendiliğinden kullanır.
2. Yukarıdaki ortam değişkenlerini girin.
3. **`/app/veri` yoluna kalıcı disk (volume) ekleyin.**
4. İlk girişten sonra panelden (`/admin/icerik`) parolayı değiştirin;
   ardından `ADMIN_PAROLA_HASH` değişkeni silinebilir.

> Volume, konteynerdeki `basari` kullanıcısına (uid 1001) ait olmalıdır.
> Platform diski root'a ait olarak bağlıyorsa `RAILWAY_RUN_UID=0` gerekebilir.

### Neden sunucusuz (Netlify/Vercel) değil

Bu uygulama diske yazıyor: veritabanı ve fotoğraflar. Sunucusuz platformlarda
dosya sistemi geçicidir — panel "Kaydedildi" der, veri o isteğin sonunda
kaybolur. Arıza sessiz olduğu için en kötü türden. Ücretsiz katmana geçmek,
veritabanını barındırılan bir servise ve fotoğrafları bir nesne deposuna
taşımayı, yani `lib/queries.ts` içindeki senkron sorguların tamamını ve
`lib/yukleme.ts` dosyasını yeniden yazmayı gerektirir.

### Yedekleme

```bash
docker compose exec site tar czf - /app/veri > yedek-$(date +%F).tar.gz
```

Tek klasör hem veritabanını hem fotoğrafları içerir. SQLite tek dosyadır;
yedeklemek onu kopyalamaktan ibarettir.

---

## Testler

```bash
npm test
```

34 test, Node'un gömülü koşucusuyla. Kapsam:

- **`oturum.test.ts`** — parola doğrulama, jeton imzalama, kurcalanmış jeton, süre aşımı
- **`yukleme.test.ts`** — magic byte kontrolü, küçültme, WebP çıktısı, EXIF/GPS temizliği, bozuk dosya
- **`metin.test.ts`** — Türkçe slug (özellikle noktasız `ı` tuzağı)
- **`vitrin.test.ts`** — fotoğraf yuvası dağıtımı
- **`icerik.test.ts`** — varsayılan içerik ve WhatsApp bağlantısı

Veritabanına ve `next/headers`'a bağlı kod (`auth.ts`, `queries.ts`) burada
değil: ağır mock gerektirir, karşılığında az şey kanıtlar.

---

## Bakım notları

**İçerik değişiklikleri kod gerektirmez.** Telefon, adres, hakkımızda metni ve
ana sayfa tanıtımı panelden `/admin/icerik` üzerinden düzenlenir. Bir alan boş
bırakılırsa `lib/icerik.ts` içindeki varsayılana döner — yanlışlıkla silinen bir
telefon numarası siteden kaybolmaz.

**Parola panelden değiştirilir** (`/admin/icerik` altında). Değiştirildiği anda
özet veritabanına yazılır ve `ADMIN_PAROLA_HASH` ortam değişkeni artık dikkate
alınmaz. Mevcut parola tekrar sorulur: açık bırakılmış bir panelin başına geçen
biri, sahibini kendi sitesinden kilitleyemesin diye.

**Hizmet listesi ve rakamlar** `lib/icerik.ts` içinde sabittir (nadiren değişir).
Değiştirmek için o dosyayı düzenleyip yeniden dağıtın.

**Fotoğraflar yüklenirken işlenir:** en fazla 1600 px genişliğe küçültülür,
WebP'ye çevrilir, EXIF verisi silinir. Küçük bir fotoğraf büyütülmez. Yükleme
sınırı dosya başına 15 MB (`lib/yukleme.ts`), tek seferde toplam 60 MB
(`next.config.ts`).

**Next.js yükseltirken:** `package.json` içindeki `overrides` bloğunu kontrol
edin. `sharp` ve `postcss` sürümleri, Next'in içinde gelen açıklı sürümleri
ezmek için sabitlenmiş durumda; yeni Next sürümü bunları zaten güncellemişse
blok kaldırılabilir.

**Sunucu birden fazla kopya olarak çalıştırılırsa** iki yer gözden geçirilmeli:
giriş hız sınırı bellek içidir (kopya başına ayrı sayar) ve SQLite tek diske
bağlıdır. Bu site için tek kopya yeterli.
