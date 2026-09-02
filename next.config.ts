import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajinin kucuk kalmasi icin: sadece gercekten kullanilan dosyalar kopyalanir.
  output: "standalone",
  // better-sqlite3 native bir modul; Next'in onu bundle etmeye calismasi derlemeyi bozar.
  serverExternalPackages: ["better-sqlite3", "sharp"],

  experimental: {
    /*
     * Server action govde limiti VARSAYILAN OLARAK 1 MB'dir. Drone ile
     * cekilmis bir bina fotografi rahatlikla 5-10 MB oldugu icin, bu ayar
     * olmadan fotograf yukleme sessizce basarisiz olur. Tek seferde birkac
     * fotograf secilebildiginden sinir toplam boyuta gore belirlendi.
     * lib/yukleme.ts icindeki dosya basina 15 MB siniri ile birlikte calisir.
     */
    serverActions: { bodySizeLimit: "60mb" },
  },
};

export default nextConfig;
