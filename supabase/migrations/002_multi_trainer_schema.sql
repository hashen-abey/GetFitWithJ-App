-- Migration 002: Multi-trainer schema with programs, notes, notifications
-- Extends the initial schema with full trainer-client management features

-- ============================================
-- NEW ENUM TYPES
-- ============================================

-- Add associate_trainer to existing role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'trainer_owner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'associate_trainer';

CREATE TYPE session_type AS ENUM ('in_person', 'online');

-- ============================================
-- CLIENT INVITES
-- ============================================

CREATE TABLE client_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_invites_token ON client_invites(token);
CREATE INDEX idx_client_invites_trainer ON client_invites(trainer_id);

-- ============================================
-- WORKOUTS (YouTube-based library)
-- ============================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT GENERATED ALWAYS AS (
    CASE
      WHEN youtube_url ~ 'youtu\.be/([A-Za-z0-9_-]{11})' THEN
        (regexp_match(youtube_url, 'youtu\.be/([A-Za-z0-9_-]{11})'))[1]
      WHEN youtube_url ~ '[?&]v=([A-Za-z0-9_-]{11})' THEN
        (regexp_match(youtube_url, '[?&]v=([A-Za-z0-9_-]{11})'))[1]
      ELSE NULL
    END
  ) STORED,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  muscle_groups TEXT[] DEFAULT '{}',
  duration_mins INTEGER,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_created_by ON workouts(created_by);
CREATE INDEX idx_workouts_difficulty ON workouts(difficulty);

-- ============================================
-- PROGRAMS
-- ============================================

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_programs_trainer ON programs(trainer_id);

CREATE TABLE program_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_program_workouts_program ON program_workouts(program_id);
CREATE INDEX idx_program_workouts_workout ON program_workouts(workout_id);

CREATE TABLE client_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_programs_client ON client_programs(client_id);
CREATE INDEX idx_client_programs_program ON client_programs(program_id);

-- ============================================
-- UPDATE SESSIONS TABLE
-- ============================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type session_type NOT NULL DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS duration_mins INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS location_or_link TEXT;

CREATE INDEX idx_sessions_trainer ON sessions(trainer_id);

-- ============================================
-- NOTES & REPLIES (Realtime)
-- ============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_client ON notes(client_id);
CREATE INDEX idx_notes_trainer ON notes(trainer_id);

CREATE TABLE note_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_replies_note ON note_replies(note_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER tr_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: is any kind of trainer
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer_owner', 'associate_trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: is trainer owner (full access)
CREATE OR REPLACE FUNCTION is_trainer_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer_owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CLIENT INVITES policies
CREATE POLICY "Trainers can manage their invites"
  ON client_invites FOR ALL TO authenticated
  USING (trainer_id = auth.uid() OR is_trainer_owner());

CREATE POLICY "Anyone can read invite by token"
  ON client_invites FOR SELECT TO anon
  USING (true);

-- WORKOUTS policies
CREATE POLICY "Trainers can manage workouts"
  ON workouts FOR ALL TO authenticated
  USING (is_trainer());

CREATE POLICY "Clients can view workouts"
  ON workouts FOR SELECT TO authenticated
  USING (true);

-- PROGRAMS policies
CREATE POLICY "Trainer owner sees all programs"
  ON programs FOR SELECT TO authenticated
  USING (is_trainer_owner());

CREATE POLICY "Associate trainers see own programs"
  ON programs FOR SELECT TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY "Clients see assigned programs"
  ON programs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_programs cp
      WHERE cp.program_id = programs.id AND cp.client_id = auth.uid()
    )
  );

CREATE POLICY "Trainer owner manages all programs"
  ON programs FOR ALL TO authenticated
  USING (is_trainer_owner());

CREATE POLICY "Associate trainers manage own programs"
  ON programs FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Associate trainers update own programs"
  ON programs FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY "Associate trainers delete own programs"
  ON programs FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- PROGRAM_WORKOUTS policies
CREATE POLICY "Trainers can manage program workouts"
  ON program_workouts FOR ALL TO authenticated
  USING (
    is_trainer_owner() OR
    EXISTS (
      SELECT 1 FROM programs
      WHERE id = program_workouts.program_id AND trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view assigned program workouts"
  ON program_workouts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      JOIN client_programs cp ON cp.program_id = p.id
      WHERE p.id = program_workouts.program_id AND cp.client_id = auth.uid()
    )
  );

-- CLIENT_PROGRAMS policies
CREATE POLICY "Trainers can manage client programs"
  ON client_programs FOR ALL TO authenticated
  USING (is_trainer());

CREATE POLICY "Clients can view own programs"
  ON client_programs FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- NOTES policies
CREATE POLICY "Trainer owner sees all notes"
  ON notes FOR ALL TO authenticated
  USING (is_trainer_owner());

CREATE POLICY "Associate trainer manages own notes"
  ON notes FOR ALL TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY "Clients can view and update own notes"
  ON notes FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can mark notes as read"
  ON notes FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- NOTE_REPLIES policies
CREATE POLICY "Note participants can view replies"
  ON note_replies FOR SELECT TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM notes
      WHERE id = note_replies.note_id
      AND (trainer_id = auth.uid() OR client_id = auth.uid())
    ) OR
    is_trainer_owner()
  );

CREATE POLICY "Note participants can insert replies"
  ON note_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      is_trainer() OR
      EXISTS (
        SELECT 1 FROM notes
        WHERE id = note_replies.note_id AND client_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authors can delete own replies"
  ON note_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_trainer_owner());

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- SUPABASE REALTIME
-- Enable realtime for notes and replies
-- ============================================

-- Run in Supabase dashboard: ALTER PUBLICATION supabase_realtime ADD TABLE notes, note_replies, notifications;

-- ============================================
-- STORAGE: Update for Supabase Storage (replace Cloudinary)
-- ============================================

-- avatars bucket is already created in migration 001
-- Add workout-thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('workout-thumbnails', 'workout-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view workout thumbnails"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'workout-thumbnails');

CREATE POLICY "Trainers can upload workout thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workout-thumbnails' AND is_trainer());

-- ============================================
-- FUNCTION: Send invite notification
-- ============================================

CREATE OR REPLACE FUNCTION create_invite_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for the trainer when invite is used
  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
    INSERT INTO notifications (user_id, type, payload)
    VALUES (NEW.trainer_id, 'invite_accepted', jsonb_build_object('email', NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invite_used
  AFTER UPDATE ON client_invites
  FOR EACH ROW EXECUTE FUNCTION create_invite_notification();
