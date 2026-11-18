-- ==============================================================================
-- MIGRACIÓN 004: Carpetas Jerárquicas y Aislamiento RLS para DocuSmart (HU-04)
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA FOLDERS
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  parent_id uuid references public.folders(id) on delete cascade,
  nombre text not null,
  color_icono text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint chk_no_self_parent check (id <> parent_id)
);

-- 2. FUNCIÓN DE SEGURIDAD PARA EVITAR JERARQUÍAS CIRCULARES (ANTI-CICLOS)
create or replace function public.check_folder_hierarchy_cycles()
returns trigger as $$
declare
  curr_parent uuid;
  depth int := 0;
  max_depth int := 20; -- Límite de profundidad razonable
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'Una carpeta no puede ser padre de sí misma (id: %)', new.id;
  end if;

  curr_parent := new.parent_id;
  while curr_parent is not null loop
    depth := depth + 1;
    if depth > max_depth then
      raise exception 'Profundidad máxima de subcarpetas excedida o ciclo detectado';
    end if;

    select parent_id into curr_parent
    from public.folders
    where id = curr_parent and usuario_id = new.usuario_id;

    if curr_parent = new.id then
      raise exception 'Jerarquía circular no permitida: una carpeta no puede moverse dentro de sus propias subcarpetas';
    end if;
  end loop;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_folder_cycles on public.folders;
create trigger trg_check_folder_cycles
  before insert or update on public.folders
  for each row execute function public.check_folder_hierarchy_cycles();

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
alter table public.folders enable row level security;

drop policy if exists "Los usuarios pueden ver sus propias carpetas" on public.folders;
create policy "Los usuarios pueden ver sus propias carpetas"
  on public.folders for select
  using (auth.uid() = usuario_id);

drop policy if exists "Los usuarios pueden crear sus propias carpetas" on public.folders;
create policy "Los usuarios pueden crear sus propias carpetas"
  on public.folders for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "Los usuarios pueden actualizar sus propias carpetas" on public.folders;
create policy "Los usuarios pueden actualizar sus propias carpetas"
  on public.folders for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

drop policy if exists "Los usuarios pueden eliminar sus propias carpetas" on public.folders;
create policy "Los usuarios pueden eliminar sus propias carpetas"
  on public.folders for delete
  using (auth.uid() = usuario_id);

-- 4. PERMISOS EXPLÍCITOS PARA EL ROL AUTHENTICATED
grant select, insert, update, delete on table public.folders to authenticated;

-- 5. RELACIÓN FORÁNEA CON LA TABLA DOCUMENTS (ON DELETE SET NULL)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_documents_carpeta' and table_name = 'documents'
  ) then
    alter table public.documents
      add constraint fk_documents_carpeta
      foreign key (carpeta_id) references public.folders(id) on delete set null;
  end if;
end $$;

-- 6. ÍNDICES DE RENDIMIENTO PARA NAVEGACIÓN Y BÚSQUEDA
create index if not exists idx_folders_usuario on public.folders(usuario_id);
create index if not exists idx_folders_parent on public.folders(parent_id);
create index if not exists idx_documents_carpeta on public.documents(carpeta_id);
