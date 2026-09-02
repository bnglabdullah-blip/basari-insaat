import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";
import { fotografKaydet, fotografSil } from "./yukleme.ts";

/* Testler gercek dosya yaziyor; her test kendi ciktisini siliyor. */
const KLASOR = "public/uploads";

async function jpeg(en: number, boy: number, ek?: Record<string, unknown>) {
  let s = sharp({
    create: { width: en, height: boy, channels: 3, background: "#8b5a3c" },
  });
  if (ek) s = s.withMetadata(ek);
  return s.jpeg().toBuffer();
}

/** Kaydedilmis dosyayi bellege okur (tutamak birakmadan). */
const okuAl = (webYolu: string) => readFile(`${KLASOR}/${webYolu.split("/").pop()}`);

const dosyala = (b: Buffer, ad = "test.jpg") =>
  new File([new Uint8Array(b)], ad, { type: "image/jpeg" });

/** Kaydedilen dosyayi okuyup metadata'sini dondurur, sonra siler. */
async function kaydetVeOlc(b: Buffer, ad?: string) {
  const s = await fotografKaydet(dosyala(b, ad));
  if (!s.ok) return { s, m: null };
  // Dosyayi ONCE bellege okuyoruz: sharp'a yol verilirse Windows'ta dosya
  // tutamagi acik kalir, sonraki unlink sessizce basarisiz olur ve test
  // artiklari birikir.
  const m = await sharp(await okuAl(s.dosya)).metadata();
  await fotografSil(s.dosya);
  return { s, m };
}

test("genis gorsel 1600 px'e kuculur", async () => {
  const { s, m } = await kaydetVeOlc(await jpeg(4000, 3000));
  assert.ok(s.ok);
  assert.equal(m!.width, 1600);
  assert.equal(m!.height, 1200); // en-boy orani korunuyor
});

test("kucuk gorsel BUYUTULMEZ", async () => {
  // Buyutmek dosyayi sisirir, detay eklemez.
  const { m } = await kaydetVeOlc(await jpeg(800, 600));
  assert.equal(m!.width, 800);
});

test("cikti her zaman webp", async () => {
  const s = await fotografKaydet(dosyala(await jpeg(1000, 800)));
  assert.ok(s.ok);
  assert.match(s.dosya, /\.webp$/);
  const m = await sharp(await okuAl(s.dosya)).metadata();
  assert.equal(m.format, "webp");
  await fotografSil(s.dosya);
});

test("EXIF yon bilgisi piksellere uygulanir", async () => {
  /*
   * Orientation 6 = "90 derece dondurulmus goster". Metadata cikista
   * dusuruldugu icin, once dondurulmezse fotograf sitede YAN gorunurdu.
   * 200x100 girdi, dondukten sonra 100x200 olmali.
   */
  const { m } = await kaydetVeOlc(await jpeg(200, 100, { orientation: 6 }));
  assert.equal(m!.width, 100);
  assert.equal(m!.height, 200);
});

test("EXIF verisi (GPS dahil) cikistan silinir", async () => {
  const { m } = await kaydetVeOlc(await jpeg(600, 400, { orientation: 1 }));
  assert.equal(m!.exif, undefined);
});

test("gorsel olmayan dosya imza kontrolunde reddedilir", async () => {
  // Adi .jpg, tipi image/jpeg — ama ilk baytlar JPEG degil.
  const sahte = new File([new Uint8Array(Buffer.from("MZ\x90\x00 bu bir exe"))], "kotu.jpg", {
    type: "image/jpeg",
  });
  const s = await fotografKaydet(sahte);
  assert.equal(s.ok, false);
  assert.match((s as { hata: string }).hata, /geçerli bir JPG/);
});

test("bos dosya reddedilir", async () => {
  const s = await fotografKaydet(new File([], "bos.jpg", { type: "image/jpeg" }));
  assert.equal(s.ok, false);
});

test("imzasi dogru ama icerigi bozuk dosya cokmez", async () => {
  // JPEG imzasiyla basliyor ama gecerli bir goruntu degil: sharp patlar,
  // biz hata dondurmeliyiz.
  const bozuk = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(600, 7)]);
  const s = await fotografKaydet(dosyala(bozuk, "bozuk.jpg"));
  assert.equal(s.ok, false);
  assert.match((s as { hata: string }).hata, /işlenemedi/);
});
