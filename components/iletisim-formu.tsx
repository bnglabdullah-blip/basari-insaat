"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { mesajGonderAction, type FormDurum } from "@/app/(site)/iletisim/actions";

const girdiSinif =
  "w-full border border-[var(--color-rule)] bg-white px-4 py-3.5 outline-none transition-colors focus:border-[var(--color-navy)]";

function Gonder() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 bg-[var(--color-navy)] px-8 py-4 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Gönderiliyor…" : "Mesajı gönder"}
    </button>
  );
}

export default function IletisimFormu() {
  const [durum, action] = useActionState<FormDurum, FormData>(
    mesajGonderAction,
    {}
  );

  // Basarili gonderimden sonra formu degil tesekkur mesajini goster.
  if (durum.bilgi) {
    return (
      <div
        role="status"
        className="border-l-2 border-[var(--color-navy)] bg-[var(--color-navy)]/5 p-8"
      >
        <p className="font-display text-2xl">Teşekkürler.</p>
        <p className="mt-3 text-[var(--color-muted)]">{durum.bilgi}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {/*
        Bal küpü. Ekran okuyucuların da atlaması için aria-hidden + tabIndex=-1;
        display:none yerine ekran dışına taşınıyor çünkü bazı botlar
        display:none alanları doldurmayacak kadar akıllı.
      */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Bu alanı boş bırakın</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="ad" className="eyebrow block text-[var(--color-navy)]">
          Adınız *
        </label>
        <input
          id="ad"
          name="ad"
          required
          autoComplete="name"
          className={`${girdiSinif} mt-2`}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="telefon"
            className="eyebrow block text-[var(--color-navy)]"
          >
            Telefon
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`${girdiSinif} mt-2`}
          />
        </div>
        <div>
          <label
            htmlFor="eposta"
            className="eyebrow block text-[var(--color-navy)]"
          >
            E-posta
          </label>
          <input
            id="eposta"
            name="eposta"
            type="email"
            autoComplete="email"
            className={`${girdiSinif} mt-2`}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-[var(--color-muted)]">
        Telefon veya e-postadan en az birini girin.
      </p>

      <div>
        <label
          htmlFor="mesaj"
          className="eyebrow block text-[var(--color-navy)]"
        >
          Mesajınız *
        </label>
        <textarea
          id="mesaj"
          name="mesaj"
          required
          rows={6}
          className={`${girdiSinif} mt-2 resize-y`}
          placeholder="Arsanız, daire talebiniz veya dönüşüm süreciniz hakkında kısaca bilgi verin."
        />
      </div>

      {durum.hata && (
        <p
          role="alert"
          className="border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
        >
          {durum.hata}
        </p>
      )}

      <Gonder />
    </form>
  );
}
