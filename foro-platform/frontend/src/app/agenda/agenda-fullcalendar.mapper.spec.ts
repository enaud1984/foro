import { AgendaFullCalendarMapper, EventoAgendaDto } from './agenda-fullcalendar.mapper';

describe('AgendaFullCalendarMapper', () => {
  const dto: EventoAgendaDto = {
    id: 'evento-1', calendarioId: 'calendario-1', creatoreId: 'utente-1', calendarioNome: 'Studio',
    colore: '#0b67b2', titolo: 'Udienza', inizio: '2026-08-04T08:00:00Z', fine: '2026-08-04T09:00:00Z',
    statoDisponibilita: 'OCCUPATO', tuttoGiorno: false, ricorrenza: 'NESSUNA', praticaId: 'pratica-1'
  };

  it('mappa il DTO FORO in EventInput conservando i metadati di dominio', () => {
    const evento = AgendaFullCalendarMapper.daDto(dto);
    expect(evento.id).toBe(dto.id);
    expect(evento.title).toBe(dto.titolo);
    expect(evento.start).toBe(dto.inizio);
    expect(evento.end).toBe(dto.fine);
    expect(evento.allDay).toBeFalse();
    expect(evento.extendedProps?.['dto']).toBe(dto);
  });

  it('mappa drag e resize in un comando backend ISO senza perdere i collegamenti', () => {
    const comando = AgendaFullCalendarMapper.daEvento({
      id: dto.id, title: dto.titolo, start: new Date('2026-08-05T10:00:00Z'),
      end: new Date('2026-08-05T11:30:00Z'), allDay: false, extendedProps: { dto }
    } as never);
    expect(comando.inizio).toBe('2026-08-05T10:00:00.000Z');
    expect(comando.fine).toBe('2026-08-05T11:30:00.000Z');
    expect(comando.praticaId).toBe('pratica-1');
    expect(comando.calendarioId).toBe('calendario-1');
  });

  it('interpreta la fine esclusiva FullCalendar di una selezione all-day', () => {
    const intervallo = AgendaFullCalendarMapper.intervalloSelezionato({
      start: new Date(2026, 7, 4), end: new Date(2026, 7, 5), allDay: true
    } as never);
    expect(intervallo).toEqual({ data: '2026-08-04', inizio: '00:00', fine: '23:59', tuttoGiorno: true });
  });
});
