import Link from "next/link";
import ProjeFormu from "@/components/admin/proje-formu";

export default function YeniProje() {
  return (
    <>
      <Link
        href="/admin/projeler"
        className="link-underline text-sm text-[var(--color-muted)]"
      >
        ← Projeler
      </Link>
      <h1 className="font-display mt-4 text-3xl">Yeni proje</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Projeyi oluşturduktan sonra fotoğraf ekleyebilirsiniz.
      </p>
      <ProjeFormu />
    </>
  );
}
