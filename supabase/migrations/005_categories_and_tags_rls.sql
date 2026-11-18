-- ==============================================================================
-- MIGRACIÓN 005: Categorías y Etiquetas Personalizadas con RLS (HU-08)
-- Tablas: categories, tags, document_tags
-- Integración: Supabase Auth, PostgreSQL RLS y aislamiento estricto multi-tenant
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA CATEGORIES Y POLÍTICAS RLS
-- Permite categorías predeterminadas del sistema (usuario_id IS NULL)
-- y categorías personalizadas por usuario (usuario_id = auth.uid())
-- ------------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  usuario_id uuid references auth.users on delete cascade,
  nombre text not null,
  color text not null default '#3b82f6',
  icono text default 'Tag',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS en categories
alter table public.categories enable row level security;

-- Privilegios de tabla al rol authenticated
grant select, insert, update, delete on table public.categories to authenticated;

-- Política SELECT: Ver categorías globales del sistema o las creadas por el propio usuario
drop policy if exists "Usuarios leen categorias del sistema o propias" on public.categories;
create policy "Usuarios leen categorias del sistema o propias"
  on public.categories for select
  using (usuario_id is null or auth.uid() = usuario_id);

-- Política INSERT: Los usuarios solo pueden insertar categorías asignadas a su propio usuario_id
drop policy if exists "Usuarios crean solo sus propias categorias" on public.categories;
create policy "Usuarios crean solo sus propias categorias"
  on public.categories for insert
  with check (auth.uid() = usuario_id);

-- Política UPDATE: Los usuarios solo pueden modificar sus propias categorías (no las del sistema)
drop policy if exists "Usuarios actualizan solo sus propias categorias" on public.categories;
create policy "Usuarios actualizan solo sus propias categorias"
  on public.categories for update
  using (auth.uid() = usuario_id);

-- Política DELETE: Los usuarios solo pueden eliminar sus propias categorías
drop policy if exists "Usuarios eliminan solo sus propias categorias" on public.categories;
create policy "Usuarios eliminan solo sus propias categorias"
  on public.categories for delete
  using (auth.uid() = usuario_id);

-- Semilla de Categorías Predeterminadas del Sistema (usuario_id = NULL)
insert into public.categories (id, usuario_id, nombre, color, icono)
values
  ('cat-1', null, 'Facturas', '#3b82f6', 'Receipt'),
  ('cat-2', null, 'Legal', '#8b5cf6', 'Scale'),
  ('cat-3', null, 'Identificaciones', '#10b981', 'UserCheck'),
  ('cat-4', null, 'Garantías', '#f59e0b', 'Shield'),
  ('cat-5', null, 'Nóminas', '#ec4899', 'CreditCard')
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 2. TABLA TAGS Y POLÍTICAS RLS
-- Etiquetas personalizadas creadas por cada usuario
-- ------------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users on delete cascade not null default auth.uid(),
  nombre text not null,
  color text not null default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Restricción única para evitar etiquetas duplicadas por usuario
alter table public.tags drop constraint if exists tags_usuario_id_nombre_key;
alter table public.tags add constraint tags_usuario_id_nombre_key unique (usuario_id, nombre);

-- Habilitar RLS en tags
alter table public.tags enable row level security;

-- Privilegios de tabla al rol authenticated
grant select, insert, update, delete on table public.tags to authenticated;

-- Política SELECT: Los usuarios solo pueden ver sus propias etiquetas
drop policy if exists "Usuarios ven sus propias etiquetas" on public.tags;
create policy "Usuarios ven sus propias etiquetas"
  on public.tags for select
  using (auth.uid() = usuario_id);

-- Política INSERT: Los usuarios solo pueden insertar etiquetas con su usuario_id
drop policy if exists "Usuarios crean sus propias etiquetas" on public.tags;
create policy "Usuarios crean sus propias etiquetas"
  on public.tags for insert
  with check (auth.uid() = usuario_id);

-- Política UPDATE: Los usuarios solo pueden modificar sus propias etiquetas
drop policy if exists "Usuarios modifican sus propias etiquetas" on public.tags;
create policy "Usuarios modifican sus propias etiquetas"
  on public.tags for update
  using (auth.uid() = usuario_id);

-- Política DELETE: Los usuarios solo pueden eliminar sus propias etiquetas
drop policy if exists "Usuarios eliminan sus propias etiquetas" on public.tags;
create policy "Usuarios eliminan solo sus propias etiquetas"
  on public.tags for delete
  using (auth.uid() = usuario_id);

-- ------------------------------------------------------------------------------
-- 3. TABLA INTERMEDIA DOCUMENT_TAGS (Relación N a N)
-- Asocia documentos y etiquetas asegurando aislamiento estricto
-- ------------------------------------------------------------------------------
create table if not exists public.document_tags (
  documento_id uuid references public.documents on delete cascade not null,
  etiqueta_id uuid references public.tags on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (documento_id, etiqueta_id)
);

-- Habilitar RLS en document_tags
alter table public.document_tags enable row level security;

-- Privilegios de tabla al rol authenticated
grant select, insert, update, delete on table public.document_tags to authenticated;

-- Política SELECT: Ver solo etiquetas de documentos que pertenezcan al usuario
drop policy if exists "Usuarios leen etiquetas de sus documentos" on public.document_tags;
create policy "Usuarios leen etiquetas de sus documentos"
  on public.document_tags for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = documento_id and d.usuario_id = auth.uid()
    )
  );

-- Política INSERT: Insertar etiquetas solo en documentos propios y con etiquetas propias
drop policy if exists "Usuarios asocian etiquetas a sus documentos" on public.document_tags;
create policy "Usuarios asocian etiquetas a sus documentos"
  on public.document_tags for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = documento_id and d.usuario_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = etiqueta_id and t.usuario_id = auth.uid()
    )
  );

-- Política DELETE: Desvincular etiquetas solo de documentos propios
drop policy if exists "Usuarios desvinculan etiquetas de sus documentos" on public.document_tags;
create policy "Usuarios desvinculan etiquetas de sus documentos"
  on public.document_tags for delete
  using (
    exists (
      select 1 from public.documents d
      where d.id = documento_id and d.usuario_id = auth.uid()
    )
  );
