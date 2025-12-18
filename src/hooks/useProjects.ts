import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { Project, ProjectStatus } from '@/types/project';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewardProjectCreation, rewardProjectCompletion } = useGamification();

  const formatProject = useCallback((data: any): Project => ({
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    status: data.status,
    targetDate: data.target_date ? new Date(data.target_date) : undefined,
    orderIndex: data.order_index,
    progress: data.progress,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined
  }), []);

  const loadProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map(formatProject);
      setProjects(formatted);
    } catch (error: any) {
      logger.error('Failed to load projects', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, formatProject]);

  const createProject = useCallback(async (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          description,
          icon: icon || '📚',
          color: color || '#a78bfa',
          order_index: projects.length
        })
        .select()
        .single();

      if (error) throw error;

      await loadProjects();
      
      toast({
        title: "✅ Projet créé",
        description: `${name} a été créé avec succès`,
      });

      // Gamification: reward project creation
      await rewardProjectCreation(name);

      return formatProject(data);
    } catch (error: any) {
      logger.error('Failed to create project', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive"
      });
      return null;
    }
  }, [user, projects.length, loadProjects, toast, formatProject]);

  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Project>
  ) => {
    if (!user) return false;

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate?.toISOString().split('T')[0];

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId);

      if (error) throw error;

      await loadProjects();
      return true;
    } catch (error: any) {
      logger.error('Failed to update project', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadProjects, toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) return false;

    try {
      await supabase
        .from('tasks')
        .update({ project_id: null, project_status: null })
        .eq('project_id', projectId);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      await loadProjects();
      
      toast({
        title: "🗑️ Projet supprimé",
        description: "Le projet a été supprimé avec succès",
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to delete project', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadProjects, toast]);

  const completeProject = useCallback(async (projectId: string) => {
    if (!user) return false;

    try {
      // Get project details and task count
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      const { data: tasks, count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('level', 0);

      const { error } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      await loadProjects();
      
      toast({
        title: "🎉 Projet complété !",
        description: "Félicitations pour avoir terminé ce projet",
      });

      // Gamification: reward project completion
      if (project) {
        await rewardProjectCompletion(projectId, project.name, count || 0);
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to complete project', { error: error.message });
      return false;
    }
  }, [user, loadProjects, toast, rewardProjectCompletion]);

  const assignTaskToProject = useCallback(async (
    taskId: string,
    projectId: string | null
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          project_id: projectId,
          project_status: projectId ? 'todo' : null
        })
        .eq('id', taskId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      logger.error('Failed to assign task to project', { error: error.message });
      return false;
    }
  }, [user]);

  const activeProjects = useCallback(() => {
    return projects.filter(p => p.status !== 'archived');
  }, [projects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Realtime subscription for projects
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.info('Projects realtime update', { event: payload.eventType });
          
          if (payload.eventType === 'INSERT') {
            const newProject = formatProject(payload.new);
            setProjects(prev => [...prev, newProject]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedProject = formatProject(payload.new);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, formatProject]);

  return {
    projects,
    loading,
    activeProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    assignTaskToProject,
    reloadProjects: loadProjects
  };
};
