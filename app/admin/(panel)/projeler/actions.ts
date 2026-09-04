"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { yetkiGerekli } from "@/lib/auth";
import { slugla } from "@/lib/metin";
import {
  gorselGetir,
  gorselSil,
  gorselleriEkle,
  gorselleriSirala,
  projeEkle,
  projeGetirId,
  projeGorselleri,
  projeGuncelle,
  projeSil,
  slugKullanimda,
  type ProjeDurum,
} from "@/lib/queries";
import {
  dosyaAdiGecerliMi,
  dosyaUrl,
  fotografSil,
  imzaliYuklemeHedefleri,
  type YuklemeHedefi,
} from "@/lib/yukleme";

export type ProjeDurumSonuc = { hata?: string; bilgi?: string };

const GECERLI_DURUMLAR: ProjeDurum[] = ["planlama", "devam", "tamamlandi"];

/** Tek seferde imzalanabilecek yukleme sayisi — panel zaten coklu secime izin
 * veriyor ama sinirsiz URL talebi anlamsiz. */
const AZAMI_YUKLEME_ADEDI = 20;

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

  // Beyaz liste veritabanindaki CHECK kisitiyla birebir ayni; disina cikan
  // deger DB'ye ulasmadan burada "devam"a katlanir.
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
      // Postgres'te boolean sutun; checkbox'in varligi yeterli.
      yayinda: Boolean(form.get("yayinda")),
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

  /*
   * id alani bozuksa (bos degil ama sayi da degil) islemi kes. Onceki halde
   * Number("abc") = NaN, asagidaki `if (id)` false'a dusuyor ve GUNCELLEME
   * niyetiyle gelen istek sessizce YENI proje olusturuyordu.
   */
  const idHam = form.get("id");
  const id = idHam ? Number(idHam) : null;
  if (id !== null && !Number.isInteger(id)) {
    return { hata: "Geçersiz proje kimliği." };
  }

  if (await slugKullanimda(okunan.veri.slug, id ?? undefined)) {
    return {
      hata: `"${okunan.veri.slug}" web adresi başka bir projede kullanılıyor. Başlığı veya web adresini değiştirin.`,
    };
  }

  if (id) {
    const mevcut = await projeGetirId(id);
    if (!mevcut) return { hata: "Proje bulunamadı." };
    await projeGuncelle(id, okunan.veri);
    sayfalariTazele(mevcut.slug);
    sayfalariTazele(okunan.veri.slug); // slug degistiyse eski yol da tazelenir
    revalidatePath(`/admin/projeler/${id}`);
    return { bilgi: "Değişiklikler kaydedildi." };
  }

  const yeniId = await projeEkle(okunan.veri);
  sayfalariTazele(okunan.veri.slug);
  redirect(`/admin/projeler/${yeniId}`);
}

export async function projeSilAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) redirect("/admin/projeler");

  const proje = await projeGetirId(id);
  if (!proje) redirect("/admin/projeler");

  // Once Storage'daki dosyalar, sonra veritabani kaydi. Ters sirada
  // yapilsaydi (once DB) hangi dosyalarin silinecegi bilgisi kaybolur ve
  // fotograflar bucket'ta sonsuza kadar yetim kalirdi.
  for (const g of await projeGorselleri(id)) await fotografSil(g.dosya);

  await projeSil(id);
  sayfalariTazele(proje.slug);
  redirect("/admin/projeler");
}

/* ==========================================================================
   Görseller — iki adimli yukleme
   --------------------------------------------------------------------------
   Dosyalar Netlify fonksiyonundan GECMEZ (govde siniri ~6 MB). Akis:
     1. Istemci gorselYuklemeUrlAction ile N imzali hedef alir.
     2. Kucultulmus WebP'leri dogrudan Storage'a PUT eder (hedef.url).
     3. Biten adlari gorselKaydetAction'a verir; kayit + kapak + tazeleme
        orada olur.
   ========================================================================== */

export type YuklemeUrlSonuc = { hata?: string; hedefler?: YuklemeHedefi[] };

export async function gorselYuklemeUrlAction(
  projeId: number,
  adet: number
): Promise<YuklemeUrlSonuc> {
  await yetkiGerekli();

  if (!Number.isInteger(projeId) || !Number.isInteger(adet)) {
    return { hata: "Geçersiz istek." };
  }
  if (adet < 1 || adet > AZAMI_YUKLEME_ADEDI) {
    return { hata: `Tek seferde en fazla ${AZAMI_YUKLEME_ADEDI} fotoğraf yüklenebilir.` };
  }
  if (!(await projeGetirId(projeId))) return { hata: "Proje bulunamadı." };

  return { hedefler: await imzaliYuklemeHedefleri(adet) };
}

export async function gorselKaydetAction(
  projeId: number,
  dosyaAdlari: string[]
): Promise<ProjeDurumSonuc> {
  await yetkiGerekli();

  if (!Number.isInteger(projeId)) return { hata: "Geçersiz istek." };
  const proje = await projeGetirId(projeId);
  if (!proje) return { hata: "Proje bulunamadı." };

  /*
   * Adlar istemciden geri geliyor ama istemcinin SECTIGI adlar degil:
   * imzali URL yalnizca bizim urettigimiz ada yazabilir. Yine de bicim
   * dogrulamasi yapiliyor — bizim kalibimiza uymayan bir ad veritabanina
   * hicbir kosulda girmez.
   */
  const gecerli = dosyaAdlari
    .slice(0, AZAMI_YUKLEME_ADEDI)
    .filter(dosyaAdiGecerliMi);
  if (gecerli.length === 0) return { hata: "Kaydedilecek fotoğraf yok." };

  await gorselleriEkle(
    projeId,
    await Promise.all(gecerli.map((ad) => dosyaUrl(ad)))
  );

  revalidatePath(`/admin/projeler/${projeId}`);
  sayfalariTazele(proje.slug);

  return { bilgi: `${gecerli.length} fotoğraf yüklendi.` };
}

export async function gorselSilAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  const gorselId = Number(form.get("gorselId"));
  if (!Number.isInteger(gorselId)) return;

  const gorsel = await gorselGetir(gorselId);
  if (!gorsel) return;

  const proje = await projeGetirId(gorsel.proje_id);

  await gorselSil(gorselId); // kapagi da tazeler
  await fotografSil(gorsel.dosya);

  revalidatePath(`/admin/projeler/${gorsel.proje_id}`);
  sayfalariTazele(proje?.slug);
}

export async function gorselSiralaAction(
  projeId: number,
  sirali: number[]
): Promise<void> {
  await yetkiGerekli();

  if (!Number.isInteger(projeId) || !sirali.every(Number.isInteger)) return;

  const proje = await projeGetirId(projeId);
  if (!proje) return;

  // Siralamanin ilk elemani kapak oldugu icin gorselleriSirala kapagi da
  // ayni islemde tazeler; ayri bir kapakTazele cagrisi gerekmiyor.
  await gorselleriSirala(projeId, sirali);

  revalidatePath(`/admin/projeler/${projeId}`);
  sayfalariTazele(proje.slug);
}
