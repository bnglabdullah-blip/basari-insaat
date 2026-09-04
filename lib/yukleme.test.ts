import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyaAdiGecerliMi, dosyaAdiUret } from "./yukleme.ts";

/*
 * Yukleme katmaninin SAF kismi: dosya adi uretimi ve dogrulamasi.
 *
 * Gorsel isleme (kucultme/WebP/EXIF) tarayiciya tasindi, Storage cagrilari
 * ise ag gerektirir; burada test edilen sey guven sinirinin kalbi — istemciden
 * donen bir adin bizim kalibimiza uymadikca islenmemesi.
 */

test("uretilen ad kendi dogrulamasindan gecer", () => {
  for (let i = 0; i < 50; i++) {
    const ad = dosyaAdiUret();
    assert.ok(dosyaAdiGecerliMi(ad), `gecersiz uretim: ${ad}`);
  }
});

test("uretilen adlar benzersizdir", () => {
  const adlar = new Set(Array.from({ length: 200 }, dosyaAdiUret));
  assert.equal(adlar.size, 200);
});

test("uzanti her zaman .webp", () => {
  assert.match(dosyaAdiUret(), /\.webp$/);
});

test("dizin gezinme ve yabanci adlar reddedilir", () => {
  for (const kotu of [
    "../gizli.webp", // dizin gezinme
    "..%2Fgizli.webp", // kodlanmis gezinme
    "alt/klasor.webp", // yol ayraci
    "a b.webp", // bosluk
    "resim.jpg", // yanlis uzanti
    "resim.webp.exe", // cift uzanti
    "ABC123-aabbccddeeff.webp", // buyuk harf (bizim uretim hep kucuk)
    "-aabbccddeeff.webp", // govdesiz
    "abc-XYZ.webp", // hex olmayan son ek
    "abc-aabbcc.webp", // kisa son ek (12 hex olmali)
    "", // bos
    ".webp",
  ]) {
    assert.equal(dosyaAdiGecerliMi(kotu), false, `kabul edildi: ${kotu}`);
  }
});
