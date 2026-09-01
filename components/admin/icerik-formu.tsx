"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  icerikKaydetAction,
  type IcerikDurum,
} from "@/app/admin/(panel)/icerik/actions";
import type { VARSAYILAN } from "@/lib/icerik";

type Ayarlar = typeof VARSAYILAN;

const girdiSinif =
  "w-full border border-[var(--color-rule)] bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--color-navy)]";

/** Tek bir ayar alani. `satir` verilirse textarea, verilmezse input. */
function Alan({
  ad,
  etiket,
  deger,
  ipucu,
  satir,
}: {
  ad: keyof Ayarlar;
  etiket: string;
  deger: string;
  ipucu?: string;
  satir?: number;
}) {
  return (
    <div>
      <label htmlFor={ad} className="eyebrow block text-[var(--color-navy)]">
        {etiket}
      </label>
      {ipucu && (
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">{ipucu}</p>
      )}
      {satir ? (
        <textarea
          id={ad}
          name={ad}
          rows={satir}
          defaultValue={deger}
          className={`${girdiSinif} mt-2 resize-y`}
        />
      ) : (
        <input
          id={ad}
          name={ad}
          defaultValue={deger}
          className={`${girdiSinif} mt-2`}
        />
      )}
    </div>
  );
}

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[var(--color-navy)] px-7 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

export default function IcerikFormu({ ayarlar }: { ayarlar: Ayarlar }) {
  const [durum, action] = useActionState<IcerikDurum, FormData>(
    icerikKaydetAction,
    {}
  );

  return (
    <form action={action} className="mt-10 max-w-2xl space-y-14">
      <section className="space-y-8">
        <h2 className="font-display border-b border-[var(--color-rule)] pb-4 text-2xl">
          İletişim bilgileri
        </h2>
        <p className="-mt-4 text-sm text-[var(--color-muted)]">
          Bu alanlar sitenin altbilgisinde ve iletişim sayfasında görünür.
          Bir alanı boş bırakırsanız varsayılan değerine döner.
        </p>

        <Alan ad="adres" etiket="Adres" deger={ayarlar.adres} satir={2} />
        <Alan ad="ilce" etiket="İlçe / İl" deger={ayarlar.ilce} />
        <Alan
          ad="telefonSabit"
          etiket="Sabit telefon"
          deger={ayarlar.telefonSabit}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Alan ad="yetkili1Ad" etiket="1. yetkili adı" deger={ayarlar.yetkili1Ad} />
          <Alan ad="yetkili1Tel" etiket="1. yetkili telefonu" deger={ayarlar.yetkili1Tel} />
          <Alan ad="yetkili2Ad" etiket="2. yetkili adı" deger={ayarlar.yetkili2Ad} />
          <Alan ad="yetkili2Tel" etiket="2. yetkili telefonu" deger={ayarlar.yetkili2Tel} />
        </div>

        <Alan
          ad="eposta"
          etiket="E-posta"
          ipucu="Boş bırakırsanız sitede gösterilmez."
          deger={ayarlar.eposta}
        />
        <Alan
          ad="calismaSaatleri"
          etiket="Çalışma saatleri"
          deger={ayarlar.calismaSaatleri}
        />
        <Alan
          ad="whatsapp"
          etiket="WhatsApp numarası"
          ipucu="İletişim formu bu numaraya yönlenir. 0534 590 25 63 gibi yazın; başındaki sıfır veya +90 fark etmez."
          deger={ayarlar.whatsapp}
        />
      </section>

      <section className="space-y-8">
        <h2 className="font-display border-b border-[var(--color-rule)] pb-4 text-2xl">
          Site metinleri
        </h2>

        <Alan ad="slogan" etiket="Slogan" deger={ayarlar.slogan} />
        <Alan
          ad="ozet"
          etiket="Kısa tanıtım"
          ipucu="Ana sayfanın üstünde ve altbilgide görünür."
          deger={ayarlar.ozet}
          satir={3}
        />
        <Alan
          ad="hakkindaBaslik"
          etiket="Hakkımızda başlığı"
          deger={ayarlar.hakkindaBaslik}
        />
        <Alan
          ad="hakkindaMetin"
          etiket="Hakkımızda metni"
          ipucu="Yeni paragraf için bir boş satır bırakın."
          deger={ayarlar.hakkindaMetin}
          satir={10}
        />
        <Alan
          ad="metaAciklama"
          etiket="Arama motoru açıklaması"
          ipucu="Google sonuçlarında başlığın altında çıkan metin. 155 karakteri geçmemeli."
          deger={ayarlar.metaAciklama}
          satir={3}
        />
      </section>

      {durum.bilgi && (
        <p
          role="status"
          className="border-l-2 border-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-3 text-sm"
        >
          {durum.bilgi}
        </p>
      )}
      {durum.hata && (
        <p
          role="alert"
          className="border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
        >
          {durum.hata}
        </p>
      )}

      <Kaydet />
    </form>
  );
}
