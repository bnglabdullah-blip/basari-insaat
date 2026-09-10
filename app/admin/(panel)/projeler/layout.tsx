/*
 * Proje ekranlarinin ortak govdesi.
 *
 * Bu sarmalayici eskiden (panel)/layout.tsx icindeydi; icerik duzenleyici tam
 * genislige ihtiyac duydugu icin oradan alinip yalnizca kullanan ekranlara
 * verildi. Uc proje sayfasini tek tek sarmak yerine ic ice bir layout: liste,
 * yeni ve duzenleme ekranlari kendiliginden ayni cerceveyi aliyor.
 */
export default function ProjelerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>;
}
