import Image from "next/image";
import Link from "next/link";
import { yetkiGerekli } from "@/lib/auth";
import { cikisAction } from "../actions";

// Panel her zaman canli veri gostermeli; onbellekten servis edilmemeli.
export const dynamic = "force-dynamic";

const PANEL_MENU = [
  { yol: "/admin", ad: "Özet" },
  { yol: "/admin/projeler", ad: "Projeler" },
  { yol: "/admin/icerik", ad: "İçerik" },
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
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-rule)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
          <Link href="/admin" className="shrink-0">
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

      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
