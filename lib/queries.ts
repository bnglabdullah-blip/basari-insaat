import { db } from "./db";
import { VARSAYILAN, type AyarAnahtari } from "./icerik";

/* ==========================================================================
   Tipler
   ========================================================================== */

export type ProjeDurum = "planlama" | "devam" | "tamamlandi";

export const DURUM_ETIKET: Record<ProjeDurum, string> = {
  planlama: "Planlama aşamasında",
  devam: "Devam ediyor",
  tamamlandi: "Tamamlandı",
};

export type Proje = {
  id: number;
  slug: string;
  baslik: string;
  konum: string;
  durum: ProjeDurum;
  yil: string;
  ozet: string;
  aciklama: string;
  kapak: string | null;
  sira: number;
  yayinda: number;
  olusturma: string;
};

export type ProjeGorsel = {
  id: number;
  proje_id: number;
  dosya: string;
  sira: number;
};

/* ==========================================================================
   Projeler
   ========================================================================== */

export function projeleriGetir(sadeceYayinda = true): Proje[] {
  return db
    .prepare(
      `SELECT * FROM projeler
       ${sadeceYayinda ? "WHERE yayinda = 1" : ""}
       ORDER BY sira ASC, id DESC`
    )
    .all() as Proje[];
}

export function projeGetir(slug: string): Proje | undefined {
  return db
    .prepare("SELECT * FROM projeler WHERE slug = ? AND yayinda = 1")
    .get(slug) as Proje | undefined;
}

export function projeGetirId(id: number): Proje | undefined {
  return db.prepare("SELECT * FROM projeler WHERE id = ?").get(id) as
    | Proje
    | undefined;
}

export function projeGorselleri(projeId: number): ProjeGorsel[] {
  return db
    .prepare(
      "SELECT * FROM proje_gorseller WHERE proje_id = ? ORDER BY sira ASC, id ASC"
    )
    .all(projeId) as ProjeGorsel[];
}

/**
 * Site genelindeki tum fotograflarin yolu, galeri sirasinda.
 *
 * Vitrin yuvalari (lib/vitrin.ts) bu havuzdan besleniyor: bir sayfada
 * fotograf gereken her yer ayri bir yuva numarasi alir, boylece ayni kare
 * tek ekranda iki kez cikmaz. Yalnizca YAYINDA projelerin fotograflari
 * geliyor — taslak bir projenin karesi ana sayfada belirmemeli.
 */
export function tumGorseller(): string[] {
  return (
    db
      .prepare(
        `SELECT g.dosya FROM proje_gorseller g
         JOIN projeler p ON p.id = g.proje_id
         WHERE p.yayinda = 1
         ORDER BY p.sira ASC, p.id DESC, g.sira ASC`
      )
      .all() as { dosya: string }[]
  ).map((r) => r.dosya);
}

export function projeEkle(v: {
  slug: string;
  baslik: string;
  konum: string;
  durum: ProjeDurum;
  yil: string;
  ozet: string;
  aciklama: string;
  yayinda: number;
}): number {
  /*
   * Yeni proje EN KUCUK sirayi alir (MIN - 1), en buyugunu degil.
   * Listeler "ORDER BY sira ASC" oldugu icin bu, yeni eklenen projeyi
   * listenin BASINA koyar. Onceki hali (MAX + 1) tam tersini yapiyor,
   * yeni projeyi en sona atiyordu.
   */
  const r = db
    .prepare(
      `INSERT INTO projeler (slug, baslik, konum, durum, yil, ozet, aciklama, yayinda, sira)
       VALUES (@slug, @baslik, @konum, @durum, @yil, @ozet, @aciklama, @yayinda,
               (SELECT COALESCE(MIN(sira), 0) - 1 FROM projeler))`
    )
    .run(v);
  return Number(r.lastInsertRowid);
}

export function projeGuncelle(
  id: number,
  v: {
    slug: string;
    baslik: string;
    konum: string;
    durum: ProjeDurum;
    yil: string;
    ozet: string;
    aciklama: string;
    yayinda: number;
  }
): void {
  db.prepare(
    `UPDATE projeler SET slug=@slug, baslik=@baslik, konum=@konum, durum=@durum,
            yil=@yil, ozet=@ozet, aciklama=@aciklama, yayinda=@yayinda
     WHERE id=@id`
  ).run({ ...v, id });
}

export function projeSil(id: number): void {
  // proje_gorseller kayitlari ON DELETE CASCADE ile otomatik siliniyor
  // (db.ts icinde foreign_keys pragma'si aciliyor).
  db.prepare("DELETE FROM projeler WHERE id = ?").run(id);
}

/** Bir slug'in baska bir projede kullanilip kullanilmadigini kontrol eder. */
export function slugKullanimda(slug: string, haricId?: number): boolean {
  const r = db
    .prepare(
      `SELECT 1 FROM projeler WHERE slug = ? ${haricId ? "AND id != ?" : ""} LIMIT 1`
    )
    .get(...(haricId ? [slug, haricId] : [slug]));
  return r !== undefined;
}

/* ==========================================================================
   Proje görselleri
   ========================================================================== */

export function gorselEkle(projeId: number, dosya: string): void {
  db.prepare(
    `INSERT INTO proje_gorseller (proje_id, dosya, sira)
     VALUES (?, ?, (SELECT COALESCE(MAX(sira), 0) + 1 FROM proje_gorseller WHERE proje_id = ?))`
  ).run(projeId, dosya, projeId);
  kapakTazele(projeId);
}

export function gorselGetir(id: number): ProjeGorsel | undefined {
  return db.prepare("SELECT * FROM proje_gorseller WHERE id = ?").get(id) as
    | ProjeGorsel
    | undefined;
}

export function gorselSil(id: number): void {
  const g = gorselGetir(id);
  if (!g) return;
  db.prepare("DELETE FROM proje_gorseller WHERE id = ?").run(id);
  kapakTazele(g.proje_id);
}

/** Yeni sirayi tek islemde yazar — yarim kalmis siralama olusmaz. */
export const gorselleriSirala = db.transaction(
  (projeId: number, sirali: number[]) => {
    const stmt = db.prepare(
      "UPDATE proje_gorseller SET sira = ? WHERE id = ? AND proje_id = ?"
    );
    sirali.forEach((gorselId, i) => stmt.run(i, gorselId, projeId));
  }
);

/**
 * Kapak gorselini her zaman siradaki ILK gorsele esitler.
 *
 * Panelde "Kapak yap" dugmesi gorseli listenin basina tasir; ayri bir kapak
 * alani tutulmuyor. "Birinci fotograf kapaktir" tek kural olarak kaliyor,
 * ogrenilmesi gereken ikinci bir kavram olusmuyor.
 */
function kapakTazele(projeId: number): void {
  const ilk = db
    .prepare(
      "SELECT dosya FROM proje_gorseller WHERE proje_id = ? ORDER BY sira ASC, id ASC LIMIT 1"
    )
    .get(projeId) as { dosya: string } | undefined;
  db.prepare("UPDATE projeler SET kapak = ? WHERE id = ?").run(
    ilk?.dosya ?? null,
    projeId
  );
}

export { kapakTazele };

/* ==========================================================================
   Ayarlar (site metinleri + iletişim bilgileri)
   ========================================================================== */

/**
 * Varsayilanlarin uzerine veritabanindaki degerleri bindirir.
 *
 * Bos string'ler kasitli olarak atlaniyor: admin bir alani temizlediginde
 * sitede o alanin bos gorunmesi degil, varsayilanina donmesi isteniyor.
 * Aksi halde yanlislikla silinen bir telefon numarasi siteden tamamen
 * kaybolurdu.
 */
export function ayarlariGetir(): typeof VARSAYILAN {
  const satirlar = db.prepare("SELECT anahtar, deger FROM ayarlar").all() as {
    anahtar: string;
    deger: string;
  }[];

  const sonuc = { ...VARSAYILAN } as Record<string, string>;
  for (const s of satirlar) {
    if (s.anahtar in VARSAYILAN && s.deger.trim() !== "") {
      sonuc[s.anahtar] = s.deger;
    }
  }
  return sonuc as typeof VARSAYILAN;
}

export const ayarlariKaydet = db.transaction(
  (degerler: Partial<Record<AyarAnahtari, string>>) => {
    const stmt = db.prepare(
      "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger"
    );
    for (const [k, v] of Object.entries(degerler)) stmt.run(k, v ?? "");
  }
);

/* ==========================================================================
   Admin parolasi
   ========================================================================== */

/**
 * Parola ozeti `ayarlar` tablosunda tutuluyor ama VARSAYILAN icinde DEGIL.
 *
 * Bu ayrim KASITLI ve guvenlik acisindan kritik: ayarlariGetir() yalnizca
 * VARSAYILAN'da bulunan anahtarlari donduruyor (bkz. yukaridaki filtre) ve o
 * sonuc IcerikFormu gibi ISTEMCI bilesenlerine kadar gidiyor. Anahtari
 * VARSAYILAN'a eklemek, parola ozetini her sayfa render'inda tarayiciya
 * gondermek anlamina gelirdi. Buradaki filtre, o sizintiyi engelleyen sey.
 */
const PAROLA_ANAHTARI = "admin_parola_hash";

/** Panelden belirlenmis parola ozeti; hic belirlenmediyse null. */
export function parolaHashGetir(): string | null {
  const r = db
    .prepare("SELECT deger FROM ayarlar WHERE anahtar = ?")
    .get(PAROLA_ANAHTARI) as { deger: string } | undefined;
  return r && r.deger.trim() !== "" ? r.deger : null;
}

export function parolaHashKaydet(hash: string): void {
  db.prepare(
    "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger"
  ).run(PAROLA_ANAHTARI, hash);
}
