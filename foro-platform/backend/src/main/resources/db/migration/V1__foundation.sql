CREATE TABLE studio (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE user_account (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE studio_membership (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  user_id UUID NOT NULL REFERENCES user_account(id),
  role VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(studio_id,user_id)
);
CREATE INDEX idx_membership_user ON studio_membership(user_id,status);
CREATE TABLE audit_event (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  actor_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80),
  entity_id UUID,
  outcome VARCHAR(30) NOT NULL,
  correlation_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE studio_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
