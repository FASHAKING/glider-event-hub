-- 0009: Event approval workflow, interests table, notification mute toggle

-- 1. Event approval status column
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

-- 2. Global notification mute on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_muted boolean NOT NULL DEFAULT false;

-- 3. Interests table — tracks which events (and categories) a user is interested in
CREATE TABLE IF NOT EXISTS interests (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interests"
  ON interests FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Interests are publicly readable"
  ON interests FOR SELECT USING (true);
