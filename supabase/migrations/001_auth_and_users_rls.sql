-- ==============================================================================
-- MIGRACIÓN 001: Autenticación, Perfil de Usuario y Aislamiento por RLS (HU-01)
-- Proyecto: DocuSmart
-- ==============================================================================

-- 1. Crear tabla de perfiles de usuario en el esquema público
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nombre_completo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilitar Row-Level Security (RLS) para aislamiento estricto
alter table public.users enable row level security;

-- 3. Crear Políticas de Seguridad RLS
-- Política de Lectura: Cada usuario sólo puede leer su propio registro
create policy "Los usuarios pueden ver su propio perfil"
  on public.users
  for select
  using (auth.uid() = id);

-- Política de Actualización: Cada usuario sólo puede modificar su propio registro
create policy "Los usuarios pueden actualizar su propio perfil"
  on public.users
  for update
  using (auth.uid() = id);

-- 4. Función y Trigger automático para sincronizar auth.users con public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger disparado inmediatamente tras la creación de un usuario en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- PRUEBA DE AISLAMIENTO RLS (Verificación CA-01.3):
-- Ejecutar en SQL Editor de Supabase simulando un usuario:
-- 
-- SELECT auth.uid(); -- Identificador del usuario en sesión
-- SELECT * FROM public.users; -- Solo devolverá la fila donde id = auth.uid()
-- ==============================================================================
