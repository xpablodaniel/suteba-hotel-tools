// render.js — Generación de plantillas HTML para vouchers

/**
 * Convierte datos relevantes a HTML imprimible
 * @param {Array} relevantData - Datos procesados
 * @param {Object} config - APP_CONFIG
 * @returns {string} HTML de vouchers
 */
function relevantDataToForm(relevantData, config) {
  const groupedData = groupDataByRoomAndVoucher(relevantData);
  let formHTML = '';

  for (const key in groupedData) {
    const group = groupedData[key];
    
    // Ordenar por DNI
    group.sort((a, b) => parseInt(a.dni) - parseInt(b.dni));
    
    const item = group[0];
    
    // Corrección para vouchers individuales
    let finalCantp = item.cantp;
    let finalMealCount = item.mealCount;
    
    if (group.length === 1) {
      finalCantp = 1;
      finalMealCount = config.mealMultiplier[config.mode] * item.stayDuration;
    }

    formHTML += renderVoucher(item, finalCantp, finalMealCount, config);
  }

  return formHTML;
}

/**
 * Renderiza un voucher individual
 * @param {Object} item - Datos del pasajero
 * @param {number} cantp - Cantidad de personas
 * @param {number} mealCount - Cantidad de comidas
 * @param {Object} config - APP_CONFIG
 * @returns {string} HTML del voucher
 */
function renderVoucher(item, cantp, mealCount, config) {
  const mode = config.mode;
  const serviceText = mode === 'MAP' 
    ? 'Favor de brindar servicio de Cena al siguiente afiliado:' 
    : 'Favor de brindar servicio de Pensión Completa al siguiente afiliado:';
  
  const title = mode === 'MAP' ? 'Voucher de Comidas' : 'Voucher de Comidas PPJ';
  
  let html = '<div class="container">';
  html += '<div class="logo-container"><img src="assets/suteba_logo_3.jpg" alt="Logo"></div>';
  html += `<h1 class="h1-container">${title}</h1>`;
  html += `<p class="p-cena">${serviceText}</p>`;
  html += `<div class="passengerName"><strong>Nombre:</strong> ${item.passengerName}</div>`;
  html += `<div class="dni"><strong>Dni:</strong> ${item.dni}</div>`;
  html += `<div class="hotel"><strong>U.Turística:</strong> ${item.hotel}</div>`;
  html += `<div class="din"><strong>Ingreso:</strong> ${item.dinRaw}</div>`;
  html += `<div class="dout"><strong>Egreso:</strong> ${item.doutRaw}</div>`;
  html += `<div class="roomNumber"><strong>Habitación Nº:</strong> <span class="roomNumberContent">${item.roomNumber}</span></div>`;
  html += `<div class="cantp"><strong>Cant. Pax:</strong> ${cantp}</div>`;
  html += '<p class="p-servicios"><strong>Servicios a Tomar</strong></p>';
  html += `<div class="cantMap"><strong>Cant. Comidas:</strong> ${mealCount}</div>`;
  
  // Sección de tildado (configurable)
  html += renderCheckSection(config, mealCount, item.stayDuration);
  
  html += '</div>';
  
  return html;
}

/**
 * Renderiza la sección de tildado según configuración
 * @param {Object} config - APP_CONFIG
 * @param {number} mealCount - Total de comidas
 * @param {number} stayDuration - Días de estadía
 * @returns {string} HTML de la sección de tildado
 */
function renderCheckSection(config, mealCount, stayDuration) {
  const mode = config.mode;
  const renderMode = config.renderMode;
  
  if (renderMode === 'image') {
    // Modo imagen (legacy)
    const imagePath = config.imageForTildes[mode];
    return `<div class="check-container"><img src="${imagePath}" alt="Check boxes"></div>`;
  } else if (renderMode === 'boxes') {
    // Modo casillas HTML imprimibles - formato organizado por tipo de comida y días
    let html = '<div class="check-container check-boxes-grid">';
    
    if (mode === 'PC') {
      // Pensión Completa: secciones separadas para Almuerzo y Cena
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Almuerzo</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
      
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Cena</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
      
    } else {
      // MAP: solo Cena
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Cena</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
    }
    
    html += '</div>';
    return html;
  }
  
  return '';
}

// Exportar funciones al scope global
window.relevantDataToForm = relevantDataToForm;
window.renderVoucher = renderVoucher;
window.renderCheckSection = renderCheckSection;
