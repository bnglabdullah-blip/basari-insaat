"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjeGorsel } from "@/lib/queries";

/**
 * Proje fotograf galerisi ve buyutme penceresi.
 *
 * Buyutme icin native <dialog> elementi kullaniliyor. showModal() cagrildiginda
 * tarayici bedelsiz olarak sunlari sagliyor:
 *   - odak tuzagi (Tab, pencere disina cikmaz)
 *   - Escape ile kapanma
 *   - arka plandaki icerigin ekran okuyuculardan gizlenmesi (inert)
 *   - ::backdrop ile stillenebilir arka plan
 * Bir lightbox kutuphanesi bunlarin aynisi icin ~30 KB JS eklerdi.
 */
export default function Galeri({
  gorseller,
  baslik,
}: {
  gorseller: ProjeGorsel[];
  baslik: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [aktif, setAktif] = useState(0);

  const ac = useCallback((i: number) => {
    setAktif(i);
    dialogRef.current?.showModal();
  }, []);

  const git = useCallback(
    (yon: -1 | 1) => {
      // Modulo ile dairesel gezinme: son fotograftan sonra basa doner.
      setAktif((i) => (i + yon + gorseller.length) % gorseller.length);
    },
    [gorseller.length]
  );

  // Ok tuslariyla gezinme. Escape'i tarayici zaten kendisi yonetiyor.
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      if (e.key === "ArrowRight") git(1);
      if (e.key === "ArrowLeft") git(-1);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [git]);

  if (gorseller.length === 0) return null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gorseller.map((g, i) => (
          <li key={g.id} className="reveal">
            <button
              type="button"
              onClick={() => ac(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-[var(--color-paper-dim)]"
              aria-label={`${baslik} — ${i + 1}. fotoğrafı büyüt`}
            >
              <Image
                src={g.dosya}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        // Boslugu tiklayarak kapatma. <dialog> tiklamalari kendi kutusunda
        // aldigi icin hedefin dialog'un KENDISI olmasi, arka plana
        // tiklandigi anlamina gelir.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 backdrop:bg-[var(--color-navy)]/95"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between px-5 py-4 text-[var(--color-paper)]">
            <span className="tabular text-sm">
              {aktif + 1} / {gorseller.length}
            </span>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-3 py-2 text-sm"
            >
              Kapat ✕
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              key={gorseller[aktif].id}
              src={gorseller[aktif].dosya}
              alt={`${baslik} — ${aktif + 1}. fotoğraf`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {gorseller.length > 1 && (
            <div className="flex shrink-0 justify-center gap-3 px-5 py-5">
              <button
                type="button"
                onClick={() => git(-1)}
                className="border border-[var(--color-paper)]/30 px-6 py-2.5 text-sm text-[var(--color-paper)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-navy)]"
              >
                ← Önceki
              </button>
              <button
                type="button"
                onClick={() => git(1)}
                className="border border-[var(--color-paper)]/30 px-6 py-2.5 text-sm text-[var(--color-paper)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-navy)]"
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
