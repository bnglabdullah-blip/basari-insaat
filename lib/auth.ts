import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { jetonDogrula, jetonUret, parolaDogrula, parolaHashle } from "./oturum";
import { parolaHashGetir, parolaHashKaydet } from "./queries";

/**
 * Next.js'e bagli kimlik dogrulama katmani.
 * Saf kripto mantigi oturum.ts icinde ve orada test ediliyor.
 */

const CEREZ_ADI = "basari_oturum";

function anahtar(): string {
  const a = process.env.OTURUM_ANAHTARI;
  if (!a || a.length < 32) {
    // Sessizce zayif bir varsayilana dusmek yerine hemen ve net bir hata:
    // uretimde tahmin edilebilir bir anahtarla calismak, oturum jetonlarinin
    // taklit edilebilmesi demektir.
    throw new Error(
      "OTURUM_ANAHTARI ortam degiskeni tanimli degil veya 32 karakterden kisa. " +
        "`npm run parola` calistirarak deger uretebilirsiniz."
    );
  }
  return a;
}

/* --------------------------------------------------------------------------
   Giris denemesi hiz siniri
   --------------------------------------------------------------------------
   Bellek ici, surec basina. ponytail: Netlify'da her fonksiyon kopyasi kendi
   sayacini tutar, yani sinir kopya basina 8 deneme demektir — caydiricilik
   azalir ama kalkmaz. Gercek dagitik sinir gerekirse ayarlar tablosuna ya da
   Upstash'e tasinir.
   -------------------------------------------------------------------------- */

const denemeler = new Map<string, { sayi: number; ilk: number }>();
const PENCERE_MS = 15 * 60 * 1000;
const AZAMI_DENEME = 8;

function hizSiniriAsildi(kimlik: string): boolean {
  const simdi = Date.now();
  const kayit = denemeler.get(kimlik);

  if (!kayit || simdi - kayit.ilk > PENCERE_MS) {
    denemeler.set(kimlik, { sayi: 1, ilk: simdi });
    return false;
  }
  kayit.sayi += 1;
  return kayit.sayi > AZAMI_DENEME;
}

/**
 * Hiz siniri anahtari: istemcinin IP'si.
 *
 * Netlify gercek istemci IP'sini `x-nf-client-connection-ip` basliginda verir;
 * varsa dogrudan o kullanilir.
 *
 * x-forwarded-for'da ise EN SAGDAKI deger aliniyor, ilki DEGIL. Basligin sol
 * tarafi istemcinin kendi elindedir: saldirgan istege "X-Forwarded-For: 1.2.3.4"
 * ekleyerek her denemede farkli bir "IP" ile siniri sifirlayabilirdi. En sagdaki
 * degeri ise onumuzdeki guvenilir proxy yazar, istemci degistiremez.
 */
async function istemciKimligi(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "genel"
  );
}

/* --------------------------------------------------------------------------
   Giris / cikis
   -------------------------------------------------------------------------- */

export type GirisSonuc = { ok: true } | { ok: false; hata: string };

/**
 * Gecerli parola ozeti: ONCE veritabani, sonra ortam degiskeni.
 *
 * Sira onemli. Musteri panelden parolasini degistirdiginde
 * ADMIN_PAROLA_HASH artik eski parolayi temsil eder; env'e oncelik
 * verilseydi degisiklik hicbir ise yaramaz, üstelik eski parola calismaya
 * devam ederdi.
 *
 * Ortam degiskeni ILK KURULUM icin duruyor: veritabani bostur, panele
 * girilecek bir parola gerekir. Musteri parolasini bir kez degistirdikten
 * sonra env degeri tamamen devre disi kalir ve Railway'den silinebilir.
 */
async function gecerliHash(): Promise<string> {
  const dbHash = await parolaHashGetir();
  if (dbHash) return dbHash;

  const env = process.env.ADMIN_PAROLA_HASH;
  if (!env) {
    throw new Error(
      "Parola tanimli degil: ne veritabaninda ne ADMIN_PAROLA_HASH icinde. " +
        "`npm run parola` calistirip ciktisini ortam degiskenlerine ekleyin."
    );
  }
  return env;
}

/**
 * Jetona gomulen parola surumu: gecerli hash'in ozetinin ilk 8 karakteri.
 *
 * Parola degistiginde tuz yenilendigi icin hash, dolayisiyla bu damga da
 * degisir; eskisiyle imzalanmis tum jetonlar aninda gecersizlesir. Damganin
 * kendisi hash'i ele vermez: scrypt ciktisinin sha256'sinden 4 bayt, geri
 * donusu yok.
 */
function jetonSurumu(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 8);
}

export async function girisYap(
  parola: string,
  kimlik?: string
): Promise<GirisSonuc> {
  const anahtarKimlik = kimlik ?? (await istemciKimligi());

  if (hizSiniriAsildi(anahtarKimlik)) {
    return {
      ok: false,
      hata: "Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin.",
    };
  }

  const hash = await gecerliHash();
  if (!parolaDogrula(parola, hash)) {
    return { ok: false, hata: "Parola hatalı." };
  }

  denemeler.delete(anahtarKimlik);

  const cerezler = await cookies();
  cerezler.set(CEREZ_ADI, jetonUret(anahtar(), Date.now() / 1000, jetonSurumu(hash)), {
    httpOnly: true, // JS ile okunamaz -> XSS ile oturum calinamaz
    sameSite: "lax", // baska sitelerden gelen isteklerde gonderilmez -> CSRF
    secure: process.env.NODE_ENV === "production", // HTTPS disinda gonderilmez
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return { ok: true };
}

export async function cikisYap(): Promise<void> {
  const cerezler = await cookies();
  cerezler.delete(CEREZ_ADI);
}

/* --------------------------------------------------------------------------
   Yetki kontrolu
   -------------------------------------------------------------------------- */

export async function oturumAcikMi(): Promise<boolean> {
  const cerezler = await cookies();
  const jeton = cerezler.get(CEREZ_ADI)?.value;
  // Cerez yoksa parola surumu icin veritabanina gitmeye gerek yok: public
  // site duzeni (onizlemeYetkisi) her render'da buraya ugruyor.
  if (!jeton) return false;

  return jetonDogrula(
    jeton,
    anahtar(),
    Date.now() / 1000,
    jetonSurumu(await gecerliHash())
  );
}

/**
 * Panel onizlemesi icin yetki kontrolu — HATA FIRLATMAZ.
 *
 * oturumAcikMi(), OTURUM_ANAHTARI tanimsizsa bilerek hata firlatir; panelde
 * dogru davranis budur. Ancak bu kontrol PUBLIC site duzeninden de cagriliyor
 * ve orada ayni hata, yanlis yapilandirilmis tek bir ortam degiskeni yuzunden
 * sitenin TAMAMINI dusururdu. Onizleme bir panel kolayligi; yoklugu siteyi
 * bozmamali. Bu yuzden hata durumunda "yetki yok" deyip geciyoruz.
 */
export async function onizlemeYetkisi(): Promise<boolean> {
  try {
    return await oturumAcikMi();
  } catch {
    return false;
  }
}

/**
 * Yetkisiz erisimde giris sayfasina yonlendirir.
 *
 * !!! HER SERVER ACTION KENDI ICINDE BUNU CAGIRMAK ZORUNDA !!!
 *
 * Sebebi: server action'lar layout hiyerarsisinden BAGIMSIZ calisir. Next.js
 * bunlari, action kimligini bilen herkesin dogrudan POST edebilecegi birer uc
 * nokta olarak yayinlar. `app/admin/(panel)/layout.tsx` icindeki kontrol
 * yalnizca SAYFA RENDER'ini korur; bir action cagrildiginda o layout hic
 * calistirilmaz. Kontrolu sadece layout'a birakmak, App Router'da en sik
 * yapilan guvenlik hatasidir.
 */
export async function yetkiGerekli(): Promise<void> {
  if (!(await oturumAcikMi())) redirect("/admin/giris");
}

/* --------------------------------------------------------------------------
   Parola degistirme
   -------------------------------------------------------------------------- */

/** scripts/parola.mjs ile ayni alt sinir. */
const ASGARI_UZUNLUK = 10;

/**
 * Panelden parola degistirir.
 *
 * Oturum acik olsa bile MEVCUT PAROLA tekrar soruluyor. Sebebi: acik birakilmis
 * bir panelin basina gecen biri, parolayi degistirip asil sahibini kendi
 * sitesinden kilitleyebilirdi. Oturum "bu kisi giris yapmisti" der; mevcut
 * parola "bu kisi hâlâ sahibi" der.
 */
export async function parolaDegistir(
  mevcut: string,
  yeni: string
): Promise<GirisSonuc> {
  if (yeni.length < ASGARI_UZUNLUK) {
    return {
      ok: false,
      hata: `Yeni parola en az ${ASGARI_UZUNLUK} karakter olmalı.`,
    };
  }
  if (!parolaDogrula(mevcut, await gecerliHash())) {
    return { ok: false, hata: "Mevcut parola hatalı." };
  }

  // Yeni hash yeni jeton surumu demek: bu kayitla birlikte, mevcut oturum
  // dahil eski jetonlarin tumu gecersizlesir ve yeniden giris istenir.
  await parolaHashKaydet(parolaHashle(yeni));
  return { ok: true };
}

export { CEREZ_ADI };
