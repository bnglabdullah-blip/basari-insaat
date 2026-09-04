-- Ilk sema: SQLite'tan Supabase Postgres'e gecis.
--
-- SQLite'taki halinden bilinçli farklar:
--   * mesajlar tablosu TASINMADI — ozellik kaldirildi, tablo olu.
--   * durum artik CHECK ile sinirli; SQLite'ta serbest metindi ve dogrulama
--     yalnizca uygulama katmanindaydi (actions.ts). Kaynak kod listesiyle
--     birebir ayni: planlama / devam / tamamlandi.
--   * yayinda INTEGER(0/1) yerine boolean — Postgres'te dogru tip bu.
--   * olusturma TEXT yerine timestamptz.

create table projeler (
  id        bigint generated always as identity primary key,
  slug      text        not null unique,
  baslik    text        not null,
  konum     text        not null default '',
  durum     text        not null default 'devam'
            check (durum in ('planlama', 'devam', 'tamamlandi')),
  yil       text        not null default '',
  ozet      text        not null default '',
  aciklama  text        not null default '',
  kapak     text,
  sira      integer     not null default 0,
  yayinda   boolean     not null default true,
  olusturma timestamptz not null default now()
);

-- Vitrin listesi hep "WHERE yayinda ORDER BY sira" seklinde okunuyor;
-- kismi index tam bu sorguyu karsiliyor.
create index idx_projeler_vitrin on projeler (sira) where yayinda;

create table proje_gorseller (
  id       bigint generated always as identity primary key,
  -- ON DELETE CASCADE: proje silinince gorselleri de gitsin. SQLite'ta bu,
  -- her baglantida pragma acmayi gerektiriyordu; Postgres'te hep acik.
  proje_id bigint  not null references projeler (id) on delete cascade,
  dosya    text    not null,
  sira     integer not null default 0
);

create index idx_gorsel_proje on proje_gorseller (proje_id, sira);

create table ayarlar (
  anahtar text primary key,
  deger   text not null
);

-- RLS her tabloda acik ama HICBIR policy yok: bu kasitli. Tum erisim sunucu
-- tarafindan service_role anahtariyla yapiliyor (RLS'i bypass eder). Policy
-- yazilmadigi icin anon/authenticated anahtarlar hicbir satiri goremez —
-- tarayici DB'ye zaten baglanmiyor, bu da yanlislikla baglanirsa gelen kilit.
alter table projeler enable row level security;
alter table proje_gorseller enable row level security;
alter table ayarlar enable row level security;
