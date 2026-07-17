CREATE TABLE invito_evento (
  id UUID PRIMARY KEY, studio_id UUID NOT NULL REFERENCES studio(id), evento_id UUID NOT NULL REFERENCES evento_calendario(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_account(id), email VARCHAR(320) NOT NULL, stato_email VARCHAR(20) NOT NULL,
  inviato_il TIMESTAMPTZ, errore VARCHAR(500), creato_il TIMESTAMPTZ NOT NULL, UNIQUE(evento_id,user_id)
);
CREATE TABLE notifica_utente (
  id UUID PRIMARY KEY, studio_id UUID NOT NULL REFERENCES studio(id), user_id UUID NOT NULL REFERENCES user_account(id),
  tipo VARCHAR(40) NOT NULL, titolo VARCHAR(240) NOT NULL, descrizione VARCHAR(1000) NOT NULL,
  evento_id UUID REFERENCES evento_calendario(id) ON DELETE CASCADE, letta BOOLEAN NOT NULL DEFAULT FALSE, creata_il TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_notifica_utente_lista ON notifica_utente(studio_id,user_id,creata_il DESC);
ALTER TABLE invito_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifica_utente ENABLE ROW LEVEL SECURITY;
