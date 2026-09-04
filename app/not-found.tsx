import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { VARSAYILAN } from "@/lib/icerik";
import { ayarlariGetir } from "@/lib/queries";
import Bulunamadi from "./(site)/not-found";

/**
 * HICBIR rotayla eslesmeyen adresler icin 404 (ornegin /rastgele-bir-adres).
 *
 * Neden hem burada hem (site)/not-found.tsx'te dosya var: Next, bir rota
 * grubunun icindeki not-found.tsx'i yalnizca O GRUBUN sayfalarindan atilan
 * notFound() cagrilari icin kullanir. Silinmis bir proje (/projeler/eski-slug)
 * oradan gecer ve header/footer'i (site)/layout.tsx'ten alir. Ama hicbir
 * segmentle eslesmeyen bir adres hangi gruba ait oldugu bilinemedigi icin KOK
 * duzeye duser; burada dosya olmazsa Next'in Ingilizce varsayilan 404'u basilir.
 *
 * Govde tekrarlanmiyor: (site)/not-found.tsx'teki bilesen aynen kullaniliyor,
 * yalnizca kabuk (header/footer) elle sariliyor.
 */
export default async function KokBulunamadi() {
  /*
   * ayarlariGetir burada patlarsa TUM 404 sayfasi coker; ustelik bu sayfa
   * derleme aninda /_not-found olarak on-uretiliyor, yani Supabase'e
   * ulasilamayan bir derleme build'i kirar. Varsayilana dusuyoruz:
   * lib/icerik.ts gercek iletisim bilgilerini tutuyor, yer tutucu degil.
   */
  let ayarlar = VARSAYILAN;
  try {
    ayarlar = await ayarlariGetir();
  } catch (hata) {
    console.error("[404] ayarlar okunamadi, varsayilana dusuldu:", hata);
  }

  return (
    <>
      <SiteHeader telefon={ayarlar.telefonSabit} />
      <main id="icerik">
        <Bulunamadi />
      </main>
      <SiteFooter ayarlar={ayarlar} />
    </>
  );
}
