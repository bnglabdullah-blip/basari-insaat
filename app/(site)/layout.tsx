import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import YapisalVeri from "@/components/yapisal-veri";
import { ayarlariGetir } from "@/lib/queries";

/*
 * Public sayfalar her istekte veritabanindan okunur.
 *
 * Neden statik uretim degil: Docker imaji derlenirken veritabani dosyasi
 * heniz mevcut degil (calisma aninda bir volume olarak baglaniyor). Statik
 * uretim, derleme aninda BOS bir veritabanini sayfalara gomer ve admin
 * panelinden bir degisiklik yapilana kadar site bos gorunurdu.
 *
 * Maliyeti ihmal edilebilir: SQLite okumalari ayni surecte, mikrosaniyeler
 * icinde tamamlaniyor ve bu olcekte bir sitede es zamanli istek sayisi dusuk.
 */
export const dynamic = "force-dynamic";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ayarlar = ayarlariGetir();

  return (
    <>
      <YapisalVeri
        ayarlar={ayarlar}
        siteUrl={process.env.SITE_URL ?? "https://basariinsaat.com"}
      />
      {/* Klavye ve ekran okuyucu kullanicilarinin menuyu atlayip dogrudan
          icerige gecmesi icin. Odaklanmadan gorunmez. */}
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-[var(--color-navy)] focus:px-5 focus:py-3 focus:text-[var(--color-paper)]"
      >
        İçeriğe geç
      </a>
      <SiteHeader telefon={ayarlar.telefonSabit} />
      <main id="icerik">{children}</main>
      <SiteFooter ayarlar={ayarlar} />
    </>
  );
}
