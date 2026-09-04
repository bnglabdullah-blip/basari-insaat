import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * standalone, Docker imaji icin duruyor (Dockerfile bunu bekliyor; Railway
   * geri donus yolu). Netlify eklentisi kendi sunucu paketini uretir ve bu
   * ayardan etkilenmez.
   */
  output: "standalone",

  /*
   * Fotograflar artik Supabase Storage'in public URL'lerinden geliyor;
   * next/image uzak kaynaklari acikca beyaz listeye almadan reddeder.
   * Yol deseni bilerek dar: yalnizca public bucket icerigi.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /*
   * Eski serverExternalPackages (better-sqlite3, sharp) ve serverActions
   * bodySizeLimit ayarlarina artik gerek yok: veritabani Supabase'e tasindi,
   * fotograflar sunucudan gecmeden dogrudan Storage'a yukleniyor. Varsayilan
   * 1 MB action govdesi, form metinleri icin fazlasiyla yeterli.
   */
};

export default nextConfig;
