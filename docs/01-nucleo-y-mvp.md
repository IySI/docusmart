# 01 - Núcleo de la Aplicación y Definición del MVP

## 1. Resumen de la Idea
**DocuSmart** es una aplicación web intuitiva y moderna diseñada para centralizar, organizar y gestionar documentos digitales (personales y profesionales) como archivos PDF, documentos Word e imágenes. Su objetivo principal es simplificar la administración documental cotidiana combinando la organización tradicional (carpetas, categorías y etiquetas) con capacidades de clasificación inteligente asistida por Inteligencia Artificial (IA).

## 2. Problema a Resolver
- **Problema actual**: La dispersión de archivos en múltiples carpetas locales, correos electrónicos y servicios en la nube dificulta localizar documentos importantes rápidamente (facturas, contratos, certificados, notas, recibos). Además, el etiquetado y la clasificación manual suelen ser tediosos, lo que lleva al desorden y a la pérdida de tiempo.
- **Impacto**: Pérdida de productividad, frustración por no encontrar documentos a tiempo, riesgo de duplicidad de archivos y desorganización acumulativa tanto a nivel personal como en entornos de pequeñas empresas o autónomos.

## 3. Público Objetivo
- **Usuarios primarios (Directos)**: 
  - Profesionales independientes, trabajadores remotos y estudiantes que manejan un flujo constante de documentos digitales y buscan un repositorio centralizado y ágil.
  - Usuarios particulares que desean mantener en orden sus finanzas personales, garantías, identificaciones y documentos legales de su hogar.
- **Beneficiarios secundarios**:
  - Pequeños equipos de trabajo o colaboradores que requieren acceder a información clasificada y disponible de forma inmediata sin fricciones técnicas.

## 4. Propuesta de Valor
- **Centralización simple y visual**: Gestión unificada de formatos esenciales (PDF, Word, imágenes) con visualización previa integrada sin necesidad de descargar el archivo.
- **Organización híbrida y flexible**: Combinación de jerarquía por carpetas/categorías junto a etiquetas libres y metadatos personalizados.
- **Asistencia inteligente (IA)**: Reducción del esfuerzo manual sugiriendo automáticamente categorías y etiquetas relevantes a partir del contenido o nombre del documento.
- **Experiencia de usuario limpia**: Interfaz minimalista, rápida y sin saturación de funciones innecesarias.

## 5. Alcance del MVP (Producto Mínimo Viable)
*Funcionalidades esenciales e indispensables para la primera versión funcional:*

1. **Gestión de Archivos y Almacenamiento**:
   - Subida y almacenamiento seguro de documentos en formatos clave: PDF, Word (.docx) e imágenes (PNG, JPG/JPEG).
   - Operaciones básicas de ciclo de vida del archivo: renombrar, descargar y eliminar (con confirmación de seguridad).
2. **Organización y Estructura**:
   - Creación, edición y eliminación de carpetas y categorías para estructurar el repositorio.
   - Asignación manual de etiquetas (*tags*) y metadatos descriptivos (ej. fecha, notas breves).
3. **Búsqueda y Filtros Básicos**:
   - Barra de búsqueda rápida por nombre de archivo y etiquetas.
   - Filtros por categoría, tipo de formato (PDF, Word, imagen) y fecha de subida.
4. **Visualizador Integrado (Preview)**:
   - Vista previa directa en el navegador para PDFs e imágenes (y soporte de previsualización o visor estándar para documentos Word).
5. **Clasificación Inteligente Básica (IA)**:
   - Análisis asistido al subir un documento para sugerir automáticamente:
     - Una categoría sugerida (ej. *Factura*, *Contrato*, *Identificación*, *Personal*).
     - Etiquetas clave sugeridas (ej. nombre de emisor, año, concepto relevante).
   - El usuario siempre valida, ajusta o descarta la sugerencia de la IA antes de confirmarla.

## 6. Funcionalidades para Versiones Futuras (Fuera del MVP)
*Ideas valiosas postergadas conscientemente para evitar sobrecomplejidad inicial:*

- **OCR Avanzado y Búsqueda en Texto Completo**: Indexación profunda del texto interno de imágenes escaneadas o PDFs rasterizados.
- **Control de Versiones de Documentos**: Historial de cambios, control de revisiones y restauración de versiones anteriores de un archivo.
- **Compartición y Colaboración Multiusuario**: Enlaces públicos o temporales con contraseña para compartir archivos, y carpetas compartidas con permisos específicos.
- **Flujos de Automatización / Auto-Filing Autónomo**: Reglas desatendidas para mover o clasificar archivos automáticamente sin intervención humana.
- **Extracción Estructurada de Datos por IA**: Extracción automática de tablas de facturas, montos totales e integración con software externo.
- **Aplicación Móvil Dedicada**: Apps nativas para iOS y Android con captura directa desde la cámara del dispositivo.
