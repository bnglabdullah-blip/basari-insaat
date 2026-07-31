import type { Metadata } from "next";
import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { ayarlariGetir, tumGorseller } from "@/lib/queries";
import { YUVA, yuvaGorseli } from "@/lib/vitrin";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Başarı İnşaat — yapı denetim tecrübesiyle kurulan bir inşaat şirketi. Eskişehir'de konut ve ticari yapı projeleri.",
};

export default function Hakkimizda() {
  const ayarlar = ayarlariGetir();
  // Doku amaçlı accent; ana sayfa hero'sundan ve kapaktan ayrı bir yuva.
  const accent = yuvaGorseli(tumGorseller(), YUVA.hakkindaAccent);

  return (
    <>
      <div className="grid-rules mx-auto max-w-[100rem] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <p className="eyebrow enter enter-1">Hakkımızda</p>
        <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
          {ayarlar.hakkindaBaslik}
        </h1>

        <div className="enter enter-3 mt-16 grid gap-10 border-t border-[var(--color-rule)] pt-10 md:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed md:col-span-7 md:col-start-6">
            {ayarlar.hakkindaMetin.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Accent görsel — metin bloğunun ardından sayfaya nefes verir. */}
      <section className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
        <Gorsel
          src={accent}
          alt="Başarı İnşaat — cephe detayı"
          sizes="100vw"
        />
      </section>

      {/*
        Hizmet listesi buradan KALDIRILDI. Aynı dört kalem ana sayfada ve
        /hizmetler sayfasında zaten var; üçüncü kez basmak sayfayı uzatmaktan
        başka bir işe yaramıyordu. Yerine iki yeni sayfaya yönlendirme.
      */}
      <section className="mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
        <h2 className="eyebrow reveal border-b border-[var(--color-rule)] pb-5">
          Devamı
        </h2>
        <div className="grid md:grid-cols-2">
          {[
            {
              yol: "/ekip",
              ad: "Ekip",
              aciklama:
                "Kurucu ortakların yapı denetim geçmişi ve hangi tarafı yürüttükleri.",
            },
            {
              yol: "/surec",
              ad: "Çalışma sürecimiz",
              aciklama:
                "Arsa değerlendirmesinden anahtar teslimine altı adım, hepsi yazılı.",
            },
          ].map((k) => (
            <Link
              key={k.yol}
              href={k.yol}
              className="row-link reveal border-b border-[var(--color-rule)] py-10 md:odd:border-r md:odd:pr-10 md:even:pl-10"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-[length:var(--text-title)]">
                  {k.ad}
                </h3>
                <span aria-hidden className="text-[var(--color-clay)]">
                  →
                </span>
              </div>
              <p className="mt-3 max-w-md text-[var(--color-muted)]">
                {k.aciklama}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* İletişim çağrısı */}
      <section className="bg-[var(--color-navy)] text-[var(--color-paper)]">
        <div className="mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <h2 className="font-display reveal text-[length:var(--text-display)] md:col-span-7">
              Birlikte çalışalım.
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <Link
                href="/iletisim"
                className="inline-block bg-[var(--color-paper)] px-8 py-4 font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-clay)] hover:text-white"
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
