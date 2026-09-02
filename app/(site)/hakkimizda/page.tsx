import type { Metadata } from "next";
import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { ayarlariGetir, tumGorseller } from "@/lib/queries";
import { YUVA, yuvaGorseli } from "@/lib/vitrin";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Başarı İnşaat — Eskişehir'de konut ve ticari yapı projeleri geliştiren inşaat şirketi.",
};

export default function Hakkimizda() {
  const ayarlar = ayarlariGetir();
  // Doku amaçlı accent; ana sayfa hero'sundan ve kapaktan ayrı bir yuva.
  const accent = yuvaGorseli(tumGorseller(), YUVA.hakkindaAccent);

  return (
    <>
      <div className="grid-rules mx-auto max-w-[100rem] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <p className="eyebrow enter enter-1">Hakkımızda</p>

        {/*
          Başlık panelden geliyor ve şu an boş. Boşken "Hakkımızda"ya düşüyor:
          bir sayfanın h1'siz kalması hem ekran okuyucu için hem arama motoru
          için kırıktır, dekoratif bir eksiklik değildir.
        */}
        <h1
          data-alan="hakkindaBaslik"
          className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]"
        >
          {ayarlar.hakkindaBaslik || "Hakkımızda"}
        </h1>

        {/* Metin girilmemişse blok hiç basılmıyor — boş bir çizgi kalmıyor. */}
        {ayarlar.hakkindaMetin && (
          <div className="enter enter-3 mt-16 grid gap-10 border-t border-[var(--color-rule)] pt-10 md:grid-cols-12">
            {/* Paragraflarin TAMAMI burada basiliyor; panel onizlemesi de
                metni bu sayfada duzenletiyor (ana sayfada ilk iki paragrafla
                sinirli oldugu icin orada duzenlemek yaniltici olurdu). */}
            <div
              data-alan="hakkindaMetin"
              data-alan-tip="paragraf"
              className="space-y-6 text-lg leading-relaxed md:col-span-7 md:col-start-6"
            >
              {ayarlar.hakkindaMetin.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accent görsel — metin bloğunun ardından sayfaya nefes verir. */}
      <section className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
        <Gorsel src={accent} alt="Başarı İnşaat — cephe detayı" sizes="100vw" />
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
