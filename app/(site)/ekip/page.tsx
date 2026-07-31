import type { Metadata } from "next";
import Link from "next/link";
import { EKIP, VARSAYILAN, telLink } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ekip",
  description:
    "Başarı İnşaat kurucu ortakları — yapı denetim kökenli saha ve süreç " +
    "tecrübesi. Eskişehir.",
};

export default function Ekip() {
  const ayarlar = ayarlariGetir();

  /*
   * Ad ve telefon panelden yonetilen ayarlardan geliyor, EKIP sabitinden
   * degil. EKIP yalnizca unvan/alan/ozgecmis gibi nadiren degisen metni
   * tutuyor. Aksi halde panelden "Taha Bey" degistirildiginde footer ve
   * iletisim sayfasi guncellenir, bu sayfa eski adda kalirdi.
   */
  const iletisim = [
    { ad: ayarlar.yetkili1Ad, tel: ayarlar.yetkili1Tel },
    { ad: ayarlar.yetkili2Ad, tel: ayarlar.yetkili2Tel },
  ];

  return (
    <>
      <section className="grid-rules mx-auto max-w-[100rem] px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <p className="eyebrow enter enter-1">Ekip</p>
        <h1 className="font-display enter enter-2 mt-6 max-w-4xl text-[length:var(--text-display)]">
          Denetleyen taraftan inşa eden tarafa.
        </h1>
        <p className="enter enter-3 mt-10 max-w-xl border-t border-[var(--color-rule)] pt-8 text-lg leading-relaxed text-[var(--color-muted)]">
          {VARSAYILAN.firma}, yılların yapı denetim tecrübesiyle kuruldu.
          Kurucu ortakların ikisi de kariyerine binaları denetleyerek başladı.
        </p>
      </section>

      {/*
        Portre fotoğrafı yok — elimizde bulunmadığı için. Stok fotoğraf veya
        boş avatar koymaktansa tipografik kart daha dürüst duruyor; isim ve
        alan zaten taşınması gereken bilginin tamamı.
      */}
      <section className="mx-auto max-w-[100rem] px-6 pb-24 md:px-10 md:pb-32">
        <div className="grid gap-px border-t border-[var(--color-rule)] md:grid-cols-2">
          {EKIP.map((k, i) => (
            <article
              key={k.ad}
              className="reveal border-b border-[var(--color-rule)] py-12 md:py-16 md:odd:border-r md:odd:pr-12 md:even:pl-12"
            >
              <p className="eyebrow text-[var(--color-clay)]">{k.unvan}</p>
              <h2 className="font-display mt-5 text-[length:var(--text-title)]">
                {iletisim[i]?.ad || k.ad}
              </h2>
              <p className="mt-2 text-[var(--color-muted)]">{k.alan}</p>
              <p className="mt-8 max-w-md leading-relaxed text-[var(--color-muted)]">
                {k.ozgecmis}
              </p>
              {iletisim[i]?.tel && (
                <a
                  href={`tel:${telLink(iletisim[i].tel)}`}
                  className="link-underline tabular mt-8 inline-block font-medium"
                >
                  {iletisim[i].tel}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
        <div className="relative mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <h2 className="font-display reveal text-[length:var(--text-display)] md:col-span-7">
              Doğrudan bize ulaşın.
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <p className="text-[var(--color-paper)]/70">
                Arada santral yok; numaralar doğrudan bizim.
              </p>
              <Link
                href="/iletisim"
                className="mt-8 inline-block bg-[var(--color-paper)] px-8 py-4 font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-clay)] hover:text-white"
              >
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
