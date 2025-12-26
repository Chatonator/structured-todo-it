-- ============================================
-- Phase 1: Create unified items table WITHOUT FK constraint
-- ============================================

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  item_type text NOT NULL,
  
  -- Harmonized mandatory fields
  category text NOT NULL DEFAULT 'Autres',
  context text NOT NULL DEFAULT 'Perso',
  "estimatedTime" integer NOT NULL DEFAULT 30,
  
  -- Hierarchy (FK added later)
  parent_id uuid,
  order_index integer NOT NULL DEFAULT 0,
  
  -- State
  is_completed boolean NOT NULL DEFAULT false,
  
  -- Flexible metadata
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Performance indexes
CREATE INDEX items_user_id_idx ON public.items(user_id);
CREATE INDEX items_item_type_idx ON public.items(item_type);
CREATE INDEX items_parent_id_idx ON public.items(parent_id);
CREATE INDEX items_category_idx ON public.items(category);
CREATE INDEX items_context_idx ON public.items(context);
CREATE INDEX items_is_completed_idx ON public.items(is_completed);

-- ============================================
-- Phase 2: RLS Policies
-- ============================================

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items"
  ON public.items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Phase 3: Trigger for updated_at
-- ============================================

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Phase 4: Migrate existing data (parents first)
-- ============================================

-- Migrate projects (parents)
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", order_index, is_completed, metadata, created_at, updated_at)
SELECT 
  id,
  user_id,
  name,
  'project',
  COALESCE(category, 'Autres'),
  COALESCE(context, 'Perso'),
  COALESCE("estimatedTime", 60),
  order_index,
  status = 'completed',
  jsonb_build_object(
    'description', description,
    'icon', icon,
    'color', color,
    'status', status,
    'targetDate', target_date,
    'progress', progress,
    'completedAt', completed_at
  ),
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM public.projects;

-- Migrate decks (parents for habits)
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", order_index, is_completed, metadata, created_at, updated_at)
SELECT 
  id,
  user_id,
  name,
  'deck',
  COALESCE(category, 'Quotidien'),
  COALESCE(context, 'Perso'),
  COALESCE("estimatedTime", 30),
  "order",
  false,
  jsonb_build_object(
    'description', description,
    'icon', icon,
    'color', color,
    'isDefault', is_default
  ),
  created_at,
  updated_at
FROM public.decks;

-- Migrate main tasks (level 0, no project) - these are parents for subtasks
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", parent_id, order_index, is_completed, metadata, created_at)
SELECT 
  id,
  user_id,
  name,
  'task',
  category,
  context,
  "estimatedTime",
  NULL,
  0,
  "isCompleted",
  jsonb_build_object(
    'subCategory', "subCategory",
    'duration', duration,
    'isExpanded', "isExpanded"
  ),
  created_at
FROM public.tasks
WHERE level = 0 AND project_id IS NULL;

-- Migrate habits (children of decks)
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", parent_id, order_index, is_completed, metadata, created_at, updated_at)
SELECT 
  id,
  user_id,
  name,
  'habit',
  COALESCE(category, 'Quotidien'),
  COALESCE(context, 'Perso'),
  COALESCE("estimatedTime", 15),
  deck_id,
  "order",
  false,
  jsonb_build_object(
    'description', description,
    'icon', icon,
    'color', color,
    'frequency', frequency,
    'timesPerWeek', times_per_week,
    'targetDays', target_days,
    'isActive', is_active
  ),
  created_at,
  updated_at
FROM public.habits;

-- Migrate subtasks (level > 0, children of tasks)
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", parent_id, order_index, is_completed, metadata, created_at)
SELECT 
  t.id,
  t.user_id,
  t.name,
  'subtask',
  t.category,
  t.context,
  t."estimatedTime",
  t."parentId",
  t.level,
  t."isCompleted",
  jsonb_build_object(
    'subCategory', t."subCategory",
    'duration', t.duration,
    'isExpanded', t."isExpanded",
    'level', t.level
  ),
  t.created_at
FROM public.tasks t
WHERE t.level > 0 AND t.project_id IS NULL;

-- Migrate project tasks (children of projects)
INSERT INTO public.items (id, user_id, name, item_type, category, context, "estimatedTime", parent_id, order_index, is_completed, metadata, created_at)
SELECT 
  id,
  user_id,
  name,
  'project_task',
  category,
  context,
  "estimatedTime",
  project_id,
  0,
  "isCompleted",
  jsonb_build_object(
    'subCategory', "subCategory",
    'duration', duration,
    'isExpanded', "isExpanded",
    'projectStatus', project_status
  ),
  created_at
FROM public.tasks
WHERE project_id IS NOT NULL;

-- ============================================
-- Phase 5: Clean orphaned parent_ids and add FK
-- ============================================

UPDATE public.items 
SET parent_id = NULL 
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT id FROM public.items);

ALTER TABLE public.items 
ADD CONSTRAINT items_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.items(id) ON DELETE CASCADE;