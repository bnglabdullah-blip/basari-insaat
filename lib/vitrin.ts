/**
 * Vitrin fotograflarinin sayfalara dagitilmasi.
 *
 * Sorun: sitede fotograf gereken her yer "projenin kapagi"ni kullanirsa, tek
 * projeli bir firmada AYNI kare tek ekranda birden fazla kez cikar. Ana
 * sayfada tam genislik hero slab'i ile ilk proje kartinin ikisi de kapagi
 * kullaniyordu; olculdugunde 26 gorsel referansina karsilik 1 benzersiz
 * dosya vardi.
 *
 * Cozum: fotograf gereken her yere bir YUVA NUMARASI verilir, havuzdan o
 * indeksteki kare cekilir. Yuvalar farkli oldugu surece fotograflar da
 * farkli olur.
 *
 * Bu dosya bilincli olarak veritabanindan hicbir sey import etmiyor —
 * boylece saf bir fonksiyon olarak test edilebiliyor (bkz. vitrin.test.ts).
 */

/**
 * Sayfa yuvalari.
 *
 * 0 REZERVE: kapak. Proje kartlari ve proje detay hero'su kapagi kullanir,
 * baska hicbir yuva 0 olamaz.
 *
 * Degerler galerideki editoryel siraya gore secildi:
 *   1 → genis kose cekimi   (hero slab icin dogru olcek)
 *   3 → tugla/denizlik detayi (accent icin doku, bir bina fotografi daha degil)
 */
export const YUVA = {
  anaHero: 1,
  hakkindaAccent: 3,
} as const;

/**
 * Havuzdan bir yuvanin fotografini dondurur.
 *
 * Neden sabit indeks, rastgele secim degil: sunucu bileseni her istekte
 * yeniden calisir. Rastgelelik her yenilemede baska bir fotograf verir,
 * `next/image` onbellegini bosa cikarir ve sayfa "titrek" hissettirir.
 *
 * Modulo, havuz yuva numarasindan kucukse (ornegin 2 fotografli yeni bir
 * kurulum) cokmek yerine basa donmeyi saglar. Bu durumda tekrar kacinilmaz;
 * amac tekrari havuz yeterliyken onlemek.
 */
export function yuvaGorseli(
  havuz: string[],
  yuva: number
): string | undefined {
  if (havuz.length === 0) return undefined;
  return havuz[yuva % havuz.length];
}
