CREATE TABLE tipo_soggetto (
  codice VARCHAR(40) PRIMARY KEY,
  descrizione VARCHAR(120) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE ruolo_soggetto_pratica (
  codice VARCHAR(50) PRIMARY KEY,
  descrizione VARCHAR(160) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

INSERT INTO tipo_soggetto(codice,descrizione,ordine,attivo,creato_il,aggiornato_il) VALUES
('PERSONA_FISICA','Persona fisica',1,TRUE,NOW(),NOW()),
('PERSONA_GIURIDICA','Persona giuridica',2,TRUE,NOW(),NOW()),
('DITTA_INDIVIDUALE','Ditta individuale',3,TRUE,NOW(),NOW()),
('ENTE_ASSOCIAZIONE','Ente o associazione',4,TRUE,NOW(),NOW()),
('CONDOMINIO','Condominio',5,TRUE,NOW(),NOW()),
('PUBBLICA_AMMINISTRAZIONE','Pubblica amministrazione',6,TRUE,NOW(),NOW()),
('ALTRO','Altro soggetto',7,TRUE,NOW(),NOW());

INSERT INTO ruolo_soggetto_pratica(codice,descrizione,ordine,attivo,creato_il,aggiornato_il) VALUES
('CLIENTE','Cliente / assistito',1,TRUE,NOW(),NOW()),
('CONTROPARTE','Controparte',2,TRUE,NOW(),NOW()),
('TESTIMONE','Testimone',3,TRUE,NOW(),NOW()),
('REFERENTE','Referente',4,TRUE,NOW(),NOW()),
('LEGALE_RAPPRESENTANTE','Legale rappresentante',5,TRUE,NOW(),NOW()),
('AVVOCATO_CONTROPARTE','Avvocato della controparte',6,TRUE,NOW(),NOW()),
('CONSULENTE_PARTE','Consulente tecnico di parte',7,TRUE,NOW(),NOW()),
('CTU','Consulente tecnico d''ufficio',8,TRUE,NOW(),NOW()),
('PERITO','Perito',9,TRUE,NOW(),NOW()),
('NOTAIO','Notaio',10,TRUE,NOW(),NOW()),
('CURATORE','Curatore',11,TRUE,NOW(),NOW()),
('AMMINISTRATORE_CONDOMINIO','Amministratore di condominio',12,TRUE,NOW(),NOW()),
('ALTRO','Altro ruolo',13,TRUE,NOW(),NOW());

CREATE TABLE soggetto (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  tipo_codice VARCHAR(40) NOT NULL REFERENCES tipo_soggetto(codice),
  nome VARCHAR(120),
  cognome VARCHAR(120),
  data_nascita DATE,
  luogo_nascita VARCHAR(160),
  provincia_nascita VARCHAR(2),
  stato_nascita VARCHAR(80),
  denominazione VARCHAR(240),
  forma_giuridica VARCHAR(120),
  codice_fiscale VARCHAR(24),
  codice_fiscale_normalizzato VARCHAR(24),
  partita_iva VARCHAR(20),
  partita_iva_normalizzata VARCHAR(20),
  email VARCHAR(320),
  pec VARCHAR(320),
  telefono VARCHAR(40),
  cellulare VARCHAR(40),
  indirizzo VARCHAR(240),
  civico VARCHAR(20),
  cap VARCHAR(10),
  comune VARCHAR(120),
  provincia VARCHAR(2),
  stato VARCHAR(30) NOT NULL DEFAULT 'ATTIVO',
  stato_indirizzo VARCHAR(80),
  note VARCHAR(4000),
  version BIGINT NOT NULL DEFAULT 0,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT chk_soggetto_stato CHECK (stato IN ('ATTIVO','DISATTIVATO')),
  CONSTRAINT chk_soggetto_dati_tipo CHECK (
    (tipo_codice='PERSONA_FISICA' AND nome IS NOT NULL AND cognome IS NOT NULL)
    OR (tipo_codice<>'PERSONA_FISICA' AND denominazione IS NOT NULL)
  )
);

CREATE INDEX idx_soggetto_studio_stato ON soggetto(studio_id,stato) WHERE eliminato_il IS NULL;
CREATE INDEX idx_soggetto_studio_aggiornato ON soggetto(studio_id,aggiornato_il DESC) WHERE eliminato_il IS NULL;
CREATE INDEX idx_soggetto_studio_cf ON soggetto(studio_id,codice_fiscale_normalizzato) WHERE eliminato_il IS NULL AND codice_fiscale_normalizzato IS NOT NULL;
CREATE INDEX idx_soggetto_studio_piva ON soggetto(studio_id,partita_iva_normalizzata) WHERE eliminato_il IS NULL AND partita_iva_normalizzata IS NOT NULL;
CREATE INDEX idx_soggetto_studio_denominazione ON soggetto(studio_id,LOWER(denominazione)) WHERE eliminato_il IS NULL;
ALTER TABLE soggetto ENABLE ROW LEVEL SECURITY;

INSERT INTO soggetto(
  id,studio_id,tipo_codice,nome,cognome,denominazione,forma_giuridica,
  codice_fiscale,codice_fiscale_normalizzato,partita_iva,partita_iva_normalizzata,
  email,telefono,indirizzo,civico,cap,comune,provincia,stato,stato_indirizzo,note,
  creato_il,creato_da,aggiornato_il,aggiornato_da
) VALUES
('a1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','PERSONA_FISICA','Giulia','Ferrari',NULL,NULL,
 'FRRGLI90A41F205X','FRRGLI90A41F205X',NULL,NULL,'giulia.ferrari@example.test','+39 02 0000001','Via Esempio','10','20100','Milano','MI','ATTIVO','Italia','Dato fittizio per ambiente demo',
 NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('a2222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','PERSONA_GIURIDICA',NULL,NULL,'Aurora Servizi S.r.l.','S.r.l.',
 '09876543210','09876543210','09876543210','09876543210','info@aurora.example.test','+39 02 0000002','Corso Demo','20','20100','Milano','MI','ATTIVO','Italia','Dato fittizio per ambiente demo',
 NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('a3333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','CONDOMINIO',NULL,NULL,'Condominio Via Esempio 25',NULL,
 '12345678901','12345678901',NULL,NULL,'amministrazione@example.test','+39 02 0000003','Via Esempio','25','20100','Milano','MI','ATTIVO','Italia','Dato fittizio per ambiente demo',
 NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');
