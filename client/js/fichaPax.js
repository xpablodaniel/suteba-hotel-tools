(function(){
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const preview = document.getElementById('preview');
  const generateBtn = document.getElementById('generateBtn');
  const status = document.getElementById('status');
  const thumbnails = document.getElementById('thumbnails');
  const previewFrame = document.getElementById('previewFrame');

  let parsedRows = [];
  let grouped = []; // groups by voucher (computed after parsing)

  function preventDefaults(e){e.preventDefault();e.stopPropagation();}
  ['dragenter','dragover','dragleave','drop'].forEach(evt => dropArea.addEventListener(evt, preventDefaults));

  dropArea.addEventListener('drop', e => {
    const dt = e.dataTransfer; const files = dt.files; handleFiles(files);
  });

  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files){
    if(!files || files.length===0) return;
    const file = files[0];
    fileInfo.textContent = `Archivo: ${file.name} — ${Math.round(file.size/1024)} KB`;
    parseCSVFile(file);
  }

  function parseCSVFile(file){
    status.textContent = 'Parseando...';
    Papa.parse(file, {
      header:true,
      skipEmptyLines:true,
      complete: function(results){
        parsedRows = results.data;
        status.textContent = `Filas: ${parsedRows.length}`;
        // compute groups by voucher for ZIP generation
        grouped = groupByVoucher(parsedRows);
        renderPreview(parsedRows);
        updateGenerateLabel();
        generateBtn.disabled = parsedRows.length===0;
      },
      error: function(err){ status.textContent = 'Error parseando CSV: '+err.message }
    });
  }

  function renderPreview(rows){
    const sample = rows.slice(0,10);
    let html = '<table><thead><tr>' + Object.keys(sample[0]||{}).map(h=>`<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    sample.forEach(r => {
      html += '<tr>' + Object.values(r).slice(0,Object.keys(r).length).map(c=>`<td>${escapeHtml(String(c||''))}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    preview.innerHTML = html;
  }

  function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c]) }

  // Update the generate button label to show the number of fichas to download
  function updateGenerateLabel(){
    const n = (grouped && grouped.length) ? grouped.length : (parsedRows.length || 0);
    generateBtn.textContent = n > 0 ? `Descargar ${n} ficha${n===1? '': 's'} (ZIP)` : 'Descargar fichas (ZIP)';
  }

  // Group rows by Voucher and pick titular (oldest by Edad) + accompanantes
  function groupByVoucher(rows){
    const m = {};
    rows.forEach(r=>{
      const v = (r['Voucher']||r['voucher']||'').toString().trim();
      if(!v) return;
      if(!m[v]) m[v]=[];
      m[v].push(r);
    });
    const groups = Object.keys(m).map(v=>{
      const pax = m[v];
      // choose titular by max Edad when present
      let titular = pax[0];
      try{
        const hasEdad = pax.some(p=>p['Edad'] && !isNaN(parseInt(p['Edad'])));
        if(hasEdad){
          titular = pax.reduce((a,b)=> ((parseInt(a['Edad']||0) >= parseInt(b['Edad']||0))? a : b));
        }
      }catch(e){ /* ignore and fallback */ }
      const acompanantes = pax.filter(p=>p!==titular);
      const todas_habitaciones = Array.from(new Set(pax.map(p=>p['Nro. habitación']||p['Nro habitacion']||p['Habitacion']||'').filter(Boolean)));
      return { voucher: v, titular, acompanantes, todas_habitaciones, num_pasajeros: pax.length, rows: pax };
    });
    return groups;
  }

  // Basic PDF generation using pdf-lib and the existing template in python/fichaPax/fichaPax.pdf
  async function generateAll(){
    generateBtn.disabled = true; status.textContent = 'Generando PDFs...'; thumbnails.innerHTML='';
    const templateUrl = '/python/fichaPax/fichaPax.pdf';
    const templateBytes = await fetch(templateUrl).then(r=>r.arrayBuffer());
    const zip = new JSZip();

    const groupsList = (grouped && grouped.length) ? grouped : groupByVoucher(parsedRows);
    // Limit thumbnail previews to a small number (examples only)
    let thumbsShown = 0; const maxThumbs = 2;
    for(let i=0;i<groupsList.length;i++){
      const group = groupsList[i];
      status.textContent = `Generando ${i+1}/${groupsList.length}`;
      const pdfBytes = await fillTemplate(templateBytes, group, i);
      const nameBase = sanitizeFilename((group.voucher || group.titular['Apellido y nombre'] || group.titular['Nombre'] || ('ficha_'+(i+1))).toString());
      const name = `${nameBase}_${i+1}.pdf`;
      zip.file(name, pdfBytes);

      // show preview thumb for first few (limit to maxThumbs examples)
      if(thumbsShown < maxThumbs){
        const blob = new Blob([pdfBytes], {type:'application/pdf'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.textContent = name; a.target='_blank';
        const div = document.createElement('div'); div.style.margin='6px'; div.appendChild(a); thumbnails.appendChild(div);
        if(thumbsShown===0) previewFrame.src = url;
        thumbsShown++;
      }
      await sleep(50);
    }

    // Show a small summary about number of generated files and how many examples are shown
    const shown = Math.min(maxThumbs, groupsList.length);
    const info = document.createElement('div'); info.style.margin='6px 0'; info.textContent = `Mostrando ${shown} de ${groupsList.length} fichas como ejemplo.`;
    thumbnails.prepend(info);

    status.textContent = 'Creando ZIP...';
    const zipBlob = await zip.generateAsync({type:'blob'}, (meta)=>{ status.textContent = `Comprimiendo: ${Math.round(meta.percent)}%`; });
    triggerDownload(zipBlob, 'fichas.zip');
    status.textContent = 'Listo';
    generateBtn.disabled = false;
    updateGenerateLabel();
  }

  async function fillTemplate(templateBytes, group, idx){
    // Use the positions map extracted from generar_con_overlay.py (python/fichaPax/positions.json)
    const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const first = pages[0];

    // Embed fonts
    const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Load positions map (cache on window)
    if(!window.__ficha_positions_map){
      const map = await fetch('/python/fichaPax/positions.json').then(r=>r.json());
      window.__ficha_positions_map = map.fields || {};
    }
    const pos = window.__ficha_positions_map;

    const mmToPt = 72/25.4; // points per mm
    const pageHeight = first.getHeight();

    const titular = group.titular || {};

    // Helper to get field from titular
    const tVal = (keys)=>{
      for(const k of keys){ if(titular[k] && String(titular[k]).trim() !== '') return String(titular[k]).trim(); }
      return '';
    };

    // Draw main fields using the map
    const name = tVal(['Apellido y nombre','Nombre','Nombre completo','NombrePax','Nombre y Apellido']);
    if(name && pos['Apellido y nombre']){
      const p = pos['Apellido y nombre'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(name, { x, y, size: p.size || 10, font: helv });
    }

    // Documento tipo + número
    const tipo = tVal(['Tipo documento','Tipo','Tipo Doc']);
    const nro = tVal(['Nro. doc.','Nro doc','Nro Documento']);
    const docText = (tipo? tipo + ': ' : '') + (nro? nro : '');
    if(docText && pos['TipoDocumento_Nro']){
      const p = pos['TipoDocumento_Nro'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(docText, { x, y, size: p.size || 10, font: helv });
    }

    // Telefono / Email
    const telefono = tVal(['Celular','Teléfono','Telefono']);
    if(telefono && pos['Telefono']){
      const p = pos['Telefono'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(telefono, { x, y, size: p.size || 10, font: helv });
    }
    const email = tVal(['Email','E-mail','Correo']);
    if(email && pos['Email']){
      const p = pos['Email'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(email, { x, y, size: p.size || 10, font: helv });
    }

    // Sede
    const sede = tVal(['Sede','Seccional']);
    if(sede && pos['Sede']){
      const p = pos['Sede'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      // Apply the same cleaning as in python script (remove leading NN - )
      const clean = sede.replace(/^\s*\d+\s*[-–—]\s*/, '');
      first.drawText(clean, { x, y, size: p.size || 10, font: helv });
    }

    // Fecha de nacimiento
    const fnac = tVal(['Fecha de nacimiento','Fecha nacimiento','Fecha Nacimiento']);
    if(fnac && pos['Fecha de nacimiento']){
      const p = pos['Fecha de nacimiento'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fnac, { x, y, size: p.size || 10, font: helv });
    }

    // Acompanantes (based on group.acompanantes)
    if(pos['Acomp']){
      const p = pos['Acomp'];
      const acomp = group.acompanantes || [];
      for(let i=0;i<Math.min(acomp.length, p.max); i++){
        const an = acomp[i]['Apellido y nombre'] || acomp[i]['Nombre'] || '';
        const ad = (acomp[i]['Tipo documento']? (acomp[i]['Tipo documento'] + ': ') : '') + (acomp[i]['Nro. doc.'] || acomp[i]['Nro doc'] || '');
        const y = pageHeight - ((p.y_first_top_mm + (i) * p.spacing_mm) * mmToPt);
        const xName = p.x_mm_name * mmToPt;
        const xDoc = p.x_mm_doc * mmToPt;
        if(an) first.drawText(an, { x: xName, y, size: p.size || 9, font: helv });
        if(ad && ad.trim() !== ': ') first.drawText(`${ad}`, { x: xDoc, y, size: p.size || 9, font: helv });
      }
    }

    // Habitacion(s)
    const habitacionesRaw = (group.todas_habitaciones && group.todas_habitaciones.length>0) ? group.todas_habitaciones.join(', ') : '';
    if(pos['NroHabitacion']){
      const p = pos['NroHabitacion'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(habitacionesRaw || '', { x, y, size: p.size || 10, font: helv });
    }

    // Fecha ingreso/egreso (from titular)
    const fIngreso = tVal(['Fecha de ingreso','Fecha ingreso','Checkin']);
    const fEgreso = tVal(['Fecha de egreso','Fecha egreso','Checkout']);
    if(fIngreso && pos['FechaIngreso']){
      const p = pos['FechaIngreso'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fIngreso, { x, y, size: p.size || 10, font: helv });
    }
    if(fEgreso && pos['FechaEgreso']){
      const p = pos['FechaEgreso'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fEgreso, { x, y, size: p.size || 10, font: helv });
    }

    // Servicios -> mark X at positions
    if(pos['Servicios']){
      const p = pos['Servicios'];
      const servicios = (tVal(['Servicios','Servicio']) || '').toUpperCase();
      if(servicios.includes('DESAYUNO') && !servicios.includes('MEDIA')){
        const x = p.x_mm_desayuno * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      } else if(servicios.includes('MEDIA')){
        const x = p.x_mm_media * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      } else if(servicios.includes('COMPLETA') || servicios.includes('PENSION')){
        const x = p.x_mm_completa * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      }
    }

    // Voucher
    const voucher = (group.voucher || titular['Voucher'] || titular['voucher'] || '');
    if(voucher && pos['Voucher']){
      const p = pos['Voucher'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(voucher, { x, y, size: p.size || 11, font: helvBold });
    }

    // Add index for traceability (small grey)
    first.drawText(`#${idx+1}`, { x: 500, y: 40, size: 10, color: PDFLib.rgb(0.5,0.5,0.5), font: helv });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  function sanitizeFilename(s){ return s.replace(/[^a-z0-9\-_\.]/ig,'_').slice(0,120); }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function triggerDownload(blob, name){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  generateBtn.addEventListener('click', generateAll);

})();