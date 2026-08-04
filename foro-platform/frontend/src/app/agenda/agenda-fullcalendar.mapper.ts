import { DateSelectArg, EventApi, EventInput } from '@fullcalendar/core';

export interface EventoAgendaDto {
  id: string;
  calendarioId: string;
  creatoreId: string;
  calendarioNome: string;
  colore: string;
  titolo: string;
  inizio: string;
  fine: string;
  luogo?: string;
  note?: string;
  partecipanti?: string;
  statoDisponibilita: string;
  promemoriaMinuti?: number;
  categoria?: string;
  tuttoGiorno: boolean;
  serieId?: string;
  ricorrenza: string;
  fineRicorrenza?: string;
  praticaId?: string;
  praticaCodice?: string;
  praticaTitolo?: string;
  praticaStato?: string;
}

export interface ComandoAggiornamentoEvento {
  calendarioId: string;
  titolo: string;
  inizio: string;
  fine: string;
  note?: string;
  statoDisponibilita: string;
  promemoriaMinuti?: number;
  categoria?: string;
  tuttoGiorno: boolean;
  ricorrenza: string;
  fineRicorrenza?: string | null;
  praticaId?: string | null;
}

/** Unico confine di traduzione tra il contratto Agenda FORO e FullCalendar. */
export class AgendaFullCalendarMapper {
  static daDto(dto: EventoAgendaDto): EventInput {
    return {
      id: dto.id,
      title: dto.titolo,
      start: dto.inizio,
      end: dto.fine,
      allDay: dto.tuttoGiorno,
      backgroundColor: dto.colore,
      borderColor: dto.colore,
      extendedProps: {
        descrizione: dto.note,
        praticaId: dto.praticaId,
        soggettoId: undefined,
        tipoEvento: dto.categoria,
        stato: dto.statoDisponibilita,
        luogo: dto.luogo,
        note: dto.note,
        proprietario: dto.creatoreId,
        calendarioNome: dto.calendarioNome,
        dto
      }
    };
  }

  static daEvento(evento: EventApi): ComandoAggiornamentoEvento {
    const dto = evento.extendedProps['dto'] as EventoAgendaDto;
    if (!evento.start) throw new Error('L’appuntamento deve avere una data di inizio.');
    const fine = evento.end ?? new Date(evento.start.getTime() + 30 * 60_000);
    return {
      calendarioId: dto.calendarioId,
      titolo: evento.title,
      inizio: evento.start.toISOString(),
      fine: fine.toISOString(),
      note: dto.note,
      statoDisponibilita: dto.statoDisponibilita,
      promemoriaMinuti: dto.promemoriaMinuti,
      categoria: dto.categoria,
      tuttoGiorno: evento.allDay,
      ricorrenza: dto.ricorrenza,
      fineRicorrenza: dto.fineRicorrenza ?? null,
      praticaId: dto.praticaId ?? null
    };
  }

  static intervalloSelezionato(selezione: DateSelectArg): { data: string; inizio: string; fine: string; tuttoGiorno: boolean } {
    const inizio = selezione.start;
    const fineEsclusiva = selezione.end;
    const fineForm = selezione.allDay
      ? new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate(), 23, 59)
      : fineEsclusiva;
    return {
      data: AgendaFullCalendarMapper.dataLocale(inizio),
      inizio: AgendaFullCalendarMapper.oraLocale(inizio),
      fine: AgendaFullCalendarMapper.oraLocale(fineForm),
      tuttoGiorno: selezione.allDay
    };
  }

  private static dataLocale(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  private static oraLocale(data: Date): string {
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  }
}
