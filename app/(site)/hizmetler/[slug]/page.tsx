import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HIZMETLER } from "@/lib/icerik";

type Props = { params: Promise<{ slug: string }> };

/*
 * Hizmetler veritabanindan degil sabit bir listeden geliyor, dolayisiyla bu
 * dort sayfa derleme aninda uretilebilir. Sitenin geri kalani `force-dynamic`
 * (bkz. app/(site)/layout.tsx) oldugu icin bu sayfalar da dinamik render
 * edilecek; yine de generateStaticParams gecerli slug kumesini tek yerde
 * tanimliyor ve yanlis bir slug'in sessizce gecmesini engelliyor.
 */
export function generateStaticParams() {
  return HIZMETLER.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hizmet = HIZMETLER.find((h) => h.slug === slug);
  if (!hizmet) return { title: "Hizmet bulunamadı" };

  return {
    title: hizmet.ad,
    description: `${hizmet.ad} — ${hizmet.ozet}`,
    openGraph: { title: hizmet.ad, description: hizmet.ozet },
  };
}

export default async function HizmetDetay({ params }: Props) {
  const { slug } = await params;
  const i = HIZMETLER.findIndex((h) => h.slug === slug);
  if (i === -1) notFound();

  const hizmet = HIZMETLER[i];
  // Diziyi kaydirarak sonraki hizmete gec — son kalemde basa doner.
  const sonraki = HIZMETLER[(i + 1) % HIZMETLER.length];

  return (
    <>
      <section className="grid-rules relative mx-auto max-w-[100rem] overflow-hidden px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <span aria-hidden className="filigran right-4 top-10 md:right-10">
          {hizmet.no}
        </span>

        <div className="relative">
          <Link href="/hizmetler" className="eyebrow enter enter-1 link-underline">
            ← Hizmetler
          </Link>
          <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
            {hizmet.ad}
          </h1>
          <p className="enter enter-3 mt-10 max-w-2xl border-t border-[var(--color-rule)] pt-8 text-lg leading-relaxed text-[var(--color-muted)]">
            {hizmet.ozet}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[100rem] px-6 pb-24 md:px-10 md:pb-32">
        <div className="grid gap-14 md:grid-cols-12">
          {/* Uzun metin */}
          <div className="reveal space-y-6 text-lg leading-relaxed md:col-span-6">
            {hizmet.detay.split("\n\n").map((p, k) => (
              <p key={k}>{p}</p>
            ))}
          </div>

          {/* Kapsam — yapışkan, uzun metin kaydırılırken görünür kalır */}
          <div className="reveal-late md:col-span-5 md:col-start-8">
            <div className="md:sticky md:top-28">
              <h2 className="eyebrow border-b border-[var(--color-rule)] pb-4">
                Kapsam
              </h2>
              <ul className="mt-2">
                {hizmet.kapsam.map((k) => (
                  <li
                    key={k}
                    className="flex gap-4 border-b border-[var(--color-rule)] py-4 text-[var(--color-muted)]"
                  >
                    <span aria-hidden className="text-[var(--color-clay)]">
                      —
                    </span>
                    {k}
                  </li>
                ))}
              </ul>
              <Link
                href="/surec"
                className="link-underline mt-8 inline-block font-medium"
              >
                Çalışma sürecimiz →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sonraki hizmet — sayfa sonunda çıkmaz sokak bırakmıyor */}
      <section className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
        <div className="relative mx-auto max-w-[100rem] px-6 py-20 md:px-10 md:py-24">
          <Link href={`/hizmetler/${sonraki.slug}`} className="row-link group block">
            <p className="eyebrow text-[var(--color-paper)]/50">Sonraki hizmet</p>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-[length:var(--text-display)]">
                {sonraki.ad}
              </h2>
              <span aria-hidden className="text-[var(--color-clay)]">
                →
              </span>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
