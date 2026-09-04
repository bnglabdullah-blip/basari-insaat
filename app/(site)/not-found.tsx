import Link from "next/link";

/**
 * 404 sayfasi (site) grubunun ICINDE duruyor.
 *
 * Eskiden app/not-found.tsx idi: kok duzeyde oldugu icin (site)/layout.tsx'in
 * disinda kaliyor ve 404 sayfasi header, footer ve gezinme olmadan
 * basiliyordu. Yanlis bir adrese dusen ziyaretci "site coktu" hissiyle
 * kaliyordu, oysa tek ihtiyaci menuydu.
 *
 * min-h-screen kaldirildi: artik ustunde header, altinda footer var; tam
 * ekran yukseklik bos bir kaydirma seridi birakirdi.
 */
export default function BulunamadiSayfasi() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display tabular text-[length:var(--text-hero)] text-[var(--color-clay)]">
        404
      </p>
      <h1 className="font-display mt-4 text-[length:var(--text-title)]">
        Aradığınız sayfa bulunamadı.
      </h1>
      <p className="mt-4 max-w-md text-[var(--color-muted)]">
        Bağlantı taşınmış veya silinmiş olabilir.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block bg-[var(--color-navy)] px-8 py-4 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
