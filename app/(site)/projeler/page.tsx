import type { Metadata } from "next";
import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { DURUM_ETIKET, projeleriGetir } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Projeler",
  description:
    "Başarı İnşaat'ın Eskişehir'de devam eden ve tamamlanan konut projeleri.",
};

export default async function ProjelerSayfasi() {
  const projeler = await projeleriGetir();

  return (
    <div className="mx-auto max-w-[100rem] px-6 pb-24 pt-16 md:px-10 md:pb-36 md:pt-24">
      <p className="eyebrow enter enter-1">Projeler</p>
      <h1 className="font-display enter enter-2 mt-6 max-w-3xl text-[length:var(--text-display)]">
        İnşa ettiğimiz her yapı, denetlediğimiz titizlikte.
      </h1>

      {projeler.length === 0 ? (
        <p className="mt-20 border-t border-[var(--color-rule)] pt-10 text-lg text-[var(--color-muted)]">
          Projelerimiz çok yakında burada yayınlanacak.
        </p>
      ) : (
        <div className="mt-16 grid gap-x-8 gap-y-16 md:mt-24 md:grid-cols-2">
          {projeler.map((p) => (
            <Link
              key={p.id}
              href={`/projeler/${p.slug}`}
              className="reveal group block"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-paper-dim)]">
                <Gorsel
                  src={p.kapak}
                  alt=""
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>

              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-[var(--color-rule)] pt-4">
                <h2 className="font-display text-[length:var(--text-title)]">
                  {p.baslik}
                </h2>
                <span className="eyebrow shrink-0">{DURUM_ETIKET[p.durum]}</span>
              </div>

              <p className="mt-2 text-[var(--color-muted)]">
                {[p.konum, p.yil].filter(Boolean).join(" · ")}
              </p>
              {p.ozet && <p className="mt-3 max-w-lg">{p.ozet}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
