import type { MetadataRoute } from "next";
import { HIZMETLER } from "@/lib/icerik";
import { projeleriGetir } from "@/lib/queries";

// Projeler veritabanindan okundugu icin sitemap her istekte uretilmeli;
// derleme aninda dondurulursa yeni eklenen projeler asla listelenmez.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.SITE_URL ?? "https://basariinsaat.com";

  const sabit = [
    "",
    "/projeler",
    "/hizmetler",
    "/hakkimizda",
    "/surec",
    "/ekip",
    "/iletisim",
  ].map((yol) => ({
    url: `${site}${yol}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: yol === "" ? 1 : 0.8,
  }));

  // Hizmet detaylari sabit listeden turetiliyor — yeni bir hizmet eklendiginde
  // sitemap'i ayrica guncellemek gerekmiyor.
  const hizmetler = HIZMETLER.map((h) => ({
    url: `${site}/hizmetler/${h.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const projeler = projeleriGetir().map((p) => ({
    url: `${site}/projeler/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...sabit, ...hizmetler, ...projeler];
}
