/**
 * Turkce metinden URL'e uygun slug uretir.
 *
 * DIKKAT — buradaki asil incelik:
 * Yaygin slug tarifi `normalize("NFD")` ile aksanlari ayirip silmektir.
 * Bu, o/u/s/g/c harflerinde calisir cunku hepsi "temel harf + birlesen
 * aksan" olarak ayrisir. ANCAK noktasiz i (U+0131) ayrisamayan, kendi
 * basina bagimsiz bir karakterdir. Yalnizca NFD'ye guvenen bir kod bu
 * harfi tamamen siler:
 *
 *     "Yapı Denetim"  ->  "yap-denetim"     (yanlis)
 *     "Kanalıcı"      ->  "kanal"           (yanlis)
 *
 * Bu yuzden Turkce'ye ozgu harfler NFD'den ONCE elle esleniyor.
 */

const TR_HARFLER: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

export function slugla(metin: string): string {
  return metin
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (h) => TR_HARFLER[h])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kalan birlesen aksanlari sil
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // harf/rakam disindaki her sey tire
    .replace(/^-+|-+$/g, "") // bas ve sondaki tireleri kirp
    .slice(0, 80);
}

/** Tarihi "12 Mart 2026, 14:30" bicimine cevirir. */
export function tarihBicimle(sqliteTarih: string): string {
  // SQLite datetime('now') UTC uretir ama sonunda "Z" yoktur; eklenmezse
  // tarayici bunu YEREL saat sanip saatleri kaydirir.
  return new Date(sqliteTarih.replace(" ", "T") + "Z").toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
