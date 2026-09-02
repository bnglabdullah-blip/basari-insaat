"use client";

import { useEffect, useRef, useState } from "react";
import { VARSAYILAN } from "@/lib/icerik";

/**
 * Bolunmus icerik ekrani: solda form, sagda sitenin canli onizlemesi.
 *
 * Iki yonlu calisir. Forma yazildikca onizleme guncellenir; onizlemede bir
 * metne tiklanip degistirildiginde formdaki alan guncellenir. Kaydet'e
 * basilana kadar hicbiri kalici degil.
 *
 * Form DOM uzerinden dinleniyor, React state'i uzerinden degil. Sebebi:
 * IcerikFormu KONTROLSUZ bir form (alanlar `defaultValue` ile basiliyor,
 * degerleri gonderim aninda FormData okuyor). Boyle bir formda `input.value`
 * dogrudan atanabilir; React'in haberi olmasi gerekmez, cunku degeri React
 * tutmuyor. Formu kontrollu hale getirmek her alan icin state, her tusa
 * basista yeniden render ve IcerikFormu'nun bastan yazilmasi demekti.
 */

const ONIZLEME_SAYFALARI = [
  { yol: "/", ad: "Ana sayfa" },
  { yol: "/hakkimizda", ad: "Hakkımızda" },
  { yol: "/iletisim", ad: "İletişim" },
  { yol: "/sirket-bilgilerimiz", ad: "Şirket bilgileri" },
];

const GENISLIKLER = [
  { px: 390, ad: "Mobil" },
  { px: 820, ad: "Tablet" },
  { px: 0, ad: "Tam" },
];

/** Panelden gecerli sayilan alan adlari — onizlemeden gelen her sey degil. */
const ALANLAR = new Set(Object.keys(VARSAYILAN));

export default function IcerikDuzenleyici({
  children,
}: {
  children: React.ReactNode;
}) {
  const sarmalayici = useRef<HTMLDivElement>(null);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const [sayfa, setSayfa] = useState("/");
  const [genislik, setGenislik] = useState(0);

  /* ---------------- form -> onizleme ---------------- */

  useEffect(() => {
    const kok = sarmalayici.current;
    if (!kok) return;

    function degisti(e: Event) {
      const alan = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!alan?.name || !ALANLAR.has(alan.name)) return;
      cerceve.current?.contentWindow?.postMessage(
        { tip: "deger", alan: alan.name, deger: alan.value },
        window.location.origin
      );
    }

    // Yakalama asamasinda degil, normal kabarma ile: form alanlarinin
    // hepsi bu dugumun altinda.
    kok.addEventListener("input", degisti);
    return () => kok.removeEventListener("input", degisti);
  }, []);

  /* ---------------- onizleme -> form ---------------- */

  useEffect(() => {
    /**
     * Formdaki TUM degerleri cerceveye basar.
     *
     * Onizleme sayfasi degistirildiginde sunucu veritabanindaki KAYITLI
     * degerleri render eder; kaydedilmemis duzenlemeler onizlemede geri
     * alinmis gibi gorunur, formda ise durmaya devam ederdi. Kullanicinin
     * neyin gecerli oldugunu bilemedigi en kotu durum bu.
     */
    function hepsiniGonder(pencere: Window) {
      sarmalayici.current
        ?.querySelectorAll<HTMLInputElement>("[name]")
        .forEach((alan) => {
          if (!ALANLAR.has(alan.name)) return;
          pencere.postMessage(
            { tip: "deger", alan: alan.name, deger: alan.value },
            window.location.origin
          );
        });
    }

    function mesaj(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (!d) return;

      // Cerceve dinlemeye hazir olduğunu bildirdi (iframe'in load olayi bunun
      // icin guvenilir degil — bkz. onizleme-koprusu.tsx).
      if (d.tip === "hazir") {
        const pencere = cerceve.current?.contentWindow;
        if (pencere) hepsiniGonder(pencere);
        return;
      }

      if (d.tip !== "duzenle" || typeof d.alan !== "string") return;
      if (!ALANLAR.has(d.alan)) return;

      const alan = sarmalayici.current?.querySelector<HTMLInputElement>(
        `[name="${d.alan}"]`
      );
      if (!alan) return;
      alan.value = String(d.deger ?? "");
    }

    window.addEventListener("message", mesaj);
    return () => window.removeEventListener("message", mesaj);
  }, []);

  return (
    <div
      ref={sarmalayici}
      className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div>{children}</div>

      {/* Onizleme genis ekranda sabit kalir: form uzun, asagi kaydirirken
          sitenin gozden kaybolmasi bu ekranin tum anlamini yok ederdi. */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <div className="flex flex-wrap items-center gap-3 border border-[var(--color-rule)] border-b-0 bg-white px-4 py-3">
            <select
              value={sayfa}
              onChange={(e) => setSayfa(e.target.value)}
              aria-label="Önizlenecek sayfa"
              className="border border-[var(--color-rule)] px-2 py-1.5 text-sm"
            >
              {ONIZLEME_SAYFALARI.map((s) => (
                <option key={s.yol} value={s.yol}>
                  {s.ad}
                </option>
              ))}
            </select>

            <div className="ml-auto flex gap-1">
              {GENISLIKLER.map((g) => (
                <button
                  key={g.px}
                  type="button"
                  onClick={() => setGenislik(g.px)}
                  className={`px-2.5 py-1.5 text-xs transition-colors ${
                    genislik === g.px
                      ? "bg-[var(--color-navy)] text-white"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-paper)]"
                  }`}
                >
                  {g.ad}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[calc(100vh-11rem)] overflow-hidden border border-[var(--color-rule)] bg-white">
            <iframe
              ref={cerceve}
              src={sayfa}
              title="Site önizlemesi"
              className="h-full border-0 bg-white"
              style={
                genislik ? { width: genislik, margin: "0 auto" } : { width: "100%" }
              }
            />
          </div>

          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Önizlemedeki kesikli çerçeveli metinlere tıklayıp doğrudan
            düzenleyebilirsiniz. Değişiklikler <strong>Kaydet</strong>e
            basılana kadar kalıcı değildir.
          </p>
        </div>
      </aside>
    </div>
  );
}
