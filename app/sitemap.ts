import type { MetadataRoute } from "next";
import { projeleriGetir } from "@/lib/queries";

// Projeler veritabanindan okundugu icin sitemap her istekte uretilmeli;
// derleme aninda dondurulursa yeni eklenen projeler asla listelenmez.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL ?? "https://basariyapi.com";

  const sabit = [
    "",
    "/projeler",
    "/hakkimizda",
    "/sirket-bilgilerimiz",
    "/iletisim",
  ].map((yol) => ({
    url: `${site}${yol}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: yol === "" ? 1 : 0.8,
  }));

  const projeler = (await projeleriGetir()).map((p) => ({
    url: `${site}/projeler/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...sabit, ...projeler];
}
