"use server";

import { mesajEkle } from "@/lib/queries";

export type FormDurum = { hata?: string; bilgi?: string };

/* --------------------------------------------------------------------------
   Hiz siniri — bellek ici, surec basina.
   Formun spam ile doldurulmasini engeller. Kalici bir depoya gerek yok:
   surec yeniden baslarsa sayac sifirlanir, en kotu ihtimalle birkac fazladan
   mesaj gelir.
   ponytail: bellek ici sayac, coklu kopyaya gecilirse paylasimli depoya tasinir.
   -------------------------------------------------------------------------- */
const gonderimler: number[] = [];
const PENCERE_MS = 10 * 60 * 1000;
const AZAMI = 20;

function hizSiniriAsildi(): boolean {
  const simdi = Date.now();
  // Penceredeki suresi dolmus kayitlari temizle
  while (gonderimler.length && simdi - gonderimler[0] > PENCERE_MS) {
    gonderimler.shift();
  }
  if (gonderimler.length >= AZAMI) return true;
  gonderimler.push(simdi);
  return false;
}

export async function mesajGonderAction(
  _onceki: FormDurum,
  form: FormData
): Promise<FormDurum> {
  /*
   * Bal kupu (honeypot): "website" alani CSS ile gizli, gercek kullanici
   * onu goremez ve dolduramaz. Formlari otomatik dolduran botlar ise her
   * alani doldurma egilimindedir. Dolu geldiyse istegi sessizce basarili
   * gibi gosteriyoruz — bota reddedildigini soylemek, ona atlatilacak bir
   * kontrol oldugunu ogretmek olurdu.
   *
   * Uc satirlik bu kontrol, bir CAPTCHA'nin kullanicilara yukledigi surtunme
   * ve erisilebilirlik sorunu olmadan botlarin buyuk cogunlugunu keser.
   */
  if (String(form.get("website") ?? "")) {
    return { bilgi: "Mesajınız alındı. En kısa sürede size dönüş yapacağız." };
  }

  if (hizSiniriAsildi()) {
    return {
      hata: "Şu anda çok fazla istek alıyoruz. Lütfen biraz sonra tekrar deneyin veya telefonla ulaşın.",
    };
  }

  const ad = String(form.get("ad") ?? "").trim();
  const telefon = String(form.get("telefon") ?? "").trim();
  const eposta = String(form.get("eposta") ?? "").trim();
  const mesaj = String(form.get("mesaj") ?? "").trim();

  if (!ad) return { hata: "Adınızı girin." };
  if (!mesaj) return { hata: "Mesajınızı yazın." };
  if (!telefon && !eposta) {
    return {
      hata: "Size ulaşabilmemiz için telefon veya e-posta bilgilerinizden en az birini girin.",
    };
  }

  // Veritabanina yazilmadan once ust sinir: asiri uzun girdilerin diski
  // sismesini engeller.
  mesajEkle({
    ad: ad.slice(0, 120),
    telefon: telefon.slice(0, 40),
    eposta: eposta.slice(0, 160),
    mesaj: mesaj.slice(0, 4000),
  });

  return { bilgi: "Mesajınız alındı. En kısa sürede size dönüş yapacağız." };
}
