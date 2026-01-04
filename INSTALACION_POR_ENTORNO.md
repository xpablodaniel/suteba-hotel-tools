# 🖥️ Guía de Instalación por Entorno

## 🎯 Resumen Rápido

| Entorno | Instalador | Resultado |
|---------|-----------|-----------|
| **Ubuntu Nativo** | `./instalar-ubuntu-nativo.sh` | ✅ Icono en escritorio |
| **WSL (Desarrollo)** | `./launcher.sh` | ✅ Sin icono, uso directo |
| **Windows** | `start-server.bat` | ✅ Doble clic en .bat |

---

## 🐧 Ubuntu NATIVO (Usuarios finales)

### Características:
- ✅ Icono en el escritorio de Ubuntu
- ✅ Doble clic para iniciar
- ✅ Integración completa con el sistema

### Instalación:
```bash
cd /ruta/del/proyecto
./instalar-ubuntu-nativo.sh
```

### Uso:
1. Doble clic en "SUTEBA Hotel Tools" en el escritorio
2. Si pregunta, marca "Confiar y ejecutar"
3. ¡Listo!

---

## 🔧 WSL (Windows Subsystem for Linux)

### Características:
- ⚠️ Los archivos .desktop NO funcionan en WSL
- ✅ Ejecutar scripts directamente funciona perfectamente
- ✅ Ideal para desarrollo

### Por qué no funciona el .desktop en WSL:
WSL no tiene un entorno de escritorio propio, usa el de Windows. Los archivos `.desktop` son para escritorios Linux nativos (GNOME, KDE, etc).

### Solución en WSL:

#### Opción 1: Ejecutar directamente (Recomendado)
```bash
cd /ruta/del/proyecto
./launcher.sh
```

#### Opción 2: Crear alias en ~/.bashrc
```bash
echo "alias suteba='cd /ruta/del/proyecto && ./launcher.sh'" >> ~/.bashrc
source ~/.bashrc

# Luego simplemente ejecuta:
suteba
```

#### Opción 3: Acceso directo de Windows
Si ejecutaste `./instalar-lanzador.sh` opción 2, tendrás un archivo `.bat` en tu escritorio de Windows que ejecutará el proyecto desde WSL.

---

## 🪟 Windows (Sin WSL)

### Uso directo con Python:
1. Instala Python 3 desde [python.org](https://www.python.org/downloads/)
2. Doble clic en `start-server.bat`
3. El navegador se abrirá automáticamente

### Nota:
El archivo `start-server.bat` funciona en Windows nativo con Python instalado.

---

## 📦 Transferir proyecto a Ubuntu Nativo

Si desarrollaste en WSL y necesitas mover el proyecto a Ubuntu nativo:

### 1. Copiar el proyecto:
```bash
# Desde WSL, copiar a una ubicación accesible
cp -r /mnt/c/Users/tu-usuario/proyecto ~/proyecto-ubuntu

# O usar un pendrive/red
```

### 2. En Ubuntu nativo:
```bash
cd ~/proyecto-ubuntu
./instalar-ubuntu-nativo.sh
```

### 3. Listo:
Tendrás el icono en tu escritorio de Ubuntu.

---

## 🆘 Solución de Problemas

### "El icono no aparece en el escritorio"

**En WSL:**
- Normal. WSL no tiene escritorio de Ubuntu
- Usa `./launcher.sh` directamente

**En Ubuntu nativo:**
- Verifica que estás en Ubuntu real (no WSL):
  ```bash
  grep -i microsoft /proc/version
  # Si sale "microsoft" → estás en WSL
  # Si no sale nada → estás en Ubuntu nativo
  ```
- Re-ejecuta el instalador

### "python3: command not found"

```bash
# Ubuntu/WSL
sudo apt update
sudo apt install python3

# Windows
# Descarga e instala desde python.org
```

### "El servidor no inicia"

```bash
# Verificar si el puerto está ocupado
lsof -i:8000

# Detener el servidor anterior
./stop-server.sh

# Reintentar
./launcher.sh
```

---

## 📝 Resumen de Archivos

| Archivo | Para quién | Cuándo usar |
|---------|-----------|-------------|
| `launcher.sh` | Todos | Iniciar el servidor manualmente |
| `stop-server.sh` | Todos | Detener el servidor |
| `instalar-ubuntu-nativo.sh` | Ubuntu nativo | Primera instalación |
| `instalar-lanzador.sh` | Avanzados | Instalación personalizada |
| `start-server.bat` | Windows | Usar en Windows sin WSL |

---

## 💡 Recomendaciones

### Para desarrollo (WSL):
```bash
./launcher.sh
# Trabaja normalmente
# Ctrl+C para detener
```

### Para usuarios finales (Ubuntu nativo):
```bash
./instalar-ubuntu-nativo.sh
# Doble clic en el icono del escritorio
```

### Para pruebas rápidas (cualquier entorno):
```bash
python3 -m http.server 8000
# Abrir manualmente: http://localhost:8000/index.html
```

---

*Esta guía cubre todos los escenarios de uso del proyecto*
