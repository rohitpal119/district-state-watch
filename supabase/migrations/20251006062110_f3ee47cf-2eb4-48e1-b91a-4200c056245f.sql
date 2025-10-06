-- Add contractor to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contractor';

-- Create user_roles table for proper role management (security best practice)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create contractor_communications table
CREATE TABLE IF NOT EXISTS public.contractor_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  district_collector_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('contractor', 'district_collector')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  read boolean DEFAULT false NOT NULL
);

ALTER TABLE public.contractor_communications ENABLE ROW LEVEL SECURITY;

-- RLS for contractor_communications
CREATE POLICY "Contractors can view own communications"
ON public.contractor_communications
FOR SELECT
USING (
  auth.uid() = contractor_id OR 
  auth.uid() = district_collector_id
);

CREATE POLICY "Contractors can insert own communications"
ON public.contractor_communications
FOR INSERT
WITH CHECK (
  auth.uid() = contractor_id AND sender_type = 'contractor'
);

CREATE POLICY "District collectors can insert communications"
ON public.contractor_communications
FOR INSERT
WITH CHECK (
  auth.uid() = district_collector_id AND sender_type = 'district_collector'
);

-- Create project_image_updates table
CREATE TABLE IF NOT EXISTS public.project_image_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  contractor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('ar', '360', 'progress')),
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.project_image_updates ENABLE ROW LEVEL SECURITY;

-- RLS for project_image_updates
CREATE POLICY "Anyone can view image updates"
ON public.project_image_updates
FOR SELECT
USING (true);

CREATE POLICY "Contractors can insert own image updates"
ON public.project_image_updates
FOR INSERT
WITH CHECK (auth.uid() = contractor_id);

-- Create contractor_fund_updates table
CREATE TABLE IF NOT EXISTS public.contractor_fund_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  contractor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  receipt_url text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.contractor_fund_updates ENABLE ROW LEVEL SECURITY;

-- RLS for contractor_fund_updates
CREATE POLICY "Contractors can view own fund updates"
ON public.contractor_fund_updates
FOR SELECT
USING (auth.uid() = contractor_id);

CREATE POLICY "District collectors can view district fund updates"
ON public.contractor_fund_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'district_collector'
    AND profiles.assigned_district = (
      SELECT district FROM projects WHERE projects.id = contractor_fund_updates.project_id
    )
  )
);

CREATE POLICY "Contractors can insert own fund updates"
ON public.contractor_fund_updates
FOR INSERT
WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "District collectors can update fund update status"
ON public.contractor_fund_updates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'district_collector'
    AND profiles.assigned_district = (
      SELECT district FROM projects WHERE projects.id = contractor_fund_updates.project_id
    )
  )
);

-- Add contractor_id to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contractor_id uuid REFERENCES auth.users(id);

-- Update projects RLS to include contractors
CREATE POLICY "Contractors can view assigned projects"
ON public.projects
FOR SELECT
USING (auth.uid() = contractor_id);