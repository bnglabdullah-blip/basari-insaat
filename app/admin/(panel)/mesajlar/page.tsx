import { tarihBicimle } from "@/lib/metin";
import { mesajlariGetir } from "@/lib/queries";
import { telLink } from "@/lib/icerik";
import { mesajSilAction, okunduAction } from "./actions";

export default function Mesajlar() {
  const mesajlar = mesajlariGetir();

  return (
    <>
      <h1 className="font-display text-3xl">Mesajlar</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Siteden gelen iletişim talepleri. Okunmamışlar en üstte.
      </p>

      {mesajlar.length === 0 ? (
        <p className="mt-12 border border-dashed border-[var(--color-rule)] p-10 text-center text-[var(--color-muted)]">
          Henüz mesaj yok.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {mesajlar.map((m) => (
            <li
              key={m.id}
              className={`border p-6 ${
                m.okundu === 0
                  ? "border-[var(--color-clay)]/40 bg-[var(--color-clay)]/5"
                  : "border-[var(--color-rule)] bg-white"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className="font-medium">
                  {m.ad}
                  {m.okundu === 0 && (
                    <span className="ml-3 align-middle text-xs font-normal text-[var(--color-clay)]">
                      ● yeni
                    </span>
                  )}
                </p>
                <p className="tabular text-sm text-[var(--color-muted)]">
                  {tarihBicimle(m.olusturma)}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {m.telefon && (
                  <a
                    href={`tel:${telLink(m.telefon)}`}
                    className="link-underline tabular"
                  >
                    {m.telefon}
                  </a>
                )}
                {m.eposta && (
                  <a href={`mailto:${m.eposta}`} className="link-underline">
                    {m.eposta}
                  </a>
                )}
              </div>

              {/* whitespace-pre-line: kullanıcının girdiği satır sonları korunur */}
              <p className="mt-5 whitespace-pre-line leading-relaxed">
                {m.mesaj}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-[var(--color-rule)] pt-4">
                <form action={okunduAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    type="hidden"
                    name="okundu"
                    value={m.okundu === 0 ? "1" : "0"}
                  />
                  <button
                    type="submit"
                    className="link-underline text-sm text-[var(--color-muted)]"
                  >
                    {m.okundu === 0
                      ? "Okundu olarak işaretle"
                      : "Okunmadı olarak işaretle"}
                  </button>
                </form>

                <details>
                  <summary className="cursor-pointer list-none text-sm text-[var(--color-muted)] hover:text-[var(--color-clay)]">
                    Sil…
                  </summary>
                  <form action={mesajSilAction} className="mt-3">
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="bg-[var(--color-clay)] px-4 py-2 text-xs font-medium text-white"
                    >
                      Kalıcı olarak sil
                    </button>
                  </form>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
