import IcerikFormu from "@/components/admin/icerik-formu";
import { ayarlariGetir } from "@/lib/queries";

export default function IcerikSayfasi() {
  return (
    <>
      <h1 className="font-display text-3xl">İçerik</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        İletişim bilgileri ve site metinleri.
      </p>
      <IcerikFormu ayarlar={ayarlariGetir()} />
    </>
  );
}
