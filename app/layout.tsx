import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { VARSAYILAN } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";

/**
 * KRITIK: subsets'e 'latin-ext' eklenmek ZORUNDA.
 *
 * Turkce'ye ozgu s(cedilla), g(breve), noktasiz i, buyuk noktali I ve C(cedilla)
 * karakterleri Unicode'da Latin Extended-A blogunda yer alir. Sadece 'latin'
 * alt kumesi yuklenirse tarayici bu harfleri fontta bulamaz ve her birini ayri
 * bir yedek fonttan ikame eder — "BASARI INSAAT" yazisi iki farkli fontla
 * karisik render olur. Ekranda fark edilmesi zor ama profesyonel olmayan bir
 * gorunum yaratir.
 */
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.SITE_URL ?? "https://basariyapi.com";

/**
 * Meta bilgileri sabit degil, VERITABANINDAN uretiliyor.
 *
 * Onceden burada `export const metadata` vardi ve icerigi lib/icerik.ts'teki
 * VARSAYILAN'dan geliyordu — yani panelin "Meta açıklaması" alanina yazilan
 * metin siteye HIC ulasmiyordu. Alan panelde duzenlenebiliyorsa, sonucu da
 * duzenlemenin etkiledigi yerde okunmali.
 *
 * ayarlariGetir() bos degerleri zaten varsayilana dusurdugu icin, panel bos
 * biraktiginda eski davranis aynen korunuyor.
 */
export async function generateMetadata(): Promise<Metadata> {
  /*
   * ayarlariGetir() artik AG uzerinden gidiyor (SQLite'ta yerel dosyaydi).
   * Burada firlatmasina izin verilirse KOK layout coker: tek bir sayfa degil,
   * admin girisi dahil sitenin tamami 500 doner ve build sirasinda /_not-found
   * onceden uretilemedigi icin dagitim da basarisiz olur.
   *
   * Meta bilgisi dekorasyon; onun icin her sayfayi dusurmek yanlis takas.
   * Veritabani ulasilamazsa varsayilanlarla devam ediyoruz — panel duzenlemesi
   * oncesindeki davranisin aynisi.
   */
  let ayarlar = VARSAYILAN;
  try {
    ayarlar = await ayarlariGetir();
  } catch (hata) {
    console.error("[layout] meta bilgisi okunamadi, varsayilana dusuldu:", hata);
  }
  const baslik = `${ayarlar.firma} — Eskişehir'de Yapı ve Konut Projeleri`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: baslik,
      template: `%s — ${ayarlar.firma}`,
    },
    description: ayarlar.metaAciklama,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: ayarlar.firma,
      title: baslik,
      description: ayarlar.metaAciklama,
      images: [{ url: "/og-kaynak.jpg", width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
