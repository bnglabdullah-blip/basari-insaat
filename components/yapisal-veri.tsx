import type { VARSAYILAN } from "@/lib/icerik";

/**
 * Schema.org LocalBusiness yapisal verisi.
 *
 * Arama motorlarina firmanin bir YEREL ISLETME oldugunu, nerede bulundugunu
 * ve hangi numaralardan ulasilabilecegini makine tarafindan okunabilir
 * bicimde bildirir. "Eskisehir insaat firmasi" gibi konum belirten
 * aramalarda ve Google harita sonuclarinda dogrudan karsiligi var.
 *
 * Metin icerigi tekrar etmesi kasitlidir: yapisal veri, sayfadaki gorunur
 * bilgiyi dogrulayan paralel bir katmandir.
 */
export default function YapisalVeri({
  ayarlar,
  siteUrl,
}: {
  ayarlar: typeof VARSAYILAN;
  siteUrl: string;
}) {
  const telefonlar = [
    ayarlar.telefonSabit,
    ayarlar.yetkili1Tel,
    ayarlar.yetkili2Tel,
  ].filter(Boolean);

  const veri = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: ayarlar.firma,
    description: ayarlar.metaAciklama,
    url: siteUrl,
    logo: `${siteUrl}/logo-blok.svg`,
    image: `${siteUrl}/og-kaynak.jpg`,
    telephone: telefonlar[0],
    // `kosul && {...}` yerine ucluk operatoru: ilkinde ifadenin tipi
    // `false | {...}` olur ve `false` yayilamayacagi icin derleme kirilir.
    ...(telefonlar.length > 1
      ? {
          contactPoint: telefonlar.slice(1).map((tel) => ({
            "@type": "ContactPoint",
            telephone: tel,
            contactType: "sales",
            areaServed: "TR",
            availableLanguage: "Turkish",
          })),
        }
      : {}),
    ...(ayarlar.eposta ? { email: ayarlar.eposta } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: ayarlar.adres,
      addressLocality: "Tepebaşı",
      addressRegion: "Eskişehir",
      addressCountry: "TR",
    },
    areaServed: { "@type": "City", name: "Eskişehir" },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify ciktisi guvenli: veriler string olarak kaciriliyor.
      // "</script>" dizisi bir metin alanina girerse etiketi erken kapatabilir,
      // bu yuzden "<" karakteri unicode kacisiyla yaziliyor.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(veri).replace(/</g, "\\u003c"),
      }}
    />
  );
}
