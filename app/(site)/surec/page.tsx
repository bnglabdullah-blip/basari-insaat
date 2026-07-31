import type { Metadata } from "next";
import Link from "next/link";
import { SUREC } from "@/lib/icerik";

export const metadata: Metadata = {
  title: "Çalışma Sürecimiz",
  description:
    "Arsa değerlendirmesinden anahtar teslimine kadar Başarı İnşaat'ın altı " +
    "adımlı çalışma süreci. Eskişehir'de konut ve kentsel dönüşüm projeleri.",
};

export default function Surec() {
  return (
    <>
      <section className="grid-rules mx-auto max-w-[100rem] px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <p className="eyebrow enter enter-1">Çalışma sürecimiz</p>
        <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
          Altı adım. Hepsi{" "}
          <span className="text-[var(--color-clay)]">yazılı</span>.
        </h1>
        <p className="enter enter-3 mt-10 max-w-xl border-t border-[var(--color-rule)] pt-8 text-lg leading-relaxed text-[var(--color-muted)]">
          İnşaat süreçlerinin çoğu teknik sebeplerden değil, kimin ne zaman ne
          yapacağının belirsiz kalmasından uzar. Aşağıdaki altı adımın her biri
          sözleşmede tarih ve sorumluyla birlikte yer alır.
        </p>
      </section>

      {/*
        Numaralı akış. Sol sütundaki büyük numara sticky değil — okuyucu
        aşağı indikçe numaraların değişmesi ilerleme duygusunu veriyor,
        sabit kalması ise onu bozardı.
      */}
      <section className="mx-auto max-w-[100rem] px-6 pb-24 md:px-10 md:pb-32">
        <ol>
          {SUREC.map((s) => (
            <li key={s.no} className="reveal border-t border-[var(--color-rule)]">
              <div className="grid gap-4 py-10 md:grid-cols-12 md:py-14">
                <span
                  aria-hidden
                  className="font-display tabular text-[length:var(--text-title)] text-[var(--color-clay)] md:col-span-2"
                >
                  {s.no}
                </span>
                <h2 className="font-display text-[length:var(--text-title)] md:col-span-4">
                  {s.ad}
                </h2>
                <p className="max-w-xl leading-relaxed text-[var(--color-muted)] md:col-span-6 md:col-start-7">
                  {s.aciklama}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
        <span aria-hidden className="filigran filigran-koyu right-4 top-6 md:right-10">
          06
        </span>
        <div className="relative mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <h2 className="font-display reveal text-[length:var(--text-display)] md:col-span-7">
              İlk adım bir görüşme.
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <p className="text-[var(--color-paper)]/70">
                Fizibilite görüşmesi için bir ücret talep etmiyoruz.
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
