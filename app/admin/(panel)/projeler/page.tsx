import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { DURUM_ETIKET, projeleriGetir } from "@/lib/queries";

export default async function ProjeListesi() {
  const projeler = await projeleriGetir(false); // taslaklar dahil

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Projeler</h1>
        <Link
          href="/admin/projeler/yeni"
          className="bg-[var(--color-navy)] px-6 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
        >
          Yeni proje
        </Link>
      </div>

      {projeler.length === 0 ? (
        <p className="mt-12 border border-dashed border-[var(--color-rule)] p-10 text-center text-[var(--color-muted)]">
          Henüz proje yok.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {projeler.map((p) => {
            // Sayiyi liste sorgusu getiriyor; proje basina ayri sorgu (N+1) yok.
            const adet = p.gorselSayisi ?? 0;
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/projeler/${p.id}`}
                  className="row-link flex items-center gap-5 py-5"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-[var(--color-paper-dim)]">
                    <Gorsel src={p.kapak} alt="" sizes="96px" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.baslik}</p>
                    <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                      {p.konum || "Konum girilmemiş"} · {DURUM_ETIKET[p.durum]} ·{" "}
                      {adet} fotoğraf
                    </p>
                  </div>

                  {!p.yayinda && (
                    <span className="shrink-0 border border-[var(--color-muted)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
                      Taslak
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
