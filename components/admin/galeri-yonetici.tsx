"use client";

import Image from "next/image";
import { useActionState, useOptimistic, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  gorselSilAction,
  gorselSiralaAction,
  gorselYukleAction,
  type ProjeDurumSonuc,
} from "@/app/admin/(panel)/projeler/actions";
import type { ProjeGorsel } from "@/lib/queries";

function YukleDugmesi() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[var(--color-navy)] px-6 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Yükleniyor…" : "Seçilenleri yükle"}
    </button>
  );
}

export default function GaleriYonetici({
  projeId,
  gorseller,
}: {
  projeId: number;
  gorseller: ProjeGorsel[];
}) {
  const [durum, yukleAction] = useActionState<ProjeDurumSonuc, FormData>(
    gorselYukleAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [, gecisBaslat] = useTransition();

  /*
   * useOptimistic: siralama degistiginde arayuz sunucu yanitini beklemeden
   * guncellenir. Sunucudan taze veri geldiginde React otomatik olarak gercek
   * degere doner — basarisiz bir istekte elle geri alma kodu yazmaya gerek
   * kalmiyor. Elle tutulan bir useState'te bu senkronizasyon her zaman
   * kacirilan bir ayrinti olur.
   */
  const [liste, iyimserSirala] = useOptimistic(
    gorseller,
    (_mevcut, yeni: ProjeGorsel[]) => yeni
  );

  function tasi(index: number, yon: -1 | 1) {
    const hedef = index + yon;
    if (hedef < 0 || hedef >= liste.length) return;

    const yeni = [...liste];
    [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];

    gecisBaslat(async () => {
      iyimserSirala(yeni);
      await gorselSiralaAction(projeId, yeni.map((g) => g.id));
    });
  }

  function basaAl(index: number) {
    if (index === 0) return;
    const yeni = [...liste];
    const [tasinan] = yeni.splice(index, 1);
    yeni.unshift(tasinan);

    gecisBaslat(async () => {
      iyimserSirala(yeni);
      await gorselSiralaAction(projeId, yeni.map((g) => g.id));
    });
  }

  return (
    <section className="mt-16">
      <h2 className="font-display border-b border-[var(--color-rule)] pb-4 text-2xl">
        Fotoğraflar
        <span className="tabular ml-3 text-base font-normal text-[var(--color-muted)]">
          {liste.length}
        </span>
      </h2>

      {/* --- Yükleme --- */}
      <form
        ref={formRef}
        action={(fd) => {
          yukleAction(fd);
          formRef.current?.reset(); // aynı dosyaların iki kez yüklenmesini önler
        }}
        className="mt-6 flex flex-wrap items-center gap-4"
      >
        <input type="hidden" name="projeId" value={projeId} />
        <input
          type="file"
          name="fotograflar"
          multiple
          accept="image/jpeg,image/png,image/webp"
          required
          className="max-w-full text-sm file:mr-4 file:cursor-pointer file:border file:border-[var(--color-navy)] file:bg-transparent file:px-4 file:py-2.5 file:text-sm file:font-medium"
        />
        <YukleDugmesi />
      </form>

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        JPG, PNG veya WEBP · dosya başına en fazla 15 MB · birden fazla seçebilirsiniz
      </p>

      {durum.hata && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
        >
          {durum.hata}
        </p>
      )}
      {durum.bilgi && (
        <p
          role="status"
          className="mt-4 border-l-2 border-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-3 text-sm"
        >
          {durum.bilgi}
        </p>
      )}

      {/* --- Liste --- */}
      {liste.length === 0 ? (
        <p className="mt-8 border border-dashed border-[var(--color-rule)] p-10 text-center text-[var(--color-muted)]">
          Bu projede henüz fotoğraf yok.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((g, i) => (
            <li
              key={g.id}
              className="group relative overflow-hidden border border-[var(--color-rule)] bg-white"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={g.dosya}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-0 top-0 bg-[var(--color-clay)] px-3 py-1.5 text-xs font-medium text-white">
                    Kapak
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => tasi(i, -1)}
                    disabled={i === 0}
                    aria-label="Yukarı taşı"
                    className="border border-[var(--color-rule)] px-2.5 py-1 text-sm disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => tasi(i, 1)}
                    disabled={i === liste.length - 1}
                    aria-label="Aşağı taşı"
                    className="border border-[var(--color-rule)] px-2.5 py-1 text-sm disabled:opacity-30"
                  >
                    ↓
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => basaAl(i)}
                      className="border border-[var(--color-rule)] px-2.5 py-1 text-xs"
                    >
                      Kapak yap
                    </button>
                  )}
                </div>

                <form action={gorselSilAction}>
                  <input type="hidden" name="gorselId" value={g.id} />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-clay)]"
                  >
                    Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
