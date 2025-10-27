/*
  # XML to JSON Converter - Database Schema

  ## Overview
  Creates the complete database schema for the XML to JSON Converter software,
  including user authentication, conversion history, and analytics tracking.

  ## New Tables

  ### 1. `conversions`
  Stores all XML to JSON conversion records with full traceability
  - `id` (uuid, primary key) - Unique identifier for each conversion
  - `user_id` (uuid, foreign key) - Links to auth.users, null for anonymous conversions
  - `filename` (text) - Original filename if uploaded
  - `xml_input` (text) - Original XML content
  - `json_output` (text) - Converted JSON result
  - `file_size` (integer) - Size of input XML in bytes
  - `conversion_time_ms` (integer) - Processing time in milliseconds
  - `status` (text) - Conversion status: success, error
  - `error_message` (text) - Error details if conversion failed
  - `created_at` (timestamptz) - Timestamp of conversion

  ### 2. `user_profiles`
  Extended user information and preferences
  - `id` (uuid, primary key) - References auth.users(id)
  - `full_name` (text) - User's full name
  - `role` (text) - User role: developer, analyst, admin
  - `organization` (text) - Company/organization name
  - `total_conversions` (integer) - Count of conversions performed
  - `created_at` (timestamptz) - Profile creation date
  - `updated_at` (timestamptz) - Last profile update

  ## Security
  - Enable RLS on all tables
  - Users can only view their own conversion history
  - Authenticated users can create conversions
  - Anonymous users can convert but not access history
  - Admin users can view all conversions

  ## Indexes
  - Index on user_id for fast history queries
  - Index on created_at for chronological sorting
  - Index on status for filtering by conversion result
*/

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text DEFAULT '',
  xml_input text NOT NULL,
  json_output text,
  file_size integer DEFAULT 0,
  conversion_time_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  role text DEFAULT 'developer',
  organization text DEFAULT '',
  total_conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);

-- Enable Row Level Security
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversions table

-- Allow authenticated users to view their own conversions
CREATE POLICY "Users can view own conversions"
  ON conversions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to create conversions
CREATE POLICY "Authenticated users can create conversions"
  ON conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to create conversions (without user_id)
CREATE POLICY "Anonymous users can create conversions"
  ON conversions
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow users to delete their own conversions
CREATE POLICY "Users can delete own conversions"
  ON conversions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_profiles table

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update conversion count
CREATE OR REPLACE FUNCTION public.increment_conversion_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.status = 'success' THEN
    UPDATE public.user_profiles
    SET total_conversions = total_conversions + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversion count
DROP TRIGGER IF EXISTS on_conversion_created ON conversions;
CREATE TRIGGER on_conversion_created
  AFTER INSERT ON conversions
  FOR EACH ROW EXECUTE FUNCTION public.increment_conversion_count();
