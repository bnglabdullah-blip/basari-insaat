import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Galeri from "@/components/galeri";
import Gorsel from "@/components/gorsel";
import { DURUM_ETIKET, projeGetir, projeGorselleri } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const proje = projeGetir(slug);
  if (!proje) return { title: "Proje bulunamadı" };

  return {
    title: proje.baslik,
    description:
      proje.ozet || `${proje.baslik} — ${proje.konum}. Başarı İnşaat projesi.`,
    openGraph: {
      title: proje.baslik,
      description: proje.ozet,
      // Kapak fotografi varsa paylasim onizlemesinde o kullanilir.
      images: proje.kapak ? [{ url: proje.kapak }] : undefined,
    },
  };
}

export default async function ProjeDetay({ params }: Props) {
  const { slug } = await params;
  const proje = projeGetir(slug);
  if (!proje) notFound();

  const gorseller = projeGorselleri(proje.id);
  // İlk fotoğraf üstte tam genişlik kullanılıyor, galeride tekrar edilmiyor.
  const galeriGorselleri = gorseller.slice(1);

  const kunye = [
    { etiket: "Konum", deger: proje.konum },
    { etiket: "Durum", deger: DURUM_ETIKET[proje.durum] },
    { etiket: "Yıl", deger: proje.yil },
  ].filter((k) => k.deger);

  return (
    <>
      <div className="mx-auto max-w-[100rem] px-6 pb-16 pt-16 md:px-10 md:pt-24">
        <Link
          href="/projeler"
          className="link-underline enter enter-1 text-sm text-[var(--color-muted)]"
        >
          ← Projeler
        </Link>

        <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
          {proje.baslik}
        </h1>

        {proje.ozet && (
          <p className="enter enter-3 mt-6 max-w-2xl text-lg text-[var(--color-muted)]">
            {proje.ozet}
          </p>
        )}
      </div>

      {/* Kapak fotoğrafı */}
      <div className="relative h-[55vh] w-full overflow-hidden md:h-[80vh]">
        <Gorsel
          src={proje.kapak}
          alt={`${proje.baslik} — genel görünüm`}
          priority
          sizes="100vw"
        />
      </div>

      <div className="mx-auto max-w-[100rem] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Künye */}
          {kunye.length > 0 && (
            <dl className="reveal md:col-span-3">
              {kunye.map((k) => (
                <div
                  key={k.etiket}
                  className="border-b border-[var(--color-rule)] py-4 first:border-t"
                >
                  <dt className="eyebrow">{k.etiket}</dt>
                  <dd className="mt-1.5">{k.deger}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Açıklama */}
          {proje.aciklama && (
            <div className="reveal-late space-y-6 text-lg leading-relaxed md:col-span-7 md:col-start-6">
              {proje.aciklama.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>

        {/* Galeri */}
        {galeriGorselleri.length > 0 && (
          <section className="mt-24 md:mt-36">
            <h2 className="eyebrow reveal mb-8 border-b border-[var(--color-rule)] pb-5">
              Fotoğraflar
            </h2>
            <Galeri gorseller={galeriGorselleri} baslik={proje.baslik} />
          </section>
        )}

        {/* İletişim çağrısı */}
        <section className="mt-24 border-t border-[var(--color-rule)] pt-14 md:mt-36">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <h2 className="font-display reveal text-[length:var(--text-title)] md:col-span-6">
              Bu proje hakkında bilgi almak ister misiniz?
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <Link
                href="/iletisim"
                className="inline-block bg-[var(--color-navy)] px-8 py-4 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
              >
                İletişime geçin
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
