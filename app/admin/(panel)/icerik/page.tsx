import IcerikDuzenleyici from "@/components/admin/icerik-duzenleyici";
import IcerikFormu from "@/components/admin/icerik-formu";
import ParolaFormu from "@/components/admin/parola-formu";
import { ayarlariGetir } from "@/lib/queries";

export default async function IcerikSayfasi() {
  return (
    <IcerikDuzenleyici>
      <IcerikFormu ayarlar={await ayarlariGetir()} />
      {/* Parola, sitede karsiligi olan bir icerik degil; ayri bir islem
          olarak rayin dibinde duruyor. Icerik formunun ICINE giremez:
          ic ice form gecersiz HTML. */}
      <div className="px-5 pb-12">
        <ParolaFormu />
      </div>
    </IcerikDuzenleyici>
  );
}
