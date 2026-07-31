import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yönetim Paneli",
  // Panelin arama motorlarinda cikmasi icin hicbir sebep yok.
  robots: { index: false, follow: false },
};

/**
 * Admin bolumu, public sitenin (site) route grubunun DISINDA yer aliyor.
 * Bu sayede site header/footer'ini miras almiyor ve panelin kendi sade
 * kabugu kullaniliyor.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[var(--color-paper)]">{children}</div>;
}
