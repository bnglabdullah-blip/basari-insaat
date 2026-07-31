import assert from "node:assert/strict";
import test from "node:test";
import { YUVA, yuvaGorseli } from "./vitrin.ts";

/** Galerideki gercek durum: 11 ayirt edilebilir kare. */
const HAVUZ = Array.from({ length: 11 }, (_, i) => `/uploads/f${i}.jpg`);

test("hicbir yuva bir digeriyle ayni fotografi vermez", () => {
  // Asil kosul bu: sayfalar arasi tekrar burada yakalanir.
  const secilenler = Object.values(YUVA).map((y) => yuvaGorseli(HAVUZ, y));
  assert.equal(new Set(secilenler).size, secilenler.length);
});

test("hicbir yuva kapagi (0) calmaz", () => {
  // Proje kartlari kapagi kullaniyor; bir yuva da kapaga denk gelirse
  // ana sayfada yine ayni kare iki kez cikar.
  const kapak = HAVUZ[0];
  for (const [ad, y] of Object.entries(YUVA)) {
    assert.notEqual(yuvaGorseli(HAVUZ, y), kapak, `${ad} yuvasi kapaga denk geldi`);
  }
});

test("ayni yuva her cagrida ayni fotografi verir", () => {
  // Sunucu bileseni her istekte yeniden calisir; secim kararli olmali.
  assert.equal(yuvaGorseli(HAVUZ, 3), yuvaGorseli(HAVUZ, 3));
});

test("bos havuz cokmez", () => {
  // Yeni kurulumda veya fotografsiz projede. Gorsel bileseni undefined'i
  // zaten desenli yer tutucuya ceviriyor.
  assert.equal(yuvaGorseli([], YUVA.anaHero), undefined);
});

test("havuz yuva numarasindan kucukse basa doner", () => {
  assert.equal(yuvaGorseli(["/a.jpg", "/b.jpg"], 7), "/b.jpg");
});
