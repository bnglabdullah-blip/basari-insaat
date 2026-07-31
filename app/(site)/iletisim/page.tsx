import type { Metadata } from "next";
import IletisimFormu from "@/components/iletisim-formu";
import { telLink } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Başarı İnşaat iletişim bilgileri — Tepebaşı / Eskişehir. Telefon, adres ve mesaj formu.",
};

export default function Iletisim() {
  const a = ayarlariGetir();

  const telefonlar = [
    { ad: "Sabit hat", tel: a.telefonSabit },
    { ad: a.yetkili1Ad, tel: a.yetkili1Tel },
    { ad: a.yetkili2Ad, tel: a.yetkili2Tel },
  ].filter((t) => t.tel);

  // Haritanin gosterecegi adres. Google Maps embed'i API anahtari
  // gerektirmez ve kota tuketmez.
  const haritaSorgu = encodeURIComponent(`${a.adres} ${a.ilce}`);

  return (
    <div className="mx-auto max-w-[100rem] px-6 pb-24 pt-16 md:px-10 md:pb-36 md:pt-24">
      <p className="eyebrow enter enter-1">İletişim</p>
      <h1 className="font-display enter enter-2 mt-6 max-w-3xl text-[length:var(--text-display)]">
        Bize ulaşın.
      </h1>

      <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-12 md:gap-10">
        {/* Bilgiler */}
        <div className="enter enter-3 md:col-span-5">
          <h2 className="eyebrow border-b border-[var(--color-rule)] pb-4">
            Ofis
          </h2>
          <address className="mt-5 not-italic text-lg leading-relaxed">
            {a.adres}
            <br />
            {a.ilce}
          </address>

          <h2 className="eyebrow mt-12 border-b border-[var(--color-rule)] pb-4">
            Telefon
          </h2>
          <ul className="mt-2">
            {telefonlar.map((t) => (
              <li
                key={t.tel}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--color-rule)] py-4"
              >
                <span className="text-[var(--color-muted)]">{t.ad}</span>
                <a
                  href={`tel:${telLink(t.tel)}`}
                  className="link-underline tabular text-lg font-medium"
                >
                  {t.tel}
                </a>
              </li>
            ))}
          </ul>

          {a.eposta && (
            <>
              <h2 className="eyebrow mt-12 border-b border-[var(--color-rule)] pb-4">
                E-posta
              </h2>
              <a
                href={`mailto:${a.eposta}`}
                className="link-underline mt-4 inline-block text-lg"
              >
                {a.eposta}
              </a>
            </>
          )}

          <h2 className="eyebrow mt-12 border-b border-[var(--color-rule)] pb-4">
            Çalışma saatleri
          </h2>
          <p className="mt-4 text-[var(--color-muted)]">{a.calismaSaatleri}</p>
        </div>

        {/* Form */}
        <div className="md:col-span-6 md:col-start-7">
          <h2 className="eyebrow mb-6 border-b border-[var(--color-rule)] pb-4">
            Mesaj gönderin
          </h2>
          <IletisimFormu />
        </div>
      </div>

      {/* Harita */}
      <div className="reveal mt-24 aspect-[16/9] w-full overflow-hidden border border-[var(--color-rule)] md:mt-32 md:aspect-[21/9]">
        <iframe
          title="Başarı İnşaat ofis konumu"
          src={`https://www.google.com/maps?q=${haritaSorgu}&output=embed`}
          loading="lazy"
          // Harita, kullanicinin konumu veya kamerasi gibi hicbir tarayici
          // yetkisine ihtiyac duymuyor; hepsi kapatiliyor.
          allow=""
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
