import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

import { KanbanColumnConfig } from '@/types/item';

export type TeamProjectStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'archived';

export interface TeamProject {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  status: TeamProjectStatus;
  targetDate?: Date;
  orderIndex: number;
  progress: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  kanbanColumns?: KanbanColumnConfig[];
  showInSidebar?: boolean;
}

interface TeamProjectRow {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: string;
  target_date: string | null;
  order_index: number;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  kanban_columns: unknown; // JSON from Supabase, will be cast
}

const mapRowToProject = (row: TeamProjectRow): TeamProject => ({
  id: row.id,
  teamId: row.team_id,
  name: row.name,
  description: row.description || undefined,
  icon: row.icon || '📁',
  color: row.color || '#a78bfa',
  status: row.status as TeamProjectStatus,
  targetDate: row.target_date ? new Date(row.target_date) : undefined,
  orderIndex: row.order_index,
  progress: row.progress,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  kanbanColumns: (row.kanban_columns as KanbanColumnConfig[] | null) || undefined,
});

export const useTeamProjects = (teamId: string | null) => {
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!teamId || !user) {
      setProjects([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_projects')
        .select('*')
        .eq('team_id', teamId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setProjects((data || []).map(mapRowToProject));
    } catch (error: any) {
      console.error('Error fetching team projects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets d'équipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [teamId, user, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<TeamProject | null> => {
    if (!teamId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('team_projects')
        .insert({
          team_id: teamId,
          name,
          description: description || null,
          icon: icon || '📁',
          color: color || '#a78bfa',
          created_by: user.id,
          order_index: projects.length,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = mapRowToProject(data);
      setProjects(prev => [...prev, newProject]);
      
      toast({
        title: "Projet créé",
        description: `Le projet "${name}" a été créé`,
      });

      return newProject;
    } catch (error: any) {
      console.error('Error creating team project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
      return null;
    }
  }, [teamId, user, projects.length, toast]);

  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Omit<TeamProject, 'id' | 'teamId' | 'createdBy' | 'createdAt'>>
  ): Promise<boolean> => {
    if (!teamId || !user) return false;

    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
        if (updates.status === 'completed') {
          dbUpdates.completed_at = new Date().toISOString();
        }
      }
      if (updates.targetDate !== undefined) {
        dbUpdates.target_date = updates.targetDate ? updates.targetDate.toISOString().split('T')[0] : null;
      }
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.kanbanColumns !== undefined) dbUpdates.kanban_columns = updates.kanbanColumns;

      const { error } = await supabase
        .from('team_projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .eq('team_id', teamId);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
      ));

      return true;
    } catch (error: any) {
      console.error('Error updating team project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      });
      return false;
    }
  }, [teamId, user, toast]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!teamId || !user) return false;

    try {
      const { error } = await supabase
        .from('team_projects')
        .delete()
        .eq('id', projectId)
        .eq('team_id', teamId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting team project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet (seuls les admins peuvent supprimer)",
        variant: "destructive",
      });
      return false;
    }
  }, [teamId, user, toast]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
