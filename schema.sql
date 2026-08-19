CREATE TABLE IF NOT EXISTS championships (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id BIGSERIAL PRIMARY KEY,
  championship_id INTEGER NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 19),
  name TEXT NOT NULL,
  UNIQUE (championship_id, position)
);

CREATE TABLE IF NOT EXISTS rounds (
  id BIGSERIAL PRIMARY KEY,
  championship_id INTEGER NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  round_date DATE,
  UNIQUE (championship_id, round_number)
);

CREATE TABLE IF NOT EXISTS scores (
  round_id BIGINT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  points NUMERIC(10, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (round_id, participant_id)
);

CREATE INDEX IF NOT EXISTS scores_participant_idx
  ON scores (participant_id);

CREATE OR REPLACE VIEW general_ranking AS
SELECT
  p.championship_id,
  p.id AS participant_id,
  p.position,
  p.name,
  COUNT(DISTINCT s.round_id)::INTEGER AS rounds_played,
  COALESCE(SUM(s.points), 0)::NUMERIC(10, 2) AS total_points
FROM participants p
LEFT JOIN scores s ON s.participant_id = p.id
GROUP BY p.championship_id, p.id, p.position, p.name;

INSERT INTO championships (id, name)
VALUES (1, 'Meu Campeonato Cartola')
ON CONFLICT (id) DO NOTHING;