import "server-only";
import { cookies } from "next/headers";
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
   Bellek ici, surec basina. Tek kapsayicida calisan bu site icin yeterli;
   birden fazla kopya calistirilirsa paylasimli bir sayaca gecilmeli.
   ponytail: bellek ici sayac, coklu kopyaya gecilirse Redis'e tasinir.
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
function gecerliHash(): string {
  const dbHash = parolaHashGetir();
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

export async function girisYap(
  parola: string,
  kimlik = "genel"
): Promise<GirisSonuc> {
  if (hizSiniriAsildi(kimlik)) {
    return {
      ok: false,
      hata: "Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin.",
    };
  }

  if (!parolaDogrula(parola, gecerliHash())) {
    return { ok: false, hata: "Parola hatalı." };
  }

  denemeler.delete(kimlik);

  const cerezler = await cookies();
  cerezler.set(CEREZ_ADI, jetonUret(anahtar()), {
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
  return jetonDogrula(cerezler.get(CEREZ_ADI)?.value, anahtar());
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
  if (!parolaDogrula(mevcut, gecerliHash())) {
    return { ok: false, hata: "Mevcut parola hatalı." };
  }

  parolaHashKaydet(parolaHashle(yeni));
  return { ok: true };
}

export { CEREZ_ADI };
