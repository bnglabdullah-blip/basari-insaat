import type { Metadata } from "next";
import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { HIZMETLER } from "@/lib/icerik";
import { tumGorseller } from "@/lib/queries";
import { YUVA, yuvaGorseli } from "@/lib/vitrin";

export const metadata: Metadata = {
  title: "Hizmetler",
  description:
    "Başarı İnşaat hizmetleri — konut projeleri, kentsel dönüşüm, cephe " +
    "uygulaması ve yapı denetim danışmanlığı. Eskişehir.",
};

export default function Hizmetler() {
  /*
   * Accent görsel kapaktan ve ana sayfa hero'sundan AYRI bir yuvadan geliyor
   * (bkz. lib/vitrin.ts), böylece aynı kare sitede iki kez görünmüyor.
   */
  const accent = yuvaGorseli(tumGorseller(), YUVA.hizmetlerAccent);

  return (
    <>
      <section className="grid-rules mx-auto max-w-[100rem] px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <p className="eyebrow enter enter-1">Hizmetler</p>
        <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
          Dört başlıkta topluyoruz; hepsi aynı denetim ölçütüne bağlı.
        </h1>
        <p className="enter enter-3 mt-10 max-w-xl border-t border-[var(--color-rule)] pt-8 text-lg leading-relaxed text-[var(--color-muted)]">
          Yapı denetim kökenimiz, bu dört işi birbirinden bağımsız hizmetler
          olarak değil, aynı yapının farklı aşamaları olarak görmemizi sağlıyor.
        </p>
      </section>

      {/* Accent görsel — panoramik kırpım, sayfanın nefes aldığı yer */}
      <section className="relative h-[38vh] w-full overflow-hidden md:h-[52vh]">
        <Gorsel
          src={accent}
          alt="Başarı İnşaat — cephe uygulaması detayı"
          sizes="100vw"
        />
      </section>

      <section className="relative mx-auto max-w-[100rem] overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <span aria-hidden className="filigran right-4 top-10 md:right-10">
          01
        </span>

        <ul className="relative">
          {HIZMETLER.map((h) => (
            <li key={h.slug} className="reveal border-b border-[var(--color-rule)]">
              <Link
                href={`/hizmetler/${h.slug}`}
                className="row-link grid gap-4 py-10 md:grid-cols-12 md:items-baseline md:py-14"
              >
                <span className="tabular text-sm font-medium text-[var(--color-clay)] md:col-span-1">
                  {h.no}
                </span>
                <h2 className="font-display text-[length:var(--text-title)] md:col-span-4">
                  {h.ad}
                </h2>
                <p className="max-w-xl leading-relaxed text-[var(--color-muted)] md:col-span-5 md:col-start-7">
                  {h.ozet}
                </p>
                <span
                  aria-hidden
                  className="text-sm text-[var(--color-clay)] md:col-span-1 md:text-right"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
        <div className="relative mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <h2 className="font-display reveal text-[length:var(--text-display)] md:col-span-7">
              Hangi aşamada olduğunuzu konuşalım.
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <p className="text-[var(--color-paper)]/70">
                Arsa sahibi, hak sahibi veya daire arayan — hepsi için süreç
                farklı başlıyor.
              </p>
              <Link
                href="/iletisim"
                className="mt-8 inline-block bg-[var(--color-paper)] px-8 py-4 font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-clay)] hover:text-white"
              >
                İletişime geçin
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
