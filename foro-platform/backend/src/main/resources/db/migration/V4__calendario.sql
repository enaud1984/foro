CREATE TABLE calendario (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  proprietario_id UUID NOT NULL REFERENCES user_account(id),
  nome VARCHAR(160) NOT NULL,
  colore VARCHAR(30) NOT NULL,
  condiviso_tutto_studio BOOLEAN NOT NULL DEFAULT FALSE,
  creato_il TIMESTAMPTZ NOT NULL,
  UNIQUE (studio_id, nome)
);

CREATE TABLE evento_calendario (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  calendario_id UUID NOT NULL REFERENCES calendario(id),
  creatore_id UUID NOT NULL REFERENCES user_account(id),
  titolo VARCHAR(240) NOT NULL,
  inizio TIMESTAMPTZ NOT NULL,
  fine TIMESTAMPTZ NOT NULL,
  luogo VARCHAR(300),
  note VARCHAR(4000),
  partecipanti VARCHAR(1000),
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL,
  CONSTRAINT chk_evento_intervallo CHECK (fine > inizio)
);

CREATE INDEX idx_calendario_studio ON calendario(studio_id);
CREATE INDEX idx_evento_calendario_periodo ON evento_calendario(studio_id, inizio, fine);
ALTER TABLE calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_calendario ENABLE ROW LEVEL SECURITY;

INSERT INTO calendario (id, studio_id, proprietario_id, nome, colore, condiviso_tutto_studio, creato_il) VALUES
  ('71111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Studio Legale Verdi', 'studio', TRUE, NOW()),
  ('72222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Calendario privato', 'private', FALSE, NOW()),
  ('73333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Udienze', 'hearings', TRUE, NOW()),
  ('74444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Scadenze deposito', 'deadlines', TRUE, NOW())
ON CONFLICT (studio_id, nome) DO NOTHING;
