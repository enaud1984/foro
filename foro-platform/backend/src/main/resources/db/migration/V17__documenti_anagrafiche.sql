ALTER TABLE documento_pratica
  DROP CONSTRAINT fk_documento_pratica;

ALTER TABLE documento_pratica
  ALTER COLUMN pratica_id DROP NOT NULL,
  ADD COLUMN data_documento DATE,
  ADD COLUMN note VARCHAR(1000),
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE documento_pratica
  ADD CONSTRAINT fk_documento_pratica
    FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  ADD CONSTRAINT chk_documento_collegamento
    CHECK (pratica_id IS NOT NULL OR soggetto_id IS NOT NULL);

CREATE INDEX idx_documento_soggetto_elenco
  ON documento_pratica(studio_id,soggetto_id,aggiornato_il DESC)
  WHERE soggetto_id IS NOT NULL AND eliminato_il IS NULL;

INSERT INTO categoria_documento_pratica(codice,descrizione,ordine,attivo,creato_il,aggiornato_il)
VALUES
  ('DOCUMENTO_IDENTITA','Documento di identità',16,TRUE,NOW(),NOW()),
  ('CODICE_FISCALE','Codice fiscale',17,TRUE,NOW(),NOW()),
  ('CONSENSO_TRATTAMENTO','Consenso al trattamento',18,TRUE,NOW(),NOW()),
  ('IDENTIFICAZIONE_CLIENTE','Identificazione cliente',19,TRUE,NOW(),NOW()),
  ('VISURA_CAMERALE','Visura camerale',20,TRUE,NOW(),NOW()),
  ('DOCUMENTO_SOCIETARIO','Documento societario',21,TRUE,NOW(),NOW()),
  ('CERTIFICATO','Certificato',22,TRUE,NOW(),NOW()),
  ('ALTRO_ANAGRAFICO','Altro documento anagrafico',23,TRUE,NOW(),NOW())
ON CONFLICT (codice) DO NOTHING;
