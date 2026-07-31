"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  projeKaydetAction,
  type ProjeDurumSonuc,
} from "@/app/admin/(panel)/projeler/actions";
import { slugla } from "@/lib/metin";
import type { Proje } from "@/lib/queries";

function Kaydet({ yeni }: { yeni: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[var(--color-navy)] px-7 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : yeni ? "Projeyi oluştur" : "Değişiklikleri kaydet"}
    </button>
  );
}

function Alan({
  ad,
  etiket,
  ipucu,
  children,
}: {
  ad: string;
  etiket: string;
  ipucu?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={ad} className="eyebrow block text-[var(--color-navy)]">
        {etiket}
      </label>
      {ipucu && (
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">{ipucu}</p>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const girdiSinif =
  "w-full border border-[var(--color-rule)] bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--color-navy)]";

export default function ProjeFormu({ proje }: { proje?: Proje }) {
  const [durum, action] = useActionState<ProjeDurumSonuc, FormData>(
    projeKaydetAction,
    {}
  );

  // Baslik yazilirken web adresini canli onizle. Sunucu bu degeri yeniden
  // uretiyor; buradaki hesap yalnizca kullaniciya ne olacagini gostermek
  // icin — istemciden gelen slug'a guvenilmiyor.
  const [baslik, setBaslik] = useState(proje?.baslik ?? "");
  const [slug, setSlug] = useState(proje?.slug ?? "");
  const etkinSlug = slug.trim() ? slugla(slug) : slugla(baslik);

  return (
    <form action={action} className="mt-10 max-w-2xl space-y-8">
      {proje && <input type="hidden" name="id" value={proje.id} />}

      <Alan ad="baslik" etiket="Proje başlığı">
        <input
          id="baslik"
          name="baslik"
          required
          defaultValue={proje?.baslik}
          onChange={(e) => setBaslik(e.target.value)}
          className={girdiSinif}
          placeholder="Örn. Adil Över Apartmanı"
        />
      </Alan>

      <Alan
        ad="slug"
        etiket="Web adresi"
        ipucu="Boş bırakırsanız başlıktan otomatik üretilir."
      >
        <input
          id="slug"
          name="slug"
          defaultValue={proje?.slug}
          onChange={(e) => setSlug(e.target.value)}
          className={girdiSinif}
          placeholder="otomatik"
        />
        <p className="mt-2 break-all text-xs text-[var(--color-muted)]">
          basariinsaat.com/projeler/
          <span className="text-[var(--color-clay)]">{etkinSlug || "…"}</span>
        </p>
      </Alan>

      <div className="grid gap-8 sm:grid-cols-2">
        <Alan ad="konum" etiket="Konum">
          <input
            id="konum"
            name="konum"
            defaultValue={proje?.konum}
            className={girdiSinif}
            placeholder="Tepebaşı / Eskişehir"
          />
        </Alan>

        <Alan ad="yil" etiket="Yıl">
          <input
            id="yil"
            name="yil"
            defaultValue={proje?.yil}
            className={girdiSinif}
            placeholder="2026"
          />
        </Alan>
      </div>

      <Alan ad="durum" etiket="Durum">
        <select
          id="durum"
          name="durum"
          defaultValue={proje?.durum ?? "devam"}
          className={girdiSinif}
        >
          <option value="planlama">Planlama aşamasında</option>
          <option value="devam">Devam ediyor</option>
          <option value="tamamlandi">Tamamlandı</option>
        </select>
      </Alan>

      <Alan
        ad="ozet"
        etiket="Kısa özet"
        ipucu="Proje listesinde kartın altında görünen tek cümle."
      >
        <input
          id="ozet"
          name="ozet"
          defaultValue={proje?.ozet}
          className={girdiSinif}
          placeholder="4 katlı, 8 daireli konut projesi"
        />
      </Alan>

      <Alan
        ad="aciklama"
        etiket="Açıklama"
        ipucu="Proje sayfasındaki uzun metin. Paragraf için bir boş satır bırakın."
      >
        <textarea
          id="aciklama"
          name="aciklama"
          rows={8}
          defaultValue={proje?.aciklama}
          className={`${girdiSinif} resize-y`}
        />
      </Alan>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="yayinda"
          defaultChecked={proje ? proje.yayinda === 1 : true}
          className="h-4 w-4 accent-[var(--color-navy)]"
        />
        <span className="text-sm">
          Sitede yayında
          <span className="ml-2 text-[var(--color-muted)]">
            (kapatırsanız yalnızca panelde görünür)
          </span>
        </span>
      </label>

      {durum.hata && (
        <p
          role="alert"
          className="border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
        >
          {durum.hata}
        </p>
      )}
      {durum.bilgi && (
        <p
          role="status"
          className="border-l-2 border-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-3 text-sm"
        >
          {durum.bilgi}
        </p>
      )}

      <Kaydet yeni={!proje} />
    </form>
  );
}
