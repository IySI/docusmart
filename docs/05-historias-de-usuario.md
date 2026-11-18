# 05 - Historias de Usuario con Criterios de Aceptación

Este documento desglosa el alcance del MVP de **DocuSmart** en unidades de trabajo ágiles, verificables y priorizadas, siguiendo el estándar de desarrollo de software.

---

## Matriz de Priorización del MVP (MoSCoW)

- **Must have (Obligatorio en MVP)**: HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07.
- **Should have (Importante en MVP)**: HU-08.
- **Could have (Versiones futuras)**: Búsqueda OCR en texto completo, trabajo colaborativo, control de versiones.

---

## Historias de Usuario Detalladas

### HU-01: Autenticación y Aislamiento de Usuario
- **Historia**: *Como usuario, quiero registrarme e iniciar sesión con mi correo electrónico y contraseña para acceder a mi repositorio personal de documentos con total privacidad.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Registro exitoso)**:
    - **Dado** que el usuario ingresa un correo válido y una contraseña que cumple los requisitos mínimos (8+ caracteres, combinación de letras y números),
    - **Cuando** presiona "Registrarse",
    - **Entonces** se crea su cuenta, se cifra la contraseña mediante un algoritmo seguro (*bcrypt/Argon2*), se inicia sesión y se le redirige al explorador principal vacío.
  - [x] **Escenario 2 (Validación de errores)**:
    - **Dado** que el usuario ingresa un correo ya registrado o datos inválidos,
    - **Cuando** intenta enviar el formulario,
    - **Entonces** el sistema muestra un mensaje de error claro en español junto al campo afectado sin recargar la página.
  - [x] **Escenario 3 (Aislamiento de sesión)**:
    - **Dado** que un usuario inicia sesión,
    - **Cuando** consulta carpetas o archivos,
    - **Entonces** el sistema solo consulta y devuelve registros vinculados a su identificador de usuario (`usuario_id`), impidiendo cualquier acceso a documentos ajenos.

---

### HU-02: Carga y Almacenamiento Seguro de Archivos
- **Historia**: *Como usuario autenticado, quiero subir documentos PDF, Word e imágenes arrastrándolos o seleccionándolos desde mi equipo para centralizarlos en la nube.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Subida válida)**:
    - **Dado** que el usuario selecciona un archivo con formato permitido (`.pdf`, `.docx`, `.doc`, `.png`, `.jpg`, `.jpeg`) menor o igual a 25 MB,
    - **Cuando** confirma la subida,
    - **Entonces** el archivo se almacena en el almacenamiento de objetos cifrado y sus metadatos se registran en la base de datos asociados al usuario.
  - [x] **Escenario 2 (Restricción de formato o peso)**:
    - **Dado** que el usuario intenta subir un archivo con extensión no permitida (ej. `.exe`) o que supera los 25 MB,
    - **Cuando** suelta el archivo o lo selecciona,
    - **Entonces** el sistema rechaza la carga inmediatamente y muestra una alerta amigable explicando el motivo y los límites admitidos.

---

### HU-03: Clasificación Inteligente y Sugerencias con IA
- **Historia**: *Como usuario, quiero que la aplicación analice el documento al subirlo y me sugiera automáticamente una categoría y etiquetas relevantes para catalogarlo sin esfuerzo manual.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Sugerencia asistida exitosa)**:
    - **Dado** que el usuario sube un archivo (ej. una factura en PDF),
    - **Cuando** el modelo `gemini-2.0-flash` procesa el documento en un tiempo inferior a 4 segundos,
    - **Entonces** el modal de subida presenta una tarjeta con la categoría sugerida (ej. *"Facturas & Recibos"*) y etiquetas sugeridas (ej. *"Servicios"*, *"2026"*, *"Electricidad"*).
  - [x] **Escenario 2 (Control del usuario sobre la IA)**:
    - **Dado** que el sistema muestra sugerencias de la IA,
    - **Cuando** el usuario revisa los campos,
    - **Entonces** puede aceptar las sugerencias con un solo clic o editar manualmente la categoría y etiquetas antes de presionar "Guardar".
  - [x] **Escenario 3 (Degradación elegante ante fallos)**:
    - **Dado** que el servicio de IA no responde o se agota la cuota externa,
    - **Cuando** finaliza la subida del archivo,
    - **Entonces** el sistema guarda el archivo sin error, notifica discretamente que la sugerencia automática no está disponible y permite al usuario categorizarlo manualmente.

---

### HU-04: Organización mediante Carpetas Jerárquicas
- **Historia**: *Como usuario, quiero crear carpetas y mover archivos entre ellas para mantener una estructura documental limpia y comprensible.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Creación de carpeta)**:
    - **Dado** que el usuario hace clic en "Nueva Carpeta",
    - **Cuando** escribe un nombre (ej. *"Contratos Laborales"*) y confirma,
    - **Entonces** la carpeta se visualiza de inmediato en el árbol lateral y en el panel central.
  - [x] **Escenario 2 (Mover documento a carpeta)**:
    - **Dado** un documento ubicado en la raíz o en otra carpeta,
    - **Cuando** el usuario lo arrastra a una carpeta o selecciona "Mover a..." desde el menú de opciones (`...`),
    - **Entonces** el archivo actualiza su `carpeta_id` y pasa a mostrarse dentro de la carpeta destino.
  - [x] **Escenario 3 (Eliminación de carpeta)**:
    - **Dado** que el usuario solicita eliminar una carpeta que contiene documentos,
    - **Cuando** confirma la acción en el diálogo de advertencia,
    - **Entonces** se maneja la reubicación segura o eliminación controlada de sus elementos según la preferencia seleccionada.

---

### HU-05: Visualizador Integrado de Documentos
- **Historia**: *Como usuario, quiero previsualizar mis archivos directamente en la aplicación para consultar su contenido rápidamente sin necesidad de descargarlos a mi equipo.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Previsualización de PDF e Imágenes)**:
    - **Dado** que el usuario hace clic sobre un archivo PDF o una imagen en la lista,
    - **Cuando** se genera la URL firmada temporal con expiración de 15 minutos,
    - **Entonces** se abre el visor modal mostrando el documento con controles de zoom, cambio de página y un panel lateral con sus metadatos.
  - [x] **Escenario 2 (Documentos Word)**:
    - **Dado** que el usuario abre un archivo `.docx`,
    - **Cuando** interactúa con el visor,
    - **Entonces** se muestra una vista previa formateada o, en caso de elementos complejos, la opción de visualización web rápida o descarga directa.

---

### HU-06: Búsqueda y Filtros Rápidos en Tiempo Real
- **Historia**: *Como usuario, quiero buscar documentos por texto y filtrarlos por categoría, formato o etiquetas para localizar cualquier archivo en segundos.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Búsqueda por texto)**:
    - **Dado** que el usuario escribe un término en la barra de búsqueda (ej. *"alquiler"*),
    - **Cuando** transcurren 300 ms sin escribir (*debounce*),
    - **Entonces** el explorador filtra y muestra únicamente los documentos cuyo nombre contenga el término buscado.
  - [x] **Escenario 2 (Filtros por formato y categoría)**:
    - **Dado** que el usuario activa el filtro rápido `[PDF]` y selecciona la categoría *"Legal"*,
    - **Cuando** se actualiza la vista,
    - **Entonces** se listan exclusivamente los archivos que cumplen ambas condiciones simultáneamente.

---

### HU-07: Gestión del Archivo (Renombrar, Descargar y Eliminar)
- **Historia**: *Como usuario, quiero renombrar mis archivos, descargarlos a mi equipo o eliminarlos definitivamente para mantener mi catálogo actualizado.*
- **Prioridad**: **Must have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Renombrar documento)**:
    - **Dado** que el usuario selecciona "Renombrar" desde el menú del archivo,
    - **Cuando** ingresa el nuevo nombre y confirma,
    - **Entonces** el nombre visible del archivo se actualiza en pantalla y en la base de datos, conservando su extensión original.
  - [x] **Escenario 2 (Descarga directa)**:
    - **Dado** que el usuario pulsa "Descargar",
    - **Cuando** se solicita el archivo,
    - **Entonces** el navegador inicia la descarga del binario original mediante una URL firmada de descarga segura.
  - [x] **Escenario 3 (Eliminación con confirmación)**:
    - **Dado** que el usuario selecciona "Eliminar",
    - **Cuando** aparece el diálogo de confirmación y el usuario pulsa "Confirmar eliminación",
    - **Entonces** el registro se elimina de la base de datos, se borra el archivo del almacenamiento de objetos y desaparece de la vista.

---

### HU-08: Gestión de Categorías y Etiquetas Personalizadas
- **Historia**: *Como usuario, quiero crear y gestionar mis propias categorías y etiquetas para clasificar mis documentos según mis propios criterios.*
- **Prioridad**: **Should have**
- **Criterios de Aceptación**:
  - [x] **Escenario 1 (Creación de etiquetas)**:
    - **Dado** que el usuario está editando los metadatos de un archivo o creando una nueva etiqueta,
    - **Cuando** escribe un texto nuevo (ej. *"Hacienda2026"*) y presiona Enter,
    - **Entonces** la etiqueta queda registrada en su catálogo personal y queda vinculada al documento.
  - [x] **Escenario 2 (Filtro por etiqueta)**:
    - **Dado** que el usuario hace clic en una pastilla de etiqueta en el panel de filtros,
    - **Cuando** se aplica el filtro,
    - **Entonces** se muestran todos los archivos que tienen asociada dicha etiqueta.
