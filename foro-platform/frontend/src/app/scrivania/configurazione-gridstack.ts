import { GridStackOptions } from 'gridstack';

export type ChiaveWidgetScrivania =
  | 'calendario'
  | 'documenti'
  | 'email'
  | 'clienti'
  | 'pratiche'
  | 'collaboratori';

export const COLONNE_SCRIVANIA = 12;
export const VERSIONE_LAYOUT_GRIDSTACK = 5;

export const CONFIGURAZIONE_GRIDSTACK = Object.freeze({
  column: COLONNE_SCRIVANIA,
  cellHeight: 46,
  margin: 8,
  animate: true,
  float: false,
  staticGrid: false,
  disableDrag: false,
  disableResize: false,
  alwaysShowResizeHandle: true,
  draggable: {
    handle: '.op-head',
    cancel: 'button, a, input, select, textarea, [role="button"], .widget-actions-menu'
  },
  resizable: { handles: 'se', autoHide: false },
  minRow: 1,
  columnOpts: {
    breakpoints: [{ w: 640, c: 1, layout: 'list' }],
    layout: 'moveScale'
  }
} satisfies GridStackOptions);

export const DIMENSIONI_WIDGET: Record<
  ChiaveWidgetScrivania,
  { w: number; h: number; minW: number; minH: number; maxW: number; maxH: number }
> = Object.freeze({
  calendario: { w: 5, h: 6, minW: 4, minH: 5, maxW: 10, maxH: 16 },
  documenti: { w: 4, h: 5, minW: 3, minH: 4, maxW: 9, maxH: 14 },
  email: { w: 4, h: 5, minW: 3, minH: 4, maxW: 9, maxH: 14 },
  clienti: { w: 4, h: 5, minW: 3, minH: 4, maxW: 9, maxH: 14 },
  pratiche: { w: 4, h: 5, minW: 3, minH: 4, maxW: 9, maxH: 14 },
  collaboratori: { w: 4, h: 5, minW: 3, minH: 4, maxW: 9, maxH: 14 }
});
