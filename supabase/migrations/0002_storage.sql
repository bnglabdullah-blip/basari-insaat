-- Proje fotograflari icin Storage bucket'i.
--
-- public = true: fotograflar zaten herkese acik site icerigi; imzasiz
-- /object/public/ URL'leriyle dogrudan servis edilir, CDN cache'lenir.
--
-- allowed_mime_types + file_size_limit SUNUCU tarafinda zorlaniyor:
-- istemci fotografi webp'ye cevirip kucultuyor ama istemciye guvenilmez —
-- imzali URL'i ele geciren biri 500MB'lik bir video yukleyemesin.
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values (
  'proje-gorselleri',
  'proje-gorselleri',
  true,
  array['image/webp'],
  2097152 -- 2MB
)
on conflict (id) do update set
  public             = excluded.public,
  allowed_mime_types = excluded.allowed_mime_types,
  file_size_limit    = excluded.file_size_limit;

-- storage.objects icin policy YOK (RLS Supabase tarafindan zaten acik):
-- okuma bucket'in public bayragiyla, yazma/silme yalnizca service_role ile
-- (RLS'i bypass eder). Imzali yukleme URL'leri de sunucuda service_role
-- istemcisiyle uretiliyor; anon anahtarla hicbir yazma yolu yok.
