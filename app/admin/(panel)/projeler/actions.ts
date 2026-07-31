"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { yetkiGerekli } from "@/lib/auth";
import { slugla } from "@/lib/metin";
import {
  gorselEkle,
  gorselGetir,
  gorselSil,
  gorselleriSirala,
  kapakTazele,
  projeEkle,
  projeGetirId,
  projeGorselleri,
  projeGuncelle,
  projeSil,
  slugKullanimda,
  type ProjeDurum,
} from "@/lib/queries";
import { fotografKaydet, fotografSil } from "@/lib/yukleme";

export type ProjeDurumSonuc = { hata?: string; bilgi?: string };

const GECERLI_DURUMLAR: ProjeDurum[] = ["planlama", "devam", "tamamlandi"];

/** Public sitede bu projenin gorundugu tum yollari tazeler. */
function sayfalariTazele(slug?: string) {
  revalidatePath("/");
  revalidatePath("/projeler");
  if (slug) revalidatePath(`/projeler/${slug}`);
}

/** Form alanlarini okur ve dogrular. */
function formuOku(form: FormData) {
  const baslik = String(form.get("baslik") ?? "").trim();
  if (!baslik) return { hata: "Proje başlığı zorunlu." } as const;

  const durumHam = String(form.get("durum") ?? "devam");
  const durum = (GECERLI_DURUMLAR as string[]).includes(durumHam)
    ? (durumHam as ProjeDurum)
    : "devam";

  // Slug elle girilebilir; bos birakilirsa baslikatan uretilir.
  const slugHam = String(form.get("slug") ?? "").trim();
  const slug = slugla(slugHam || baslik);
  if (!slug) {
    return {
      hata: "Başlıktan geçerli bir web adresi üretilemedi. Latin harf içeren bir başlık girin.",
    } as const;
  }

  return {
    veri: {
      baslik,
      slug,
      konum: String(form.get("konum") ?? "").trim(),
      durum,
      yil: String(form.get("yil") ?? "").trim(),
      ozet: String(form.get("ozet") ?? "").trim(),
      aciklama: String(form.get("aciklama") ?? "").trim(),
      yayinda: form.get("yayinda") ? 1 : 0,
    },
  } as const;
}

/* ==========================================================================
   Proje olusturma / guncelleme / silme
   ========================================================================== */

export async function projeKaydetAction(
  _onceki: ProjeDurumSonuc,
  form: FormData
): Promise<ProjeDurumSonuc> {
  // Her action kendi yetki kontrolunu yapar — layout'taki kontrol buraya
  // ulasmaz. Ayrintili aciklama lib/auth.ts icinde.
  await yetkiGerekli();

  const okunan = formuOku(form);
  if ("hata" in okunan) return { hata: okunan.hata };

  const idHam = form.get("id");
  const id = idHam ? Number(idHam) : null;

  if (slugKullanimda(okunan.veri.slug, id ?? undefined)) {
    return {
      hata: `"${okunan.veri.slug}" web adresi başka bir projede kullanılıyor. Başlığı veya web adresini değiştirin.`,
    };
  }

  if (id) {
    const mevcut = projeGetirId(id);
    if (!mevcut) return { hata: "Proje bulunamadı." };
    projeGuncelle(id, okunan.veri);
    sayfalariTazele(mevcut.slug);
    sayfalariTazele(okunan.veri.slug); // slug degistiyse eski yol da tazelenir
    revalidatePath(`/admin/projeler/${id}`);
    return { bilgi: "Değişiklikler kaydedildi." };
  }

  const yeniId = projeEkle(okunan.veri);
  sayfalariTazele(okunan.veri.slug);
  redirect(`/admin/projeler/${yeniId}`);
}

export async function projeSilAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  const id = Number(form.get("id"));
  const proje = projeGetirId(id);
  if (!proje) redirect("/admin/projeler");

  // Once diskteki dosyalar, sonra veritabani kaydi. Ters sirada yapilsaydi
  // (once DB) hangi dosyalarin silinecegi bilgisi kaybolur ve fotograflar
  // diskte sonsuza kadar yetim kalirdi.
  for (const g of projeGorselleri(id)) await fotografSil(g.dosya);

  projeSil(id);
  sayfalariTazele(proje.slug);
  redirect("/admin/projeler");
}

/* ==========================================================================
   Görseller
   ========================================================================== */

export async function gorselYukleAction(
  _onceki: ProjeDurumSonuc,
  form: FormData
): Promise<ProjeDurumSonuc> {
  await yetkiGerekli();

  const projeId = Number(form.get("projeId"));
  const proje = projeGetirId(projeId);
  if (!proje) return { hata: "Proje bulunamadı." };

  const dosyalar = form
    .getAll("fotograflar")
    .filter((d): d is File => d instanceof File && d.size > 0);

  if (dosyalar.length === 0) return { hata: "Fotoğraf seçilmedi." };

  const hatalar: string[] = [];
  let basarili = 0;

  for (const d of dosyalar) {
    const sonuc = await fotografKaydet(d);
    if (sonuc.ok) {
      gorselEkle(projeId, sonuc.dosya);
      basarili++;
    } else {
      hatalar.push(sonuc.hata);
    }
  }

  revalidatePath(`/admin/projeler/${projeId}`);
  sayfalariTazele(proje.slug);

  // Kismi basari gercek bir durum: 5 fotograftan 4'u yuklenip biri
  // bozuksa, kullanici hem neyin gectigini hem neyin kaldigini gormeli.
  if (hatalar.length > 0) {
    return {
      hata:
        (basarili > 0 ? `${basarili} fotoğraf yüklendi. ` : "") +
        hatalar.join(" "),
    };
  }
  return { bilgi: `${basarili} fotoğraf yüklendi.` };
}

export async function gorselSilAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  const gorselId = Number(form.get("gorselId"));
  const gorsel = gorselGetir(gorselId);
  if (!gorsel) return;

  const proje = projeGetirId(gorsel.proje_id);

  gorselSil(gorselId);
  await fotografSil(gorsel.dosya);

  revalidatePath(`/admin/projeler/${gorsel.proje_id}`);
  sayfalariTazele(proje?.slug);
}

export async function gorselSiralaAction(
  projeId: number,
  sirali: number[]
): Promise<void> {
  await yetkiGerekli();

  const proje = projeGetirId(projeId);
  if (!proje) return;

  gorselleriSirala(projeId, sirali);
  // Siralamanin ilk elemani kapak gorseli oldugu icin kapak da tazelenir.
  kapakTazele(projeId);

  revalidatePath(`/admin/projeler/${projeId}`);
  sayfalariTazele(proje.slug);
}
