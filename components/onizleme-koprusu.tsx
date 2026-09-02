"use client";

import { useEffect } from "react";

/**
 * Panel onizlemesi ile site arasindaki kopru.
 *
 * Panelin `iframe`i icinde acilan site sayfasi bu bileseni calistirir ve
 * ust pencereyle iki yonlu konusur:
 *
 *   panel  -> site : {tip:"deger"}   forma yazildikca metni yerinde gunceller
 *   site   -> panel: {tip:"duzenle"} onizlemede tiklanip degistirilen metni
 *                                     formdaki alana yazar
 *
 * ONEMLI: bu bilesen HICBIR SEY KAYDETMEZ. Yaptigi tek is DOM'u ve formu
 * senkron tutmak; kalici degisiklik yalnizca panelde "Kaydet"e basildiginda,
 * mevcut icerikKaydetAction uzerinden olur. Onizleme kapatilirsa kaydedilmemis
 * her sey kaybolur - tarayicidaki bir metin kutusuna yazip vazgecmek gibi.
 *
 * Ayni sebeple: sayfa HTML'i saklanmiyor. Icerik veritabaninda ALAN olarak
 * duruyor, bilesenler onu her istekte yeniden basiyor. Burada duzenlenen sey
 * ekrandaki HTML degil, o alanin degeri.
 */

/** Sunucudan gelen ayar anahtarlarinin adlari. Sadece bunlar kabul edilir. */
const GECERLI = /^[a-zA-Z0-9]+$/;

export default function OnizlemeKoprusu() {
  useEffect(() => {
    /*
     * Yalnizca panelin cercevesi icinde calisir. Ziyaretci siteyi normal
     * actiginda (window.self === window.top) hicbir sey baglanmaz; yonetici
     * giris yapmis olsa bile kendi sitesinde gezerken metinler tiklandiginda
     * duzenlenebilir hale gelmez.
     */
    if (window.self === window.top) return;

    const kaynak = window.location.origin;
    const bul = (alan: string) =>
      Array.from(
        document.querySelectorAll<HTMLElement>(`[data-alan="${alan}"]`)
      );

    /** Metni yazar. Paragraf alanlarinda bos satirlar <p>'ye cevrilir. */
    function yaz(el: HTMLElement, deger: string) {
      if (el.dataset.alanTip === "paragraf") {
        el.replaceChildren(
          ...deger
            .split("\n\n")
            .filter((p) => p.trim())
            .map((p) => {
              const d = document.createElement("p");
              d.textContent = p;
              return d;
            })
        );
      } else {
        el.textContent = deger;
      }
    }

    /* ---------------- panel -> site ---------------- */

    function mesaj(e: MessageEvent) {
      if (e.origin !== kaynak) return; // baska bir siteden gelen mesaji dinleme
      const d = e.data;
      if (!d || d.tip !== "deger" || typeof d.alan !== "string") return;
      if (!GECERLI.test(d.alan)) return;
      bul(d.alan).forEach((el) => yaz(el, String(d.deger ?? "")));
    }

    /* ---------------- site -> panel ---------------- */

    let acik: HTMLElement | null = null;

    function kapat() {
      acik?.removeAttribute("contenteditable");
      acik = null;
    }

    function tikla(e: MouseEvent) {
      const hedef = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-alan]"
      );
      // Onizlemede gezinme kapali: bir baglantiya tiklamak paneli baska bir
      // sayfaya goturur ve yazilanlar kaybolurdu.
      e.preventDefault();
      e.stopPropagation();
      if (hedef === acik) return;
      kapat();
      if (!hedef) return;
      acik = hedef;
      hedef.setAttribute("contenteditable", "true");
      hedef.focus();
    }

    function yazildi(e: Event) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-alan]"
      );
      if (!el?.dataset.alan) return;
      /*
       * innerText, innerHTML DEGIL: forma HTML degil duz metin gitmeli.
       * Ayrica innerText paragraf araligini satir sonuna cevirdigi icin
       * hakkindaMetin gibi cok paragrafli alanlar dogru bicimde geri doner.
       */
      window.parent.postMessage(
        { tip: "duzenle", alan: el.dataset.alan, deger: el.innerText },
        kaynak
      );
    }

    function tus(e: KeyboardEvent) {
      if (e.key === "Escape") kapat();
    }

    window.addEventListener("message", mesaj);
    document.addEventListener("click", tikla, true);
    document.addEventListener("input", yazildi);
    document.addEventListener("keydown", tus);

    document.documentElement.dataset.onizleme = "acik";

    /*
     * Panele "dinlemeye hazirim" haberi.
     *
     * Panelin iframe `load` olayini beklemesi YETMEZ: o olay belgenin
     * yuklendigini soyler, React'in hidrate olup bu dinleyicileri bagladigini
     * degil. Load aninda gonderilen degerler dinleyici daha yokken gelir ve
     * sessizce dusar. El sikismayi hazir olan taraf baslatiyor.
     */
    window.parent.postMessage({ tip: "hazir" }, kaynak);

    return () => {
      window.removeEventListener("message", mesaj);
      document.removeEventListener("click", tikla, true);
      document.removeEventListener("input", yazildi);
      document.removeEventListener("keydown", tus);
      delete document.documentElement.dataset.onizleme;
      kapat();
    };
  }, []);

  // Duzenlenebilir alanlarin nerede oldugunu gosteren isaretler. Yalnizca
  // onizleme baglandiginda (html[data-onizleme]) devreye girer.
  return (
    <style>{`
      [data-onizleme] [data-alan] {
        outline: 1px dashed transparent;
        outline-offset: 3px;
        cursor: text;
        transition: outline-color .12s;
      }
      [data-onizleme] [data-alan]:hover { outline-color: rgba(180,83,60,.55); }
      [data-onizleme] [data-alan][contenteditable="true"] {
        outline: 2px solid var(--color-clay, #b4533c);
        outline-offset: 3px;
      }
    `}</style>
  );
}
