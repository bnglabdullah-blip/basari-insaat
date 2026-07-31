import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { VARSAYILAN } from "@/lib/icerik";

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

const siteUrl = process.env.SITE_URL ?? "https://basariinsaat.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${VARSAYILAN.firma} — Eskişehir'de Yapı ve Konut Projeleri`,
    template: `%s — ${VARSAYILAN.firma}`,
  },
  description: VARSAYILAN.metaAciklama,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: VARSAYILAN.firma,
    title: `${VARSAYILAN.firma} — Eskişehir'de Yapı ve Konut Projeleri`,
    description: VARSAYILAN.metaAciklama,
    images: [{ url: "/og-kaynak.jpg", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

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
