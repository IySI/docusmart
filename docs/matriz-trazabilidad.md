# Matriz de Trazabilidad de Requisitos - DocuSmart

> **Proyecto**: DocuSmart  
> **Documento de Referencia**: [Documento Maestro](./documento-maestro.md) y [05 - Historias de Usuario](./05-historias-de-usuario.md)  
> **Última Actualización**: 2026-11-17  
> **Estado Global del Proyecto**: Desarrollo en Curso - 7 Historias Validadas (87.5%) / 1 En desarrollo (12.5%) / 0 Pendientes (0%)  

---

## 1. Definición de Estados del Ciclo de Vida

Cada historia de usuario en DocuSmart transita de forma controlada y secuencial por los siguientes cuatro estados:

| Estado | Significado Operativo | Criterio de Entrada | Criterio de Salida |
| :--- | :--- | :--- | :--- |
| **Pendiente** | La historia está especificada y priorizada, pero aún no se ha iniciado su implementación. | Aprobación de la especificación. | Autorización explícita del usuario para iniciar su desarrollo. |
| **En desarrollo** | Se está escribiendo el código, configurando endpoints, componentes o esquemas asociados. | Inicio del trabajo activo en la rama/módulo. | Código completado y ejecución preliminar de pruebas. |
| **Implementada** | La funcionalidad está codificada y pasa las pruebas técnicas locales (unitarias/integración). | Pruebas técnicas superadas y evidencias registradas. | Verificación de criterios de aceptación con el usuario y aprobación formal. |
| **Validada** | Los criterios de aceptación fueron contrastados rigurosamente y el usuario ha otorgado su aprobación final. | Aprobación explícita del usuario. | Lista para despliegue / Integrada al incremento del MVP. |

---

## 2. Resumen de Progreso

| Historia de Usuario | Título | Prioridad | Estado Actual | % Avance |
| :--- | :--- | :---: | :---: | :---: |
| **HU-01** | Autenticación y Aislamiento de Usuario | **Must have** | `Validada` | 100% |
| **HU-02** | Carga y Almacenamiento Seguro de Archivos | **Must have** | `Validada` | 100% |
| **HU-03** | Clasificación Inteligente y Sugerencias con IA | **Must have** | `Validada` | 100% |
| **HU-04** | Organización mediante Carpetas Jerárquicas | **Must have** | `Validada` | 100% |
| **HU-05** | Visualizador Integrado de Documentos | **Must have** | `Validada` | 100% |
| **HU-06** | Búsqueda y Filtros Rápidos en Tiempo Real | **Must have** | `Validada` | 100% |
| **HU-07** | Gestión del Archivo (Renombrar, Descargar y Eliminar) | **Must have** | `Validada` | 100% |
| **HU-08** | Gestión de Categorías y Etiquetas Personalizadas | **Should have** | `Validada` | 100% |

**Métricas Globales**:
- Total Historias: 8 (7 Must have, 1 Should have)
- Pendientes: 0 (0%) | En desarrollo: 0 (0%) | Implementadas: 0 (0%) | Validadas: 8 (100%)

> **Registro de Aprobación Formal del MVP Completo**: Las 8 historias de usuario (**HU-01**, **HU-02**, **HU-03**, **HU-04**, **HU-05**, **HU-06**, **HU-07** y **HU-08**) han sido formalmente validadas y aprobadas al 100% por el usuario tras la ejecución y superación rigurosa de todas sus pruebas reales de integración, autenticación, almacenamiento seguro con RLS, inferencia con Gemini Flash, organización jerárquica con protección anti-ciclos, visualización integrada con URLs firmadas temporales (15 min), búsqueda multicriterio con debounce y filtros combinados, gestión completa del archivo (renombrado con extensión protegida, descarga directa binaria, eliminación definitiva dual y actualización reactiva), y gestión de categorías y etiquetas personalizadas con persistencia relacional N:M y aislamiento multi-tenant.

---

## 3. Matriz Detallada de Trazabilidad (HU-01 a HU-08)

### HU-01: Autenticación y Aislamiento de Usuario
- **Prioridad**: `Must have`
- **Estado**: `Validada` (Aprobada por el usuario tras pruebas reales)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-01.1 (Registro Exitoso)**: Formulario con validación de correo y contraseña (mínimo 8 caracteres). Creación de registro en `auth.users` y sincronización con `public.users`.
  - [x] **CA-01.2 (Validación y Errores en Español)**: Advertencias claras en español ante credenciales incorrectas o campos incompletos.
  - [x] **CA-01.3 (Aislamiento Estricto por RLS)**: Activación de Row-Level Security en PostgreSQL vinculando cada consulta al `usuario_id` del token JWT, imposibilitando el acceso a datos de otros usuarios.
- **Implementación Técnica Entregada**:
  - `src/lib/supabase/`: Clientes SSR para navegador, servidor y middleware.
  - `src/app/(auth)/login/page.tsx` y `register/page.tsx`: Pantallas de autenticación.
  - `src/middleware.ts`: Protección de rutas privadas y refresco de sesiones.
  - Migración SQL `001_auth_and_users_rls.sql` y `003_fix_permissions_and_grants.sql`.
- **Evidencias de Verificación**:
  - **Prueba de Registro e Inicio de Sesión**: Ejecutada satisfactoriamente con usuarios reales.
  - **Prueba de Rutas Protegidas**: Intento de acceso a `/` sin sesión redirige con HTTP 307 a `/login`.
  - **Prueba de Aislamiento**: Sesión activa con dos usuarios distintos confirmando aislamiento estricto de datos.

---

### HU-02: Carga y Almacenamiento Seguro de Archivos
- **Prioridad**: `Must have`
- **Estado**: `Validada` (Aprobada por el usuario tras pruebas reales)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-02.1 (Subida Válida)**: Admisión y almacenamiento en bucket privado `documents` de archivos PDF, Word e imágenes $\le$ 25 MB y registro de metadatos en tabla `documents`.
  - [x] **CA-02.2 (Rechazo y Alertas Amigables)**: Detección y bloqueo inmediato de formatos no permitidos o pesos mayores a 25 MB.
- **Implementación Técnica Entregada**:
  - `src/lib/storage/index.ts`: Funciones `uploadDocument`, `validateDocumentFile` y `fetchUserDocuments`.
  - `src/components/upload/UploadModal.tsx`: Modal interactivo de subida conectado a Supabase Storage.
  - `src/app/page.tsx`: Explorador dinámico que consulta y muestra los documentos reales del usuario autenticado.
  - Migración SQL `002_documents_storage_and_rls.sql` y `003_fix_permissions_and_grants.sql`.
- **Evidencias de las Seis Pruebas Reales (P1 - P6)**:
  - **P1: Registro Usuario A**: Completado exitosamente en `/register`.
  - **P2: Subida de PDF Válida**: Archivo PDF almacenado en bucket privado `documents` y visible en el explorador.
  - **P3: Rechazo de Formato**: Archivo no permitido rechazado con alerta clara en español.
  - **P4: Rechazo por Peso > 25 MB**: Validación de tamaño comprobada impidiendo la subida.
  - **P5: Aislamiento Usuario B**: Usuario B solo ve su propio espacio vacío; cero visibilidad de archivos de Usuario A.
  - **P6: Protección RLS en Storage**: Reglas de Storage RLS comprobadas impidiendo acceso directo a archivos ajenos.

---

### HU-03: Clasificación Inteligente y Sugerencias con IA
- **Prioridad**: `Must have`
- **Estado**: `Validada` (Aprobación explícita del usuario tras comprobación de todos los criterios y pruebas funcionales/seguridad)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-03.1 (Inferencia Rápida Gemini Flash)**: Procesamiento del documento/imagen en un tiempo récord de ~1.2 segundos (< 4 s) con sugerencia de categoría exacta y entre 2 y 5 etiquetas relevantes en JSON estructurado.
  - [x] **CA-03.2 (Soberanía y Edición del Usuario)**: Presentación de sugerencias en tarjeta interactiva `AiSuggestionCard` con opciones de «Aceptar sugerencia» (aplicación en 1 clic) o modificación manual de categoría antes de confirmar.
  - [x] **CA-03.3 (Degradación Elegante)**: Verificado tanto sin API Key como ante contingencias: el sistema habilita la selección manual sin bloquear la subida ni generar errores HTTP 500.
- **Implementación Técnica Entregada**:
  - `src/lib/ai/gemini-client.ts`: Cliente de inferencia con Google Gemini Flash (`gemini-3.1-flash-lite` y fallback a `gemini-flash-lite-latest`) con JSON Schema estricto.
  - `src/app/api/ai/classify/route.ts`: Endpoint de servidor protegido con sesión Supabase Auth y control de latencia mediante AbortController.
  - `src/components/upload/AiSuggestionCard.tsx`: Tarjeta interactiva con indicadores de confianza, insignias de categoría, chips de tags y acciones aceptar/modificar.
  - `src/components/upload/UploadModal.tsx`: Integración reactiva del análisis en segundo plano y vinculación directa con el formulario de guardado.
- **Evidencias de Verificación y Pruebas Reales**:
  - **Prueba Unitaria y Heurística (3/3)**: Validación del catálogo de 5 categorías, reglas de degradación y aislamiento de API Key.
  - **Prueba Real Escenario 3 (Degradación Elegante)**: Comprobada por el usuario; la ausencia temporal de clave permite la clasificación manual inmediata.
  - **Prueba Real Escenario 1 (Inferencia Asistida)**: Comprobada por el usuario con documentos reales; respuesta estructurada en ~1.2 s con alta confianza.
  - **Prueba Real Escenario 2 (Soberanía de Edición)**: Comprobada la aceptación de sugerencias y la modificación manual de categorías y notas.
  - **Prueba de Seguridad**: Clave `GEMINI_API_KEY` alojada exclusivamente en el servidor sin filtración en las cabeceras ni el tráfico de red del cliente.

---

### HU-04: Organización mediante Carpetas Jerárquicas
- **Prioridad**: `Must have`
- **Estado**: `Validada` (100% - Aprobada formalmente por el usuario tras superar satisfactoriamente las 6 pruebas de verificación funcional y seguridad)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-04.1 (Creación de Carpeta y Subcarpetas)**: Creación instantánea de carpetas raíz y subcarpetas anidadas con actualización reactiva en árbol lateral y explorador principal.
  - [x] **CA-04.2 (Mover Documentos y Reorganización)**: Reasignación de `carpeta_id` mediante acción contextual "Mover a carpeta" o selección de carpeta destino en subida, con navegación fluida y reactiva.
  - [x] **CA-04.3 (Eliminación y Gestión Segura)**: Diálogo modal de advertencia al eliminar carpetas no vacías (desvinculando documentos a la raíz mediante `ON DELETE SET NULL` sin pérdida de datos) y prevención absoluta de referencias circulares.
- **Implementación Técnica Entregada**:
  - Migración SQL `004_folders_hierarchy_and_rls.sql`: Tabla `public.folders`, trigger PL/pgSQL anti-ciclos (`check_folder_hierarchy_cycles`), directivas RLS completas, `GRANT` para usuarios autenticados y clave foránea `fk_documents_carpeta` (`ON DELETE SET NULL`).
  - `src/lib/folders/index.ts`: Módulo de cliente/servidor para operaciones CRUD (`fetchUserFolders`, `createFolder`, `updateFolder`, `deleteFolder`, `moveDocumentToFolder`), construcción de árbol jerárquico recursivo (`buildFolderTree`), migas de pan (`getBreadcrumbTrail`) y cálculo de descendientes (`getDescendantFolderIds`).
  - `src/app/api/folders/route.ts` y `src/app/api/folders/[id]/route.ts`: Handlers REST con verificación de sesión y captura de errores de ciclo jerárquico.
  - `src/app/api/documents/[id]/route.ts`: Handler PATCH para actualizar `carpeta_id` y reubicar archivos.
  - `src/components/explorer/Sidebar.tsx`: Árbol recursivo multinivel con creación, edición de color/nombre y eliminación en vivo.
  - `src/components/explorer/FolderModal.tsx`: Diálogo interactivo para creación y renombramiento con paleta de 7 colores y selección de carpeta padre.
  - `src/components/explorer/MoveDocumentModal.tsx`: Modal para reubicar documentos entre carpetas o hacia la raíz.
  - `src/components/explorer/DeleteFolderDialog.tsx`: Diálogo modal de confirmación con advertencia de desvinculación a raíz.
  - `src/components/upload/UploadModal.tsx`: Selector de carpeta de destino al subir documentos.
  - `src/app/page.tsx`: Integración completa de navegación por migas de pan (*breadcrumbs*), filtrado jerárquico y tarjetas de subcarpetas.
- **Evidencias de Verificación y Pruebas Reales (6/6 Superadas)**:
  - **Prueba Real P1 (Creación de Carpeta Raíz y Subcarpeta)**: Comprobada por el usuario. Creación fluida de carpetas principales y subcarpetas anidadas en el árbol lateral.
  - **Prueba Real P2 (Navegación y Breadcrumbs)**: Comprobada por el usuario. Navegación fluida por la jerarquía mediante la barra interactiva `Inicio > Carpeta > Subcarpeta` y actualización del explorador.
  - **Prueba Real P3 (Mover Documento a Carpeta)**: Comprobada por el usuario. Reubicación de archivos existentes mediante el modal contextual y actualización de contadores de documentos.
  - **Prueba Real P4 (Subida Directa a Carpeta)**: Comprobada por el usuario. Selección de carpeta en el modal de subida y almacenamiento inmediato en la ubicación indicada.
  - **Prueba Real P5 (Prevención de Ciclos Jerárquicos)**: Comprobada por el usuario. Bloqueo en UI y a nivel de base de datos con el trigger anti-ciclos ante intentos de mover una carpeta dentro de sí misma o de sus subcarpetas.
  - **Prueba Real P6 (Eliminación Segura y Preservación de Archivos)**: Comprobada por el usuario. Al borrar una carpeta contenedora, los documentos se reubican automáticamente en la raíz (`ON DELETE SET NULL`) sin pérdida de datos.

---

### HU-05: Visualizador Integrado de Documentos
- **Prioridad**: `Must have`
- **Estado**: `Validada` (100% - Aprobada formalmente por el usuario tras superar satisfactoriamente las 5 pruebas de verificación funcional y seguridad)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-05.1 (Visor de PDF e Imágenes con URL Firmada)**: Apertura de visor modal con URL firmada temporal de 15 minutos, visor PDF nativo embebido, controles de zoom para imágenes (50% a 200%) y panel lateral con metadatos completos.
  - [x] **CA-05.2 (Documentos Word .docx)**: Renderizado de previsualización web ligera mediante conversión HTML en cliente con `mammoth`, con fallback y acceso directo a descarga protegida.
  - [x] **CA-05.3 (Navegación entre Documentos y Estados de Error)**: Opciones para abrir, cerrar (tecla Esc o botón X), avanzar o retroceder (`[← Anterior]` / `[Siguiente →]` o flechas de teclado) entre documentos, con retroalimentación clara ante formatos no compatibles o reintento de carga.
- **Implementación Técnica Entregada**:
  - `src/app/api/documents/[id]/signed-url/route.ts`: Endpoint seguro con verificación de sesión y RLS para generar URLs firmadas temporales (TTL 900 s / 15 min) desde el bucket privado de Supabase Storage.
  - `src/lib/storage/index.ts`: Función cliente/servidor `fetchDocumentSignedUrl` para solicitar URLs firmadas temporales con control de errores.
  - `src/components/viewer/DocumentViewerModal.tsx`: Visor modal completo con renderizado nativo de PDF en iframe, visualizador escalable de imágenes con zoom, conversor web de Word (`.docx`) mediante `mammoth`, navegación interactiva entre documentos con contador `X de N`, panel de metadatos (carpeta, categoría, etiquetas, notas, peso, fecha) y manejo amigable de errores.
  - `src/app/page.tsx`: Integración del visor con navegación activa por la lista de documentos (`documentsList={filteredDocuments}` y `onSelectDocument={setPreviewDocument}`).
- **Evidencias de Verificación y Pruebas Reales (5/5 Superadas)**:
  - **Prueba Real P1 (Visualización de PDF Real)**: Comprobada por el usuario. Carga fluida de documento PDF mediante URL firmada en contenedor embebido nativo con controles de lectura y enlace para abrir en nueva pestaña.
  - **Prueba Real P2 (Visualización de Imágenes con Zoom)**: Comprobada por el usuario. Apertura de imagen (JPG/PNG), controles de zoom (50% a 200%), restablecimiento al 100% y ajuste visual fluido.
  - **Prueba Real P3 (Vista Previa de Word .docx)**: Comprobada por el usuario. Conversión de texto a vista previa web con `mammoth` y opción de descarga segura protegida.
  - **Prueba Real P4 (Navegación entre Documentos)**: Comprobada por el usuario. Desplazamiento fluido entre archivos con botones `[Anterior]` / `[Siguiente]` y atajos de teclado (`←` / `→` / `Esc`).
  - **Prueba Real P5 (Aislamiento y Metadatos Seguros)**: Comprobada por el usuario. Panel lateral con metadatos exactos (carpeta, tamaño, categoría, notas) y garantía de URL firmada temporal de 15 minutos con RLS.

---

### HU-06: Búsqueda y Filtros Rápidos en Tiempo Real
- **Prioridad**: `Must have`
- **Estado**: `Validada` (100% - Aprobada formalmente por el usuario tras superar satisfactoriamente las 6 pruebas de verificación funcional y seguridad)
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-06.1 (Búsqueda Reactiva por Nombre y Metadatos con Debounce)**: Filtrado dinámico por coincidencia en nombre de archivo, nombre original o notas tras 300 ms de inactividad de teclado mediante `useDebounce`.
  - [x] **CA-06.2 (Filtros Compuestos por Formato, Categoría y Fecha)**: Combinación simultánea de filtros por formato (`PDF`, `DOCX`, `IMG`), categoría y rango de fechas (7 días, 30 días, este año), devolviendo intersección exacta.
  - [x] **CA-06.3 (Actualización Dinámica, Limpieza y Manejo de Estados Vacíos)**: Contador reactivo de resultados, barra de chips de filtros activos con remoción individual `(x)`, botón para restablecer todos los filtros y pantalla amigable `SearchX` ante búsquedas sin resultados.
- **Implementación Técnica Entregada**:
  - `src/hooks/useDebounce.ts`: Hook utilitario de retardo a 300 ms para optimizar la entrada por teclado y evitar cálculos redundantes.
  - `src/app/api/documents/search/route.ts`: Endpoint backend seguro con Supabase Auth y RLS para consultas complejas con soporte de parámetros `q`, `formato`, `categoria_id`, `carpeta_id` y `fecha`.
  - `src/components/explorer/TopBar.tsx`: Barra superior con input de búsqueda reactivo, botón de limpieza inmediata `(X)`, chips de formato, selector de categorías y selector de fecha.
  - `src/app/page.tsx`: Motor de filtrado reactivo compuesto en cliente, integración con `useDebounce(searchQuery, 300)`, barra de chips de filtros activos con remoción individual y botón «Restablecer Filtros».
  - `src/components/explorer/EmptyState.tsx`: Estado vacío explicativo `SearchX` ante búsquedas o combinaciones sin resultados con acción de restablecimiento en 1 clic.
- **Evidencias de Verificación y Pruebas Reales (6/6 Superadas)**:
  - **Prueba Real P1 (Búsqueda por Nombre y Metadatos)**: Comprobada por el usuario. Filtrado reactivo en 300 ms buscando por nombre de archivo, notas o etiquetas.
  - **Prueba Real P2 (Filtro por Formato y Categoría)**: Comprobada por el usuario. Combinación precisa de formato (PDF, Word, Imágenes) y categoría asignada.
  - **Prueba Real P3 (Filtro por Rango Temporal)**: Comprobada por el usuario. Filtrado efectivo por fechas (Últimos 7 días, Últimos 30 días, Este año).
  - **Prueba Real P4 (Combinación Simultánea y Pastillas de Filtro)**: Comprobada por el usuario. Intersección exacta de criterios y visualización de pastillas activas con remoción individual `(x)`.
  - **Prueba Real P5 (Búsqueda sin Resultados y Limpieza)**: Comprobada por el usuario. Despliegue de pantalla `EmptyState` explicativa y restauración inmediata de la lista completa con «Restablecer Filtros».
  - **Prueba Real P6 (Aislamiento y Seguridad RLS)**: Comprobada por el usuario. Consultas directas a la base de datos y al endpoint `/api/documents/search` restringidas estrictamente a los documentos del usuario autenticado.

---

### HU-07: Gestión del Archivo (Renombrar, Descargar y Eliminar)
- **Prioridad**: `Must have`
- **Estado**: `Validada` (100% - Aprobada formalmente por el usuario tras superar satisfactoriamente las 6 pruebas de verificación funcional y seguridad)
- **% Avance**: 100%
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-07.1 (Renombrar con Preservación de Extensión)**: Cambio de nombre visual y en base de datos conservando intacta la extensión original (`.pdf`, `.docx`, etc.) y tipo MIME.
  - [x] **CA-07.2 (Descarga Directa Segura)**: Disparo de descarga con cabecera `Content-Disposition: attachment` y nombre original del archivo mediante URL firmada de Supabase Storage.
  - [x] **CA-07.3 (Eliminación Completa Dual con Confirmación)**: Diálogo modal que tras confirmación elimina el registro en base de datos (`documents`) y el objeto físico en el bucket de storage con actualización reactiva instantánea del explorador.
- **Implementación Técnica Entregada**:
  - `src/app/api/documents/[id]/route.ts`: Handlers `PATCH` (renombrar con preservación estricta de extensión) y `DELETE` (eliminación física en bucket `documents` y fila en tabla PostgreSQL con RLS).
  - `src/app/api/documents/[id]/signed-url/route.ts`: Soporte de parámetro `?download=true` para forzar descarga segura con nombre original (`Content-Disposition`).
  - `src/lib/storage/index.ts`: Funciones exportadas `renameDocument()`, `deleteDocument()` y `downloadDocumentFile()`.
  - `src/components/explorer/RenameDocumentModal.tsx`: Modal con separación visual de nombre base y extensión protegida, foco automático, botón de guardado y feedback de errores.
  - `src/components/explorer/DeleteDocumentModal.tsx`: Diálogo modal de advertencia destructiva con botón de cancelación por defecto y borrado permanente.
  - `src/components/explorer/DocumentActionsMenu.tsx`: Menú desplegable contextual accesible mediante el botón de tres puntos `(...)` con posicionamiento inteligente (evita recortes en bordes), `z-index: 50` y opciones (Previsualizar, Descargar, Renombrar, Mover, Eliminar).
  - `src/components/explorer/DocumentGrid.tsx` y `DocumentTable.tsx`: Integración de acciones directas de descarga, reubicación y menú de opciones completas con elevación de z-index al abrirse.
  - `src/components/viewer/DocumentViewerModal.tsx`: Descarga directa funcional integrada en el visor modal.
  - `src/app/page.tsx`: Gestión de estado de modales de renombrado y borrado, y actualización reactiva inmediata en la UI tras cada operación.
- **Evidencias de Verificación y Pruebas Reales (6/6 Superadas)**:
  - **Prueba Real P1 (Renombrado Exitoso y Preservación de Extensión)**: Comprobada por el usuario. Cambio de nombre en modal, persistencia en PostgreSQL (`public.documents`) y preservación estricta de la extensión original sin duplicaciones.
  - **Prueba Real P2 (Descarga Directa en el Navegador)**: Comprobada por el usuario. Obtención de URL firmada con cabecera de descarga forzada y descarga local del binario intacto.
  - **Prueba Real P3 (Cancelación Segura de Eliminación)**: Comprobada por el usuario. Cierre del modal destructivo sin alterar el archivo ni en la base de datos ni en el almacenamiento.
  - **Prueba Real P4 (Eliminación Definitiva Dual)**: Comprobada por el usuario. Eliminación simultánea del archivo físico en Supabase Storage (`documents/<usuario_id>/...`) y del registro en PostgreSQL.
  - **Prueba Real P5 (Actualización Reactiva sin F5)**: Comprobada por el usuario. Desaparición inmediata del documento borrado o actualización instantánea del nuevo nombre en la UI tanto en vista Cuadrícula como en Tabla.
  - **Prueba Real P6 (Aislamiento y Seguridad RLS)**: Comprobada por el usuario. Bloqueo estricto con HTTP 401/403 ante cualquier intento no autorizado o cruzado entre usuarios.

---

### HU-08: Gestión de Categorías y Etiquetas Personalizadas
- **Prioridad**: `Should have`
- **Estado**: `Validada` (100% - Aprobada formalmente por el usuario tras superar satisfactoriamente las 6 pruebas de verificación funcional y seguridad)
- **% Avance**: 100%
- **Criterios de Aceptación Comprobados**:
  - [x] **CA-08.1 (Catálogo y Creación de Categorías y Etiquetas)**: Creación, edición y eliminación de categorías personalizadas con paleta de colores, y creación de etiquetas en caliente con autocompletado y vinculación relacional N:M a documentos (`document_tags`).
  - [x] **CA-08.2 (Asignación, Filtros Dinámicos e Inferencia Asistida por IA)**: Filtrado reactivo por etiquetas y categorías en la barra lateral (`Sidebar`) y superior (`TopBar`), badges en cuadrícula y tabla, y sugerencia automática de taxonomía personalizada mediante Google Gemini Flash.
- **Implementación Técnica Entregada**:
  - `supabase/migrations/005_categories_and_tags_rls.sql`: Migración SQL con tablas `categories`, `tags`, `document_tags`, semillas del sistema (`cat-1` a `cat-5`), restricciones de unicidad y políticas RLS completas de aislamiento multi-tenant. Ejecutada exitosamente en Supabase.
  - `src/lib/categories/index.ts`: Servicios de consulta (`fetchCategories`), creación (`createCategory`), actualización (`updateCategory`), eliminación (`deleteCategory`) y fallback con categorías predeterminadas.
  - `src/lib/tags/index.ts`: Servicios para gestión de etiquetas de usuario (`fetchUserTags`), creación/reutilización (`createOrGetTag`), eliminación (`deleteTag`), mapeo N:M eficiente (`fetchAllDocumentTagsMap`) y sincronización atómica (`setDocumentTags`).
  - `src/app/api/categories/route.ts` y `src/app/api/categories/[id]/route.ts`: Endpoints protegidos con RLS para administración segura de categorías con reasignación en borrado.
  - `src/app/api/tags/route.ts` y `src/app/api/tags/[id]/route.ts`: Endpoints protegidos con RLS para creación, consulta y eliminación de etiquetas.
  - `src/app/api/documents/[id]/route.ts`: Sincronización automática de etiquetas en tabla `document_tags` al actualizar documentos.
  - `src/app/api/ai/classify/route.ts` y `src/lib/ai/gemini-client.ts`: Inyección dinámica de las categorías disponibles en el prompt de clasificación de Google Gemini Flash.
  - `src/components/tags/TagInput.tsx`: Componente interactivo para agregar/eliminar pastillas de etiquetas con tecla Enter, coma y autocompletado.
  - `src/components/categories/CategoryModal.tsx`: Diálogo modal para crear y editar categorías personalizadas con paleta visual de colores y eliminación segura.
  - `src/components/explorer/EditDocumentMetadataModal.tsx`: Diálogo modal para reasignar categoría y editar etiquetas de cualquier documento existente.
  - `src/components/explorer/Sidebar.tsx`: Integración completa de listado de categorías con badge "Propia", botón de edición rápida, acción "+ Crear categoría" y nube interactiva de etiquetas (#tags).
  - `src/components/explorer/TopBar.tsx`: Selector reactivo de categorías dinámicas.
  - `src/components/explorer/DocumentGrid.tsx` y `DocumentTable.tsx`: Badges de categorías con renderizado de colores hexadecimales, badges de etiquetas y opción "Categoría & Etiquetas..." en el menú de acciones.
  - `src/components/upload/UploadModal.tsx`: Integración de `TagInput` y asignación de etiquetas sugeridas por Gemini.
  - `src/components/viewer/DocumentViewerModal.tsx`: Visualización de categoría y etiquetas en el panel de metadatos con botón de edición directa.
  - `src/app/page.tsx`: Coordinación global de estado de categorías, etiquetas, mapa N:M relacional, filtros combinados y apertura de modales.
- **Evidencias de Verificación y Pruebas Reales (6/6 Superadas)**:
  - **Prueba Real P1 (Crear Categoría Personalizada)**: Comprobada satisfactoriamente por el usuario. Creación de categoría en modal con color personalizado, persistencia en tabla `categories` con RLS y despliegue inmediato en la barra lateral con la insignia *"Propia"*.
  - **Prueba Real P2 (Edición y Eliminación de Categoría)**: Comprobada satisfactoriamente por el usuario. Modificación reactiva de nombre/color y borrado seguro con desvinculación garantizada de documentos asociados (`ON DELETE SET NULL`), preservando la integridad de los archivos.
  - **Prueba Real P3 (Crear Etiquetas en Caliente y Asignar a Documento)**: Comprobada satisfactoriamente por el usuario. Entrada interactiva de etiquetas con `TagInput` (`#tags`), persistencia en tablas `tags` y `document_tags` y despliegue visual de pastillas en cuadrícula y tabla.
  - **Prueba Real P4 (Filtrado Combinado por Etiqueta y Categoría)**: Comprobada satisfactoriamente por el usuario. Filtrado reactivo en barra lateral y selector de barra superior, pastilla de filtro activo removible y sincronización instantánea del explorador.
  - **Prueba Real P5 (Clasificación Asistida con IA)**: Comprobada satisfactoriamente por el usuario. Análisis con Google Gemini Flash detectando taxonomía y precargando automáticamente categoría y etiquetas en el formulario de subida.
  - **Prueba Real P6 (Aislamiento y Seguridad RLS)**: Comprobada satisfactoriamente por el usuario. Verificación multi-tenant con usuarios distintos confirmando que las categorías y etiquetas de un usuario son completamente invisibles e inaccesibles para los demás.
