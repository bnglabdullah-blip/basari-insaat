/**
 * Sitenin tum duzenlenebilir metinleri ve iletisim bilgileri.
 *
 * Bu dosya VARSAYILANLARI tutar. Admin panelinden bir alan degistirildiginde
 * deger `ayarlar` tablosuna yazilir ve `lib/queries.ts` icindeki ayarlar()
 * fonksiyonu buradaki varsayilanin uzerine biner.
 *
 * Neden ayri bir dosya: veritabani bos oldugunda (ilk kurulum, yeni gelistirici
 * ortami) site yine de dolu ve duzgun gorunur. "Once icerik gir sonra bak"
 * asamasi hic olusmuyor.
 */

export const VARSAYILAN = {
  // --- Kimlik ---
  firma: "Başarı İnşaat",
  slogan: "Yapıyı ayakta tutan disiplindir.",
  ozet:
    "Eskişehir'de konut ve ticari yapı projeleri geliştiriyoruz. " +
    "Yapı denetim kökenimizle, inşa ettiğimiz her binaya denetlediğimiz " +
    "titizlikle yaklaşıyoruz.",

  // --- Iletisim ---
  adres:
    "Eskibağlar Mahallesi, Prof. Dr. Yılmaz Büyükerşen Bulvarı, " +
    "Adil Över Apartmanı, Kat: 1, Daire: 1",
  ilce: "Tepebaşı / Eskişehir",
  telefonSabit: "0222 221 47 45",
  yetkili1Ad: "Taha Bey",
  yetkili1Tel: "0534 590 25 63",
  yetkili2Ad: "Abdullah Bey",
  yetkili2Tel: "0533 593 81 73",
  eposta: "",
  calismaSaatleri: "Pazartesi – Cumartesi · 09:00 – 18:00",

  // --- Hakkimizda ---
  // Musteri istegiyle BOS birakildi; metin panelden (Icerik ekrani) girilecek.
  // Bos oldugunda /hakkimizda basligi "Hakkimizda"ya duser ve metin blogu hic
  // basilmaz; yarim gorunen bir sayfa olusmuyor.
  hakkindaBaslik: "",
  hakkindaMetin: "",

  // --- SEO ---
  metaAciklama:
    "Başarı İnşaat — Eskişehir'de konut ve ticari yapı projeleri. " +
    "Yapı denetim tecrübesiyle inşaat, cephe uygulaması ve kentsel dönüşüm.",
};
/*
 * Burada bilincli olarak `as const` KULLANILMIYOR.
 *
 * `as const` her alani kendi metninin literal tipine sabitler: `eposta`
 * alaninin tipi `string` degil, bos metnin ta kendisi ("") olur. Bu da
 * veritabanindan gelen degerlerin bu tipe atanamamasina ve `eposta && {...}`
 * gibi kaliplarin derleme hatasi vermesine yol acar. `as const` olmadan
 * anahtar isimleri yine korunur, degerler ise dogru sekilde `string` olur.
 */

export type AyarAnahtari = keyof typeof VARSAYILAN;

/**
 * Hizmetler — yalnizca ana sayfadaki "Ne yapiyoruz" listesi.
 *
 * Ayri /hizmetler sayfalari musteri istegiyle kaldirildi. Liste ana sayfada
 * baglantisiz duruyor; bu yuzden `slug`, `kapsam` ve `detay` alanlari da
 * silindi — hicbiri artik okunmuyordu.
 */
export const HIZMETLER = [
  {
    no: "01",
    ad: "Konut Projeleri",
    ozet:
      "Arsa değerlendirmesinden anahtar teslimine kadar, projelendirme ve " +
      "inşa süreçlerinin tamamını üstleniyoruz.",
  },
  {
    no: "02",
    ad: "Kentsel Dönüşüm",
    ozet:
      "Riskli yapı tespitinden yeni binanın teslimine kadar hak sahipleriyle " +
      "şeffaf yürütülen dönüşüm süreçleri.",
  },
  {
    no: "03",
    ad: "Cephe Uygulaması",
    ozet:
      "Kompozit, seramik ve tuğla cephe sistemleri; ısı yalıtımı ve su " +
      "yalıtımı detaylarıyla birlikte uygulanır.",
  },
  {
    no: "04",
    ad: "Yapı Denetim Danışmanlığı",
    ozet:
      "Kurucu ortaklarımızın yapı denetim tecrübesiyle, süreç boyunca " +
      "bağımsız teknik kontrol ve raporlama.",
  },
] as const;

/** Ana sayfadaki rakamlar. */
export const RAKAMLAR = [
  { deger: "15+", etiket: "Yıllık saha tecrübesi" },
  { deger: "100%", etiket: "Deprem yönetmeliğine uyum" },
  { deger: "1", etiket: "Devam eden proje" },
] as const;

/**
 * Gezinme — header ve footer'in TEK kaynagi.
 *
 * Ayni diziden beslenmeleri sart: kullanici footer'da gordugu bir gruplamayi
 * header'da da bulmayi bekler. Iki ayri liste tutulsaydi biri guncellenip
 * digeri unutuldugunda sessizce ayrisirlardi.
 *
 * `alt` tasiyan ogeler header'da acilir menu, footer'da sutun oluyor.
 * Gruplarin kendisi de gercek bir sayfaya isaret ediyor (`yol`): boylece
 * dokunmatik cihazda acilir menu acilmasa bile ustune dokunmak calisir ve
 * klavye kullanicisi icin normal bir baglanti olarak kalirlar.
 */
export const GEZINME = [
  { yol: "/", ad: "Ana Sayfa" },
  {
    yol: "/hakkimizda",
    ad: "Kurumsal",
    alt: [
      { yol: "/hakkimizda", ad: "Hakkımızda" },
      { yol: "/sirket-bilgilerimiz", ad: "Şirket Bilgilerimiz" },
    ],
  },
  { yol: "/projeler", ad: "Projeler" },
  { yol: "/iletisim", ad: "İletişim" },
];

/**
 * Siteyi gelistiren firma.
 *
 * `url` bos oldugu surece footer'da duz metin olarak basiliyor; doldurulunca
 * kendiliginden baglantiya donusuyor. Bos bir href veya "#" birakmak, tiklayip
 * hicbir yere gitmeyen bir baglanti uretirdi.
 */
export const GELISTIRICI = {
  ad: "EZ Solutions",
  url: "",
};

/** Telefon numarasini tel: baglantisi icin normalize eder: "0222 221 47 45" -> "+902222214745" */
export function telLink(numara: string): string {
  const rakamlar = numara.replace(/\D/g, "");
  return rakamlar.startsWith("0") ? `+9${rakamlar}` : `+90${rakamlar}`;
}
