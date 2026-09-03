import {
  ClientSideRowModelModule, ColDef, ColumnAutoSizeModule, GridOptions, LocaleModule, ModuleRegistry,
  PaginationModule, QuickFilterModule, RowStyleModule, TextFilterModule, ValidationModule,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
  ClientSideRowModelModule, ColumnAutoSizeModule, PaginationModule, QuickFilterModule,
  TextFilterModule, LocaleModule, RowStyleModule, ValidationModule,
]);

/** Configurazione Community condivisa: nessun modulo Enterprise viene registrato. */
export const definizioneColonnaForo: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 120,
  flex: 1,
};

export const opzioniGrigliaForo: GridOptions = {
  defaultColDef: definizioneColonnaForo,
  rowHeight: 52,
  headerHeight: 48,
  pagination: true,
  paginationPageSize: 12,
  paginationPageSizeSelector: [12, 25, 50],
  animateRows: true,
  localeText: {
    noRowsToShow: 'Nessun risultato',
    loadingOoo: 'Caricamento…',
    page: 'Pagina',
    of: 'di',
    to: 'a',
  },
};
