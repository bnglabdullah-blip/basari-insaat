import assert from "node:assert/strict";
import test from "node:test";
import {
  OTURUM_SURESI_SN,
  jetonDogrula,
  jetonUret,
  parolaDogrula,
  parolaHashle,
} from "./oturum.ts";

const ANAHTAR = "test-gizli-anahtar-en-az-32-karakter-olmali";

/* ----------------------------------------------------------------------
   Parola
   ---------------------------------------------------------------------- */

test("dogru parola kabul edilir", () => {
  const saklanan = parolaHashle("Ç0k-Gizli-Parola!");
  assert.equal(parolaDogrula("Ç0k-Gizli-Parola!", saklanan), true);
});

test("yanlis parola reddedilir", () => {
  const saklanan = parolaHashle("Ç0k-Gizli-Parola!");
  assert.equal(parolaDogrula("Ç0k-Gizli-Parola", saklanan), false);
  assert.equal(parolaDogrula("", saklanan), false);
});

test("ayni parola her seferinde farkli hash uretir (tuzlama calisiyor)", () => {
  // Tuz olmasaydi iki hash ayni olurdu ve gokkusagi tablosu saldirisi
  // mumkun hale gelirdi.
  assert.notEqual(parolaHashle("ayni"), parolaHashle("ayni"));
});

test("bozuk hash kaydi cokme yerine false dondurur", () => {
  assert.equal(parolaDogrula("x", "tuzsuz-kayit"), false);
  assert.equal(parolaDogrula("x", ""), false);
  assert.equal(parolaDogrula("x", "aabb:ccdd"), false); // dogru bicim, yanlis uzunluk
});

/* ----------------------------------------------------------------------
   Oturum jetonu
   ---------------------------------------------------------------------- */

test("taze jeton gecerlidir", () => {
  assert.equal(jetonDogrula(jetonUret(ANAHTAR), ANAHTAR), true);
});

test("kurcalanmis imza reddedilir", () => {
  const jeton = jetonUret(ANAHTAR);
  const [govde, imza] = jeton.split(".");

  // Imzanin son karakterini degistir
  const bozuk = govde + "." + imza.slice(0, -1) + (imza.at(-1) === "A" ? "B" : "A");
  assert.equal(jetonDogrula(bozuk, ANAHTAR), false);
});

test("son kullanma tarihi uzatilmis jeton reddedilir", () => {
  // Saldirganin en cazip hamlesi: govdedeki zaman damgasini ileri almak.
  // Imza govdeye bagli oldugu icin bu mutlaka yakalanmali.
  const uzatilmis = String(Math.floor(Date.now() / 1000) + 999999);
  const jeton = jetonUret(ANAHTAR);
  const sahte = uzatilmis + "." + jeton.split(".")[1];
  assert.equal(jetonDogrula(sahte, ANAHTAR), false);
});

test("suresi dolmus jeton reddedilir", () => {
  const gecmis = Date.now() / 1000 - OTURUM_SURESI_SN - 10;
  const jeton = jetonUret(ANAHTAR, gecmis);
  assert.equal(jetonDogrula(jeton, ANAHTAR), false);
  // Ayni jeton, uretildigi anda gecerliydi:
  assert.equal(jetonDogrula(jeton, ANAHTAR, gecmis + 1), true);
});

test("baska anahtarla imzalanmis jeton reddedilir", () => {
  const jeton = jetonUret("baska-bir-anahtar-tamamen-farkli-olan");
  assert.equal(jetonDogrula(jeton, ANAHTAR), false);
});

test("bicimsiz girdiler cokme yerine false dondurur", () => {
  for (const girdi of [undefined, null, "", ".", "imzasiz", ".sadeceimza"]) {
    assert.equal(jetonDogrula(girdi, ANAHTAR), false, `girdi: ${girdi}`);
  }
});
