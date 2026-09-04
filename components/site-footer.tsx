import Image from "next/image";
import Link from "next/link";
import { GELISTIRICI, GEZINME, VARSAYILAN, telLink } from "@/lib/icerik";

/**
 * Numarayi tel: baglantisi olarak basar. Etiket alani OPSIYONEL:
 * yetkili isimleri musteri istegiyle siteden tamamen kaldirildi, numaralar
 * etiketsiz duruyor. Sabit hat kisi adi olmadigi icin etiketini koruyor.
 *
 * Baglantida ml-auto var: etiket basilmadiginda da numara saga yaslanir,
 * justify-between'in tek cocukla sola kaymasini engeller.
 */
function Yetkili({ ad, tel }: { ad?: string; tel: string }) {
  if (!tel) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-rule-dark)] py-3">
      {ad && <span className="text-sm text-[var(--color-paper)]/60">{ad}</span>}
      <a
        href={`tel:${telLink(tel)}`}
        className="link-underline tabular ml-auto text-sm text-[var(--color-paper)]"
      >
        {tel}
      </a>
    </div>
  );
}

export default function SiteFooter({
  ayarlar,
}: {
  ayarlar: typeof VARSAYILAN;
}) {
  const yil = new Date().getFullYear();

  return (
    <footer className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
      <div className="relative mx-auto max-w-[100rem] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          {/* Marka */}
          <div className="md:col-span-5">
            {/*
              Koyu zeminde logonun beyaz varyanti kullaniliyor. Lacivert
              logoyu burada gostermek okunaksiz olurdu; marka setinde bu
              amacla hazirlanmis ayri bir dosya zaten var.
            */}
            <Image
              src="/logo-beyaz.png"
              alt={ayarlar.firma}
              width={502}
              height={81}
              className="h-6 w-auto"
            />
            <p
              data-alan="ozet"
              className="mt-8 max-w-sm text-[var(--color-paper)]/70"
            >
              {ayarlar.ozet}
            </p>
          </div>

          {/* Adres */}
          <div className="md:col-span-4 md:col-start-7">
            <h2 className="eyebrow text-[var(--color-paper)]/50">Ofis</h2>
            {/* Adres ve ilce ayri <span>'lerde: onizlemede ikisi ayri ayri
                duzenlenebilsin diye. Tek dugumde olsalardi tiklayan kisi
                hangi forma alanini degistirdigini bilemezdi. */}
            <address className="mt-5 not-italic leading-relaxed text-[var(--color-paper)]/85">
              <span data-alan="adres">{ayarlar.adres}</span>
              <br />
              <span data-alan="ilce">{ayarlar.ilce}</span>
            </address>
            <p
              data-alan="calismaSaatleri"
              className="mt-5 text-sm text-[var(--color-paper)]/60"
            >
              {ayarlar.calismaSaatleri}
            </p>
          </div>

          {/* Telefonlar */}
          <div className="md:col-span-3">
            <h2 className="eyebrow text-[var(--color-paper)]/50">İletişim</h2>
            <div className="mt-3">
              <Yetkili ad="Sabit hat" tel={ayarlar.telefonSabit} />
              <Yetkili tel={ayarlar.yetkili1Tel} />
              <Yetkili tel={ayarlar.yetkili2Tel} />
            </div>

            {/*
              E-posta yalnizca panelde doluysa basiliyor. Bos bir "E-posta"
              basligi ya da bos adrese giden bir mailto: baglantisi, hic
              gostermemekten kotudur.
            */}
            {ayarlar.eposta && (
              <a
                data-alan="eposta"
                href={`mailto:${ayarlar.eposta}`}
                className="link-underline mt-5 inline-block text-sm text-[var(--color-paper)]/85"
              >
                {ayarlar.eposta}
              </a>
            )}
          </div>
        </div>

        {/*
          Site haritasi GEZINME'den uretiliyor — header ile birebir ayni
          kaynak. Kullanicinin footer'da gordugu gruplama, menude bulacagi
          gruplamanin aynisi; iki ayri liste tutulsa zamanla ayrisirlardi.

          Alt basligi olmayan ogeler (Ana Sayfa, Projeler, Iletisim) tek bir
          "Site" sutununda toplaniyor.
        */}
        <nav className="mt-20 grid gap-10 border-t border-[var(--color-rule-dark)] pt-12 sm:grid-cols-3">
          {GEZINME.filter((m) => m.alt).map((sutun) => (
            <div key={sutun.ad}>
              <h2 className="eyebrow text-[var(--color-paper)]/50">
                {sutun.ad}
              </h2>
              <ul className="mt-5 space-y-3">
                {sutun.alt!.map((b) => (
                  <li key={b.yol}>
                    <Link
                      href={b.yol}
                      className="link-underline text-sm text-[var(--color-paper)]/75"
                    >
                      {b.ad}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="eyebrow text-[var(--color-paper)]/50">Site</h2>
            <ul className="mt-5 space-y-3">
              {GEZINME.filter((m) => !m.alt).map((m) => (
                <li key={m.yol}>
                  <Link
                    href={m.yol}
                    className="link-underline text-sm text-[var(--color-paper)]/75"
                  >
                    {m.ad}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Alt satir */}
        <div className="mt-16 flex flex-col gap-3 border-t border-[var(--color-rule-dark)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular text-sm text-[var(--color-paper)]/55">
            © {yil} {ayarlar.firma}
          </p>
          <p className="text-sm text-[var(--color-paper)]/55">
            Tasarım ve geliştirme:{" "}
            {/* URL girilene kadar duz metin. Bos href veya "#" birakmak,
                tiklayip hicbir yere gitmeyen bir baglanti uretirdi. */}
            {GELISTIRICI.url ? (
              <a
                href={GELISTIRICI.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-[var(--color-paper)]/75"
              >
                {GELISTIRICI.ad}
              </a>
            ) : (
              <span className="text-[var(--color-paper)]/75">
                {GELISTIRICI.ad}
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
