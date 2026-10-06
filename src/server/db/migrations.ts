/**
 * Migrations versionadas. NUNCA edite uma migration já aplicada — crie uma nova.
 * Os dados do usuário sobrevivem a atualizações do código porque o banco vive em GZ_DATA_DIR.
 */
export interface Migration {
  id: string;
  up: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    id: '0001_init',
    up: [
      `CREATE TABLE prospects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        segment TEXT NOT NULL DEFAULT 'servicos',
        city TEXT, state TEXT, country TEXT NOT NULL DEFAULT 'Brasil',
        instagram TEXT, website TEXT, whatsapp TEXT, phone TEXT, email TEXT, contact_name TEXT,
        notes TEXT NOT NULL DEFAULT '',
        links TEXT NOT NULL DEFAULT '[]',
        lead_source TEXT,
        stage TEXT NOT NULL DEFAULT 'lead',
        potential_value REAL, closed_value REAL,
        last_contact_at TEXT, next_followup_at TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        logo_path TEXT,
        photos TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_prospects_stage ON prospects(stage)`,
      `CREATE INDEX idx_prospects_updated ON prospects(updated_at)`,
      `CREATE TABLE audits (
        id TEXT PRIMARY KEY,
        prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        scores TEXT, report TEXT,
        screenshots TEXT NOT NULL DEFAULT '[]',
        opportunities TEXT NOT NULL DEFAULT '[]',
        error TEXT,
        created_at TEXT NOT NULL, finished_at TEXT
      )`,
      `CREATE INDEX idx_audits_prospect ON audits(prospect_id)`,
      `CREATE TABLE previews (
        id TEXT PRIMARY KEY,
        prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
        theme TEXT NOT NULL, segment TEXT NOT NULL,
        layout_variant INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL,
        path TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_previews_prospect ON previews(prospect_id)`,
      `CREATE TABLE proposals (
        id TEXT PRIMARY KEY,
        prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sent_at TEXT
      )`,
      `CREATE INDEX idx_proposals_prospect ON proposals(prospect_id)`,
      `CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        prospect_id TEXT REFERENCES prospects(id) ON DELETE SET NULL,
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, domain TEXT,
        config TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        last_build_at TEXT, last_qa TEXT,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_at TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE activities (
        id TEXT PRIMARY KEY,
        prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_activities_prospect ON activities(prospect_id, created_at)`,
      `CREATE TABLE templates (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        key TEXT NOT NULL,
        name TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        UNIQUE(kind, key)
      )`,
      `CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    ],
  },
];
