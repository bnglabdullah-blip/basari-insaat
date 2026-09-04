# Veri taşıma notu (SQLite → Supabase)

Canlı SQLite'ta yalnızca **1 proje + 11 görsel** var. Migration scripti
yazmak, 11 fotoğrafı elle yeniden girmekten daha uzun sürer — bu yüzden
taşıma elle yapılıyor:

1. Migration'ları Supabase projesine uygula (`0001_ilk_sema.sql`, `0002_storage.sql`).
2. Yeni site admin panelinden projeyi yeniden oluştur
   (başlık/konum/durum/yıl/özet/açıklama `data/basari.db`'den okunabilir:
   `node -e "const d=require('better-sqlite3')('data/basari.db',{readonly:true});console.log(d.prepare('select * from projeler').all())"`).
3. 11 fotoğrafı panelden sırasıyla tekrar yükle (kaynakları `public/uploads/`
   veya eski sunucudaki yükleme klasöründe). Kapak otomatik: ilk fotoğraf.
4. `ayarlar` tablosundaki site metinleri panelin İçerik ekranından yeniden
   girilir; `admin_parola_hash` panelden parola belirlenince kendiliğinden oluşur.
