import IcerikDuzenleyici from "@/components/admin/icerik-duzenleyici";
import IcerikFormu from "@/components/admin/icerik-formu";
import ParolaFormu from "@/components/admin/parola-formu";
import { ayarlariGetir } from "@/lib/queries";

export default function IcerikSayfasi() {
  return (
    <>
      <h1 className="font-display text-3xl">İçerik</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        İletişim bilgileri ve site metinleri. Sağdaki önizleme yazdıkça
        güncellenir; metinlere tıklayıp doğrudan da düzenleyebilirsiniz.
      </p>

      {/* Parola formu onizlemenin DISINDA: sitede karsiligi olan bir icerik
          degil, ayri bir islem. */}
      <IcerikDuzenleyici>
        <IcerikFormu ayarlar={ayarlariGetir()} />
      </IcerikDuzenleyici>

      <ParolaFormu />
    </>
  );
}
