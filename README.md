# suteba-hotel-tools

Herramienta cliente para procesar CSVs de hoteles y generar vouchers y reportes de habitación.

---

# Onboarding rápido para agentes de IA

Este repositorio es una pequeña herramienta cliente para procesar CSVs de hoteles y generar vouchers y reportes de habitación. Usa estas notas concisas para ser productivo rápidamente.

- **Panorama general**: sitio estático (sin backend). Puntos de entrada: `index.html`, `vouchers.html`, `rooming.html`. La lógica principal está en `src/` y son scripts ES simples cargados en las páginas.

- **Componentes clave**:
  - [src/app.js](src/app.js) — arranque, manejo de archivos, toggles de UI y ayuda de impresión.
  - [src/lib/parser.js](src/lib/parser.js) — parseo y normalización de CSV (soporta dos formas y corrige comas adicionales).
  - [src/lib/business.js](src/lib/business.js) — reglas de negocio para MAP vs PC, filtrado, agrupación y cálculos.
  - [src/lib/render.js](src/lib/render.js) — renderizado HTML de vouchers (modo cajas o modo legado basado en imágenes).
  - `assets/` — logos e imágenes de casillas usadas por `render.js`.

- **Flujo principal de datos** (síguelo al hacer cambios):
 1. El usuario carga un CSV vía la UI (manejado en `src/app.js`).
 2. `processData(fileContents, mode)` en `src/lib/business.js` llama a `parseCSV` de `src/lib/parser.js`.
 3. Las reglas de negocio calculan `mealCount`, `cantp`, `stayDuration` y agrupan las filas.
 4. `src/lib/render.js` convierte los grupos en HTML imprimible.

- **Convenciones importantes y puntos a tener en cuenta**:
  - Los CSVs pueden tener dos formatos. `parser.js` detecta por cantidad de campos y trata de arreglar comas extra uniéndolas en los campos de observaciones — evita refactors agresivos que cambien esa heurística sin tests.
  - Las fechas en los CSV están en `dd/mm/YYYY`; las funciones `formatDate` y `calculateStayDuration` esperan ese formato.
  - La normalización de strings elimina diacríticos para el matching de servicios (ver `shouldIncludeRow` en `business.js`).
  - No hay bundler ni scripts npm — los archivos se cargan directamente en el navegador. Ejecuta un servidor estático para desarrollo (ver workflows).
  - Archivo de ejemplo: `consultaRegimenReport.csv`. La UI mostrará una advertencia si hay filas con **Pensión Completa (PC)** mientras la app está en modo **MAP** (esas filas se filtran).

- **Flujos de trabajo para desarrolladores**:
  - Vista rápida: abre `index.html` en el navegador (doble clic) o ejecuta un servidor estático:

```bash
python3 -m http.server 8000
# o
npx http-server -c-1 .
```

  - Utilidades en Python: hay scripts bajo `python/fichaPax/`. Scripts disponibles:
    - `llenar_fichas.py` — generar/llenar fichas de pasajeros (uso: `python3 python/fichaPax/llenar_fichas.py`).
    - `generar_con_overlay.py` — generar PDFs con overlay (uso: `python3 python/fichaPax/generar_con_overlay.py`).
    - `previsualizar_fichas.py` — previsualizar fichas generadas (uso: `python3 python/fichaPax/previsualizar_fichas.py`).
    Revisa el encabezado de cada script para dependencias y ejecútalos con `python3` desde la raíz del repositorio (o activa tu virtualenv).
  - Tests: el README original lista comandos ad-hoc `python3 test_processData.py` y `node test_processData.js` si están presentes; ejecútalos desde la raíz.

- **Cómo realizar cambios seguros**:
  - Al cambiar el parseo, ejecuta pruebas manuales con `test-data-ppj.csv` y `test-data-map.csv` en la raíz.
  - Prefiere tests pequeños y focalizados (crea `test_*.js` o `test_*.py`) que cubran `parseCSV`, `processData` y `relevantDataToForm`.
  - Al modificar el layout de impresión, verifica la vista previa de impresión (el CSS está afinado para 4 vouchers por A4).

- **Ejemplos de cambios comunes y dónde implementarlos**:
  - Cambiar modo inicial o modo de render: editar `APP_CONFIG` en [src/app.js](src/app.js) (claves: `mode`, `renderMode`).
  - Agregar un nuevo formato CSV: extender `parseCSV` en [src/lib/parser.js](src/lib/parser.js) y actualizar la especificación en este README.
  - Cambiar reglas de cálculo de comidas: editar `mealMultiplier` en `APP_CONFIG` o `processData` en `src/lib/business.js`.

- **Dependencias e integraciones**:
  - No hay paquetes JS externos en el código cliente. El parser es custom; migrar a PapaParse es una sugerencia pero no está implementada.
  - Los scripts Python en `python/fichaPax/` pueden requerir paquetes de terceros — revisa sus imports antes de ejecutar.

- **Si no estás seguro, sigue estas recomendaciones**:
 1. Ejecuta la app localmente con un servidor estático y prueba con los CSVs provistos.
 2. Modifica un módulo a la vez (parser → business → render) y verifica el flujo completo en el navegador.
 3. Conserva el comportamiento legado `renderMode: 'image'` a menos que confirmes que todos los consumidores pueden usar `boxes`.

---

## Cambios recientes (29/12/2025)
- Limpieza de **Seccional**: se eliminó el prefijo numérico y guion de `Sede` (ej. `39 - CHIVILCOY` → `CHIVILCOY`) en `python/fichaPax/generar_con_overlay.py`. La limpieza preserva el case original. (Se añadió una prueba local de regex.)
- Fichas PDF: se preserva el case original al mostrar la Seccional y se agregó manejo robusto de campos vacíos antes de dibujar en el overlay.
- Agrupación por habitación: en `client/rooming.html` la exportación de `reservas_ingresan.csv` ahora agrupa por **habitación** (una fila por habitación), usando la capacidad máxima reportada en `Cantidad plazas` y concatenando nombres/DNI/observaciones únicos.
- Voucher por grupo: en `client/src/lib/render.js` se implementó la generación de **un voucher por número de `voucher`** (familias/grupos), donde `Cant. Pax` = número de filas que comparten ese voucher y `Cant. Comidas` se recalcula en consecuencia.
- Correcciones menores:
  - Se corrigió un error de sintaxis en `client/src/lib/render.js` que impedía renderizar vouchers correctamente.
  - Se ajustó la ruta del logo para las páginas dentro de `client/` (`../assets/suteba_logo_3.jpg`).

**Notas de prueba**: probé la expresión regular para la Seccional y validé con `consultaRegimenReport.csv` que la agrupación por habitación y por voucher devuelven los conteos esperados. Si querés, puedo añadir tests unitarios (JS/Py) para cubrir estos casos.

Si querés que deje la ruta del logo como absoluta (`/assets/suteba_logo_3.jpg`) para evitar problemas de base path, lo puedo cambiar también.

## Nueva herramienta: Generar fichas (fichaPax) — 31/12/2025

Se añadió una UI de prototipo para generar fichas de pasajeros desde CSV en el navegador:

- Página: `client/fichaPax.html` (requiere servir el repo con un servidor estático, p. ej. `python3 -m http.server 8000`).
- Funciona con: **PapaParse** (parseo CSV), **pdf-lib** (relleno de plantilla `python/fichaPax/fichaPax.pdf`) y **JSZip** (descarga ZIP múltiple).
- Uso rápido: abrir `http://localhost:8000/client/fichaPax.html`, arrastrar/seleccionar CSV, revisar la vista previa y hacer clic en *Descargar X fichas (ZIP)*.

Notas:
- Actualmente la posición del texto en la plantilla PDF es un primer ajuste (coordenadas iniciales). Planeo añadir `python/fichaPax/positions.json` para mapear campos a coordenadas precisas y permitir editar posiciones sin tocar el JS.
- Los scripts Python en `python/fichaPax/` se conservan como utilitarios (no se borraron).

CLI (opción para usuarios avanzados):

Si preferís la terminal, podés generar las fichas con los scripts Python:

```bash
pip install reportlab pypdf
python3 python/fichaPax/llenar_fichas.py path/to/your.csv
```

Los PDFs generados por la herramienta CLI se guardan en: `python/fichaPax/fichas/`.

> Recomendación: la UI está orientada a usuarios que no usan la terminal; la opción CLI es más rápida para procesamiento por lotes o integraciones con scripts existentes.

## Mejoras y refactorización — 3/1/2026

### 1. Sistema de búsqueda individual en fichaPax

**Problema**: La generación masiva en ZIP (35-40 fichas) tardaba ~30 segundos y no permitía acceso rápido a fichas individuales durante el check-in.

**Solución implementada**:
- Reemplazamos la generación en lote por un sistema de **búsqueda en tiempo real** con filtrado por:
  - Número de voucher
  - DNI
  - Apellido
- La interfaz muestra resultados con badges visuales (MAP en amarillo, PC en verde)
- Función `generateSingleVoucher()` permite descargar fichas individuales en menos de 1 segundo
- Se eliminó la tabla de previsualización de 25 columnas que saturaba la UI

**Archivos modificados**:
- `client/fichaPax.html` — UI simplificada con búsqueda prominente
- `client/js/fichaPax.js` — nueva función `renderSearchResults()` y `generateSingleVoucher()`
- Se removió dependencia de JSZip (ya no es necesaria)

### 2. Normalización de nombres a mayúsculas

**Problema**: El sistema gestor de reservas permite entrada de texto con mayúsculas/minúsculas inconsistentes, generando documentos con formato heterogéneo.

**Solución implementada**:
- Aplicamos `.toUpperCase()` en todas las capas:
  - **Frontend (fichaPax)**: nombres de titular y acompañantes en `client/js/fichaPax.js`
  - **Backend (Python)**: campos "Apellido y nombre" en `python/fichaPax/generar_con_overlay.py`
  - **Rooming**: campo passengerName en `client/rooming.html`
- Normalización aplicada en el momento de renderizado/escritura (no modifica datos originales del CSV)

**Archivos modificados**:
- `client/js/fichaPax.js` (líneas ~178, ~296)
- `python/fichaPax/generar_con_overlay.py` (líneas ~57, ~89)
- `client/rooming.html` (línea ~66)

### 3. Simplificación de vouchers.html (modo MAP)

**Contexto**: El hotel opera en temporada de Media Pensión (MAP) durante 7 meses/año. El toggle PC/MAP en la interfaz generaba confusión durante estos períodos.

**Solución implementada**:
- Eliminamos el toggle de modo PC/MAP y todas las referencias asociadas
- Removimos el indicador visual de modo actual
- Eliminamos la función `toggleMode()` del JavaScript
- La aplicación ahora opera exclusivamente en modo MAP (puede revertirse editando el código para temporada PC)

**Archivos modificados**:
- `client/vouchers.html` — removidos controles de toggle y badges de modo

### 4. Corrección crítica y reformateo de rooming.html

**Problema 1**: Error de sintaxis (faltaba `};` después de un return) impedía cargar archivos CSV.

**Problema 2**: El formato de salida agrupaba pasajeros por habitación, pero el sistema de importación espera **una fila por pasajero**.

**Solución implementada**:
- Corregido error de sintaxis en bloque `processData()`
- Reescrita la lógica de procesamiento para generar una fila individual por cada pasajero
- Mantenida ordenación por número de habitación (con parsing robusto usando regex)
- Agregada normalización de nombres a mayúsculas
- Formato de salida ahora incluye 14 campos: habitación, fechas, plazas, doc tipo/número, nombre, edad, voucher, servicio, estado, paquete, sede, observación

**Archivos modificados**:
- `client/rooming.html` — función `processData()` completamente reescrita

### Arquitectura modular preservada

Durante la sesión exploramos la posibilidad de integrar la generación automática de vouchers de comida junto con las fichas de check-in. Después de implementar un prototipo, decidimos **revertir esta integración** para mantener los módulos independientes:

- `fichaPax` → fichas de registro para check-in (PDF con overlay)
- `vouchers` → vouchers de comida MAP/PC (impresión HTML)
- `rooming` → procesador de reservas para rooming list (exportación CSV)

Esta separación permite:
- Mayor flexibilidad en el flujo de trabajo del hotel
- Mantenimiento más simple (cada módulo tiene una responsabilidad única)
- Reutilización independiente de cada herramienta

### Próximos pasos sugeridos

- Implementar base de datos real para tracking de check-ins y estado de habitaciones (actualmente basado en CSV estático)
- Añadir tests unitarios para `parseCSV`, `processData` y `relevantDataToForm`
- Considerar migración del parser custom a PapaParse en los módulos que aún usan código legacy
- Documentar posiciones del PDF en `positions.json` para facilitar ajustes sin tocar código JavaScript

