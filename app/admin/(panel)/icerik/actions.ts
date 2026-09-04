"use server";

import { revalidatePath } from "next/cache";
import { parolaDegistir, yetkiGerekli } from "@/lib/auth";
import { VARSAYILAN, type AyarAnahtari } from "@/lib/icerik";
import { ayarlariKaydet } from "@/lib/queries";

export type IcerikDurum = { hata?: string; bilgi?: string };

export async function icerikKaydetAction(
  _onceki: IcerikDurum,
  form: FormData
): Promise<IcerikDurum> {
  await yetkiGerekli();

  const degerler: Partial<Record<AyarAnahtari, string>> = {};

  /*
   * Formdan gelen anahtarlar VARSAYILAN'daki alanlarla sinirlaniyor.
   * Aksi halde forma elle eklenen rastgele bir alan ayarlar tablosuna
   * yazilabilirdi — girdiyi beyaz listeye gore suzmek, kara liste
   * denemekten her zaman daha guvenli.
   */
  for (const anahtar of Object.keys(VARSAYILAN) as AyarAnahtari[]) {
    const deger = form.get(anahtar);
    if (typeof deger === "string") degerler[anahtar] = deger.trim();
  }

  await ayarlariKaydet(degerler);

  // Iletisim bilgileri footer'da, yani HER sayfada gorunuyor.
  revalidatePath("/", "layout");

  return { bilgi: "Kaydedildi. Değişiklikler sitede güncellendi." };
}

export async function parolaDegistirAction(
  _onceki: IcerikDurum,
  form: FormData
): Promise<IcerikDurum> {
  // Her server action kendi yetki kontrolunu yapar (bkz. lib/auth.ts aciklamasi).
  await yetkiGerekli();

  const sonuc = await parolaDegistir(
    String(form.get("mevcut") ?? ""),
    String(form.get("yeni") ?? "")
  );

  return sonuc.ok
    ? { bilgi: "Parola değiştirildi. Bir sonraki girişte yeni parolayı kullanın." }
    : { hata: sonuc.hata };
}
