-- GetFitWithJ Database Schema
-- Single-trainer fitness coaching platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- ============================================
-- PROFILES
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,1),
  medical_notes TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WORKOUT TEMPLATES
-- ============================================

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  estimated_duration_min INTEGER,
  trainer_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  video_url TEXT,
  image_url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WORKOUT ASSIGNMENTS
-- ============================================

CREATE TABLE workout_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  trainer_notes TEXT,
  client_notes TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_assignment_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES workout_assignments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  video_url TEXT,
  image_url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WORKOUT COMPLETIONS
-- ============================================

CREATE TABLE workout_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES workout_assignments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MEAL PLANS
-- ============================================

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  total_calories INTEGER,
  trainer_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meal_plan_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein_g NUMERIC(6,1),
  carbs_g NUMERIC(6,1),
  fat_g NUMERIC(6,1),
  portion_size TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MEAL ASSIGNMENTS
-- ============================================

CREATE TABLE meal_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trainer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SESSIONS (SCHEDULED)
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  status session_status NOT NULL DEFAULT 'scheduled',
  trainer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'LKR',
  receipt_url TEXT,
  receipt_file_name TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  subscription_months INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROGRESS LOGS
-- ============================================

CREATE TABLE progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,1),
  body_fat_pct NUMERIC(4,1),
  chest_cm NUMERIC(5,1),
  waist_cm NUMERIC(5,1),
  hips_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  thigh_cm NUMERIC(5,1),
  photo_urls TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('bank_details', 'Bank: Bank of Ceylon\nAccount Name: GetFitWithJ\nAccount Number: XXXX-XXXX-XXXX\nBranch: Colombo'),
  ('welcome_message', 'Welcome to GetFitWithJ! Your fitness journey starts here.'),
  ('payment_instructions', 'Please transfer the subscription fee to the bank account below and upload your receipt.');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_workout_assignments_client ON workout_assignments(client_id);
CREATE INDEX idx_workout_assignments_dates ON workout_assignments(start_date, end_date);
CREATE INDEX idx_workout_completions_client ON workout_completions(client_id);
CREATE INDEX idx_workout_completions_assignment ON workout_completions(assignment_id);
CREATE INDEX idx_meal_assignments_client ON meal_assignments(client_id);
CREATE INDEX idx_sessions_client ON sessions(client_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_progress_logs_client ON progress_logs(client_id);
CREATE INDEX idx_progress_logs_date ON progress_logs(log_date);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_workout_assignments_updated_at
  BEFORE UPDATE ON workout_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_meal_assignments_updated_at
  BEFORE UPDATE ON meal_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_assignment_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- WORKOUT TEMPLATES policies (admin only management)
CREATE POLICY "Admin can manage workout templates"
  ON workout_templates FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view active templates"
  ON workout_templates FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage template exercises"
  ON workout_template_exercises FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view template exercises"
  ON workout_template_exercises FOR SELECT TO authenticated
  USING (true);

-- WORKOUT ASSIGNMENTS policies
CREATE POLICY "Admin can manage assignments"
  ON workout_assignments FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view own assignments"
  ON workout_assignments FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admin can manage assignment exercises"
  ON workout_assignment_exercises FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view own assignment exercises"
  ON workout_assignment_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_assignments
      WHERE id = workout_assignment_exercises.assignment_id
      AND client_id = auth.uid()
    )
  );

-- WORKOUT COMPLETIONS policies
CREATE POLICY "Admin can view all completions"
  ON workout_completions FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can manage own completions"
  ON workout_completions FOR ALL TO authenticated
  USING (client_id = auth.uid());

-- MEAL PLANS policies
CREATE POLICY "Admin can manage meal plans"
  ON meal_plans FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view active meal plans"
  ON meal_plans FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage meal plan days"
  ON meal_plan_days FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view meal plan days"
  ON meal_plan_days FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage meal plan items"
  ON meal_plan_items FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view meal plan items"
  ON meal_plan_items FOR SELECT TO authenticated
  USING (true);

-- MEAL ASSIGNMENTS policies
CREATE POLICY "Admin can manage meal assignments"
  ON meal_assignments FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view own meal assignments"
  ON meal_assignments FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- SESSIONS policies
CREATE POLICY "Admin can manage sessions"
  ON sessions FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view own sessions"
  ON sessions FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- PAYMENTS policies
CREATE POLICY "Admin can manage payments"
  ON payments FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

-- PROGRESS LOGS policies
CREATE POLICY "Admin can view all progress"
  ON progress_logs FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can manage own progress"
  ON progress_logs FOR ALL TO authenticated
  USING (client_id = auth.uid());

-- APP SETTINGS policies
CREATE POLICY "Anyone authenticated can read settings"
  ON app_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON app_settings FOR ALL TO authenticated
  USING (is_admin());

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('progress-photos', 'progress-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for receipts
CREATE POLICY "Admin can view all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND is_admin());

CREATE POLICY "Clients can view own receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Clients can upload own receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for progress photos
CREATE POLICY "Admin can view all progress photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND is_admin());

CREATE POLICY "Clients can manage own progress photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- FUNCTION: Create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
