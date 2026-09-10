"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  parolaDegistirAction,
  type IcerikDurum,
} from "@/app/admin/(panel)/icerik/actions";

const girdiSinif =
  "w-full border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)]";

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[var(--color-navy)] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Değiştiriliyor…" : "Parolayı değiştir"}
    </button>
  );
}

export default function ParolaFormu() {
  const [durum, action] = useActionState<IcerikDurum, FormData>(
    parolaDegistirAction,
    {}
  );

  return (
    <section className="border-t border-[var(--color-rule)] pt-8">
      <h2 className="eyebrow text-[var(--color-navy)]">Parola</h2>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
        Panel giriş parolanızı buradan değiştirebilirsiniz. En az 10 karakter
        olmalı. Parolanın kendisi hiçbir yerde saklanmaz, geri getirilemez —
        değiştirdikten sonra güvenli bir yere not edin.
      </p>

      {/*
        autoComplete degerleri kasitli: tarayici ve parola yoneticileri bu
        formu "parola degistirme" olarak taniyip yeni parolayi kaydetmeyi
        onerebilsin diye. current-password / new-password standart adlar.
      */}
      <form action={action} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="mevcut"
            className="eyebrow block text-[var(--color-navy)]"
          >
            Mevcut parola
          </label>
          <input
            id="mevcut"
            name="mevcut"
            type="password"
            required
            autoComplete="current-password"
            className={`${girdiSinif} mt-2`}
          />
        </div>

        <div>
          <label
            htmlFor="yeni"
            className="eyebrow block text-[var(--color-navy)]"
          >
            Yeni parola
          </label>
          <input
            id="yeni"
            name="yeni"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={`${girdiSinif} mt-2`}
          />
        </div>

        {durum.hata && (
          <p className="text-sm text-[var(--color-clay)]">{durum.hata}</p>
        )}
        {durum.bilgi && (
          <p className="text-sm text-[var(--color-navy)]">{durum.bilgi}</p>
        )}

        <Kaydet />
      </form>
    </section>
  );
}
