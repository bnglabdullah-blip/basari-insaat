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
  "w-full border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)]";

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
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">
          {ipucu}
        </p>
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
      className="bg-[var(--color-navy)] px-6 py-2.5 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="eyebrow border-b border-[var(--color-rule)] pb-3 text-[var(--color-navy)]">
      {children}
    </h2>
  );
}

export default function IcerikFormu({ ayarlar }: { ayarlar: Ayarlar }) {
  const [durum, action] = useActionState<IcerikDurum, FormData>(
    icerikKaydetAction,
    {}
  );

  return (
    <form action={action}>
      {/*
        Kaydet cubugu rayin tepesine yapisiyor.
        Duzenlemenin cogu sagdaki onizlemede yapiliyor ve form uzun; kaydetmek
        icin her seferinde formun dibine inmek gerekseydi, kaydetmeyi unutup
        sayfadan cikmak en olagan son olurdu.
      */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-rule)] bg-white px-5 py-3">
        <Kaydet />
        {durum.bilgi && (
          <p role="status" className="text-sm text-[var(--color-navy)]">
            {durum.bilgi}
          </p>
        )}
        {durum.hata && (
          <p role="alert" className="text-sm text-[var(--color-clay)]">
            {durum.hata}
          </p>
        )}
      </div>

      <div className="space-y-10 px-5 py-6">
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Sağdaki önizlemede{" "}
          <strong className="font-medium text-[var(--color-navy)]">
            herhangi bir yazıya tıklayın
          </strong>{" "}
          ve doğrudan düzenleyin. Buradaki bir alana tıkladığınızda önizleme o
          yazının bulunduğu yere gider.
        </p>

        <section className="space-y-6">
          <Baslik>Site metinleri</Baslik>

          <Alan ad="slogan" etiket="Slogan" deger={ayarlar.slogan} />
          <Alan
            ad="ozet"
            etiket="Kısa tanıtım"
            ipucu="Ana sayfanın üstünde ve altbilgide görünür."
            deger={ayarlar.ozet}
            satir={4}
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
        </section>

        <section className="space-y-6">
          <Baslik>İletişim bilgileri</Baslik>
          <p className="-mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            Bir alanı boş bırakırsanız varsayılan değerine döner.
          </p>

          <Alan ad="adres" etiket="Adres" deger={ayarlar.adres} satir={2} />
          <Alan ad="ilce" etiket="İlçe / İl" deger={ayarlar.ilce} />
          <Alan
            ad="telefonSabit"
            etiket="Sabit telefon"
            deger={ayarlar.telefonSabit}
          />
          <Alan
            ad="yetkili1Tel"
            etiket="1. yetkili telefonu"
            deger={ayarlar.yetkili1Tel}
          />
          <Alan
            ad="yetkili2Tel"
            etiket="2. yetkili telefonu"
            deger={ayarlar.yetkili2Tel}
          />
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
        </section>

        {/*
          Sitede karsiligi olmayan alanlar ayri bir baslik altinda.
          Onizlemede tiklanacak bir yerleri olmadigi icin, aranip
          bulunamadiklarinda "bozuk" gibi gorunmesinler.
        */}
        <section className="space-y-6">
          <Baslik>Sitede görünmeyen alanlar</Baslik>

          <Alan
            ad="yetkili1Ad"
            etiket="1. yetkili adı"
            ipucu="Yalnızca panelde tutulur; sitede hiçbir yerde yazmaz."
            deger={ayarlar.yetkili1Ad}
          />
          <Alan
            ad="yetkili2Ad"
            etiket="2. yetkili adı"
            ipucu="Yalnızca panelde tutulur; sitede hiçbir yerde yazmaz."
            deger={ayarlar.yetkili2Ad}
          />
          <Alan
            ad="whatsapp"
            etiket="WhatsApp numarası"
            ipucu="İletişim formu bu numaraya yönlenir. 0534 590 25 63 gibi yazın; başındaki sıfır veya +90 fark etmez."
            deger={ayarlar.whatsapp}
          />
          <Alan
            ad="metaAciklama"
            etiket="Arama motoru açıklaması"
            ipucu="Google sonuçlarında başlığın altında çıkan metin. 155 karakteri geçmemeli."
            deger={ayarlar.metaAciklama}
            satir={3}
          />
        </section>
      </div>
    </form>
  );
}
