import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Parola dogrulama ve oturum jetonu imzalama — SAF fonksiyonlar.
 *
 * Bu dosya bilincli olarak Next.js'ten hicbir sey import etmiyor. Sebebi:
 * kripto mantigi boylece `node --test` ile bir tarayici/sunucu ortami
 * kurmadan dogrudan test edilebiliyor (bkz. oturum.test.ts). Cerez okuma
 * ve yonlendirme gibi Next'e bagli isler auth.ts icinde.
 *
 * Neden harici bir kutuphane (NextAuth, jose, bcrypt) yok: tek bir admin
 * kullanicisi var. NextAuth'un saglayici/adapter/JWT altyapisi burada
 * karsiligi olmayan bir bakim yuku olurdu. Node'un kendi crypto modulu
 * scrypt ve HMAC'i zaten sunuyor.
 */

const OTURUM_SURESI_SN = 60 * 60 * 12; // 12 saat

/* --------------------------------------------------------------------------
   Parola
   -------------------------------------------------------------------------- */

/**
 * Parolayi "tuz:hash" bicimine cevirir (her ikisi de hex).
 *
 * scrypt kasitli olarak yavas ve bellek-yogun bir fonksiyondur; SHA-256 gibi
 * hizli bir ozet kullanmak, ele gecirilen bir hash'in saniyede milyarlarca
 * deneme ile kirilabilmesi anlamina gelirdi.
 */
export function parolaHashle(parola: string): string {
  const tuz = randomBytes(16);
  const hash = scryptSync(parola.normalize("NFC"), tuz, 64);
  return `${tuz.toString("hex")}:${hash.toString("hex")}`;
}

/** Girilen parolayi saklanan "tuz:hash" degeriyle karsilastirir. */
export function parolaDogrula(parola: string, saklanan: string): boolean {
  const [tuzHex, hashHex] = saklanan.split(":");
  if (!tuzHex || !hashHex) return false;

  let beklenen: Buffer;
  try {
    beklenen = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (beklenen.length !== 64) return false;

  const hesaplanan = scryptSync(parola.normalize("NFC"), Buffer.from(tuzHex, "hex"), 64);
  return timingSafeEqual(hesaplanan, beklenen);
}

/* --------------------------------------------------------------------------
   Oturum jetonu
   -------------------------------------------------------------------------- */

function base64url(b: Buffer): string {
  return b.toString("base64url");
}

function imzala(veri: string, anahtar: string): string {
  return base64url(createHmac("sha256", anahtar).update(veri).digest());
}

/**
 * "<sonKullanma>.<imza>" bicimli bir jeton uretir.
 *
 * Icerik gizli degil (sadece bir zaman damgasi) — gizlilik degil BUTUNLUK
 * gerekiyor: sunucu, jetonun kendi urettigi jeton oldugunu ve degistirilmedigini
 * dogrulayabilmeli. HMAC tam olarak bunu saglar.
 */
export function jetonUret(anahtar: string, simdiSn = Date.now() / 1000): string {
  const sonKullanma = Math.floor(simdiSn) + OTURUM_SURESI_SN;
  const govde = String(sonKullanma);
  return `${govde}.${imzala(govde, anahtar)}`;
}

/** Jeton gecerliyse true. Imza bozuksa veya suresi dolduysa false. */
export function jetonDogrula(
  jeton: string | undefined | null,
  anahtar: string,
  simdiSn = Date.now() / 1000
): boolean {
  if (!jeton) return false;

  const ayirac = jeton.lastIndexOf(".");
  if (ayirac <= 0) return false;

  const govde = jeton.slice(0, ayirac);
  const imza = jeton.slice(ayirac + 1);

  const beklenen = imzala(govde, anahtar);

  // Uzunluklar farkliysa timingSafeEqual istisna firlatir; ayrica farkli
  // uzunluk zaten gecersiz demektir.
  const a = Buffer.from(imza);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  // Imza dogrulanmadan ONCE sure kontrolu yapilmiyor: dogrulanmamis veriye
  // dayanarak karar vermemek genel bir kural.
  const sonKullanma = Number(govde);
  if (!Number.isFinite(sonKullanma)) return false;
  return simdiSn < sonKullanma;
}

export { OTURUM_SURESI_SN };
