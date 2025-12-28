// app.js — Bootstrap y configuración principal para vouchers unificados
// Soporta dos modos: MAP (Media Pensión) y PC (Pensión Completa)

const APP_CONFIG = {
  mode: 'MAP',                    // 'MAP' (Media Pensión) o 'PC' (Pensión Completa) — MAP predeterminado
  renderMode: 'boxes',           // 'boxes' (casillas HTML) o 'image' (imagen hardcodeada)
  imageForTildes: {
    MAP: 'assets/MapDay.png',
    PC: 'assets/JubPc2.png'
  },
  mealMultiplier: {
    MAP: 1,  // 1 comida/día (cena)
    PC: 2    // 2 comidas/día (almuerzo + cena)
  },
  csvParser: 'split',            // 'split' (legacy) o 'papaparse' (robusto, futuro)
  serviceLookup: {
    MAP: 'MEDIA PENSION',
    PC: 'PENSIÓN COMPLETA'        // Con acento para match exacto
  }
};

// Global data storage
let relevantData = [];

// UI Handlers
function handleFileSelect() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const fileContents = reader.result;

      // Procesar y obtener filas relevantes
      relevantData = processData(fileContents, APP_CONFIG.mode);

      const resultOutput = document.getElementById('resultOutput');
      const noDataMessage = document.getElementById('noDataMessage');
      const warningsDiv = document.getElementById('warnings');

      // Mostrar resultados o mensaje de no datos
      if (relevantData.length === 0) {
        resultOutput.innerHTML = '';
        noDataMessage.style.display = 'block';
      } else {
        resultOutput.innerHTML = relevantDataToForm(relevantData, APP_CONFIG);
        noDataMessage.style.display = 'none';
      }

      // Extraer todos los registros parseados para validaciones adicionales
      const allParsed = parseCSV(fileContents);

      // Contar filas con Pensión Completa (PC)
      const normalize = (text) => (text || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pcCount = allParsed.reduce((acc, r) => acc + (normalize(r.servicios).includes('PENSION COMPLETA') ? 1 : 0), 0);

      // Contar filas con fechas inválidas / duración inválida en los datos relevantes
      const invalidDates = relevantData.reduce((acc, r) => acc + (isNaN(r.stayDuration) || r.stayDuration <= 0 ? 1 : 0), 0);

      // Construir mensajes de advertencia
      let warnings = [];
      if (pcCount > 0 && APP_CONFIG.mode === 'MAP') {
        warnings.push(`${pcCount} fila(s) con Pensión Completa detectadas: se están ignorando en modo MAP.`);
      }
      if (invalidDates > 0) {
        warnings.push(`${invalidDates} registro(s) con fechas inválidas o duración <= 0.`);
      }

      if (warnings.length > 0) {
        warningsDiv.style.display = 'block';
        warningsDiv.innerHTML = `<strong>Advertencia:</strong> ${warnings.join(' ')} <span style="display:block;margin-top:8px;color:#856404;font-size:13px">Para procesar PC temporalmente cambie el modo a 'PC' en la interfaz o ajuste <code>APP_CONFIG.mode</code>.</span>`;
      } else {
        warningsDiv.style.display = 'none';
        warningsDiv.innerHTML = '';
      }
    };

    reader.readAsText(file);
  });

  fileInput.click();
}

function toggleMode(newMode) {
  APP_CONFIG.mode = newMode;
  document.getElementById('mode-indicator').textContent = `Modo actual: ${newMode}`;
  
  // Re-render si ya hay datos cargados
  if (relevantData.length > 0) {
    const resultOutput = document.getElementById('resultOutput');
    resultOutput.innerHTML = relevantDataToForm(relevantData, APP_CONFIG);
  }
}

function printContent() {
  const headerContainer = document.querySelector('.header-container');
  const printButtonsContainer = document.querySelector('.print-buttons-container');
  if (headerContainer) headerContainer.style.display = 'none';
  if (printButtonsContainer) printButtonsContainer.style.display = 'none';
  window.print();
  if (headerContainer) headerContainer.style.display = 'block';
  if (printButtonsContainer) printButtonsContainer.style.display = 'block';
}

// These functions are now implemented in the lib/ modules
// and available globally via window object
