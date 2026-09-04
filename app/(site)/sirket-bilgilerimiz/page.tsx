import type { Metadata } from "next";
import Link from "next/link";
import { telLink } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Şirket Bilgilerimiz",
  description:
    "Başarı İnşaat kurumsal bilgileri — ofis adresi, sabit telefon ve çalışma saatleri. Tepebaşı / Eskişehir.",
};

export default async function SirketBilgilerimiz() {
  const a = await ayarlariGetir();

  /*
   * Satirlar ayarlardan turetiliyor ve BOS olanlar listeye hic girmiyor.
   * Bos bir "E-posta —" satiri basmak, bilgiyi hic gostermemekten kotudur:
   * ziyaretciye "burada bir sey olmali ama yok" dedirtir.
   *
   * Vergi dairesi, ticaret sicil no gibi alanlar BILINCLI olarak yok:
   * elimizde dogrulanmis degerleri yok ve kurumsal bir sayfaya uydurma
   * numara yazilmaz. Musteri verdiginde panele alan eklenir.
   */
  const satirlar = [
    { etiket: "Firma", deger: a.firma },
    { etiket: "Adres", deger: [a.adres, a.ilce].filter(Boolean).join(", ") },
    { etiket: "Sabit telefon", deger: a.telefonSabit, tel: true },
    { etiket: "E-posta", deger: a.eposta, posta: true },
    { etiket: "Çalışma saatleri", deger: a.calismaSaatleri },
  ].filter((s) => s.deger);

  const haritaSorgu = encodeURIComponent(`${a.adres} ${a.ilce}`);

  return (
    <div className="mx-auto max-w-[100rem] px-6 pb-24 pt-16 md:px-10 md:pb-36 md:pt-24">
      <p className="eyebrow enter enter-1">Kurumsal</p>
      <h1 className="font-display enter enter-2 mt-6 max-w-3xl text-[length:var(--text-display)]">
        Şirket bilgilerimiz.
      </h1>

      <dl className="enter enter-3 mt-16 max-w-3xl border-t border-[var(--color-rule)] md:mt-24">
        {satirlar.map((s) => (
          <div
            key={s.etiket}
            className="grid gap-2 border-b border-[var(--color-rule)] py-6 md:grid-cols-12 md:items-baseline md:py-7"
          >
            <dt className="eyebrow md:col-span-4">{s.etiket}</dt>
            <dd className="text-lg leading-relaxed md:col-span-8">
              {s.tel ? (
                <a
                  href={`tel:${telLink(s.deger)}`}
                  className="link-underline tabular font-medium"
                >
                  {s.deger}
                </a>
              ) : s.posta ? (
                <a href={`mailto:${s.deger}`} className="link-underline">
                  {s.deger}
                </a>
              ) : (
                s.deger
              )}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 max-w-xl text-[var(--color-muted)]">
        Cep telefonlarımız ve mesaj formu için{" "}
        <Link href="/iletisim" className="link-underline font-medium text-[var(--color-navy)]">
          İletişim
        </Link>{" "}
        sayfasına geçebilirsiniz.
      </p>

      {/* Harita — adres burada yaşadığı için harita da burada. */}
      <div className="reveal mt-20 aspect-[16/9] w-full overflow-hidden border border-[var(--color-rule)] md:mt-28 md:aspect-[21/9]">
        <iframe
          title="Başarı İnşaat ofis konumu"
          src={`https://www.google.com/maps?q=${haritaSorgu}&output=embed`}
          loading="lazy"
          // Harita hicbir tarayici yetkisine ihtiyac duymuyor; hepsi kapatiliyor.
          allow=""
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
