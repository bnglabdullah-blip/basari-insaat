import Link from "next/link";
import { notFound } from "next/navigation";
import GaleriYonetici from "@/components/admin/galeri-yonetici";
import ProjeFormu from "@/components/admin/proje-formu";
import { projeGetirId, projeGorselleri } from "@/lib/queries";
import { projeSilAction } from "../actions";

export default async function ProjeDuzenle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proje = await projeGetirId(Number(id));
  if (!proje) notFound();

  const gorseller = await projeGorselleri(proje.id);

  return (
    <>
      <Link
        href="/admin/projeler"
        className="link-underline text-sm text-[var(--color-muted)]"
      >
        ← Projeler
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{proje.baslik}</h1>
        {proje.yayinda && (
          <Link
            href={`/projeler/${proje.slug}`}
            target="_blank"
            className="link-underline text-sm text-[var(--color-muted)]"
          >
            Sitede gör ↗
          </Link>
        )}
      </div>

      <ProjeFormu proje={proje} />

      <GaleriYonetici projeId={proje.id} gorseller={gorseller} />

      {/*
        --- Tehlikeli bölge ---
        Silme geri alınamaz, bu yüzden iki ayrı ve kasıtlı eylem gerektiriyor.
        Onay için <details> kullanılıyor: yerel `confirm()` bu sunucu
        bileşenini istemci bileşenine çevirmeyi gerektirirdi ve JS kapalıyken
        çalışmazdı. Bu haliyle onay adımı hiçbir koşulda atlanamaz.
      */}
      <section className="mt-20 border-t border-[var(--color-rule)] pt-8">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-clay)] hover:underline">
            Bu projeyi sil…
          </summary>
          <div className="mt-5 border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 p-5">
            <p className="text-sm">
              <strong>{proje.baslik}</strong> ve ona ait {gorseller.length}{" "}
              fotoğraf kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <form action={projeSilAction} className="mt-5">
              <input type="hidden" name="id" value={proje.id} />
              <button
                type="submit"
                className="bg-[var(--color-clay)] px-6 py-3 text-sm font-medium text-white"
              >
                Evet, kalıcı olarak sil
              </button>
            </form>
          </div>
        </details>
      </section>
    </>
  );
}
