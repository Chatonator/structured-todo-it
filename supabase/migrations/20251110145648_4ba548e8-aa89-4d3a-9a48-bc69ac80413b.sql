-- ========================================
-- Phase 1: Structure de base pour les équipes
-- ========================================

-- 1. Créer l'enum pour les rôles d'équipe
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- 2. Créer la table teams
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invite_code TEXT NOT NULL UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Créer la table team_members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 4. Créer la table team_tasks (reprend la structure de tasks)
CREATE TABLE public.team_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subCategory TEXT,
  context TEXT NOT NULL,
  duration INTEGER,
  scheduledDate DATE,
  scheduledTime TEXT,
  startTime TIMESTAMP WITH TIME ZONE,
  isCompleted BOOLEAN NOT NULL DEFAULT false,
  isExpanded BOOLEAN NOT NULL DEFAULT true,
  parentId UUID REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  isRecurring BOOLEAN DEFAULT false,
  lastCompletedAt TIMESTAMP WITHOUT TIME ZONE,
  recurrenceInterval TEXT,
  estimatedTime INTEGER NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Créer les index pour optimiser les performances
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_tasks_team_id ON public.team_tasks(team_id);
CREATE INDEX idx_team_tasks_assigned_to ON public.team_tasks(assigned_to);
CREATE INDEX idx_team_tasks_created_by ON public.team_tasks(created_by);

-- 6. Créer les triggers pour updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_tasks_updated_at
  BEFORE UPDATE ON public.team_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Fonctions de sécurité (Security Definer)
-- ========================================

-- Fonction pour vérifier si un utilisateur est membre d'une équipe
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Fonction pour vérifier si un utilisateur a un rôle spécifique dans une équipe
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id uuid, _team_id uuid, _role team_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si un utilisateur est owner ou admin d'une équipe
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role IN ('owner', 'admin')
  )
$$;

-- ========================================
-- RLS Policies pour la table teams
-- ========================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- SELECT: accessible si membre de l'équipe
CREATE POLICY "Users can view teams they are members of"
ON public.teams
FOR SELECT
USING (public.is_team_member(auth.uid(), id));

-- INSERT: tout utilisateur authentifié peut créer une équipe
CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- UPDATE: seulement owner ou admin
CREATE POLICY "Team admins can update team"
ON public.teams
FOR UPDATE
USING (public.is_team_admin(auth.uid(), id))
WITH CHECK (public.is_team_admin(auth.uid(), id));

-- DELETE: seulement owner
CREATE POLICY "Team owners can delete team"
ON public.teams
FOR DELETE
USING (public.has_team_role(auth.uid(), id, 'owner'));

-- ========================================
-- RLS Policies pour la table team_members
-- ========================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- SELECT: si membre de l'équipe
CREATE POLICY "Team members can view other members"
ON public.team_members
FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

-- INSERT: géré par les edge functions (pour invitation)
-- Mais on permet aussi l'auto-ajout lors de la création d'équipe
CREATE POLICY "Users can add themselves when creating team"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: seulement admin pour changer les rôles
CREATE POLICY "Team admins can update member roles"
ON public.team_members
FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

-- DELETE: owner peut retirer n'importe qui, membre peut se retirer lui-même
CREATE POLICY "Team owners can remove members or members can leave"
ON public.team_members
FOR DELETE
USING (
  public.has_team_role(auth.uid(), team_id, 'owner')
  OR auth.uid() = user_id
);

-- ========================================
-- RLS Policies pour la table team_tasks
-- ========================================

ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: si membre de l'équipe
CREATE POLICY "Team members can view team tasks"
ON public.team_tasks
FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

-- INSERT: si membre de l'équipe
CREATE POLICY "Team members can create tasks"
ON public.team_tasks
FOR INSERT
WITH CHECK (
  public.is_team_member(auth.uid(), team_id)
  AND auth.uid() = created_by
);

-- UPDATE: si membre de l'équipe
CREATE POLICY "Team members can update team tasks"
ON public.team_tasks
FOR UPDATE
USING (public.is_team_member(auth.uid(), team_id))
WITH CHECK (public.is_team_member(auth.uid(), team_id));

-- DELETE: si membre de l'équipe (peut être restreint plus tard)
CREATE POLICY "Team members can delete team tasks"
ON public.team_tasks
FOR DELETE
USING (public.is_team_member(auth.uid(), team_id));