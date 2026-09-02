import Link from "next/link";
import { projeleriGetir } from "@/lib/queries";

export default function PanelOzet() {
  const projeler = projeleriGetir(false);
  const yayinda = projeler.filter((p) => p.yayinda === 1).length;
  const taslak = projeler.length - yayinda;

  const kartlar = [
    { etiket: "Yayındaki proje", deger: yayinda, yol: "/admin/projeler" },
    // Taslak sayisi vurgulu: yayina alinmayi bekleyen bir proje unutulmasin.
    {
      etiket: "Taslak proje",
      deger: taslak,
      yol: "/admin/projeler",
      vurgu: taslak > 0,
    },
  ];

  return (
    <>
      <h1 className="font-display text-3xl">Özet</h1>

      <div className="mt-10 grid gap-px overflow-hidden border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2">
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

    </>
  );
}
