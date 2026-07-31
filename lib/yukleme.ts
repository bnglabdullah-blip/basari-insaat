import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Proje fotograflarinin diske yazilmasi.
 *
 * Yukleme bir GUVEN SINIRIDIR: buraya gelen her sey, kimligi dogrulanmis bir
 * yonetici gondermis olsa bile, dogrulanmadan diske yazilmaz.
 */

/** Fotograflarin yazildigi klasor. Docker'da buraya bir volume baglanir. */
const KLASOR = join(process.cwd(), "public", "uploads");

/** Web'den erisilen yol onu. */
export const URL_ONU = "/uploads";

const AZAMI_BOYUT = 15 * 1024 * 1024; // 15 MB — drone fotograflari buyuk olabilir

/**
 * Dosya turu, istemcinin bildirdigi MIME tipine gore DEGIL, dosyanin ilk
 * baytlarindaki imzaya (magic bytes) gore belirlenir. Tarayicinin gonderdigi
 * Content-Type basligi tamamen istemci kontrolundedir ve taklit edilebilir.
 */
const IMZALAR: { uzanti: string; test: (b: Buffer) => boolean }[] = [
  {
    uzanti: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    uzanti: "png",
    test: (b) =>
      b.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  {
    uzanti: "webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export type YuklemeSonuc =
  | { ok: true; dosya: string }
  | { ok: false; hata: string };

export async function fotografKaydet(dosya: File): Promise<YuklemeSonuc> {
  if (dosya.size === 0) return { ok: false, hata: "Boş dosya." };
  if (dosya.size > AZAMI_BOYUT) {
    return {
      ok: false,
      hata: `"${dosya.name}" çok büyük (${(dosya.size / 1024 / 1024).toFixed(1)} MB). En fazla 15 MB.`,
    };
  }

  const veri = Buffer.from(await dosya.arrayBuffer());
  const eslesme = IMZALAR.find((i) => i.test(veri));
  if (!eslesme) {
    return {
      ok: false,
      hata: `"${dosya.name}" geçerli bir JPG, PNG veya WEBP dosyası değil.`,
    };
  }

  /*
   * Dosya adi TAMAMEN sunucuda uretiliyor; kullanicinin verdigi ad hicbir
   * sekilde yola karismiyor. Bu, "../../" gibi dizin gezinme (path traversal)
   * saldirilarini ve isletim sistemine ozel tehlikeli adlari (CON, NUL,
   * gizli nokta dosyalari) tek hamlede imkansiz kilar. Ad temizlemeye
   * calismak yerine hic kullanmamak daha guvenli.
   */
  const ad = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${eslesme.uzanti}`;

  await mkdir(KLASOR, { recursive: true });
  await writeFile(join(KLASOR, ad), veri);

  return { ok: true, dosya: `${URL_ONU}/${ad}` };
}

/**
 * Diskten fotograf siler.
 *
 * Silme, veritabani kaydi gittikten sonra "en iyi cabayla" yapilir: dosya
 * zaten yoksa veya izin hatasi olusursa islem cokmez. Yetim bir dosyanin
 * diskte kalmasi, kullaniciya hata gostermekten daha az zararli.
 */
export async function fotografSil(webYolu: string): Promise<void> {
  // Sadece kendi urettigimiz bicimdeki yollari kabul et. Veritabanina baska
  // bir yoldan deger girmis olsa bile rastgele bir dosyayi silemeyiz.
  const ad = webYolu.startsWith(`${URL_ONU}/`)
    ? webYolu.slice(URL_ONU.length + 1)
    : null;
  if (!ad || !/^[a-z0-9-]+\.(jpg|png|webp)$/i.test(ad)) return;

  try {
    await unlink(join(KLASOR, ad));
  } catch {
    // ponytail: sessizce gec. Yetim dosya, cokmus bir silme isleminden iyidir.
  }
}
