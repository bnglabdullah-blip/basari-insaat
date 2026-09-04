import Image from "next/image";

/**
 * Fotograf sarmalayicisi.
 *
 * Neden ayri bir bilesen: proje fotograflari admin panelinden yuklenir, yani
 * bir projenin kapak gorseli HER ZAMAN olmayabilir (yeni eklenmis, henuz
 * fotograf girilmemis). Bu durumda `next/image`'a bos src vermek calisma
 * zamani hatasi uretir. Burada tek noktada kontrol edilip desenli bir
 * yer tutucuya dusuyoruz — cagiran taraflarin hicbiri bunu dusunmek
 * zorunda kalmiyor.
 */
export default function Gorsel({
  src,
  alt,
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`placeholder-hatch flex h-full w-full items-center justify-center ${className}`}
        role="img"
        aria-label={`${alt} — görsel henüz eklenmedi`}
      >
        <span className="eyebrow select-none">Görsel yakında</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      // Her cagiran taraf gorseli konumlandirilmis bir kutuya koyuyor;
      // `fill` prop olarak disari acilmisti ama hicbir yerde false
      // verilmedi. Ayarlanabilir gorunup tek degeri olan bir secenek,
      // okuyana olmayan bir esneklik vaat eder.
      fill
      priority={priority}
      sizes={sizes}
      className={`object-cover ${className}`}
    />
  );
}
