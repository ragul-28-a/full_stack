-- ==========================================
-- NEXUSSPACE FULL STACK SUPABASE SCHEMA & RLS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Lead', 'Member', 'Contributor')),
  bio TEXT,
  website TEXT
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
    AND NEW.role IS DISTINCT FROM OLD.role
    AND NOT public.is_workspace_admin() THEN
    RAISE EXCEPTION 'Only a workspace administrator can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile and admins can view profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile and admins can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_workspace_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'Member');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_workspace_admin())
  WITH CHECK (auth.uid() = id OR public.is_workspace_admin());

-- Trigger: Automatically create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'Member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------
-- 2. PROJECTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General' CHECK (category IN ('General', 'Web Dev', 'Design', 'Marketing', 'Mobile App', 'AI / Data')),
  status TEXT DEFAULT 'In Progress' CHECK (status IN ('Planning', 'In Progress', 'Completed', 'On Hold')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  cover_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ownership is validated by RLS; this permits safe profile backfills for existing projects.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public projects or projects they own" ON public.projects;
CREATE POLICY "Users can view public projects or projects they own"
  ON public.projects FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id OR public.is_workspace_admin());

DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ------------------------------------------
-- 3. TASKS TABLE (Relational - Child of Projects)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks of accessible projects" ON public.tasks;
CREATE POLICY "Users can view tasks of accessible projects"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND (p.is_public = true OR p.user_id = auth.uid() OR public.is_workspace_admin())
    )
  );

DROP POLICY IF EXISTS "Project owners can insert tasks" ON public.tasks;
CREATE POLICY "Project owners can insert tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners can update tasks" ON public.tasks;
CREATE POLICY "Project owners can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners can delete tasks" ON public.tasks;
CREATE POLICY "Project owners can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()
    )
  );


-- ------------------------------------------
-- 4. PROJECT FILES TABLE (Storage Metadata)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project files for visible projects" ON public.project_files;
CREATE POLICY "Users can view project files for visible projects"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id
        AND (p.is_public = true OR p.user_id = auth.uid() OR public.is_workspace_admin())
    )
  );

DROP POLICY IF EXISTS "Users can upload project files to owned projects" ON public.project_files;
CREATE POLICY "Users can upload project files to owned projects"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete project files of owned projects" ON public.project_files;
CREATE POLICY "Users can delete project files of owned projects"
  ON public.project_files FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id AND p.user_id = auth.uid()
    )
  );


-- ------------------------------------------
-- 5. STORAGE BUCKETS & SECURITY
-- ------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar Images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'avatars'
  );

DROP POLICY IF EXISTS "Project Assets are publicly accessible" ON storage.objects;
CREATE POLICY "Project Assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets');

DROP POLICY IF EXISTS "Authenticated users can upload project assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload project assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      (storage.foldername(name))[2] = 'covers'
      OR (
        (storage.foldername(name))[2] = 'attachments'
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id::text = (storage.foldername(name))[3]
            AND p.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their own project assets" ON storage.objects;
CREATE POLICY "Users can delete their own project assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-assets'
    AND (
      owner_id = auth.uid()::text
      OR (
        (storage.foldername(name))[1] = auth.uid()::text
        AND (
          (storage.foldername(name))[2] = 'covers'
          OR (
            (storage.foldername(name))[2] = 'attachments'
            AND EXISTS (
              SELECT 1 FROM public.projects p
              WHERE p.id::text = (storage.foldername(name))[3]
                AND p.user_id = auth.uid()
            )
          )
        )
      )
    )
  );


-- ------------------------------------------
-- 6. INDEXES
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
