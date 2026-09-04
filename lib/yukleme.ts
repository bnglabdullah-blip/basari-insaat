import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Proje fotograflari — Supabase Storage katmani.
 *
 * Dosyalar artik SUNUCUDAN GECMIYOR. Netlify fonksiyon govdesi ~6 MB ile
 * sinirli; fotograflar tarayicida kucultulup WebP'ye cevriliyor ve buradan
 * uretilen IMZALI URL ile dogrudan Storage'a yukleniyor. Sunucunun isi
 * yalnizca: (1) yukleme iznini imzalamak, (2) silmek.
 *
 * Guven siniri korunuyor:
 *   - Dosya ADI tamamen sunucuda uretilir; istemciden gelen ada asla
 *     guvenilmez. Imzali URL o ada baglidir — istemci baska yola yazamaz.
 *   - Tip (yalniz image/webp) ve boyut (2 MB) sinirlarini Storage bucket'i
 *     SUNUCU tarafinda zorlar (bkz. supabase/migrations/0002_storage.sql);
 *     istemcinin kucultme kodu atlatilsa bile buyuk/yabanci dosya reddedilir.
 *
 * db import'u fonksiyon icinde (dinamik): dosya adi uretme/dogrulama saf
 * fonksiyonlar ve `node --test` ile ortam degiskeni kurmadan test ediliyor
 * (bkz. yukleme.test.ts). Modul yuklenirken Supabase istemcisi kurulsaydi
 * test icin SUPABASE_URL tanimlamak gerekirdi.
 */

export type YuklemeHedefi = {
  /** Sunucuda uretilen ad; yukleme bitince gorselKaydetAction'a geri verilir. */
  dosyaAdi: string;
  /** Tarayicinin PUT edecegi imzali URL. */
  url: string;
  /** supabase-js uploadToSignedUrl kullanilirsa gereken jeton. */
  token: string;
};

/**
 * Rastgele, catismasiz dosya adi. Kullanici girdisi icermedigi icin dizin
 * gezinme (path traversal) ve tehlikeli adlar (CON, nokta dosyalari) bastan
 * imkansiz. Uzanti hep .webp — tarayici baska sey uretmiyor, bucket baska
 * sey kabul etmiyor.
 */
export function dosyaAdiUret(): string {
  return `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
}

/**
 * dosyaAdiUret() ciktisiyla birebir ayni bicim. Istemciden geri donen adlar
 * kaydedilmeden ve silinmeden once bundan gecer: bizim uretmedigimiz bicimde
 * bir ad, hangi yoldan gelirse gelsin islenmez.
 */
export function dosyaAdiGecerliMi(ad: string): boolean {
  return /^[a-z0-9]{1,16}-[a-f0-9]{12}\.webp$/.test(ad);
}

/** Kayitli `dosya` degeri: bucket'in herkese acik URL'i. */
export async function dosyaUrl(ad: string): Promise<string> {
  const { db, GORSEL_BUCKET } = await import("./db");
  return db.storage.from(GORSEL_BUCKET).getPublicUrl(ad).data.publicUrl;
}

/** `adet` kadar imzali yukleme hedefi uretir. */
export async function imzaliYuklemeHedefleri(
  adet: number
): Promise<YuklemeHedefi[]> {
  const { db, GORSEL_BUCKET } = await import("./db");

  return Promise.all(
    Array.from({ length: adet }, async () => {
      const dosyaAdi = dosyaAdiUret();
      const { data, error } = await db.storage
        .from(GORSEL_BUCKET)
        .createSignedUploadUrl(dosyaAdi, { upsert: false });
      if (error || !data) {
        throw new Error(
          `[yukleme] imzali URL uretilemedi: ${error?.message ?? "bos yanit"}`
        );
      }
      return { dosyaAdi, url: data.signedUrl, token: data.token };
    })
  );
}

/**
 * Storage'dan fotograf siler.
 *
 * Silme, veritabani kaydi gittikten sonra "en iyi cabayla" yapilir: dosya
 * zaten yoksa islem cokmez. Yetim bir dosyanin bucket'ta kalmasi,
 * kullaniciya hata gostermekten daha az zararli — ama artik sessiz degil,
 * her aksama loglanir.
 */
export async function fotografSil(dosyaYolu: string): Promise<void> {
  const { db, GORSEL_BUCKET } = await import("./db");

  // Veritabaninda tam public URL saklaniyor; addan onceki kismi at.
  const isaret = `/storage/v1/object/public/${GORSEL_BUCKET}/`;
  const konum = dosyaYolu.indexOf(isaret);
  const ad = konum >= 0 ? dosyaYolu.slice(konum + isaret.length) : null;

  if (!ad || !dosyaAdiGecerliMi(ad)) {
    // SQLite/diskteki eski "/uploads/..." kayitlari da buraya duser; onlarin
    // Storage'da karsiligi yok, silinecek bir sey de yok.
    console.error(`[yukleme] silinemedi, taninmayan dosya yolu: ${dosyaYolu}`);
    return;
  }

  const { error } = await db.storage.from(GORSEL_BUCKET).remove([ad]);
  if (error) {
    console.error(`[yukleme] Storage silme hatasi (${ad}): ${error.message}`);
  }
}
