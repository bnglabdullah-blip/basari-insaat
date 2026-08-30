import type { Metadata } from "next";
import IletisimFormu from "@/components/iletisim-formu";
import { telLink } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Başarı İnşaat iletişim — telefon, e-posta, çalışma saatleri ve mesaj formu.",
};

export default function Iletisim() {
  const a = ayarlariGetir();

  /*
   * Yalnizca CEP telefonlari, isim etiketi olmadan (musteri istegi).
   * Sabit hat, adres ve yetkili isimleri bu sayfadan kaldirildi; adres ve
   * sabit hat /sirket-bilgilerimiz sayfasinda duruyor.
   *
   * Bos numara listeye girmiyor: panelden biri silinirse sayfada bos bir
   * satir kalmaz.
   */
  const cepler = [a.yetkili1Tel, a.yetkili2Tel].filter(Boolean);

  return (
    <div className="mx-auto max-w-[100rem] px-6 pb-24 pt-16 md:px-10 md:pb-36 md:pt-24">
      <p className="eyebrow enter enter-1">İletişim</p>
      <h1 className="font-display enter enter-2 mt-6 max-w-3xl text-[length:var(--text-display)]">
        Bize ulaşın.
      </h1>

      <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-12 md:gap-10">
        {/* Bilgiler */}
        <div className="enter enter-3 md:col-span-5">
          {cepler.length > 0 && (
            <>
              <h2 className="eyebrow border-b border-[var(--color-rule)] pb-4">
                Telefon
              </h2>
              <ul className="mt-2">
                {cepler.map((tel) => (
                  <li
                    key={tel}
                    className="border-b border-[var(--color-rule)] py-4"
                  >
                    <a
                      href={`tel:${telLink(tel)}`}
                      className="link-underline tabular text-lg font-medium"
                    >
                      {tel}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

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

          {a.calismaSaatleri && (
            <>
              <h2 className="eyebrow mt-12 border-b border-[var(--color-rule)] pb-4">
                Çalışma saatleri
              </h2>
              <p className="mt-4 text-[var(--color-muted)]">
                {a.calismaSaatleri}
              </p>
            </>
          )}
        </div>

        {/* Form */}
        <div className="md:col-span-6 md:col-start-7">
          <h2 className="eyebrow mb-6 border-b border-[var(--color-rule)] pb-4">
            Mesaj gönderin
          </h2>
          <IletisimFormu />
        </div>
      </div>
    </div>
  );
}
