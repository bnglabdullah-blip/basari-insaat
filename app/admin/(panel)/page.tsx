import Link from "next/link";
import { mesajlariGetir, projeleriGetir } from "@/lib/queries";

export default function PanelOzet() {
  const projeler = projeleriGetir(false);
  const mesajlar = mesajlariGetir();
  const okunmamis = mesajlar.filter((m) => m.okundu === 0);

  const kartlar = [
    {
      etiket: "Yayındaki proje",
      deger: projeler.filter((p) => p.yayinda === 1).length,
      yol: "/admin/projeler",
    },
    {
      etiket: "Okunmamış mesaj",
      deger: okunmamis.length,
      yol: "/admin/mesajlar",
      vurgu: okunmamis.length > 0,
    },
    {
      etiket: "Toplam mesaj",
      deger: mesajlar.length,
      yol: "/admin/mesajlar",
    },
  ];

  return (
    <>
      <h1 className="font-display text-3xl">Özet</h1>

      <div className="mt-10 grid gap-px overflow-hidden border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-3">
        {kartlar.map((k) => (
          <Link
            key={k.etiket}
            href={k.yol}
            className="bg-white p-8 transition-colors hover:bg-[var(--color-paper)]"
          >
            <p
              className={`font-display tabular text-5xl ${
                k.vurgu ? "text-[var(--color-clay)]" : ""
              }`}
            >
              {k.deger}
            </p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">{k.etiket}</p>
          </Link>
        ))}
      </div>

      {projeler.length === 0 && (
        <div className="mt-10 border border-dashed border-[var(--color-rule)] p-10 text-center">
          <p className="text-[var(--color-muted)]">
            Henüz proje eklenmemiş. Sitenin proje bölümü şu an boş görünüyor.
          </p>
          <Link
            href="/admin/projeler/yeni"
            className="mt-6 inline-block bg-[var(--color-navy)] px-6 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
          >
            İlk projeyi ekle
          </Link>
        </div>
      )}

      {okunmamis.length > 0 && (
        <section className="mt-14">
          <h2 className="eyebrow border-b border-[var(--color-rule)] pb-4">
            Okunmamış mesajlar
          </h2>
          <ul className="divide-y divide-[var(--color-rule)]">
            {okunmamis.slice(0, 5).map((m) => (
              <li key={m.id}>
                <Link
                  href="/admin/mesajlar"
                  className="row-link flex flex-wrap items-baseline justify-between gap-2 py-4"
                >
                  <span className="font-medium">{m.ad}</span>
                  <span className="max-w-md truncate text-sm text-[var(--color-muted)]">
                    {m.mesaj}
                  </span>
                  <span className="tabular text-xs text-[var(--color-muted)]">
                    {new Date(m.olusturma + "Z").toLocaleDateString("tr-TR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
