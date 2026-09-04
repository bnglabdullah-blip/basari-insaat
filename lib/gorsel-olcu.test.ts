import assert from "node:assert/strict";
import test from "node:test";
import { AZAMI_KENAR, yeniOlcu } from "./gorsel-kucult.ts";

/*
 * gorsel-kucult.ts'in geri kalani tarayici API'si (createImageBitmap,
 * OffscreenCanvas) — node:test icinde calismaz. Bu yuzden yalnizca saf olan
 * olcu hesabi test ediliyor; dosya adi da "gorsel-kucult.test.ts" DEGIL,
 * boylece testin neyi kapsadigi adindan anlasiliyor.
 */

test("uzun kenar sinira indirilir, en-boy orani korunur", () => {
  // Tipik bir telefon karesi (4:3).
  const { genislik, yukseklik } = yeniOlcu(4032, 3024);
  assert.equal(genislik, AZAMI_KENAR);
  assert.equal(yukseklik, 1440);
});

test("dikey fotografta sinir YUKSEKLIGE uygulanir", () => {
  // Asil tuzak bu: "genislige gore olcekle" diye yazilmis bir kod, dikey
  // bir fotografi 1920x2560'a birakir — hedeflenenden buyuk.
  const { genislik, yukseklik } = yeniOlcu(3024, 4032);
  assert.equal(yukseklik, AZAMI_KENAR);
  assert.equal(genislik, 1440);
});

test("zaten kucuk fotograf BUYUTULMEZ", () => {
  // Buyutmek dosyayi sisirir, detay eklemez.
  assert.deepEqual(yeniOlcu(800, 600), { genislik: 800, yukseklik: 600 });
});

test("sinirdaki fotograf oldugu gibi kalir", () => {
  assert.deepEqual(yeniOlcu(1920, 1080), { genislik: 1920, yukseklik: 1080 });
});

test("asiri ince serit sifir piksele dusmez", () => {
  // Yuvarlama 0 uretirse canvas hata verir; en az 1 piksel garanti.
  const { yukseklik } = yeniOlcu(8000, 3);
  assert.ok(yukseklik >= 1, `yukseklik ${yukseklik} olmamali`);
});

test("bozuk 0x0 girdi cokmez", () => {
  assert.deepEqual(yeniOlcu(0, 0), { genislik: 0, yukseklik: 0 });
});
