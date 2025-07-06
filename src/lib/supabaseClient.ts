
import { createClient } from '@supabase/supabase-js';
import { Task } from '@/types/task';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseTask {
  id: string;
  user_id: string;
  name: string;
  category: string;
  sub_category?: string;
  context: string;
  estimated_time: number;
  created_at: string;
  parent_id?: string;
  level: number;
  is_expanded: boolean;
  is_completed: boolean;
  scheduled_date?: string;
  scheduled_time?: string;
  duration?: number;
  start_time?: string;
}

export const saveTasksToSupabase = async (tasks: Task[], userId: string): Promise<void> => {
  try {
    // Supprimer les anciennes tâches de l'utilisateur
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Convertir les tâches au format Supabase
    const supabaseTasks: SupabaseTask[] = tasks.map(task => ({
      id: task.id,
      user_id: userId,
      name: task.name,
      category: task.category,
      sub_category: task.subCategory,
      context: task.context,
      estimated_time: task.estimatedTime,
      created_at: task.createdAt.toISOString(),
      parent_id: task.parentId,
      level: task.level,
      is_expanded: task.isExpanded,
      is_completed: task.isCompleted,
      scheduled_date: task.scheduledDate?.toISOString(),
      scheduled_time: task.scheduledTime,
      duration: task.duration,
      start_time: task.startTime?.toISOString()
    }));

    // Insérer les nouvelles tâches
    const { error: insertError } = await supabase
      .from('tasks')
      .insert(supabaseTasks);

    if (insertError) throw insertError;

    console.log('Tâches sauvegardées vers Supabase avec succès');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde vers Supabase:', error);
    throw error;
  }
};

export const loadTasksFromSupabase = async (userId: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Convertir les données Supabase vers le format local
    const tasks: Task[] = (data || []).map((supabaseTask: SupabaseTask) => ({
      id: supabaseTask.id,
      name: supabaseTask.name,
      category: supabaseTask.category as Task['category'],
      subCategory: supabaseTask.sub_category as Task['subCategory'],
      context: supabaseTask.context as Task['context'],
      estimatedTime: supabaseTask.estimated_time,
      createdAt: new Date(supabaseTask.created_at),
      parentId: supabaseTask.parent_id,
      level: supabaseTask.level as Task['level'],
      isExpanded: supabaseTask.is_expanded,
      isCompleted: supabaseTask.is_completed,
      scheduledDate: supabaseTask.scheduled_date ? new Date(supabaseTask.scheduled_date) : undefined,
      scheduledTime: supabaseTask.scheduled_time,
      duration: supabaseTask.duration,
      startTime: supabaseTask.start_time ? new Date(supabaseTask.start_time) : undefined
    }));

    console.log('Tâches chargées depuis Supabase avec succès:', tasks.length);
    return tasks;
  } catch (error) {
    console.error('Erreur lors du chargement depuis Supabase:', error);
    throw error;
  }
};
