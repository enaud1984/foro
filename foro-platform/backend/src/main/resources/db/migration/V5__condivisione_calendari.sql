CREATE TABLE calendario_condivisione (
  calendario_id UUID NOT NULL REFERENCES calendario(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studio(id),
  user_id UUID NOT NULL REFERENCES user_account(id),
  creato_il TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (calendario_id, user_id)
);
CREATE INDEX idx_calendario_condivisione_studio_user ON calendario_condivisione(studio_id, user_id);
ALTER TABLE calendario_condivisione ENABLE ROW LEVEL SECURITY;
