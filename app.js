(() => {
  const CONFIG = window.RMG_CONFIG;
  const U = window.RMGUtils;
  const API = window.RMGApi;

  let reportes = [];
  let reportesFiltrados = [];
  let fallasActivas = {};
  let contadorFallas = 0;
  let cargandoDatos = false;
  let rmgSeleccionada = '';

  const els = {
    contenedor: U.$('contenedorFallas'),
    operador: U.$('operadorGeneral'),
    btnAgregar: U.$('btnAgregarFalla'),
    btnUsoBypass: U.$('btnUsoBypass'),
    btnExportar: U.$('btnExportar'),
    btnLimpiarOperador: U.$('btnLimpiarOperador'),
    btnActualizarResumen: U.$('btnActualizarResumen'),
    resumenRmg: U.$('resumenRmg'),
    statTotal: U.$('statTotal'),
    statAbiertas: U.$('statAbiertas'),
    statCerradas: U.$('statCerradas'),
    statActualizacion: U.$('statActualizacion')
  };

  function inicializarListas() {
    U.llenarSelect(els.operador, CONFIG.operadores, 'Seleccione operador');
    cargarOperadorActual();
  }

  function guardarOperadorActual() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.operador, els.operador.value || '');
  }

  function cargarOperadorActual() {
    const operadorGuardado = localStorage.getItem(CONFIG.STORAGE_KEYS.operador) || '';
    if (operadorGuardado && ![...els.operador.options].some(opt => opt.value === operadorGuardado)) {
      const opcion = document.createElement('option');
      opcion.value = operadorGuardado;
      opcion.textContent = operadorGuardado;
      els.operador.appendChild(opcion);
    }
    els.operador.value = operadorGuardado;
  }

  function limpiarOperadorActual() {
    els.operador.value = '';
    localStorage.removeItem(CONFIG.STORAGE_KEYS.operador);
    U.mostrarMensaje('Operador limpiado. Selecciona el nuevo operador activo.', 'info');
  }

  function crearSelect(campo, lista, id, placeholder = 'Seleccione') {
    const select = document.createElement('select');
    select.id = `${campo}${id}`;
    U.llenarSelect(select, lista, placeholder);
    return select;
  }

  function crearCampoSelect(label, campo, lista, id, placeholder) {
    const div = document.createElement('div');
    div.className = 'field';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    div.appendChild(lab);
    div.appendChild(crearSelect(campo, lista, id, placeholder));
    return div;
  }

  function crearCampoTexto(label, campo, id, placeholder = '', tipo = 'text') {
    const div = document.createElement('div');
    div.className = 'field';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    const input = document.createElement('input');
    input.type = tipo;
    input.id = `${campo}${id}`;
    input.placeholder = placeholder;
    div.appendChild(lab);
    div.appendChild(input);
    return div;
  }

  function crearCampoTextarea(label, campo, id, placeholder = '') {
    const div = document.createElement('div');
    div.className = 'field full';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    const textarea = document.createElement('textarea');
    textarea.id = `${campo}${id}`;
    textarea.placeholder = placeholder;
    div.appendChild(lab);
    div.appendChild(textarea);
    return div;
  }

  function crearStatusBox(label, campo, id, texto = 'Pendiente') {
    const box = document.createElement('div');
    box.className = 'status-box';
    const lbl = document.createElement('div');
    lbl.className = 'status-label';
    lbl.textContent = label;
    const value = document.createElement('div');
    value.className = 'status-value';
    value.id = `${campo}${id}`;
    value.textContent = texto;
    box.append(lbl, value);
    return box;
  }

  function crearBoton(texto, clase, handler) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = texto;
    btn.className = clase;
    btn.addEventListener('click', handler);
    return btn;
  }

  function agregarFalla() {
    contadorFallas += 1;
    const id = contadorFallas;

    fallasActivas[id] = {
      horaInicio: null,
      horaFin: null,
      reporteId: null,
      numeroFallaOriginal: null,
      cerradoOriginal: false,
      horaFinOriginal: null
    };

    const card = document.createElement('article');
    card.className = 'falla-box';
    card.id = `card${id}`;

    const head = document.createElement('div');
    head.className = 'falla-head';
    const titleWrap = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = `Nueva falla ${id}`;
    const mode = document.createElement('div');
    mode.className = 'card-mode';
    mode.id = `modo${id}`;
    mode.textContent = 'Nuevo reporte';
    titleWrap.append(h3, mode);
    const btnQuitar = crearBoton('Quitar', 'btn-remove-card', () => eliminarCardFalla(id));
    head.append(titleWrap, btnQuitar);

    const topButtons = document.createElement('div');
    topButtons.className = 'buttons buttons-top';
    const btnIniciar = crearBoton('Iniciar', 'btn btn-success', () => iniciarFalla(id));
    btnIniciar.id = `btnIniciar${id}`;
    const btnFinalizar = crearBoton('Finalizar', 'btn btn-danger', () => finalizarFalla(id));
    btnFinalizar.id = `btnFinalizar${id}`;
    topButtons.append(btnIniciar, btnFinalizar);

    const grid = document.createElement('div');
    grid.className = 'form-grid';
    grid.append(
      crearCampoSelect('Grúa', 'rmg', CONFIG.rmgs, id),
      crearCampoSelect('Turno', 'turno', CONFIG.turnos, id),
      crearCampoSelect('Área / Ubicación', 'area', CONFIG.areas, id),
      crearCampoSelect('Modo de operación', 'modoOperacion', CONFIG.modosOperacion, id),
      crearCampoSelect('Tipo de falla', 'tipoFalla', CONFIG.tiposFalla, id)
    );

    const statusGrid = document.createElement('div');
    statusGrid.className = 'status-grid';
    statusGrid.append(
      crearStatusBox('Hora de inicio', 'inicio', id, 'No iniciada'),
      crearStatusBox('Hora de finalización', 'fin', id, 'No finalizada'),
      crearStatusBox('Tiempo total', 'tiempo', id, 'Pendiente'),
      crearStatusBox('Estado', 'estado', id, 'Sin iniciar')
    );

    const desc = crearCampoTextarea('Descripción de la falla', 'descripcion', id, 'Describa la falla presentada');
    const accion = crearCampoTextarea('Acción tomada', 'accionTomada', id, 'Indique la acción realizada o pendiente');
    const cierre = crearCampoTextarea('Observación de cierre', 'observacionCierre', id, 'Comentario final al cerrar la falla');

    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    const btnGuardar = crearBoton('Guardar', 'btn btn-primary', () => guardarReporte(id));
    btnGuardar.id = `btnGuardar${id}`;
    buttons.append(btnGuardar, crearBoton('Limpiar', 'btn btn-light', () => limpiarFalla(id)));

    card.append(head, topButtons, grid, statusGrid, desc, accion, cierre, buttons);
    els.contenedor.appendChild(card);
    actualizarVistaFalla(id);
    return id;
  }

  function tieneDatosEnCard(id) {
    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    const falla = fallasActivas[id] || {};
    return campos.some(campo => U.$(`${campo}${id}`)?.value?.trim()) || falla.horaInicio || falla.horaFin || falla.reporteId;
  }

  function eliminarCardFalla(id) {
    if (tieneDatosEnCard(id) && !confirm(`¿Deseas quitar la tarjeta de Falla ${id}? Los datos no guardados se perderán.`)) {
      return;
    }
    delete fallasActivas[id];
    U.$(`card${id}`)?.remove();
    U.mostrarMensaje(`Se quitó la tarjeta de Falla ${id}.`, 'info');
  }

  function fallaYaCerrada(falla) {
    return Boolean(falla?.horaFin) || falla?.cerradoOriginal === true;
  }

  function iniciarFalla(id) {
    const falla = fallasActivas[id];
    if (!falla) return;
    if (fallaYaCerrada(falla)) {
      U.mostrarMensaje(`La Falla ${id} ya está cerrada. No se puede reiniciar ni cambiar sus horas.`, 'error');
      return;
    }
    falla.horaInicio = U.fechaISOActual();
    falla.horaFin = null;
    actualizarVistaFalla(id);
    U.mostrarMensaje(`Hora de inicio registrada para la Falla ${id}.`, 'success');
  }

  function finalizarFalla(id) {
    const falla = fallasActivas[id];
    if (!falla?.horaInicio) {
      U.mostrarMensaje(`Primero debes iniciar la Falla ${id}.`, 'error');
      return;
    }
    if (fallaYaCerrada(falla)) {
      U.mostrarMensaje(`La Falla ${id} ya está cerrada. No se puede volver a finalizar ni cambiar la hora de cierre.`, 'error');
      return;
    }
    falla.horaFin = U.fechaISOActual();
    actualizarVistaFalla(id);
    U.mostrarMensaje(`Hora de finalización registrada para la Falla ${id}.`, 'success');
  }

  function actualizarVistaFalla(id) {
    const falla = fallasActivas[id];
    if (!falla) return;

    const cerrado = fallaYaCerrada(falla);
    const horaFinVista = falla.horaFinOriginal || falla.horaFin;
    const estado = !falla.horaInicio ? 'Sin iniciar' : (cerrado ? 'Cerrada' : 'Abierta');
    U.$(`inicio${id}`).textContent = falla.horaInicio ? U.formatearFecha(falla.horaInicio) : 'No iniciada';
    U.$(`fin${id}`).textContent = horaFinVista ? U.formatearFecha(horaFinVista) : 'No finalizada';
    U.$(`tiempo${id}`).textContent = U.calcularTiempoTexto(falla.horaInicio, horaFinVista);
    U.$(`estado${id}`).textContent = estado;
    U.$(`modo${id}`).textContent = falla.reporteId
      ? `${falla.cerradoOriginal ? 'Reporte cerrado / Admin' : 'Editando'} ${falla.numeroFallaOriginal || 'reporte'}`
      : 'Nuevo reporte';
    U.$(`btnGuardar${id}`).textContent = falla.reporteId ? 'Actualizar reporte' : 'Guardar';

    const btnIniciar = U.$(`btnIniciar${id}`);
    const btnFinalizar = U.$(`btnFinalizar${id}`);
    if (btnIniciar) {
      btnIniciar.disabled = cerrado;
      btnIniciar.title = cerrado ? 'La falla está cerrada. No se puede reiniciar.' : '';
    }
    if (btnFinalizar) {
      btnFinalizar.disabled = cerrado;
      btnFinalizar.title = cerrado ? 'La falla ya está cerrada. La hora de cierre está bloqueada.' : '';
    }
  }

  function leerReporteDesdeCard(id) {
    const falla = fallasActivas[id];
    const horaInicio = falla?.horaInicio || null;
    const horaFin = falla?.cerradoOriginal ? (falla?.horaFinOriginal || falla?.horaFin || null) : (falla?.horaFin || null);
    const operador = U.normalizarTexto(els.operador.value);
    const estado = horaFin ? 'Cerrada' : 'Abierta';

    return {
      id: falla?.reporteId || '',
      numeroFalla: falla?.numeroFallaOriginal || '',
      operador,
      rmg: U.$(`rmg${id}`).value,
      turno: U.$(`turno${id}`).value,
      area: U.$(`area${id}`).value,
      posicion: '',
      modoOperacion: U.$(`modoOperacion${id}`).value,
      severidad: '',
      tipoFalla: U.$(`tipoFalla${id}`).value,
      responsable: '',
      descripcion: U.normalizarTexto(U.$(`descripcion${id}`).value),
      accionTomada: U.normalizarTexto(U.$(`accionTomada${id}`).value),
      observacionCierre: U.normalizarTexto(U.$(`observacionCierre${id}`).value),
      horaInicio,
      horaFin,
      tiempoTotalMinutos: U.calcularMinutos(horaInicio, horaFin),
      tiempoTexto: U.calcularTiempoTexto(horaInicio, horaFin),
      estado,
      fechaRegistro: falla?.fechaRegistro || U.fechaISOActual(),
      fechaActualizacion: U.fechaISOActual(),
      creadoPor: operador,
      actualizadoPor: operador,
      eliminado: false
    };
  }

  function validarReporte(reporte, id) {
    const faltantes = [];
    if (!reporte.operador) faltantes.push('operador');
    if (!reporte.rmg) faltantes.push('grúa');
    if (!reporte.turno) faltantes.push('turno');
    if (!reporte.area) faltantes.push('área');
    if (!reporte.modoOperacion) faltantes.push('modo de operación');
    if (!reporte.tipoFalla) faltantes.push('tipo de falla');
    if (!reporte.descripcion) faltantes.push('descripción');
    if (!reporte.horaInicio) faltantes.push('hora de inicio');

    if (faltantes.length > 0) {
      U.mostrarMensaje(`Falla ${id}: completa ${faltantes.join(', ')}.`, 'error');
      return false;
    }
    return true;
  }

  function solicitarClaveAdminParaCerrado(id) {
    const falla = fallasActivas[id];
    if (!falla?.reporteId || falla?.cerradoOriginal !== true) return '';

    const clave = prompt('Este reporte ya está cerrado. Solo el administrador puede actualizarlo. Ingresa la contraseña de administrador:');
    if (clave === null) return null;
    const claveLimpia = U.normalizarTexto(clave);
    if (!claveLimpia) {
      U.mostrarMensaje('Actualización cancelada: debes ingresar la contraseña de administrador.', 'error');
      return null;
    }
    return claveLimpia;
  }

  function obtenerTurnoAutomatico(fecha = new Date()) {
    const hora = fecha.getHours();
    if (hora >= 6 && hora < 14) return 'Día';
    if (hora >= 14 && hora < 22) return 'Tarde';
    return 'Noche';
  }

  async function generarReporteUsoBypass() {
    const operador = U.normalizarTexto(els.operador.value);
    if (!operador) {
      U.mostrarMensaje('Para generar el reporte de uso de bypass debes seleccionar el operador activo.', 'error');
      els.operador.focus();
      return;
    }

    const ahora = U.fechaISOActual();
    const reporte = {
      id: '',
      numeroFalla: '',
      operador,
      rmg: 'N/A - Bypass',
      turno: obtenerTurnoAutomatico(new Date()),
      area: 'Operación aRMG',
      posicion: '',
      modoOperacion: 'Bypass',
      severidad: '',
      tipoFalla: 'Uso de Bypass',
      responsable: operador,
      descripcion: 'Registro automático de uso de bypass generado desde el botón rápido.',
      accionTomada: 'Se registra apertura y cierre del uso de bypass.',
      observacionCierre: 'Reporte de uso de bypass cerrado automáticamente.',
      horaInicio: ahora,
      horaFin: ahora,
      tiempoTotalMinutos: 0,
      tiempoTexto: '0 h 0 min',
      estado: 'Cerrada',
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      creadoPor: operador,
      actualizadoPor: operador,
      eliminado: false
    };

    const boton = els.btnUsoBypass;
    U.setLoading(boton, true, 'Generando...');
    try {
      const respuesta = await API.guardar(reporte);
      const guardado = respuesta.reporte || reporte;
      guardarOperadorActual();
      await cargarReportesDesdeServidor(false);
      U.mostrarMensaje(`Reporte de uso de bypass ${guardado.numeroFalla || ''} generado y cerrado correctamente.`, 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      U.setLoading(boton, false);
    }
  }

  async function guardarReporte(id) {
    const fallaActual = fallasActivas[id];
    const claveAdmin = solicitarClaveAdminParaCerrado(id);
    if (claveAdmin === null) return;

    const reporte = leerReporteDesdeCard(id);
    if (!validarReporte(reporte, id)) return;

    if (fallaActual?.cerradoOriginal) {
      reporte.horaFin = fallaActual.horaFinOriginal || fallaActual.horaFin || reporte.horaFin;
      reporte.estado = 'Cerrada';
      reporte.tiempoTotalMinutos = U.calcularMinutos(reporte.horaInicio, reporte.horaFin);
      reporte.tiempoTexto = U.calcularTiempoTexto(reporte.horaInicio, reporte.horaFin);
    }

    const boton = U.$(`btnGuardar${id}`);
    U.setLoading(boton, true, 'Guardando...');

    try {
      if (fallasActivas[id]?.reporteId) {
        await API.actualizar(reporte, claveAdmin);
        U.mostrarMensaje(`Reporte ${reporte.numeroFalla || ''} actualizado correctamente.`, 'success');
      } else {
        const respuesta = await API.guardar(reporte);
        const guardado = respuesta.reporte || reporte;
        fallasActivas[id].reporteId = guardado.id || reporte.id;
        fallasActivas[id].numeroFallaOriginal = guardado.numeroFalla || reporte.numeroFalla;
        U.mostrarMensaje(`Reporte ${guardado.numeroFalla || `Falla ${id}`} guardado correctamente.`, 'success');
      }

      guardarOperadorActual();
      await cargarReportesDesdeServidor(false);
      limpiarFalla(id, false);
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      U.setLoading(boton, false);
    }
  }

  function limpiarFalla(id, aviso = true) {
    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    campos.forEach(campo => {
      const el = U.$(`${campo}${id}`);
      if (el) el.value = '';
    });

    fallasActivas[id] = {
      horaInicio: null,
      horaFin: null,
      reporteId: null,
      numeroFallaOriginal: null,
      cerradoOriginal: false,
      horaFinOriginal: null
    };
    actualizarVistaFalla(id);
    if (aviso) U.mostrarMensaje(`Falla ${id} limpiada.`, 'info');
  }

  function reporteEstaAbierto(rep) {
    return !U.estaEliminado(rep) && rep.estado !== 'Cerrada' && !rep.horaFin;
  }

  function reporteEstaCerrado(rep) {
    return !U.estaEliminado(rep) && (rep.estado === 'Cerrada' || Boolean(rep.horaFin));
  }

  function ordenarReportes(lista) {
    return Array.isArray(lista)
      ? [...lista].sort((a, b) => new Date(b.horaInicio || b.fechaRegistro || 0) - new Date(a.horaInicio || a.fechaRegistro || 0))
      : [];
  }

  function guardarCacheReportes() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.cacheReportesActivos, JSON.stringify(reportes));
      localStorage.setItem(CONFIG.STORAGE_KEYS.cacheTimestampActivos, U.fechaISOActual());
    } catch (error) {
      // Si el navegador no permite guardar caché o se llena el espacio, el sistema sigue funcionando normal.
    }
  }

  function cargarReportesDesdeCache() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.cacheReportesActivos);
      if (!raw) return false;
      const lista = JSON.parse(raw);
      if (!Array.isArray(lista)) return false;
      reportes = ordenarReportes(lista);
      reportesFiltrados = reportes.filter(rep => !U.estaEliminado(rep));
      actualizarIndicadores();
      const ultima = localStorage.getItem(CONFIG.STORAGE_KEYS.cacheTimestampActivos);
      if (ultima && els.statActualizacion) {
        els.statActualizacion.textContent = `${new Date(ultima).toLocaleString('es-PA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} cache`;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function actualizarIndicadores() {
    const activos = reportes.filter(rep => !U.estaEliminado(rep));
    const abiertas = activos.filter(reporteEstaAbierto);
    const cerradas = activos.filter(reporteEstaCerrado);
    els.statTotal.textContent = activos.length;
    els.statAbiertas.textContent = abiertas.length;
    els.statCerradas.textContent = cerradas.length;
    els.statActualizacion.textContent = new Date().toLocaleString('es-PA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    renderResumenRmg(abiertas);
    if (rmgSeleccionada) renderDetalleReportesAbiertos(rmgSeleccionada, false);
  }

  function renderResumenRmg(abiertas) {
    if (!els.resumenRmg) return;
    els.resumenRmg.textContent = '';
    CONFIG.rmgs.forEach(rmg => {
      const cantidad = abiertas.filter(rep => rep.rmg === rmg).length;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `rmg-pill ${cantidad > 0 ? 'has-open' : ''} ${rmgSeleccionada === rmg ? 'selected' : ''}`;
      pill.dataset.rmg = rmg;
      pill.setAttribute('aria-label', `${rmg}: ${cantidad} falla${cantidad === 1 ? '' : 's'} abierta${cantidad === 1 ? '' : 's'}. Tocar para desplegar reportes.`);
      const nombre = document.createElement('strong');
      nombre.textContent = rmg;
      const valor = document.createElement('span');
      valor.textContent = `${cantidad} abierta${cantidad === 1 ? '' : 's'}`;
      pill.append(nombre, valor);
      pill.addEventListener('click', () => mostrarReportesAbiertosPorRmg(rmg));
      els.resumenRmg.appendChild(pill);
    });
  }

  function asegurarPanelDetalle() {
    let panel = U.$('detalleFallasAbiertasRmg');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'detalleFallasAbiertasRmg';
      panel.className = 'open-reports-panel';
      panel.hidden = true;
      els.resumenRmg.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  function mostrarReportesAbiertosPorRmg(rmg) {
    rmgSeleccionada = rmg;
    els.resumenRmg.querySelectorAll('.rmg-pill').forEach(pill => {
      pill.classList.toggle('selected', pill.dataset.rmg === rmg);
    });
    renderDetalleReportesAbiertos(rmg, true);
  }

  function renderDetalleReportesAbiertos(rmg, moverVista = false) {
    const panel = asegurarPanelDetalle();
    const lista = reportes
      .filter(rep => reporteEstaAbierto(rep) && rep.rmg === rmg)
      .sort((a, b) => new Date(b.horaInicio || b.fechaRegistro || 0) - new Date(a.horaInicio || a.fechaRegistro || 0));

    panel.textContent = '';
    panel.hidden = false;

    const header = document.createElement('div');
    header.className = 'open-reports-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = `Reportes abiertos - ${rmg}`;
    const subtitle = document.createElement('p');
    subtitle.textContent = `${lista.length} reporte${lista.length === 1 ? '' : 's'} sin cerrar.`;
    titleWrap.append(title, subtitle);

    const btnOcultar = crearBoton('Ocultar', 'btn btn-light', () => {
      panel.hidden = true;
      rmgSeleccionada = '';
      els.resumenRmg.querySelectorAll('.rmg-pill').forEach(pill => pill.classList.remove('selected'));
    });

    header.append(titleWrap, btnOcultar);
    panel.appendChild(header);

    if (lista.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'open-reports-empty';
      empty.textContent = `No hay reportes abiertos para ${rmg}.`;
      panel.appendChild(empty);
      if (moverVista) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const list = document.createElement('div');
    list.className = 'open-reports-list';

    lista.forEach(rep => {
      const card = document.createElement('article');
      card.className = 'open-report-card';

      const top = document.createElement('div');
      top.className = 'open-report-top';
      const numero = document.createElement('strong');
      numero.textContent = rep.numeroFalla || 'Sin número';
      top.appendChild(numero);
      top.appendChild(U.crearBadge(rep.estado || 'Abierta', false));

      const meta = document.createElement('div');
      meta.className = 'open-report-meta';
      meta.append(
        crearMetaItem('Inicio', U.formatearFecha(rep.horaInicio) || 'Sin inicio'),
        crearMetaItem('Operador', rep.operador || 'Sin operador'),
        crearMetaItem('Tipo', rep.tipoFalla || 'Sin tipo'),
        crearMetaItem('Área', rep.area || 'Sin área')
      );

      const desc = document.createElement('p');
      desc.className = 'open-report-desc';
      desc.textContent = rep.descripcion || 'Sin descripción registrada.';

      const acciones = document.createElement('div');
      acciones.className = 'open-report-actions';
      acciones.appendChild(crearBoton('Cargar reporte', 'btn btn-primary', () => cargarReporteEnFormulario(rep)));

      card.append(top, meta, desc, acciones);
      list.appendChild(card);
    });

    panel.appendChild(list);
    if (moverVista) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function crearMetaItem(label, value) {
    const item = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = label;
    const span = document.createElement('span');
    span.textContent = value;
    item.append(strong, span);
    return item;
  }

  async function cargarReportesDesdeServidor(mostrarAviso = false) {
    if (cargandoDatos) return;
    cargandoDatos = true;
    U.setLoading(els.btnActualizarResumen, true, 'Actualizando...');
    try {
      // En la pantalla principal solo se necesitan reportes activos para el resumen.
      // Esto evita traer eliminados y reduce carga cuando la base crece.
      reportes = ordenarReportes(await API.listar(false));
      reportesFiltrados = reportes.filter(rep => !U.estaEliminado(rep));
      actualizarIndicadores();
      guardarCacheReportes();
      if (mostrarAviso) U.mostrarMensaje('Datos actualizados desde Google Sheets.', 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      cargandoDatos = false;
      U.setLoading(els.btnActualizarResumen, false);
    }
  }

  function cargarReporteEnFormulario(reporte) {
    let cardId = Object.keys(fallasActivas).find(key => !tieneDatosEnCard(key));
    if (!cardId) cardId = agregarFalla();
    cardId = Number(cardId);

    const cerradoOriginal = reporteEstaCerrado(reporte);
    fallasActivas[cardId] = {
      horaInicio: reporte.horaInicio || null,
      horaFin: reporte.horaFin || null,
      reporteId: reporte.id,
      numeroFallaOriginal: reporte.numeroFalla,
      fechaRegistro: reporte.fechaRegistro,
      cerradoOriginal,
      horaFinOriginal: cerradoOriginal ? (reporte.horaFin || null) : null
    };

    if (reporte.operador) {
      if (![...els.operador.options].some(opt => opt.value === reporte.operador)) {
        const opt = document.createElement('option');
        opt.value = reporte.operador;
        opt.textContent = reporte.operador;
        els.operador.appendChild(opt);
      }
      els.operador.value = reporte.operador;
      guardarOperadorActual();
    }

    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    campos.forEach(campo => {
      const el = U.$(`${campo}${cardId}`);
      if (el) el.value = reporte[campo] || '';
    });

    actualizarVistaFalla(cardId);
    U.$(`card${cardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    U.mostrarMensaje(
      cerradoOriginal
        ? `Reporte ${reporte.numeroFalla || ''} cargado. Está cerrado: la hora de cierre queda bloqueada y solo administrador puede actualizarlo.`
        : `Reporte ${reporte.numeroFalla || ''} cargado para revisión o cierre.`,
      'success'
    );
  }

  function cargarReporteParaEditar() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.reporteSeleccionado);
    if (!raw) return;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.reporteSeleccionado);

    try {
      cargarReporteEnFormulario(JSON.parse(raw));
    } catch (error) {
      U.mostrarMensaje('No se pudo cargar el reporte seleccionado.', 'error');
    }
  }

  function exportar() {
    const activos = reportesFiltrados.filter(rep => !U.estaEliminado(rep));
    if (activos.length === 0) {
      U.mostrarMensaje('No hay reportes activos para exportar.', 'error');
      return;
    }
    U.exportarReportes(activos, 'reporte_fallas_rmg_3.2.xlsx');
    localStorage.setItem(CONFIG.STORAGE_KEYS.ultimaExportacion, U.fechaISOActual());
    U.mostrarMensaje('Archivo Excel exportado correctamente.', 'success');
  }

  async function iniciar() {
    inicializarListas();
    els.operador.addEventListener('change', guardarOperadorActual);
    els.btnLimpiarOperador.addEventListener('click', limpiarOperadorActual);
    els.btnAgregar.addEventListener('click', agregarFalla);
    els.btnUsoBypass.addEventListener('click', generarReporteUsoBypass);
    els.btnExportar.addEventListener('click', exportar);
    els.btnActualizarResumen.addEventListener('click', () => cargarReportesDesdeServidor(true));

    agregarFalla();
    agregarFalla();
    agregarFalla();

    // Muestra de inmediato la última información guardada en el navegador
    // y actualiza Google Sheets en segundo plano.
    cargarReportesDesdeCache();
    cargarReporteParaEditar();
    cargarReportesDesdeServidor(false);

    setInterval(() => cargarReportesDesdeServidor(false), CONFIG.REFRESH_MS);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
