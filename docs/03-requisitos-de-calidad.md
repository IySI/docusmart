# 03 - Requisitos de Calidad

Este documento define los requisitos no funcionales que garantizan que **DocuSmart** sea una solución segura, rápida, estable y fácil de usar desde su primera versión.

---

## 1. Rendimiento y Velocidad

- **Tiempos de respuesta de la interfaz**:
  - La carga inicial de la aplicación debe completarse en menos de **2 segundos** en conexiones de banda ancha estándar.
  - La búsqueda y el filtrado de documentos deben ser instantáneos o responder en menos de **300 milisegundos**, proporcionando una experiencia fluida al escribir o activar filtros.
- **Tiempo de análisis de la IA**:
  - El análisis y retorno de sugerencias de categoría y etiquetas al subir un archivo debe completarse en un rango de **3 a 5 segundos**.
- **Visualización de documentos**:
  - La previsualización de archivos PDF de tamaño estándar (hasta 50 páginas) e imágenes debe cargar en menos de **1.5 segundos**.
- **Concurrencia inicial**:
  - La arquitectura base del MVP debe soportar de forma estable al menos **50 usuarios activos simultáneos** sin degradación perceptible en los tiempos de respuesta.

---

## 2. Seguridad y Privacidad

- **Autenticación y Sesiones**:
  - Gestión segura de contraseñas mediante algoritmos de derivación de claves robustos (ej. *bcrypt* o *Argon2*).
  - Manejo de sesiones mediante tokens seguros (JWT con flags *HttpOnly* y *SameSite* o autenticación basada en cookies seguras) con caducidad controlada.
- **Aislamiento de Información (Tenancy Seguro)**:
  - Estricto aislamiento de datos: ningún usuario podrá ver, consultar ni inferir la existencia de documentos, carpetas o etiquetas pertenecientes a otro usuario.
  - Las operaciones de consulta, modificación o borrado deben verificar a nivel de servidor la pertenencia del recurso al usuario autenticado.
- **Protección y Cifrado de Archivos**:
  - **En tránsito**: Todas las comunicaciones deben forzar el protocolo **HTTPS** con TLS 1.3 (o mínimo TLS 1.2).
  - **En reposo**: Los archivos almacenados y la base de datos deben contar con cifrado estándar (AES-256).
  - **Acceso a archivos**: La visualización y descarga de archivos no debe exponer rutas estáticas públicas; debe implementarse mediante URLs firmadas con expiración temporal corta (ej. enlaces temporales válidos por 15 minutos).
- **Privacidad en el uso de IA**:
  - Los documentos y textos enviados a los servicios de IA para su clasificación no deben ser utilizados por proveedores externos para entrenar modelos públicos sin consentimiento.

---

## 3. Usabilidad y Accesibilidad

- **Diseño Adaptable (*Responsive*)**:
  - Experiencia optimizada primordialmente para pantallas de escritorio y portátiles (1024px en adelante), garantizando al mismo tiempo que la visualización, búsqueda y descarga sean perfectamente operativas en tabletas y dispositivos móviles.
- **Claridad Visual y Lenguaje Sencillo**:
  - Uso de terminología cotidiana en español sin tecnicismos innecesarios (ej. *"Subir documento"* en lugar de *"Cargar payload"*).
  - Indicadores visuales claros para los diferentes tipos de archivo (iconos y colores distintivos para PDF, Word e imágenes).
- **Manejo Amigable de Errores**:
  - Los mensajes de validación deben ser constructivos y explicar la solución (ej. *"El archivo supera el tamaño máximo permitido de 25 MB. Por favor, selecciona un archivo más ligero"*).

---

## 4. Disponibilidad y Tolerancia a Fallos

- **Degradación Elegante del Servicio de IA**:
  - Si el servicio de clasificación por IA experimenta lentitud, pérdida de conexión o agota su cuota, **la subida del documento no se detiene ni se cancela**.
  - El sistema guarda el archivo con éxito y permite al usuario asignar su categoría y etiquetas manualmente, informando de forma discreta: *"El asistente de IA no está disponible en este momento. Puedes clasificar tu archivo de forma manual"*.
- **Respaldos y Recuperación**:
  - Copias de seguridad automáticas diarias de la base de datos de metadatos y políticas de versionado o replicación en el almacenamiento de archivos.
- **Eliminación Segura**:
  - Los procesos de eliminación de documentos deben exigir confirmación explícita para evitar pérdidas accidentales.

---

## 5. Restricciones y Supuestos Operativos

- **Límites de Archivo en el MVP**:
  - Tamaño máximo individual permitido por documento: **25 MB**.
  - Formatos estrictamente admitidos:
    - Documentos: `.pdf`, `.docx`, `.doc`
    - Imágenes: `.png`, `.jpg`, `.jpeg`
  - Validación de extensiones tanto en cliente como en servidor mediante inspección del tipo MIME real y encabezado (*magic numbers*) para impedir la subida de scripts maliciosos.
- **Cumplimiento Normativo**:
  - Consideración de principios fundamentales de privacidad de datos personales (como el RGPD o leyes locales de protección de datos personales), otorgando al usuario el derecho a eliminar definitivamente su cuenta y todos sus archivos asociados.
