ALTER TABLE evento_calendario
  ADD COLUMN stato_disponibilita VARCHAR(20) NOT NULL DEFAULT 'OCCUPATO',
  ADD COLUMN promemoria_minuti INTEGER,
  ADD COLUMN categoria VARCHAR(60),
  ADD COLUMN tutto_giorno BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN serie_id UUID,
  ADD COLUMN ricorrenza VARCHAR(20) NOT NULL DEFAULT 'NESSUNA',
  ADD COLUMN fine_ricorrenza DATE;
CREATE INDEX idx_evento_calendario_serie ON evento_calendario(studio_id, serie_id);
