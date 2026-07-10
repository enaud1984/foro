ALTER TABLE studio
  ADD COLUMN address_line VARCHAR(240),
  ADD COLUMN city VARCHAR(120),
  ADD COLUMN postal_code VARCHAR(20),
  ADD COLUMN country VARCHAR(80),
  ADD COLUMN phone VARCHAR(40),
  ADD COLUMN website VARCHAR(200),
  ADD COLUMN logo_url TEXT,
  ADD COLUMN primary_color VARCHAR(20) NOT NULL DEFAULT '#092746',
  ADD COLUMN accent_color VARCHAR(20) NOT NULL DEFAULT '#c9993a',
  ADD COLUMN secondary_color VARCHAR(20) NOT NULL DEFAULT '#128c8c',
  ADD COLUMN theme_preset VARCHAR(40) NOT NULL DEFAULT 'foro-classic';

CREATE TABLE user_dashboard_preference (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studio(id),
  user_id UUID NOT NULL REFERENCES user_account(id),
  theme_mode VARCHAR(20) NOT NULL DEFAULT 'LIGHT',
  dashboard_density VARCHAR(20) NOT NULL DEFAULT 'COMFORTABLE',
  personal_accent_color VARCHAR(20),
  widget_layout TEXT NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(studio_id,user_id)
);

ALTER TABLE user_dashboard_preference ENABLE ROW LEVEL SECURITY;
