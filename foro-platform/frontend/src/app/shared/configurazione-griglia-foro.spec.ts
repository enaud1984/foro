import { definizioneColonnaForo, opzioniGrigliaForo } from './configurazione-griglia-foro';

describe('Configurazione griglia FORO', () => {
  it('abilita ordinamento, filtri, ridimensionamento e paginazione Community', () => {
    expect(definizioneColonnaForo.sortable).toBeTrue();
    expect(definizioneColonnaForo.filter).toBeTrue();
    expect(definizioneColonnaForo.resizable).toBeTrue();
    expect(opzioniGrigliaForo.pagination).toBeTrue();
  });

  it('espone messaggi italiani per caricamento e stato vuoto', () => {
    expect(opzioniGrigliaForo.localeText?.['noRowsToShow']).toBe('Nessun risultato');
    expect(opzioniGrigliaForo.localeText?.['loadingOoo']).toBe('Caricamento…');
  });
});
