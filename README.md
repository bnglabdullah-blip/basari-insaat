# Başarı İnşaat — Web Sitesi

Eskişehir merkezli Başarı İnşaat'ın kurumsal web sitesi ve yönetim paneli.

- **Site:** ana sayfa, projeler, proje detay + fotoğraf galerisi, hakkımızda, şirket bilgileri, iletişim
- **Panel:** `/admin` — projeler, fotoğraflar, site metinleri, iletişim bilgileri, parola

Site Next.js sunucu bileşenleriyle çalışır; veri ve fotoğraflar **Supabase**'te
(Postgres + Storage) tutulur, dağıtım **Netlify** üzerinde sunucusuz
fonksiyonlar olarak yapılır. Kendi işlettiğimiz bir veritabanı sunucusu, disk,
yedekleme cron'u veya konteyner yok — ikisi de yönetilen servis. Teslimden
sonra bakılması gereken tek "sunucu" tarafı Supabase projesiyle Netlify
hesabıdır; ikisi de müşterinin adına.

---

## Teknoloji seçimleri

| Ne | Neden |
|---|---|
| **Next.js 16 (App Router)** | Sunucu bileşenleri sayesinde veri okuması doğrudan sayfa içinde yapılıyor; ayrı bir API katmanı yok. Server Actions form gönderimlerini de aynı şekilde karşılıyor. |
| **React 19** | Next 16'nın gerektirdiği sürüm. `useActionState` / `useFormStatus` panel formlarının tamamını istemci tarafı state yönetimi olmadan çalıştırıyor. |
| **TypeScript** | Veritabanı satırları ile arayüz arasındaki tip uyuşmazlıklarını derlemede yakalıyor. |
| **Supabase (Postgres + Storage)** | Veritabanı ve fotoğraf deposu tek proje altında; yönetilen servis olduğu için yedekleme, disk boyutlandırma, ölçekleme bizim işimiz değil. `service_role` anahtarıyla yalnızca sunucudan erişiliyor (RLS bypass eder), tarayıcı veritabanına hiç bağlanmıyor. |
| **Tailwind CSS 4** | PostCSS eklentisi olarak çalışıyor, ayrı yapılandırma dosyası yok. Renkler ve tipografi `app/globals.css` içindeki CSS değişkenlerinde. |
| **Tarayıcı Canvas API'si** | Yüklenen fotoğraflar sunucuya hiç uğramadan tarayıcıda küçültülüp WebP'ye çevriliyor (`lib/gorsel-kucult.ts`). Netlify fonksiyon gövdesi ~6 MB ile sınırlı; bu, küçültmenin yapılabileceği tek yeri tarayıcı yapıyor. EXIF/GPS verisinin düşmesi de bu yeniden kodlamanın yan etkisi — ek kod gerekmiyor. |
| **node:crypto** | Parola özeti (scrypt) ve oturum jetonu imzalama (HMAC). Kimlik doğrulama için kütüphane yok. |
| **node:test** | Testler Node'un gömülü test koşucusuyla çalışıyor; Jest/Vitest kurulumu yok. |
| **@netlify/plugin-nextjs** | Server component'leri, Server Actions'ı ve ISR'i Netlify fonksiyonlarına çeviriyor; ayrı bir sunucu veya konteyner işletmeye gerek yok. |

### Bilinçli olarak kullanılmayanlar

| Yok | Yerine | Neden |
|---|---|---|
| ORM (Prisma/Drizzle) | `supabase-js` sorgu builder'ı (`lib/queries.ts`) | 4 tablo ve sabit bir şema için migration altyapısı, kod üretimi ve ekstra build adımı gereksiz |
| NextAuth / Auth.js | `node:crypto`, ~40 satır | tek admin kullanıcı, tek parola — OAuth sağlayıcı, kullanıcı tablosu, oturum deposu yok |
| Kendi işlettiğimiz DB/dosya sunucusu | Supabase (yönetilen Postgres + Storage) | ikinci bir servisi bizim ayakta tutmamız gerekmiyor; yedekleme ve ölçekleme Supabase'de |
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
      projeler/             liste, yeni, [id] düzenle
      icerik/               site metinleri, iletişim bilgileri, parola
      */actions.ts         o ekrana ait Server Action'lar
  layout.tsx               kök: fontlar, meta, globals.css
  sitemap.ts robots.ts     dinamik SEO çıktıları
  not-found.tsx

lib/
  db.ts                    Supabase istemcisi (service_role, singleton, sadece sunucu)
  queries.ts               TÜM Supabase sorguları burada — başka hiçbir dosyada sorgu yok
  oturum.ts                saf kripto: parola özeti, jeton imzalama (Next'ten bağımsız)
  auth.ts                  Next'e bağlı katman: çerez, yönlendirme, hız sınırı
  yukleme.ts               fotoğraf adı üretimi/doğrulaması, imzalı Storage URL'i, silme
  gorsel-kucult.ts         tarayıcıda fotoğraf küçültme + WebP dönüştürme (saf canvas kodu)
  icerik.ts                düzenlenebilir metinlerin VARSAYILAN değerleri
  metin.ts                 Türkçe slug üretimi, tarih biçimleme
  vitrin.ts                vitrin fotoğraflarının sayfalara dağıtılması
  *.test.ts                testler kendi modüllerinin yanında

components/
  site-header/footer, galeri, gorsel, iletisim-formu, yapisal-veri
  admin/                   panel formları (proje, galeri, içerik, parola)

supabase/
  migrations/              şema ve Storage bucket tanımı (bkz. Veri modeli)
  TASIMA.md                eski SQLite verisinin Supabase'e taşınma kaydı

scripts/parola.mjs         parola özeti ve oturum anahtarı üretir
netlify.toml               Netlify build/dağıtım yapılandırması
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

Üç tablo, tamamı `supabase/migrations/0001_ilk_sema.sql` içinde tanımlı:

| Tablo | İçerik |
|---|---|
| `projeler` | başlık, slug, konum, durum, yıl, özet, açıklama, kapak, sıra, yayında |
| `proje_gorseller` | proje fotoğrafları; `ON DELETE CASCADE` ile projeye bağlı |
| `ayarlar` | `anahtar/değer` — panelden düzenlenen metinler ve parola özeti |

Fotoğraflar `proje-gorselleri` adlı public bir Storage bucket'ında
(`0002_storage.sql`); bucket, dosya türünü (yalnızca `image/webp`) ve boyutunu
(2 MB) sunucu tarafında zorluyor.

**RLS her tabloda açık ama hiçbir policy yok** — bilinçli: tüm erişim
sunucudan `service_role` anahtarıyla yapılıyor (RLS'i bypass eder), policy
yazılmadığı için `anon`/`authenticated` anahtarlarla hiçbir satır görünmez.
Tarayıcı veritabanına zaten bağlanmıyor; bu, yanlışlıkla bağlanılırsa devreye
giren ikinci bir kilit.

> **Mesaj tablosu neden yok:** iletişim formu sunucuya hiç uğramıyor,
> ziyaretçinin kendi WhatsApp'ını açıyor. Mesajlar WhatsApp'ta durduğu için
> sitede saklanacak bir şey kalmıyor.

> Site eskiden SQLite ile çalışıyordu; taşıma süreci ve gerekçesi
> `supabase/TASIMA.md` içinde kayıtlı. Yapılacak bir şey kalmadı, yalnızca
> tarihçe amaçlı duruyor.

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
- **`SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucuda.** `lib/db.ts` `server-only`
  import ediyor; bu modül yanlışlıkla bir istemci bileşenine karışırsa derleme
  hata verir. Bu anahtar RLS'i bypass eder — tarayıcıya sızması tüm
  veritabanının açılması demektir.
- **Fotoğraf türü ve boyutu Storage bucket'ında sunucu tarafında zorlanıyor**
  (yalnızca `image/webp`, en fazla 2 MB) — tarayıcının küçültme/dönüştürme
  kodu atlatılsa bile büyük veya yabancı bir dosya reddedilir.
- **Dosya adı tamamen sunucuda üretiliyor.** Kullanıcının verdiği ad hiçbir
  yola karışmıyor; imzalı yükleme URL'i bu ada bağlı, istemci başka bir yola
  yazamaz.
- **EXIF verisi düşürülüyor** — telefon fotoğrafları GPS koordinatı taşır.
  Tarayıcıda canvas'a çizilip yeniden kodlanan her fotoğraf bu veriyi otomatik
  kaybeder.
- **Panel formuna gelen alanlar beyaz listeye göre süzülüyor**
  (`VARSAYILAN` anahtarları). Parola özeti bilerek bu listenin **dışında**
  tutuluyor: `ayarlariGetir()` sonucu istemci bileşenlerine kadar gidiyor,
  anahtar listede olsaydı özet her sayfa render'ında tarayıcıya gönderilirdi.
- **Giriş hız sınırı:** 15 dakikada 8 deneme (bellek içi, fonksiyon kopyası
  başına).

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
örnek alın), `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` değerlerini
Supabase projenizin Ayarlar > API sayfasından ekleyin. Supabase projesinde
`supabase/migrations` altındaki SQL dosyaları çalıştırılmış olmalı (SQL
Editor'e yapıştırıp çalıştırmak yeterli). Sonra:

```bash
npm run dev
```

Site `http://localhost:3000`, panel `http://localhost:3000/admin` adresinde.

---

## Yayına alma

Site Netlify'da, `@netlify/plugin-nextjs` ile sunucusuz fonksiyonlar olarak
çalışır (`netlify.toml`). Depoyu Netlify'a bağlamak yeterli; build ve dağıtım
otomatik.

### Ortam değişkenleri

Netlify panelinden girilir, repoya yazılmaz:

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `SUPABASE_URL` | evet | Supabase projesinin adresi. |
| `SUPABASE_SERVICE_ROLE_KEY` | evet | RLS'i bypass eder, tam yetkili. Yalnızca sunucuda kullanılır. |
| `OTURUM_ANAHTARI` | evet | En az 32 karakter. Değiştirilirse açık tüm oturumlar düşer. |
| `SITE_URL` | evet | Sitemap, robots.txt ve paylaşım önizlemeleri bunu kullanır. |
| `ADMIN_PAROLA_HASH` | yalnızca ilk kurulumda | `npm run parola` çıktısı. Panelden parola bir kez değiştirildikten sonra özet veritabanına yazılır ve bu değişken artık okunmaz; Netlify'dan silinebilir. |

### Domain

Eski `*.netlify.app` adresi 301 ile asıl alan adına (`basariyapi.com`)
yönlendirilir (`netlify.toml`); arama motorları için çift içerik oluşmasın ve
`netlify.app` bazı sağlayıcı filtrelerinde engelli olduğu için ziyaretçi
siteyi görebilsin diye.

### Yedekleme

Veritabanı ve fotoğraflar Supabase'in yönettiği servislerde; disk yedeği almak
gerekmiyor. Supabase panelinden proje bazlı yedekleme/geri yükleme
seçenekleri kullanılabilir.

---

## Testler

```bash
npm test
```

38 test, Node'un gömülü koşucusuyla. Kapsam:

- **`oturum.test.ts`** — parola doğrulama, jeton imzalama, kurcalanmış jeton, süre aşımı
- **`yukleme.test.ts`** — dosya adı üretimi/doğrulaması, dizin gezinme ve yabancı ad reddi
- **`gorsel-olcu.test.ts`** — küçültme hedef ölçüsü (en-boy oranı korunur, küçük fotoğraf büyütülmez)
- **`metin.test.ts`** — Türkçe slug (özellikle noktasız `ı` tuzağı)
- **`vitrin.test.ts`** — fotoğraf yuvası dağıtımı
- **`icerik.test.ts`** — varsayılan içerik ve WhatsApp bağlantısı

Veritabanına, Storage'a ve `next/headers`'a bağlı kod (`auth.ts`, `queries.ts`,
`db.ts`) burada değil: ağır mock gerektirir, karşılığında az şey kanıtlar.

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

**Fotoğraflar tarayıcıda işlenir:** en fazla 1920 px genişliğe küçültülür,
WebP'ye çevrilir, EXIF verisi silinir (`lib/gorsel-kucult.ts`). Küçük bir
fotoğraf büyütülmez. Storage bucket'ı dosya başına 2 MB ile sınırlı.

**Next.js yükseltirken:** `package.json` içindeki `overrides` bloğunu kontrol
edin. `postcss` ve `nanoid` sürümleri, Next'in içinde gelen açıklı sürümleri
ezmek için sabitlenmiş durumda; yeni Next sürümü bunları zaten güncellemişse
blok kaldırılabilir.

**Giriş hız sınırı bellek içidir** ve fonksiyon kopyası başına ayrı sayılır
(Netlify'da normal davranış budur). Paylaşılan bir sınır gerekirse `ayarlar`
tablosuna ya da Upstash gibi bir servise taşınmalı (bkz. `lib/auth.ts`).

**Docker dağıtımı kaldırıldı.** `Dockerfile`, `compose.yaml` ve `.dockerignore`
sitenin önceki SQLite + kendi VPS'inde Docker imajı olarak çalıştığı döneme
aitti; taşımadan sonra tek dağıtım yolu Netlify olduğu için silindi. Eskisi
git geçmişinde duruyor, gerekirse oradan geri alınabilir.
