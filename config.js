/*
  Configuración general del sistema.
  - Cambia API_URL si publicas un nuevo Google Apps Script.
  - Los valores de listas se editan aquí y aplican a captura e historial.
*/
window.RMG_CONFIG = {
  version: '3.2.1',
  API_URL: 'https://script.google.com/macros/s/AKfycbwurv0uVeglPxtebjIGP0hPezh-14A9PbPqZ1mOnwBhjGMvEhxIQ_pEgQow5rXncOxc/exec',
  REFRESH_MS: 45000,
  HISTORIAL_PAGE_SIZE: 25,
  STORAGE_KEYS: {
    operador: 'reporteRmgOperadorActivo',
    reporteSeleccionado: 'reporteRmgSeleccionado',
    ultimaExportacion: 'reporteRmgUltimaExportacion',
    cacheReportesActivos: 'reporteRmgCacheReportesActivosV321_NUEVO_SHEETS',
    cacheTimestampActivos: 'reporteRmgCacheTimestampActivosV321_NUEVO_SHEETS',
    cacheReportesHistorial: 'reporteRmgCacheReportesHistorialV321_NUEVO_SHEETS',
    cacheTimestampHistorial: 'reporteRmgCacheTimestampHistorialV321_NUEVO_SHEETS',
    apiUrlActiva: 'reporteRmgApiUrlActiva'
  },
  rmgs: Array.from({ length: 12 }, (_, i) => `RMG ${i + 1}`),
  turnos: ['Día', 'Tarde', 'Noche'],
  operadores: [
    'GILBERTO HERNÁNDEZ',
    'MADELAINE GUZMÁN',
    'RONALDO ZUÑIGA',
    'RICARDO ORTEGA',
    'LISSETH VASQUEZ',
    'JUAN ROJAS',
    'SUSAN GARCIA',
    'MIRIAN VILLALAZ',
    'KEVIN BATISTA',
    'NATHALY CARDENAS',
    'CHELSEA CHIU',
    'JOSE BARRIOS',
    'THOMAS DEL BARRIO',
    'YOHALYS JIMENEZ'
  ],
  areas: ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4', 'Otro'],
  tiposFalla: ['Gantry', 'Hoist', 'Trolley', 'Spreader', 'Micromotion', 'CPS', 'RFID', 'LPS', 'Anti-Lift', 'Cabin Protection', 'Camaras', 'Otros'],
  modosOperacion: ['Automático', 'Remoto', 'Manual', 'Mantenimiento'],
  severidades: ['Baja', 'Media', 'Alta', 'Crítica']
};

// Limpieza automática de caché cuando se cambia el destino de Google Sheets.
// Esto evita que la pantalla muestre datos guardados del Google Sheets anterior.
try {
  const actual = window.RMG_CONFIG.API_URL;
  const anterior = localStorage.getItem(window.RMG_CONFIG.STORAGE_KEYS.apiUrlActiva);
  if (anterior && anterior !== actual) {
    [
      'reporteRmgCacheReportesActivosV32',
      'reporteRmgCacheTimestampActivosV32',
      'reporteRmgCacheReportesHistorialV32',
      'reporteRmgCacheTimestampHistorialV32',
      window.RMG_CONFIG.STORAGE_KEYS.cacheReportesActivos,
      window.RMG_CONFIG.STORAGE_KEYS.cacheTimestampActivos,
      window.RMG_CONFIG.STORAGE_KEYS.cacheReportesHistorial,
      window.RMG_CONFIG.STORAGE_KEYS.cacheTimestampHistorial,
      window.RMG_CONFIG.STORAGE_KEYS.reporteSeleccionado
    ].forEach(k => localStorage.removeItem(k));
  }
  localStorage.setItem(window.RMG_CONFIG.STORAGE_KEYS.apiUrlActiva, actual);
} catch (error) {
  console.warn('No se pudo limpiar la caché local del reporte aRMG.', error);
}
