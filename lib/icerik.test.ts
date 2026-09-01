import assert from "node:assert/strict";
import { test } from "node:test";
import { whatsappLink, whatsappMesaji, whatsappNumara } from "./icerik.ts";

const HAT = "0534 590 25 63";

test("yerel, uluslararasi ve kodsuz yazim ayni numaraya cikar", () => {
  // Panele hangi bicimde yazilirsa yazilsin baglanti calismali.
  assert.equal(whatsappNumara("0534 590 25 63"), "905345902563");
  assert.equal(whatsappNumara("+90 534 590 25 63"), "905345902563");
  assert.equal(whatsappNumara("534 590 25 63"), "905345902563");
  assert.equal(whatsappNumara("905345902563"), "905345902563");
});

test("numarada arti, bosluk veya bastaki sifir kalmaz", () => {
  // wa.me bunlarin hicbirini kabul etmiyor; kalirsa baglanti sessizce bozulur.
  const n = whatsappNumara("+90 (534) 590-25-63");
  assert.match(n, /^[0-9]+$/);
  assert.ok(!n.startsWith("0"));
});

test("mesaj bicimi: once ad soyad, sonra yazilan metin", () => {
  assert.equal(whatsappMesaji("Ayşe Yılmaz", "Arsam var."), "Ayşe Yılmaz\nArsam var.");
});

test("bastaki ve sondaki bosluklar kirpilir", () => {
  assert.equal(whatsappMesaji("  Ayşe  ", "  Merhaba  "), "Ayşe\nMerhaba");
});

test("satir sonu ve Turkce karakterler adres icin kodlanir", () => {
  const b = whatsappLink(HAT, whatsappMesaji("Ayşe Yılmaz", "Görüşmek isterim."));
  assert.ok(b.startsWith("https://wa.me/905345902563?text="));
  // Kodlanmamis satir sonu adresi kirar; %0A olarak gecmeli.
  assert.ok(b.includes("%0A"));
  assert.ok(!b.includes("\n"));
  // Ham Turkce karakter kalmamali.
  assert.ok(!/[şığüöçŞİĞÜÖÇ]/.test(b));
});

test("& ve # gibi karakterler adresi bolmez", () => {
  // Kodlanmazsa "#" sonrasi sunucuya hic gitmez, "&" yeni parametre acar.
  const b = whatsappLink(HAT, whatsappMesaji("Ali", "A & B #2 dairesi"));
  assert.ok(!b.includes(" & "));
  assert.ok(!b.includes("#"));
  assert.equal(b.split("?").length, 2);
});
