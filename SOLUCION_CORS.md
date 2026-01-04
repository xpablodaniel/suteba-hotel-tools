# Solución a problemas de CORS y función faltante

## Problemas identificados y soluciones aplicadas

### 1. Error CORS al abrir archivos directamente
**Problema:** Al abrir `fichaPax.html` con doble clic (protocolo `file://`), el navegador bloqueaba las peticiones fetch por políticas CORS.

**Solución:** 
- Se crearon scripts para iniciar un servidor local automáticamente:
  - `start-server.sh` (Linux/Mac)
  - `start-server.bat` (Windows)
- Ambos scripts inician Python HTTP server en puerto 8000 y muestran las URLs disponibles

**Uso:**
```bash
# En Linux/Mac
./start-server.sh

# En Windows
start-server.bat
```

### 2. Función `generateMealVoucherHTML` no definida
**Problema:** El código en [client/js/fichaPax.js](client/js/fichaPax.js) llamaba a `generateMealVoucherHTML` en la línea 185, pero esta función no existía.

**Solución:**
Se implementó la función completa que:
- Extrae datos del grupo (titular y acompañantes)
- Calcula la duración de estadía a partir de fechas de ingreso/egreso
- Calcula cantidad de comidas según modo (MAP=1 comida, PC=2 comidas por día)
- Genera HTML completo con estilos CSS embebidos
- Crea casillas de verificación por día según el tipo de servicio:
  - **MAP:** Solo cena
  - **PC:** Almuerzo y cena separados

### 3. Actualización del README
Se agregó documentación clara sobre:
- Cómo usar los nuevos scripts de inicio
- Advertencia sobre NO abrir archivos HTML directamente
- Explicación de errores CORS

## Archivos modificados

1. **[client/js/fichaPax.js](client/js/fichaPax.js):**
   - Agregada función `generateMealVoucherHTML` completa (líneas ~414-627)
   - Función genera HTML self-contained con estilos CSS embebidos
   - Calcula automáticamente duración de estadía y cantidad de comidas

2. **[start-server.sh](start-server.sh):**
   - Script bash nuevo para Linux/Mac
   - Inicia servidor Python HTTP en puerto 8000
   - Muestra URLs de todas las páginas disponibles

3. **[start-server.bat](start-server.bat):**
   - Script batch nuevo para Windows
   - Funcionalidad idéntica a la versión bash
   - Compatible con cmd.exe y PowerShell

4. **[README.md](README.md):**
   - Agregada sección sobre uso de scripts
   - Advertencia clara sobre CORS
   - Instrucciones de inicio rápido mejoradas

## Cómo probar la solución

1. Desde la raíz del proyecto, ejecuta:
   ```bash
   ./launcher.sh
   ```

2. Abre el navegador en: `http://localhost:8000/client/fichaPax.html`

3. Carga tu archivo CSV con los datos de reservas

4. Busca un pasajero con servicio MAP o PC

5. Haz clic en "Generar ficha"

6. Deberías recibir:
   - **ficha_[nombre].pdf** - Ficha del pasajero
   - **voucher_MAP_[nombre].pdf** o **voucher_PC_[nombre].pdf** - Voucher de comidas

## Próximos pasos (opcionales)

- Agregar tests unitarios para `generateMealVoucherHTML`
- Considerar agregar configuración para personalizar colores/estilos del voucher
- Evaluar migrar parser CSV a PapaParse para mejor manejo de edge cases
