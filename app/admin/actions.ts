"use server";

import { redirect } from "next/navigation";
import { cikisYap, girisYap } from "@/lib/auth";

export type GirisDurum = { hata?: string };

export async function girisAction(
  _onceki: GirisDurum,
  form: FormData
): Promise<GirisDurum> {
  const parola = String(form.get("parola") ?? "");
  if (!parola) return { hata: "Parola girin." };

  const sonuc = await girisYap(parola);
  if (!sonuc.ok) return { hata: sonuc.hata };

  // Dogrudan icerik ekranina: panelde yapilan is neredeyse her zaman bu.
  redirect("/admin/icerik");
}

export async function cikisAction(): Promise<void> {
  await cikisYap();
  redirect("/admin/giris");
}
