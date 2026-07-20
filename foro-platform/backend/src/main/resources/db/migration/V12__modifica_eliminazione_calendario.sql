ALTER TABLE calendario ADD COLUMN aggiornato_il TIMESTAMPTZ;
ALTER TABLE calendario ADD COLUMN eliminato_il TIMESTAMPTZ;
UPDATE calendario SET aggiornato_il = creato_il WHERE aggiornato_il IS NULL;
ALTER TABLE calendario ALTER COLUMN aggiornato_il SET NOT NULL;

ALTER TABLE calendario DROP CONSTRAINT calendario_studio_id_nome_key;
CREATE UNIQUE INDEX uk_calendario_studio_nome_attivo
  ON calendario(studio_id, nome)
  WHERE eliminato_il IS NULL;
CREATE INDEX idx_calendario_studio_attivo
  ON calendario(studio_id, nome)
  WHERE eliminato_il IS NULL;
