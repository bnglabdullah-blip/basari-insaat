import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL ?? "https://basariinsaat.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Yonetim paneli ve yuklenen ham dosyalar dizine eklenmemeli.
      disallow: ["/admin"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
