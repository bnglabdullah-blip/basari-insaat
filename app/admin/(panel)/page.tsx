import { redirect } from "next/navigation";

/*
 * Ozet ekrani kaldirildi: iki sayidan ibaretti ve panelde yapilan is
 * neredeyse her zaman icerik duzenlemek.
 *
 * Rota yine de duruyor, silinmedi: eski yer imleri, panel logosu ve giris
 * sonrasi yonlendirme /admin'e bakiyor. Kaldirmak bunlarin hepsini 404'e
 * dusururdu; uc satirlik bir yonlendirme bu riski tamamen kaldiriyor.
 */
export default function Panel() {
  redirect("/admin/icerik");
}
