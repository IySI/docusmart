# DocuSmart 📄✨

**DocuSmart** es una aplicación web moderna, ágil y segura diseñada para organizar y gestionar documentos personales y profesionales desde una interfaz intuitiva y limpia, potenciada con clasificación inteligente mediante Inteligencia Artificial.

---

## 🎯 Objetivos del Proyecto

- **Centralizar**: Terminar con la dispersión de archivos en múltiples dispositivos, correos y servicios locales.
- **Automatizar y Agilizar**: Reducir el tiempo dedicado al etiquetado y catalogación manual mediante sugerencias automáticas de IA.
- **Garantizar Privacidad y Seguridad**: Asegurar aislamiento estricto de información entre usuarios mediante políticas a nivel de base de datos y enlaces protegidos por firmas temporales.
- **Consultar sin Fricciones**: Permitir la previsualización directa en el navegador de documentos PDF, imágenes y archivos Word sin descargas obligatorias.

---

## 🚀 Funcionalidades Previstas (Alcance del MVP)

1. **Gestión de Archivos**:
   - Subida y almacenamiento seguro de archivos en formatos PDF, Word (`.docx`, `.doc`) e imágenes (`.png`, `.jpg`, `.jpeg`).
   - Ciclo de vida completo: previsualización, renombrado, descarga y eliminación con diálogo de confirmación.
2. **Organización Flexible**:
   - Creación de carpetas y subcarpetas jerárquicas.
   - Categorización taxonómica con colores y asignación dinámica de etiquetas (*tags*).
3. **Clasificación Asistida con IA**:
   - Detección automática al subir documentos para sugerir categoría y etiquetas relevantes utilizando **Google Gemini 2.0 Flash**.
   - Validación y control total por parte del usuario (aceptar con 1 clic o modificar antes de guardar).
4. **Búsqueda y Filtros Rápidos**:
   - Buscador por texto con actualización en tiempo real.
   - Filtros instantáneos por formato, categoría y etiquetas.
5. **Visor Embebido**:
   - Previsualizador en pantalla para PDFs e imágenes con panel lateral de metadatos.

---

## 🛠️ Pila Tecnológica Seleccionada

| Capa / Componente | Tecnología | Justificación Clave |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (React) + TypeScript + Tailwind CSS** | Interfaz moderna, renderizado eficiente del lado del servidor y control de tipos robusto. |
| **Base de Datos** | **PostgreSQL (Supabase)** | Integridad referencial sólida y **Row-Level Security (RLS)** para aislamiento físico por usuario. |
| **Almacenamiento** | **Object Storage (compatible S3)** | Archivos privados cifrados en reposo (AES-256) con acceso vía **URLs firmadas temporales (15 min)**. |
| **Inteligencia Artificial** | **Google Gemini 2.0 Flash** | Modelo multimodal nativo oficial y vigente, ultra veloz (1-2s), con respuestas JSON estructuradas y garantía de privacidad empresarial (sin retención de datos para entrenamiento). |
| **Autenticación** | **Supabase Auth / NextAuth** | Registro y login seguro con contraseñas encriptadas y cookies de sesión *HttpOnly*. |

---

## 📂 Estructura de Documentación del Proyecto

El análisis y la planificación detallada del proyecto se desarrollaron de forma metódica bajo la skill `analista-de-proyectos`:

```text
DocuSmart/
├── README.md                      # Descripción general del proyecto
└── docs/
    ├── documento-maestro.md       # Consolidación integral y hoja de ruta
    ├── 01-nucleo-y-mvp.md         # Fase 1: Problema, público y alcance
    ├── 02-experiencia-usuario-ux.md # Fase 2: Roles, mapa de navegación y pantallas
    ├── 03-requisitos-de-calidad.md  # Fase 3: Rendimiento, seguridad y disponibilidad
    ├── 04-datos-y-tecnologia.md   # Fase 4: Modelo conceptual ER y stack técnico
    └── 05-historias-de-usuario.md # Fase 5: Historias HU-01 a HU-08 con criterios
```

---

## 💻 Ejecución Local

Para ejecutar el proyecto en entorno local:

```bash
# Instalar dependencias
npm install

# Compilar proyecto para producción
npm run build

# Iniciar servidor local
npm start
# O en modo desarrollo:
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📌 Estado Actual del Proyecto

- **Fase Actual**: **MVP 100% Completado y Validado (8 de 8 Historias Validadas)** 🟢.
- **Servidor Local**: Activo y verificado en [http://localhost:3000](http://localhost:3000) (HTTP 200).
- **Componentes y Servicios Conectados**:
  - **Autenticación y Aislamiento (HU-01 - Validada)**: Supabase Auth con formularios reactivos `/login` y `/register`, middleware de protección de rutas privadas, persistencia de sesión y aislamiento estricto por RLS.
  - **Carga y Almacenamiento Seguro (HU-02 - Validada)**: Subida a bucket privado de Supabase Storage (`documents`), validación estricta de 25 MB y tipos MIME (PDF, Word, JPG, PNG), y persistencia de metadatos en tabla `documents` con aislamiento multi-usuario mediante PostgreSQL RLS.
  - **Clasificación Asistida con IA (HU-03 - Validada)**: Inferencia en servidor con **Google Gemini Flash** (`/api/ai/classify`), respuesta estructurada JSON en ~1.2 s, tarjeta interactiva de sugerencias en `UploadModal`, soberanía total de edición y degradación elegante.
  - **Organización en Carpetas Jerárquicas (HU-04 - Validada)**: Creación de carpetas y subcarpetas anidadas, migas de pan (*breadcrumbs*), árbol lateral interactivo, movimiento de documentos entre carpetas, protección anti-ciclos por trigger PostgreSQL (`trg_check_folder_cycles`) y borrado seguro con preservación de archivos en la raíz (`ON DELETE SET NULL`).
  - **Visualizador Integrado de Documentos (HU-05 - Validada)**: Visor modal para previsualización directa de PDFs en iframe nativo, imágenes con zoom interactivo, documentos Word (.docx mediante `mammoth`), navegación entre documentos con atajos de teclado, panel de metadatos y acceso seguro con URLs firmadas temporales (15 min).
  - **Búsqueda y Filtros de Documentos (HU-06 - Validada)**: Buscador reactivo por nombre y metadatos con debounce (300 ms), filtros cruzados por formato, categoría y fecha, actualización dinámica de resultados, chips de filtros activos con borrado individual y total, y endpoint seguro `/api/documents/search` con RLS.
  - **Gestión del Archivo (HU-07 - Validada)**: Renombrado de archivos en PostgreSQL con preservación obligatoria de la extensión original, descarga directa con URL firmada temporal y cabecera de descarga, eliminación definitiva dual (registro en PostgreSQL y archivo físico en bucket Supabase Storage) con diálogo modal de confirmación destructiva y actualización reactiva inmediata en el explorador.
  - **Categorías y Etiquetas Personalizadas (HU-08 - Validada)**: Implementación y validación completa de tablas `categories`, `tags` y `document_tags` en Supabase con RLS, soporte para categorías predeterminadas del sistema y personalizadas de usuario con paleta de colores, creación de etiquetas en caliente con componente `TagInput`, modal de edición de metadatos `EditDocumentMetadataModal`, integración con filtros compuestos en la barra lateral y superior, y taxonomía dinámica inyectada en Google Gemini Flash.
  - **Explorador Dinámico**: Conectado a la base de datos real del usuario autenticado; muestra carpetas, subcarpetas, documentos reales y se actualiza reactivamente tras cada subida, búsqueda, movimiento, renombrado, eliminación o edición de metadatos.
- **Métricas del MVP**:
  - Total de Historias: 8 historias (7 *Must have*, 1 *Should have*).
  - **Validadas**: 8 / 8 (100%) — **HU-01**, **HU-02**, **HU-03**, **HU-04**, **HU-05**, **HU-06**, **HU-07** y **HU-08** (Con aprobación formal del usuario tras pruebas reales).
  - **Implementadas**: 0 / 8 (0%).
  - **En desarrollo**: 0 / 8 (0%).
  - **Pendientes**: 0 / 8 (0%).
