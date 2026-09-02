import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * SQLite baglantisi ve sema kurulumu.
 *
 * Neden ORM yok: dort tablo ve sabit bir sema icin Prisma/Drizzle, migration
 * altyapisi, kod uretimi ve ekstra bir build adimi getirir. Buradaki tum SQL
 * queries.ts icinde, tek dosyada ve okunabilir halde duruyor.
 *
 * Neden better-sqlite3: senkron API. Sunucu bilesenlerinde await zinciri
 * kurmaya gerek kalmiyor ve tek surecli bir sitede async SQLite surucusunun
 * sagladigi hicbir avantaj yok.
 */

const DB_YOLU = process.env.DB_YOLU ?? "data/basari.db";

function baglantiAc(): Database.Database {
  /*
   * Yol GORELI oldugu icin calisma dizinine (cwd) bagimlidir. Docker'da
   * WORKDIR /app oldugundan her zaman /app/data/basari.db'ye cozulur.
   *
   * Ancak sunucu yanlislikla baska bir dizinden baslatilirsa SQLite sessizce
   * BOS ve YENI bir veritabani olusturur — hata vermez, sadece site bombos
   * gorunur. Teshis edilmesi en zor ariza turu bu oldugu icin acilan dosyanin
   * tam yolu ve mevcut olup olmadigi baslangicta bir kez kayda gecirilir.
   */
  const tamYol = resolve(DB_YOLU);
  const vardi = existsSync(tamYol);

  mkdirSync(dirname(tamYol), { recursive: true });
  console.log(
    `[veritabani] ${tamYol} ${vardi ? "acildi" : "YOKTU, yeni olusturuldu"}`
  );

  const db = new Database(tamYol);

  // WAL: okuma ve yazmanin birbirini bloklamamasi icin. Ziyaretci sayfayi
  // okurken admin panelinden kayit yazilabilir.
  db.pragma("journal_mode = WAL");

  // KRITIK: SQLite'ta yabanci anahtar zorlamasi VARSAYILAN OLARAK KAPALIDIR
  // ve her baglanti icin ayri ayri acilmasi gerekir. Acilmazsa
  // proje_gorseller.ON DELETE CASCADE sessizce calismaz; silinen projelerin
  // gorsel kayitlari tabloda oksuz olarak birikir.
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projeler (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      slug      TEXT    NOT NULL UNIQUE,
      baslik    TEXT    NOT NULL,
      konum     TEXT    NOT NULL DEFAULT '',
      durum     TEXT    NOT NULL DEFAULT 'devam',
      yil       TEXT    NOT NULL DEFAULT '',
      ozet      TEXT    NOT NULL DEFAULT '',
      aciklama  TEXT    NOT NULL DEFAULT '',
      kapak     TEXT,
      sira      INTEGER NOT NULL DEFAULT 0,
      yayinda   INTEGER NOT NULL DEFAULT 1,
      olusturma TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proje_gorseller (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      proje_id INTEGER NOT NULL REFERENCES projeler(id) ON DELETE CASCADE,
      dosya    TEXT    NOT NULL,
      sira     INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_gorsel_proje ON proje_gorseller(proje_id, sira);

    CREATE TABLE IF NOT EXISTS ayarlar (
      anahtar TEXT PRIMARY KEY,
      deger   TEXT NOT NULL
    );
  `);

  return db;
}

/**
 * Baglanti globalThis uzerinde paylasiliyor.
 *
 * Gelistirmede: Next her dosya degisikliginde modulleri yeniden yukler; modul
 * kapsamindaki bir baglanti her seferinde yeniden acilir ve eskiler
 * kapatilmadigi icin dosya tanimlayicilari sizar.
 *
 * Uretimde de gerekli: Next kodu birden fazla sunucu paketine (chunk) boler
 * ve bu modul her paket icin ayri ayri degerlendirilir. Uretim derlemesinde
 * baglantinin iki kez acildigi olculdu. SQLite ayni surecteki birden fazla
 * baglantiyla basa cikar, ancak gereksiz dosya tanimlayicisi tutmanin ve
 * semayi iki kez calistirmanin bir faydasi yok.
 */
const g = globalThis as unknown as { __basariDb?: Database.Database };

export const db: Database.Database = (g.__basariDb ??= baglantiAc());
