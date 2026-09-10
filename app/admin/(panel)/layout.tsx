import Image from "next/image";
import Link from "next/link";
import { yetkiGerekli } from "@/lib/auth";
import { cikisAction } from "../actions";

// Panel her zaman canli veri gostermeli; onbellekten servis edilmemeli.
export const dynamic = "force-dynamic";

const PANEL_MENU = [
  { yol: "/admin/icerik", ad: "İçerik" },
  { yol: "/admin/projeler", ad: "Projeler" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sayfa render'ini korur. DIKKAT: bu kontrol server action'lari KORUMAZ —
  // her action kendi icinde yetkiGerekli() cagirir. Ayrintili aciklama
  // lib/auth.ts icinde.
  await yetkiGerekli();

  return (
    /*
     * Panel tam ekran, sayfa boyu degil. Icerik duzenleyici viewport
     * yuksekligini bastan sona kullaniyor (onizleme cercevesi ekranin dibine
     * kadar insin diye); bunun icin kaydirma govdede degil, asagidaki
     * main'in kendisinde. Proje ekranlari da orada normal sekilde kayiyor.
     */
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-[var(--color-rule)] bg-white">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
          <Link href="/admin/icerik" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="Başarı İnşaat yönetim paneli"
              width={502}
              height={81}
              className="h-5 w-auto"
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {PANEL_MENU.map((m) => (
              <Link
                key={m.yol}
                href={m.yol}
                className="link-underline text-sm font-medium"
              >
                {m.ad}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/"
              target="_blank"
              className="link-underline text-sm text-[var(--color-muted)]"
            >
              Siteyi gör ↗
            </Link>
            <form action={cikisAction}>
              <button
                type="submit"
                className="text-sm text-[var(--color-muted)] hover:text-[var(--color-clay)]"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Genislik sinirlamasi burada DEGIL, ihtiyaci olan ekranda
          (projeler/layout.tsx). Icerik duzenleyicinin tam genislige
          yayilabilmesi icin. */}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
