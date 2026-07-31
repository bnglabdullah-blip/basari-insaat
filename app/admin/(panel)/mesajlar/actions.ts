"use server";

import { revalidatePath } from "next/cache";
import { yetkiGerekli } from "@/lib/auth";
import { mesajOkunduIsaretle, mesajSil } from "@/lib/queries";

export async function okunduAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  const id = Number(form.get("id"));
  const okundu = form.get("okundu") === "1";
  mesajOkunduIsaretle(id, okundu);

  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin"); // özet sayfasındaki sayaç
}

export async function mesajSilAction(form: FormData): Promise<void> {
  await yetkiGerekli();

  mesajSil(Number(form.get("id")));

  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
}
