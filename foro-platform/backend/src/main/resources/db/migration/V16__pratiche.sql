CREATE TABLE materia_pratica (
  codice VARCHAR(50) PRIMARY KEY,
  descrizione VARCHAR(160) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE tipologia_pratica (
  codice VARCHAR(60) PRIMARY KEY,
  materia_codice VARCHAR(50) REFERENCES materia_pratica(codice),
  descrizione VARCHAR(180) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE stato_pratica (
  codice VARCHAR(30) PRIMARY KEY,
  descrizione VARCHAR(100) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE priorita_pratica (
  codice VARCHAR(30) PRIMARY KEY,
  descrizione VARCHAR(100) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE ruolo_team_pratica (
  codice VARCHAR(30) PRIMARY KEY,
  descrizione VARCHAR(100) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE stato_attivita_pratica (
  codice VARCHAR(30) PRIMARY KEY,
  descrizione VARCHAR(100) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE priorita_attivita_pratica (
  codice VARCHAR(30) PRIMARY KEY,
  descrizione VARCHAR(100) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

CREATE TABLE categoria_documento_pratica (
  codice VARCHAR(40) PRIMARY KEY,
  descrizione VARCHAR(140) NOT NULL,
  ordine INTEGER NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL
);

INSERT INTO materia_pratica VALUES
('CIVILE','Diritto civile',1,TRUE,NOW(),NOW()),('PENALE','Diritto penale',2,TRUE,NOW(),NOW()),
('LAVORO','Diritto del lavoro',3,TRUE,NOW(),NOW()),('FAMIGLIA','Diritto di famiglia',4,TRUE,NOW(),NOW()),
('SUCCESSIONI','Successioni',5,TRUE,NOW(),NOW()),('IMMOBILIARE','Diritto immobiliare',6,TRUE,NOW(),NOW()),
('SOCIETARIO','Diritto societario',7,TRUE,NOW(),NOW()),('TRIBUTARIO','Diritto tributario',8,TRUE,NOW(),NOW()),
('AMMINISTRATIVO','Diritto amministrativo',9,TRUE,NOW(),NOW()),('RECUPERO_CREDITI','Recupero crediti',10,TRUE,NOW(),NOW()),
('CONTRATTUALISTICA','Contrattualistica',11,TRUE,NOW(),NOW()),('ESECUZIONI','Esecuzioni',12,TRUE,NOW(),NOW()),
('CONCORSUALE','Procedure concorsuali',13,TRUE,NOW(),NOW()),('VOLONTARIA_GIURISDIZIONE','Volontaria giurisdizione',14,TRUE,NOW(),NOW()),
('ALTRO','Altro',15,TRUE,NOW(),NOW());

INSERT INTO tipologia_pratica VALUES
('CONSULENZA',NULL,'Consulenza',1,TRUE,NOW(),NOW()),('DIFFIDA','RECUPERO_CREDITI','Diffida',2,TRUE,NOW(),NOW()),
('RECUPERO_CREDITO','RECUPERO_CREDITI','Recupero credito',3,TRUE,NOW(),NOW()),('NEGOZIAZIONE',NULL,'Negoziazione',4,TRUE,NOW(),NOW()),
('MEDIAZIONE','CIVILE','Mediazione',5,TRUE,NOW(),NOW()),('ATTO_GIUDIZIARIO',NULL,'Atto giudiziario',6,TRUE,NOW(),NOW()),
('CONTENZIOSO',NULL,'Contenzioso',7,TRUE,NOW(),NOW()),('SEPARAZIONE_CONSENSUALE','FAMIGLIA','Separazione consensuale',8,TRUE,NOW(),NOW()),
('SEPARAZIONE_GIUDIZIALE','FAMIGLIA','Separazione giudiziale',9,TRUE,NOW(),NOW()),('DIVORZIO','FAMIGLIA','Divorzio',10,TRUE,NOW(),NOW()),
('SUCCESSIONE','SUCCESSIONI','Successione',11,TRUE,NOW(),NOW()),('CONTRATTO','CONTRATTUALISTICA','Contratto',12,TRUE,NOW(),NOW()),
('PARERE',NULL,'Parere',13,TRUE,NOW(),NOW()),('DECRETO_INGIUNTIVO','RECUPERO_CREDITI','Decreto ingiuntivo',14,TRUE,NOW(),NOW()),
('OPPOSIZIONE_DECRETO_INGIUNTIVO','RECUPERO_CREDITI','Opposizione a decreto ingiuntivo',15,TRUE,NOW(),NOW()),
('PROCEDIMENTO_PENALE','PENALE','Procedimento penale',16,TRUE,NOW(),NOW()),('RICORSO',NULL,'Ricorso',17,TRUE,NOW(),NOW()),
('ESECUZIONE','ESECUZIONI','Esecuzione',18,TRUE,NOW(),NOW()),('ALTRO','ALTRO','Altro',19,TRUE,NOW(),NOW());

INSERT INTO stato_pratica VALUES
('BOZZA','Bozza',1,TRUE,NOW(),NOW()),('APERTA','Aperta',2,TRUE,NOW(),NOW()),
('IN_ATTESA','In attesa',3,TRUE,NOW(),NOW()),('SOSPESA','Sospesa',4,TRUE,NOW(),NOW()),
('DEFINITA','Definita',5,TRUE,NOW(),NOW()),('ARCHIVIATA','Archiviata',6,TRUE,NOW(),NOW());

INSERT INTO priorita_pratica VALUES
('BASSA','Bassa',1,TRUE,NOW(),NOW()),('NORMALE','Normale',2,TRUE,NOW(),NOW()),
('ALTA','Alta',3,TRUE,NOW(),NOW()),('URGENTE','Urgente',4,TRUE,NOW(),NOW());

INSERT INTO ruolo_team_pratica VALUES
('RESPONSABILE','Responsabile',1,TRUE,NOW(),NOW()),('COLLABORATORE','Collaboratore',2,TRUE,NOW(),NOW()),
('SEGRETERIA','Segreteria',3,TRUE,NOW(),NOW()),('SOLA_LETTURA','Sola lettura',4,TRUE,NOW(),NOW());

INSERT INTO stato_attivita_pratica VALUES
('DA_FARE','Da fare',1,TRUE,NOW(),NOW()),('IN_CORSO','In corso',2,TRUE,NOW(),NOW()),
('IN_ATTESA','In attesa',3,TRUE,NOW(),NOW()),('COMPLETATA','Completata',4,TRUE,NOW(),NOW()),
('ANNULLATA','Annullata',5,TRUE,NOW(),NOW());

INSERT INTO priorita_attivita_pratica VALUES
('BASSA','Bassa',1,TRUE,NOW(),NOW()),('NORMALE','Normale',2,TRUE,NOW(),NOW()),
('ALTA','Alta',3,TRUE,NOW(),NOW()),('URGENTE','Urgente',4,TRUE,NOW(),NOW());

INSERT INTO categoria_documento_pratica VALUES
('INCARICO','Incarico',1,TRUE,NOW(),NOW()),('PROCURA','Procura',2,TRUE,NOW(),NOW()),
('IDENTIFICAZIONE','Identificazione',3,TRUE,NOW(),NOW()),('PRIVACY','Privacy',4,TRUE,NOW(),NOW()),
('ANTIRICICLAGGIO','Antiriciclaggio',5,TRUE,NOW(),NOW()),('DOCUMENTO_CLIENTE','Documento del cliente',6,TRUE,NOW(),NOW()),
('CORRISPONDENZA','Corrispondenza',7,TRUE,NOW(),NOW()),('STRAGIUDIZIALE','Stragiudiziale',8,TRUE,NOW(),NOW()),
('ATTO_PROCESSUALE','Atto processuale',9,TRUE,NOW(),NOW()),('PROVVEDIMENTO','Provvedimento',10,TRUE,NOW(),NOW()),
('VERBALE','Verbale',11,TRUE,NOW(),NOW()),('PROVA','Prova',12,TRUE,NOW(),NOW()),
('AMMINISTRATIVO','Amministrativo',13,TRUE,NOW(),NOW()),('CONTABILE','Contabile',14,TRUE,NOW(),NOW()),
('ALTRO','Altro',15,TRUE,NOW(),NOW());

ALTER TABLE soggetto ADD CONSTRAINT uk_soggetto_studio_id UNIQUE (studio_id,id);

CREATE TABLE contatore_pratica (
  studio_id UUID NOT NULL REFERENCES studio(id),
  anno INTEGER NOT NULL,
  ultimo_valore INTEGER NOT NULL CHECK (ultimo_valore >= 0),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (studio_id,anno)
);

CREATE TABLE pratica (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  codice VARCHAR(30) NOT NULL,
  titolo VARCHAR(240) NOT NULL,
  descrizione TEXT,
  materia_codice VARCHAR(50) NOT NULL REFERENCES materia_pratica(codice),
  tipologia_codice VARCHAR(60) NOT NULL REFERENCES tipologia_pratica(codice),
  stato_codice VARCHAR(30) NOT NULL REFERENCES stato_pratica(codice),
  priorita_codice VARCHAR(30) NOT NULL REFERENCES priorita_pratica(codice),
  responsabile_id UUID NOT NULL,
  valore_economico NUMERIC(15,2),
  valuta VARCHAR(3) NOT NULL DEFAULT 'EUR',
  riservata BOOLEAN NOT NULL DEFAULT FALSE,
  data_apertura DATE NOT NULL,
  data_definizione DATE,
  data_archiviazione DATE,
  motivo_attesa TEXT,
  note_interne TEXT,
  version BIGINT NOT NULL DEFAULT 0,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT uk_pratica_studio_id UNIQUE (studio_id,id),
  CONSTRAINT fk_pratica_responsabile FOREIGN KEY (studio_id,responsabile_id) REFERENCES studio_membership(studio_id,user_id),
  CONSTRAINT chk_pratica_valore CHECK (valore_economico IS NULL OR valore_economico >= 0),
  CONSTRAINT chk_pratica_date CHECK (
    (data_definizione IS NULL OR data_definizione >= data_apertura)
    AND (data_archiviazione IS NULL OR data_archiviazione >= data_apertura)
  )
);
CREATE UNIQUE INDEX uk_pratica_studio_codice_attiva ON pratica(studio_id,codice) WHERE eliminato_il IS NULL;
CREATE INDEX idx_pratica_studio_stato ON pratica(studio_id,stato_codice,aggiornato_il DESC) WHERE eliminato_il IS NULL;
CREATE INDEX idx_pratica_studio_responsabile ON pratica(studio_id,responsabile_id) WHERE eliminato_il IS NULL;

CREATE TABLE pratica_soggetto (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  soggetto_id UUID NOT NULL,
  ruolo_codice VARCHAR(50) NOT NULL REFERENCES ruolo_soggetto_pratica(codice),
  principale BOOLEAN NOT NULL DEFAULT FALSE,
  descrizione_ruolo_altro VARCHAR(240),
  note TEXT,
  version BIGINT NOT NULL DEFAULT 0,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT fk_pratica_soggetto_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT fk_pratica_soggetto_soggetto FOREIGN KEY (studio_id,soggetto_id) REFERENCES soggetto(studio_id,id),
  CONSTRAINT chk_pratica_soggetto_altro CHECK (ruolo_codice <> 'ALTRO' OR NULLIF(TRIM(descrizione_ruolo_altro),'') IS NOT NULL)
);
CREATE UNIQUE INDEX uk_pratica_soggetto_attivo ON pratica_soggetto(pratica_id,soggetto_id,ruolo_codice) WHERE eliminato_il IS NULL;
CREATE UNIQUE INDEX uk_pratica_soggetto_principale ON pratica_soggetto(pratica_id,ruolo_codice) WHERE principale AND eliminato_il IS NULL;
CREATE INDEX idx_pratica_soggetto_studio_soggetto ON pratica_soggetto(studio_id,soggetto_id) WHERE eliminato_il IS NULL;

CREATE TABLE pratica_utente (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  utente_id UUID NOT NULL,
  ruolo_team_codice VARCHAR(30) NOT NULL REFERENCES ruolo_team_pratica(codice),
  principale BOOLEAN NOT NULL DEFAULT FALSE,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT fk_pratica_utente_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT fk_pratica_utente_membership FOREIGN KEY (studio_id,utente_id) REFERENCES studio_membership(studio_id,user_id)
);
CREATE UNIQUE INDEX uk_pratica_utente_attivo ON pratica_utente(pratica_id,utente_id,ruolo_team_codice) WHERE eliminato_il IS NULL;
CREATE UNIQUE INDEX uk_pratica_responsabile_team ON pratica_utente(pratica_id) WHERE ruolo_team_codice='RESPONSABILE' AND eliminato_il IS NULL;
CREATE INDEX idx_pratica_utente_visibilita ON pratica_utente(studio_id,utente_id,pratica_id) WHERE eliminato_il IS NULL;

CREATE TABLE documento_pratica (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  soggetto_id UUID,
  categoria_codice VARCHAR(40) NOT NULL REFERENCES categoria_documento_pratica(codice),
  titolo VARCHAR(240) NOT NULL,
  nome_file VARCHAR(260) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  dimensione BIGINT NOT NULL CHECK (dimensione >= 0),
  percorso_storage VARCHAR(500),
  checksum_sha256 VARCHAR(64),
  versione_numero INTEGER NOT NULL DEFAULT 1 CHECK (versione_numero > 0),
  stato_documento VARCHAR(30) NOT NULL,
  origine VARCHAR(20) NOT NULL,
  template_codice VARCHAR(60),
  caricato_da UUID NOT NULL REFERENCES user_account(id),
  creato_il TIMESTAMPTZ NOT NULL,
  aggiornato_il TIMESTAMPTZ NOT NULL,
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT fk_documento_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT fk_documento_soggetto FOREIGN KEY (studio_id,soggetto_id) REFERENCES soggetto(studio_id,id),
  CONSTRAINT chk_documento_origine CHECK (origine IN ('UPLOAD','TEMPLATE','GENERATO'))
);
CREATE INDEX idx_documento_pratica_elenco ON documento_pratica(studio_id,pratica_id,aggiornato_il DESC) WHERE eliminato_il IS NULL;

CREATE TABLE attivita_pratica (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  titolo VARCHAR(240) NOT NULL,
  descrizione TEXT,
  assegnatario_id UUID,
  stato_codice VARCHAR(30) NOT NULL REFERENCES stato_attivita_pratica(codice),
  priorita_codice VARCHAR(30) NOT NULL REFERENCES priorita_attivita_pratica(codice),
  data_scadenza DATE,
  completata_il TIMESTAMPTZ,
  evento_calendario_id UUID REFERENCES evento_calendario(id),
  version BIGINT NOT NULL DEFAULT 0,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT fk_attivita_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT fk_attivita_assegnatario FOREIGN KEY (studio_id,assegnatario_id) REFERENCES studio_membership(studio_id,user_id)
);
CREATE INDEX idx_attivita_pratica_elenco ON attivita_pratica(studio_id,pratica_id,stato_codice,data_scadenza) WHERE eliminato_il IS NULL;

CREATE TABLE comunicazione_pratica (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  oggetto VARCHAR(240) NOT NULL,
  descrizione TEXT,
  data_comunicazione TIMESTAMPTZ NOT NULL,
  autore_id UUID NOT NULL REFERENCES user_account(id),
  version BIGINT NOT NULL DEFAULT 0,
  creato_il TIMESTAMPTZ NOT NULL,
  creato_da UUID NOT NULL REFERENCES user_account(id),
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  eliminato_il TIMESTAMPTZ,
  eliminato_da UUID REFERENCES user_account(id),
  CONSTRAINT fk_comunicazione_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT chk_comunicazione_tipo CHECK (tipo IN ('EMAIL','PEC','TELEFONATA','LETTERA','RIUNIONE','NOTA','ALTRO'))
);
CREATE INDEX idx_comunicazione_pratica_elenco ON comunicazione_pratica(studio_id,pratica_id,data_comunicazione DESC) WHERE eliminato_il IS NULL;

CREATE TABLE pratica_giudiziaria (
  pratica_id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  autorita_giudiziaria VARCHAR(240),
  ufficio VARCHAR(180),
  sezione VARCHAR(120),
  numero_rg VARCHAR(80),
  anno_rg INTEGER,
  giudice VARCHAR(180),
  data_iscrizione_ruolo DATE,
  tipo_procedimento VARCHAR(180),
  grado_giudizio VARCHAR(100),
  ruolo_processuale_cliente VARCHAR(180),
  stato_procedimento VARCHAR(160),
  note TEXT,
  version BIGINT NOT NULL DEFAULT 0,
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  CONSTRAINT fk_pratica_giudiziaria FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT chk_pratica_giudiziaria_anno CHECK (anno_rg IS NULL OR anno_rg BETWEEN 1900 AND 2200)
);
CREATE INDEX idx_pratica_giudiziaria_rg ON pratica_giudiziaria(studio_id,numero_rg,anno_rg);

CREATE TABLE economia_pratica (
  pratica_id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  preventivo NUMERIC(15,2) NOT NULL DEFAULT 0,
  compenso_concordato NUMERIC(15,2) NOT NULL DEFAULT 0,
  acconti_richiesti NUMERIC(15,2) NOT NULL DEFAULT 0,
  acconti_pagati NUMERIC(15,2) NOT NULL DEFAULT 0,
  spese_anticipate NUMERIC(15,2) NOT NULL DEFAULT 0,
  contributo_unificato NUMERIC(15,2) NOT NULL DEFAULT 0,
  altre_spese NUMERIC(15,2) NOT NULL DEFAULT 0,
  importo_fatturato NUMERIC(15,2) NOT NULL DEFAULT 0,
  importo_incassato NUMERIC(15,2) NOT NULL DEFAULT 0,
  valuta VARCHAR(3) NOT NULL DEFAULT 'EUR',
  note TEXT,
  version BIGINT NOT NULL DEFAULT 0,
  aggiornato_il TIMESTAMPTZ NOT NULL,
  aggiornato_da UUID NOT NULL REFERENCES user_account(id),
  CONSTRAINT fk_economia_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id),
  CONSTRAINT chk_economia_importi CHECK (
    preventivo >= 0 AND compenso_concordato >= 0 AND acconti_richiesti >= 0 AND acconti_pagati >= 0
    AND spese_anticipate >= 0 AND contributo_unificato >= 0 AND altre_spese >= 0
    AND importo_fatturato >= 0 AND importo_incassato >= 0
  )
);

CREATE TABLE pratica_timeline (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  pratica_id UUID NOT NULL,
  tipo_evento VARCHAR(80) NOT NULL,
  titolo VARCHAR(240) NOT NULL,
  descrizione_sintetica VARCHAR(500),
  actor_id UUID REFERENCES user_account(id),
  entita_tipo VARCHAR(80),
  entita_id UUID,
  avvenuto_il TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fk_timeline_pratica FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id)
);
CREATE INDEX idx_pratica_timeline_elenco ON pratica_timeline(studio_id,pratica_id,avvenuto_il DESC);

ALTER TABLE evento_calendario ADD COLUMN pratica_id UUID;
ALTER TABLE evento_calendario ADD CONSTRAINT fk_evento_pratica
  FOREIGN KEY (studio_id,pratica_id) REFERENCES pratica(studio_id,id);
CREATE INDEX idx_evento_pratica ON evento_calendario(studio_id,pratica_id,inizio) WHERE pratica_id IS NOT NULL;

ALTER TABLE contatore_pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratica_soggetto ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratica_utente ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE attivita_pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicazione_pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratica_giudiziaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE economia_pratica ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratica_timeline ENABLE ROW LEVEL SECURITY;

INSERT INTO pratica(id,studio_id,codice,titolo,descrizione,materia_codice,tipologia_codice,stato_codice,priorita_codice,
 responsabile_id,valore_economico,valuta,riservata,data_apertura,note_interne,creato_il,creato_da,aggiornato_il,aggiornato_da)
VALUES
('b1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','PRA-2026-00001','Aurora Servizi / recupero credito','Diffida e recupero di un credito commerciale fittizio.','RECUPERO_CREDITI','RECUPERO_CREDITO','APERTA','URGENTE','22222222-2222-4222-8222-222222222222',12500,'EUR',FALSE,'2026-07-15','Dati fittizi demo',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('b2222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','PRA-2026-00002','Successione Ferrari','Assistenza stragiudiziale per successione fittizia.','SUCCESSIONI','SUCCESSIONE','IN_ATTESA','NORMALE','88888888-8888-4888-8888-888888888888',NULL,'EUR',FALSE,'2026-07-18','In attesa di documentazione demo',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('b3333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','PRA-2026-00003','Condominio Via Esempio / mediazione','Controversia condominiale interamente fittizia.','IMMOBILIARE','MEDIAZIONE','APERTA','ALTA','22222222-2222-4222-8222-222222222222',5000,'EUR',TRUE,'2026-07-21','Accesso riservato al team',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');

INSERT INTO contatore_pratica VALUES ('11111111-1111-4111-8111-111111111111',2026,3,NOW());

INSERT INTO pratica_soggetto(id,studio_id,pratica_id,soggetto_id,ruolo_codice,principale,creato_il,creato_da,aggiornato_il,aggiornato_da) VALUES
('c1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222','CLIENTE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('c1111111-1111-4111-8111-222222222222','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','CONTROPARTE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('c2222222-2222-4222-8222-111111111111','11111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','CLIENTE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('c3333333-3333-4333-8333-111111111111','11111111-1111-4111-8111-111111111111','b3333333-3333-4333-8333-333333333333','a3333333-3333-4333-8333-333333333333','CLIENTE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('c3333333-3333-4333-8333-222222222222','11111111-1111-4111-8111-111111111111','b3333333-3333-4333-8333-333333333333','a2222222-2222-4222-8222-222222222222','CONTROPARTE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');

INSERT INTO pratica_utente(id,studio_id,pratica_id,utente_id,ruolo_team_codice,principale,creato_il,creato_da,aggiornato_il,aggiornato_da) VALUES
('d1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','RESPONSABILE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('d2222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','88888888-8888-4888-8888-888888888888','RESPONSABILE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222'),
('d3333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','b3333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','RESPONSABILE',TRUE,NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');

INSERT INTO attivita_pratica(id,studio_id,pratica_id,titolo,descrizione,assegnatario_id,stato_codice,priorita_codice,data_scadenza,creato_il,creato_da,aggiornato_il,aggiornato_da)
VALUES ('e1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','Preparare diffida','Verificare gli allegati fittizi.','22222222-2222-4222-8222-222222222222','IN_CORSO','URGENTE','2026-08-01',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');

INSERT INTO documento_pratica(id,studio_id,pratica_id,categoria_codice,titolo,nome_file,mime_type,dimensione,versione_numero,stato_documento,origine,template_codice,caricato_da,creato_il,aggiornato_il)
VALUES ('e2222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','INCARICO','Lettera incarico demo','lettera-incarico-demo.pdf','application/pdf',0,1,'SOLO_METADATI','TEMPLATE','LETTERA_INCARICO','22222222-2222-4222-8222-222222222222',NOW(),NOW());

INSERT INTO comunicazione_pratica(id,studio_id,pratica_id,tipo,oggetto,descrizione,data_comunicazione,autore_id,creato_il,creato_da,aggiornato_il,aggiornato_da)
VALUES ('e3333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','TELEFONATA','Contatto iniziale','Annotazione interamente fittizia.',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222',NOW(),'22222222-2222-4222-8222-222222222222');

INSERT INTO pratica_timeline(id,studio_id,pratica_id,tipo_evento,titolo,descrizione_sintetica,actor_id,entita_tipo,entita_id,avvenuto_il) VALUES
('f1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111','PRATICA_CREATA','Pratica creata','Creazione dati demo','22222222-2222-4222-8222-222222222222','PRATICA','b1111111-1111-4111-8111-111111111111',NOW()),
('f2222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','PRATICA_CREATA','Pratica creata','Creazione dati demo','22222222-2222-4222-8222-222222222222','PRATICA','b2222222-2222-4222-8222-222222222222',NOW()),
('f3333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','b3333333-3333-4333-8333-333333333333','PRATICA_CREATA','Pratica creata','Creazione dati demo','22222222-2222-4222-8222-222222222222','PRATICA','b3333333-3333-4333-8333-333333333333',NOW());

UPDATE evento_calendario
SET pratica_id='b1111111-1111-4111-8111-111111111111',
    titolo='Udienza demo Aurora Servizi',
    note='Evento fittizio collegato alla pratica demo'
WHERE id='83222222-8322-4222-8222-222222222222';
