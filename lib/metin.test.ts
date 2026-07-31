import assert from "node:assert/strict";
import test from "node:test";
import { slugla } from "./metin.ts";

test("noktasiz i harfi kaybolmaz", () => {
  // Naif NFD tabanli slug fonksiyonlarinin duzenli olarak battigi yer.
  assert.equal(slugla("Yapı Denetim"), "yapi-denetim");
  assert.equal(slugla("Adil Över Apartmanı"), "adil-over-apartmani");
  assert.equal(slugla("Kanalıcı"), "kanalici");
});

test("tum Turkce harfler dogru eslenir", () => {
  assert.equal(slugla("şğüöçıŞĞÜÖÇİ"), "sguocisguoci");
});

test("bosluk ve noktalama tireye donusur, tekrar etmez", () => {
  assert.equal(slugla("Prof. Dr.  Yılmaz   Büyükerşen"), "prof-dr-yilmaz-buyukersen");
  assert.equal(slugla("A / B & C"), "a-b-c");
});

test("bas ve sondaki tireler kirpilir", () => {
  assert.equal(slugla("  --Merhaba--  "), "merhaba");
  assert.equal(slugla("!!!"), "");
});

test("cok uzun basliklar kirpilir", () => {
  assert.ok(slugla("a".repeat(200)).length <= 80);
});
