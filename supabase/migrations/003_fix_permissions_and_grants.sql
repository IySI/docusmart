-- ==============================================================================
-- CORRECCIÓN DE PRIVILEGIOS SQL (GRANTS) PARA DOCUSMART (HU-01 y HU-02)
-- Solución para el error: "permission denied for table documents"
-- ==============================================================================

-- 1. Garantizar acceso al esquema público para usuarios autenticados
grant usage on schema public to authenticated;

-- 2. Conceder privilegios de tabla al rol 'authenticated'
-- NOTA DE SEGURIDAD: Esto NO desactiva RLS. En PostgreSQL, GRANT otorga el permiso
-- a nivel de tabla y las políticas RLS restringen estrictamente qué filas puede
-- ver o insertar cada usuario (auth.uid() = usuario_id).
grant select, insert, update, delete on table public.documents to authenticated;

-- 3. Conceder privilegios sobre la tabla de perfiles de usuario
grant select, update on table public.users to authenticated;

-- 4. Revalidar que Row Level Security (RLS) permanece habilitado y activo
alter table public.documents enable row level security;
alter table public.users enable row level security;
