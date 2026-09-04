# Veri taşıma notu (SQLite → Supabase) — TAMAMLANDI, 4 Eylül 2026

Eski `data/basari.db` içeriği Supabase'e taşındı. Yapılacak bir şey kalmadı;
bu dosya yalnızca kayıt amaçlı duruyor.

## Taşınanlar

| Kaynak | Hedef | Adet |
|---|---|---|
| `projeler` | Postgres `projeler` | 1 |
| `proje_gorseller` + `public/uploads/*.jpg` | `proje_gorseller` + Storage `proje-gorselleri` | 11 |
| `ayarlar` | — | 0 (tablo zaten boştu) |
| `mesajlar` | — | taşınmadı, özellik kaldırıldı |

`ayarlar` boş olduğu için site metinleri `lib/icerik.ts` içindeki
`VARSAYILAN` değerlerinden geliyor — bu tasarım gereği doğru davranış.
Panelden bir alan değiştirilince veritabanına yazılır ve varsayılanın
üzerine biner.

## Nasıl yapıldı

Elle girmek yerine tek seferlik bir script kullanıldı (iş bitince silindi):

1. **Node** — `projeler` satırı Postgres'e yazıldı (`yayinda` 0/1 → boolean,
   `olusturma` SQLite'ın UTC damgası `Z` ekiyle timestamptz'ye), 11 fotoğraf
   için imzalı yükleme URL'i üretildi.
2. **Tarayıcı** — eski JPEG'ler `lib/gorsel-kucult.ts` ile aynı boru hattından
   geçirildi (1920 px sınırı, kalite 0.82, EXIF/GPS düşürme, yön düzeltmesi)
   ve imzalı URL'lere doğrudan PUT edildi.
3. **Node** — Storage'da gerçekten oluşan dosyalar doğrulandıktan sonra
   `proje_gorseller` satırları ve kapak yazıldı.

İkinci adım neden tarayıcıda: bucket yalnızca `image/webp` kabul ediyor ve
`lib/yukleme.ts` içindeki `dosyaAdiGecerliMi()` `.webp` uzantısı bekliyor —
JPEG'leri olduğu gibi yüklemek siteyi çalıştırırdı ama **panelden fotoğraf
silmeyi sessizce bozardı** (`fotografSil()` tanımadığı yolu atlıyor). Makinede
webp kodlayan bir araç olmadığı için, sırf bunun için sharp/ffmpeg bağımlılığı
eklemek yerine sitenin kendi dönüştürücüsü kullanıldı. Sonuç: taşınan
fotoğraflar panelden yüklenmiş olanlardan ayırt edilemez.

Sonuç: 3.4 MB JPEG → 2.4 MB WebP, 11/11 erişilebilir, sıra ve kapak korundu.

## Eski veriler

`data/basari.db` ve `public/uploads/` **silinmedi**; orijinal çözünürlüklü
kopyalar orada duruyor. Artık hiçbir yerden okunmuyorlar, istenirse
kaldırılabilirler (git geçmişinde kalırlar).
