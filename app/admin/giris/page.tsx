"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { girisAction, type GirisDurum } from "../actions";

function Dugme() {
  // useFormStatus, en yakin <form>'un gonderim durumunu okur. Ayri bir
  // "yukleniyor" state'i tutmaya ve elle sifirlamaya gerek birakmiyor.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full bg-[var(--color-navy)] px-6 py-3.5 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
    >
      {pending ? "Kontrol ediliyor…" : "Giriş yap"}
    </button>
  );
}

export default function GirisSayfasi() {
  const [durum, action] = useActionState<GirisDurum, FormData>(girisAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Image
          src="/logo.svg"
          alt="Başarı İnşaat"
          width={502}
          height={81}
          priority
          className="h-6 w-auto"
        />

        <h1 className="font-display mt-10 text-3xl">Yönetim paneli</h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Devam etmek için parolanızı girin.
        </p>

        <form action={action} className="mt-10">
          <label
            htmlFor="parola"
            className="eyebrow block text-[var(--color-navy)]"
          >
            Parola
          </label>
          <input
            id="parola"
            name="parola"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-describedby={durum.hata ? "giris-hata" : undefined}
            className="mt-3 w-full border border-[var(--color-rule)] bg-white px-4 py-3.5 outline-none transition-colors focus:border-[var(--color-navy)]"
          />

          {durum.hata && (
            // role="alert" olmadan ekran okuyucu bu mesaji duyurmaz.
            <p
              id="giris-hata"
              role="alert"
              className="mt-4 border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
            >
              {durum.hata}
            </p>
          )}

          <Dugme />
        </form>
      </div>
    </div>
  );
}
