/*
  Configuración general del sistema.
  - Cambia API_URL si publicas un nuevo Google Apps Script.
  - Los valores de listas se editan aquí y aplican a captura e historial.
*/
window.RMG_CONFIG = {
  version: '3.3',
  API_URL: 'https://script.google.com/macros/s/AKfycbzSMC3qjhgn3uPWA2ehIfwpKTSKvP0Z4oVZtNGPJ26PHiL2GU4PqFaXLaXe8HY6aL4Y/exec',
  REFRESH_MS: 45000,
  HISTORIAL_PAGE_SIZE: 25,
  STORAGE_KEYS: {
    operador: 'reporteRmgOperadorActivo',
    reporteSeleccionado: 'reporteRmgSeleccionado',
    ultimaExportacion: 'reporteRmgUltimaExportacion',
    cacheReportesActivos: 'reporteRmgCacheReportesActivosV33',
    cacheTimestampActivos: 'reporteRmgCacheTimestampActivosV33',
    cacheReportesHistorial: 'reporteRmgCacheReportesHistorialV33',
    cacheTimestampHistorial: 'reporteRmgCacheTimestampHistorialV33'
  },
  equipos: [
    ...Array.from({ length: 12 }, (_, i) => `RMG ${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `Mesa Remota ${i + 1}`)
  ],
  get rmgs() {
    return this.equipos;
  },
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
  areas: ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4', 'Sala RCS / Mesa Remota', 'Otro'],
  tiposFalla: ['Gantry', 'Hoist', 'Trolley', 'Spreader', 'Micromotion', 'CPS', 'RFID', 'LPS', 'Anti-Lift', 'Cabin Protection', 'Cámaras', 'Mesa Remota / RCS', 'Otros'],
  modosOperacion: ['Automático', 'Remoto', 'Manual', 'Mantenimiento'],
  severidades: ['Baja', 'Media', 'Alta', 'Crítica']
};
