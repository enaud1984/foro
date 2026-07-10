INSERT INTO studio (
  id, name, address_line, city, postal_code, country, phone, website, logo_url,
  primary_color, accent_color, secondary_color, theme_preset, status, created_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Studio Legale Verdi & Associati',
  'Via dei Tribunali 42',
  'Milano',
  '20122',
  'Italia',
  '+39 02 5550 1842',
  'https://www.studioverdi-demo.it',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="34" fill="%23092746"/><path d="M35 48h90" stroke="%23c9993a" stroke-width="8" stroke-linecap="round"/><path d="M54 48v67M80 48v67M106 48v67" stroke="%23ffffff" stroke-width="7" stroke-linecap="round"/><path d="M44 122h72" stroke="%23c9993a" stroke-width="8" stroke-linecap="round"/><text x="80" y="35" text-anchor="middle" font-family="Georgia" font-size="18" fill="%23c9993a">SV</text></svg>',
  '#092746',
  '#c9993a',
  '#0f7f86',
  'foro-classic',
  'ACTIVE',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_account (
  id, email, password_hash, display_name, status, created_at
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'admin@studioverdi-demo.it',
  '$2a$12$vSPer2byR.ZpRB7sC0UsauNeM/9IE5t6/2P3uVg/uHGwKbYoPAtUu',
  'Avv. Laura Verdi',
  'ACTIVE',
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO studio_membership (
  id, studio_id, user_id, role, status, created_at
) VALUES (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'STUDIO_ADMIN',
  'ACTIVE',
  NOW()
) ON CONFLICT (studio_id, user_id) DO NOTHING;

INSERT INTO user_dashboard_preference (
  id, studio_id, user_id, theme_mode, dashboard_density, personal_accent_color, widget_layout, updated_at
) VALUES (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'LIGHT',
  'COMFORTABLE',
  '#c9993a',
  '[{"key":"calendar","x":0,"y":0,"w":2,"h":2},{"key":"documents","x":2,"y":0,"w":2,"h":2},{"key":"email","x":4,"y":0,"w":2,"h":2},{"key":"clients","x":0,"y":2,"w":2,"h":2},{"key":"matters","x":2,"y":2,"w":4,"h":2}]',
  NOW()
) ON CONFLICT (studio_id, user_id) DO NOTHING;

INSERT INTO audit_event (
  id, studio_id, actor_id, action, entity_type, entity_id, outcome, correlation_id, occurred_at, metadata
) VALUES (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'DEMO_STUDIO_SEEDED',
  'STUDIO',
  '11111111-1111-4111-8111-111111111111',
  'SUCCESS',
  '66666666-6666-4666-8666-666666666666',
  NOW(),
  '{"source":"flyway","purpose":"local-demo","clients":18,"matters":31,"documents":248,"calendarEvents":42}'::jsonb
) ON CONFLICT (id) DO NOTHING;
