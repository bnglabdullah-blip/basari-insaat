"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GEZINME, VARSAYILAN, telLink } from "@/lib/icerik";

/**
 * Telefon numarasi prop olarak geliyor: header bir istemci bileseni oldugu
 * icin veritabanindan kendisi okuyamaz. Layout okuyup aktariyor, boylece
 * panelden yapilan degisiklik burada da aninda gorunuyor.
 */
export default function SiteHeader({ telefon }: { telefon: string }) {
  const yol = usePathname();
  const [acik, setAcik] = useState(false);

  // Menu acikken arka planin kaymasini engelle. Menu bir sayfa gecisiyle
  // kapandiginda da temizlenmesi icin bagimlilik listesinde `acik` var.
  useEffect(() => {
    document.body.style.overflow = acik ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [acik]);

  // Escape ile kapatma — modal benzeri her arayuzde beklenen davranis.
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    window.addEventListener("keydown", kapat);
    return () => window.removeEventListener("keydown", kapat);
  }, [acik]);

  /** Ana sayfa yalnizca tam eslesmede aktif; digerleri alt sayfalarinda da. */
  const aktifMi = (hedef: string) =>
    hedef === "/" ? yol === "/" : yol === hedef || yol.startsWith(hedef + "/");

  return (
    <header className="sticky top-0 z-50">
      {/*
        Arka plan ve alt cizgi, scroll'a bagli olarak beliriyor. Bunun icin
        scroll event listener YOK: native `animation-timeline: scroll()`
        kullaniliyor, dolayisiyla ana thread'de hicbir is yapilmiyor.
      */}
      <div
        aria-hidden
        className="header-solid absolute inset-0 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/85 backdrop-blur-md"
      />

      <div className="relative mx-auto flex max-w-[100rem] items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="relative z-10 block"
          aria-label={`${VARSAYILAN.firma} — ana sayfa`}
          onClick={() => setAcik(false)}
        >
          <Image
            src="/logo.svg"
            alt={VARSAYILAN.firma}
            width={502}
            height={81}
            priority
            className={`h-5 w-auto transition-opacity md:h-6 ${
              acik ? "opacity-0" : "opacity-100"
            }`}
          />
        </Link>

        {/* ================= Masaustu menu ================= */}
        <nav className="hidden items-center gap-8 lg:flex">
          {GEZINME.map((m) => {
            const aktif = aktifMi(m.yol);

            /*
             * Acilir menu tamamen CSS: `group-hover` fare icin,
             * `group-focus-within` klavye icin. JS durumu tutulmuyor —
             * disari tiklama, Escape, odak yonetimi gibi bir suru kenar
             * durumu bastan dogmuyor.
             *
             * Grup basligi da gercek bir baglanti (`m.yol`), dolayisiyla
             * dokunmatik cihazda -- hover olmayan yerde -- ustune dokunmak
             * ilgili sayfaya goturuyor.
             */
            if (!m.alt) {
              return (
                <Link
                  key={m.yol}
                  href={m.yol}
                  aria-current={aktif ? "page" : undefined}
                  className={`link-underline text-sm font-medium tracking-wide ${
                    aktif ? "text-[var(--color-clay)]" : "text-[var(--color-navy)]"
                  }`}
                >
                  {m.ad}
                </Link>
              );
            }

            return (
              <div key={m.ad} className="group relative">
                {/* pb-5/-mb-5: baslik ile acilir kutu arasinda fare bosluğu
                    kalmasin, aksi halde asagi inerken menu kapanir. */}
                <Link
                  href={m.yol}
                  aria-current={aktif ? "page" : undefined}
                  className={`link-underline -mb-5 flex items-center gap-1.5 pb-5 text-sm font-medium tracking-wide ${
                    aktif ? "text-[var(--color-clay)]" : "text-[var(--color-navy)]"
                  }`}
                >
                  {m.ad}
                  <span
                    aria-hidden
                    className="text-[0.6rem] transition-transform duration-300 group-hover:rotate-180"
                  >
                    ▾
                  </span>
                </Link>

                <div className="invisible absolute left-0 top-full z-20 pt-5 opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="min-w-56 border border-[var(--color-rule)] bg-[var(--color-paper)] py-2 shadow-[0_18px_40px_-24px_rgb(25_29_55_/_0.45)]">
                    {m.alt.map((a) => (
                      <li key={a.yol}>
                        <Link
                          href={a.yol}
                          className={`block px-5 py-2.5 text-sm transition-colors hover:bg-[var(--color-paper-dim)] ${
                            yol === a.yol
                              ? "text-[var(--color-clay)]"
                              : "text-[var(--color-navy)]"
                          }`}
                        >
                          {a.ad}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          <a
            href={`tel:${telLink(telefon)}`}
            className="tabular border border-[var(--color-navy)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)]"
          >
            {telefon}
          </a>
        </nav>

        {/* Mobil menu dugmesi — lg altinda, cunku 7 oge + telefon
            tablet genisliginde de sigmiyor. */}
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          aria-controls="mobil-menu"
          className="relative z-10 -mr-2 p-2 lg:hidden"
        >
          <span className="sr-only">{acik ? "Menüyü kapat" : "Menüyü aç"}</span>
          <span className="flex h-4 w-6 flex-col justify-between">
            <span
              className={`block h-px w-full transition-transform duration-300 ${
                acik
                  ? "translate-y-[7.5px] rotate-45 bg-[var(--color-paper)]"
                  : "bg-[var(--color-navy)]"
              }`}
            />
            <span
              className={`block h-px w-full transition-opacity duration-200 ${
                acik ? "opacity-0" : "bg-[var(--color-navy)] opacity-100"
              }`}
            />
            <span
              className={`block h-px w-full transition-transform duration-300 ${
                acik
                  ? "-translate-y-[7.5px] -rotate-45 bg-[var(--color-paper)]"
                  : "bg-[var(--color-navy)]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* ================= Mobil tam ekran menu ================= */}
      <div
        id="mobil-menu"
        className={`fixed inset-0 z-0 overflow-y-auto bg-[var(--color-navy)] transition-[opacity,visibility] duration-300 lg:hidden ${
          acik ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Alt basliklar burada gizlenmiyor, acik halde listeleniyor:
            tam ekran menude yer bol ve bir seviye daha dokunus istemek
            "kolay erisim" amaciyla celisirdi. */}
        <nav className="min-h-full px-6 pb-16 pt-28">
          {GEZINME.map((m, i) => (
            <div
              key={m.ad}
              style={{ transitionDelay: acik ? `${60 + i * 50}ms` : "0ms" }}
              className={`border-b border-[var(--color-rule-dark)] py-5 transition-all duration-500 ${
                acik ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <Link
                href={m.yol}
                onClick={() => setAcik(false)}
                className="font-display block text-3xl text-[var(--color-paper)]"
              >
                {m.ad}
              </Link>

              {m.alt && (
                <ul className="mt-4 space-y-1">
                  {m.alt.map((a) => (
                    <li key={a.yol}>
                      <Link
                        href={a.yol}
                        onClick={() => setAcik(false)}
                        className="block py-1.5 text-[var(--color-paper)]/65"
                      >
                        {a.ad}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <a
            href={`tel:${telLink(telefon)}`}
            onClick={() => setAcik(false)}
            style={{ transitionDelay: acik ? "340ms" : "0ms" }}
            className={`tabular mt-8 inline-block text-lg text-[var(--color-clay)] transition-all duration-500 ${
              acik ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {telefon}
          </a>
        </nav>
      </div>
    </header>
  );
}
