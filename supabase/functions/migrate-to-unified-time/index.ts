import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting migration for user: ${user.id}`);

    let migratedTasks = 0;
    let migratedHabits = 0;
    let migratedCompletions = 0;
    let migratedChallenges = 0;

    // 1. Migrate scheduled tasks to time_events
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('scheduledDate', 'is', null);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    } else if (tasks && tasks.length > 0) {
      console.log(`Found ${tasks.length} scheduled tasks to migrate`);

      for (const task of tasks) {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('time_events')
          .select('id')
          .eq('entity_type', 'task')
          .eq('entity_id', task.id)
          .eq('user_id', user.id)
          .single();

        if (existingEvent) {
          console.log(`Task ${task.id} already has time_event`);
          continue;
        }

        // Calculate times
        const scheduledDate = new Date(task.scheduledDate);
        let startsAt = scheduledDate;
        
        if (task.scheduledTime) {
          const [hours, minutes] = task.scheduledTime.split(':').map(Number);
          startsAt = new Date(scheduledDate);
          startsAt.setHours(hours, minutes, 0, 0);
        } else if (task.startTime) {
          startsAt = new Date(task.startTime);
        }

        const duration = task.duration || task.estimatedTime || 30;
        const endsAt = new Date(startsAt.getTime() + duration * 60000);

        // Map recurrence
        let recurrence = null;
        if (task.isRecurring && task.recurrenceInterval) {
          const frequencyMap: Record<string, string> = {
            'daily': 'daily',
            'weekly': 'weekly',
            'bi-monthly': 'bi-weekly',
            'monthly': 'monthly'
          };
          recurrence = {
            frequency: frequencyMap[task.recurrenceInterval] || 'daily',
            interval: 1
          };
        }

        // Create time_event
        const { error: insertError } = await supabase
          .from('time_events')
          .insert({
            user_id: user.id,
            entity_type: 'task',
            entity_id: task.id,
            title: task.name,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            duration,
            is_all_day: !task.scheduledTime,
            status: task.isCompleted ? 'completed' : 'scheduled',
            completed_at: task.isCompleted ? new Date().toISOString() : null,
            recurrence
          });

        if (insertError) {
          console.error(`Error creating time_event for task ${task.id}:`, insertError);
        } else {
          migratedTasks++;
          console.log(`Migrated task: ${task.name}`);
        }
      }
    }

    // 2. Migrate active habits to time_events
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
    } else if (habits && habits.length > 0) {
      console.log(`Found ${habits.length} active habits to migrate`);

      for (const habit of habits) {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('time_events')
          .select('id')
          .eq('entity_type', 'habit')
          .eq('entity_id', habit.id)
          .eq('user_id', user.id)
          .single();

        if (existingEvent) {
          console.log(`Habit ${habit.id} already has time_event`);
          continue;
        }

        // Map frequency to recurrence
        let recurrence: any = { frequency: 'daily', interval: 1 };
        if (habit.frequency === 'weekly' || habit.frequency === 'x-times-per-week') {
          recurrence = {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: habit.target_days || undefined
          };
        } else if (habit.frequency === 'custom') {
          recurrence = {
            frequency: 'custom',
            interval: 1,
            daysOfWeek: habit.target_days || undefined
          };
        }

        // Default 9h start time for habits
        const today = new Date();
        today.setHours(9, 0, 0, 0);

        const { error: insertError } = await supabase
          .from('time_events')
          .insert({
            user_id: user.id,
            entity_type: 'habit',
            entity_id: habit.id,
            title: habit.name,
            description: habit.description,
            starts_at: today.toISOString(),
            duration: 15,
            is_all_day: true,
            status: 'scheduled',
            color: habit.color,
            recurrence
          });

        if (insertError) {
          console.error(`Error creating time_event for habit ${habit.id}:`, insertError);
        } else {
          migratedHabits++;
          console.log(`Migrated habit: ${habit.name}`);
        }
      }
    }

    // 3. Migrate habit_completions to time_occurrences
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*, habits!inner(id, name)')
      .eq('user_id', user.id);

    if (completionsError) {
      console.error('Error fetching completions:', completionsError);
    } else if (completions && completions.length > 0) {
      console.log(`Found ${completions.length} habit completions to migrate`);

      for (const completion of completions) {
        // Find the time_event for this habit
        const { data: habitEvent } = await supabase
          .from('time_events')
          .select('id')
          .eq('entity_type', 'habit')
          .eq('entity_id', completion.habit_id)
          .eq('user_id', user.id)
          .single();

        if (!habitEvent) {
          console.log(`No time_event found for habit ${completion.habit_id}`);
          continue;
        }

        // Check if occurrence already exists
        const completionDate = new Date(completion.date);
        const startOfDay = new Date(completionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(completionDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingOccurrence } = await supabase
          .from('time_occurrences')
          .select('id')
          .eq('event_id', habitEvent.id)
          .eq('user_id', user.id)
          .gte('starts_at', startOfDay.toISOString())
          .lte('starts_at', endOfDay.toISOString())
          .single();

        if (existingOccurrence) {
          continue;
        }

        // Create occurrence
        const startsAt = new Date(completion.completed_at || completion.date);
        const { error: occError } = await supabase
          .from('time_occurrences')
          .insert({
            event_id: habitEvent.id,
            user_id: user.id,
            starts_at: startsAt.toISOString(),
            ends_at: new Date(startsAt.getTime() + 15 * 60000).toISOString(),
            status: 'completed',
            completed_at: completion.completed_at || new Date().toISOString()
          });

        if (occError) {
          console.error(`Error creating occurrence for completion ${completion.id}:`, occError);
        } else {
          migratedCompletions++;
        }
      }
      console.log(`Migrated ${migratedCompletions} habit completions`);
    }

    // 4. Migrate active user challenges to time_events
    const { data: userChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select('*, challenges!inner(*)')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .gte('expires_at', new Date().toISOString().split('T')[0]);

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
    } else if (userChallenges && userChallenges.length > 0) {
      console.log(`Found ${userChallenges.length} active challenges to migrate`);

      for (const uc of userChallenges) {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('time_events')
          .select('id')
          .eq('entity_type', 'challenge')
          .eq('entity_id', uc.id)
          .eq('user_id', user.id)
          .single();

        if (existingEvent) {
          continue;
        }

        const challenge = uc.challenges;
        const assignedDate = new Date(uc.assigned_date);
        assignedDate.setHours(8, 0, 0, 0);

        // Map challenge type to recurrence
        let recurrence = null;
        if (challenge.type === 'daily') {
          recurrence = { frequency: 'daily', interval: 1 };
        } else if (challenge.type === 'weekly') {
          recurrence = { frequency: 'weekly', interval: 1 };
        }

        const { error: insertError } = await supabase
          .from('time_events')
          .insert({
            user_id: user.id,
            entity_type: 'challenge',
            entity_id: uc.id,
            title: challenge.name,
            description: challenge.description,
            starts_at: assignedDate.toISOString(),
            duration: 30,
            is_all_day: true,
            status: 'scheduled',
            recurrence
          });

        if (insertError) {
          console.error(`Error creating time_event for challenge ${uc.id}:`, insertError);
        } else {
          migratedChallenges++;
        }
      }
    }

    console.log(`Migration complete for user ${user.id}`);
    console.log(`Tasks: ${migratedTasks}, Habits: ${migratedHabits}, Completions: ${migratedCompletions}, Challenges: ${migratedChallenges}`);

    return new Response(JSON.stringify({
      success: true,
      migrated: {
        tasks: migratedTasks,
        habits: migratedHabits,
        completions: migratedCompletions,
        challenges: migratedChallenges
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
