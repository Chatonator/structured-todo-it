import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  name: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  duration: number | null;
  estimatedTime: number;
  isRecurring: boolean | null;
  recurrenceInterval: string | null;
  category: string;
  isCompleted: boolean;
  lastCompletedAt: string | null;
}

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  times_per_week: number | null;
  target_days: number[] | null;
  color: string | null;
  is_active: boolean | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Starting time-sync for user: ${user.id}`);

    // 1. Fetch all scheduled tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('scheduledDate', 'is', null);

    if (tasksError) throw tasksError;

    // 2. Fetch all active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (habitsError) throw habitsError;

    console.log(`Found ${tasks?.length || 0} scheduled tasks and ${habits?.length || 0} active habits`);

    const timeEvents = [];

    // 3. Convert tasks to time_events
    if (tasks) {
      for (const task of tasks) {
        const startsAt = combineDateTime(task.scheduledDate!, task.scheduledTime);
        const duration = task.duration || task.estimatedTime || 30;

        const recurrence = task.isRecurring && task.recurrenceInterval 
          ? {
              frequency: mapRecurrenceInterval(task.recurrenceInterval),
              interval: 1
            }
          : null;

        timeEvents.push({
          user_id: user.id,
          entity_type: 'task',
          entity_id: task.id,
          starts_at: startsAt,
          ends_at: null,
          duration,
          is_all_day: false,
          timezone: 'Europe/Paris',
          recurrence,
          title: task.name,
          description: null,
          color: getCategoryColor(task.category),
          priority: 0,
          status: task.isCompleted ? 'completed' : 'scheduled',
          completed_at: task.lastCompletedAt
        });
      }
    }

    // 4. Convert habits to time_events
    if (habits) {
      for (const habit of habits) {
        const now = new Date();
        const startsAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

        const recurrence = {
          frequency: habit.frequency === 'daily' ? 'daily' : 'weekly',
          interval: 1,
          ...(habit.target_days && habit.frequency !== 'daily' && {
            daysOfWeek: habit.target_days
          })
        };

        timeEvents.push({
          user_id: user.id,
          entity_type: 'habit',
          entity_id: habit.id,
          starts_at: startsAt.toISOString(),
          ends_at: null,
          duration: 30,
          is_all_day: true,
          timezone: 'Europe/Paris',
          recurrence,
          title: habit.name,
          description: habit.description,
          color: habit.color || '#ec4899',
          priority: 0,
          status: 'scheduled',
          completed_at: null
        });
      }
    }

    // 5. Upsert into time_events (insert or update if exists)
    if (timeEvents.length > 0) {
      const { error: upsertError } = await supabase
        .from('time_events')
        .upsert(timeEvents, {
          onConflict: 'entity_type,entity_id',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;
    }

    // 6. Generate occurrences for the next 30 days (basic implementation)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    console.log(`Successfully synced ${timeEvents.length} events`);

    return new Response(
      JSON.stringify({
        success: true,
        syncedEvents: timeEvents.length,
        syncedTasks: tasks?.length || 0,
        syncedHabits: habits?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in time-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

// Helper functions
function combineDateTime(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  return date.toISOString();
}

function mapRecurrenceInterval(interval: string): string {
  const mapping: Record<string, string> = {
    'daily': 'daily',
    'weekly': 'weekly',
    'bi-weekly': 'bi-weekly',
    'monthly': 'monthly',
    'yearly': 'yearly'
  };
  return mapping[interval] || 'daily';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Business': '#3b82f6',
    'Personal': '#10b981',
    'Health': '#ef4444',
    'Learning': '#8b5cf6',
    'Finance': '#f59e0b',
    'Social': '#ec4899'
  };
  return colors[category] || '#6b7280';
}
