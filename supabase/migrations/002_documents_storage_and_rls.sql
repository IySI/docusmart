-- ==============================================================================
-- MIGRACIÓN 002: Base de Datos y Storage Seguro para DocuSmart (HU-01 y HU-02)
-- Tablas: users, documents
-- Storage: bucket privado 'documents' (25 MB max) + Políticas RLS completas
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA USERS Y SINCRONIZACIÓN AUTOMÁTICA
-- ------------------------------------------------------------------------------
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nombre_completo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.users enable row level security;

drop policy if exists "Los usuarios pueden ver su propio perfil" on public.users;
create policy "Los usuarios pueden ver su propio perfil"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.users;
create policy "Los usuarios pueden actualizar su propio perfil"
  on public.users for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. TABLA DOCUMENTS Y POLÍTICAS RLS (HU-02)
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users on delete cascade not null default auth.uid(),
  carpeta_id uuid, -- Reservado para HU-04
  categoria_id text default 'cat-1', -- Categoría por defecto
  nombre_archivo text not null,
  nombre_original text not null,
  tipo_mime text not null,
  extension text not null,
  tamano_bytes bigint not null,
  storage_path text not null,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS) en documents
alter table public.documents enable row level security;

-- Conceder privilegios de tabla al rol authenticated (prerrequisito para RLS)
grant select, insert, update, delete on table public.documents to authenticated;
grant select, update on table public.users to authenticated;
grant usage on schema public to authenticated;

-- Política SELECT: Los usuarios sólo pueden consultar sus propios documentos
drop policy if exists "Los usuarios pueden ver sus propios documentos" on public.documents;
create policy "Los usuarios pueden ver sus propios documentos"
  on public.documents for select
  using (auth.uid() = usuario_id);

-- Política INSERT: Los usuarios sólo pueden insertar documentos con su propio usuario_id
drop policy if exists "Los usuarios pueden insertar sus propios documentos" on public.documents;
create policy "Los usuarios pueden insertar sus propios documentos"
  on public.documents for insert
  with check (auth.uid() = usuario_id);

-- Política UPDATE: Los usuarios sólo pueden actualizar sus propios documentos
drop policy if exists "Los usuarios pueden actualizar sus propios documentos" on public.documents;
create policy "Los usuarios pueden actualizar sus propios documentos"
  on public.documents for update
  using (auth.uid() = usuario_id);

-- Política DELETE: Los usuarios sólo pueden eliminar sus propios documentos
drop policy if exists "Los usuarios pueden eliminar sus propios documentos" on public.documents;
create policy "Los usuarios pueden eliminar sus propios documentos"
  on public.documents for delete
  using (auth.uid() = usuario_id);

-- ------------------------------------------------------------------------------
-- 3. BUCKET PRIVADO 'documents' EN SUPABASE STORAGE Y POLÍTICAS RLS (HU-02)
-- ------------------------------------------------------------------------------
-- Crear o configurar bucket privado con límite de 25 MB y tipos MIME permitidos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400, -- 25 MB en bytes (25 * 1024 * 1024)
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

-- Políticas RLS sobre storage.objects para aislamiento por carpeta de usuario: <usuario_id>/<archivo>
drop policy if exists "Usuarios suben solo a su carpeta en documents" on storage.objects;
create policy "Usuarios suben solo a su carpeta en documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuarios leen solo sus archivos en documents" on storage.objects;
create policy "Usuarios leen solo sus archivos en documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuarios actualizan solo sus archivos en documents" on storage.objects;
create policy "Usuarios actualizan solo sus archivos en documents"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuarios eliminan solo sus archivos en documents" on storage.objects;
create policy "Usuarios eliminan solo sus archivos en documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
