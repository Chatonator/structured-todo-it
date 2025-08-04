import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Task {
  id: string;
  isRecurring: boolean;
  recurrenceInterval: string;
  lastCompletedAt: string;
  isCompleted: boolean;
}

function calculateNextRecurrence(lastCompletedAt: string, interval: string): Date {
  const lastCompleted = new Date(lastCompletedAt);
  const now = new Date();
  
  switch (interval) {
    case 'daily':
      lastCompleted.setDate(lastCompleted.getDate() + 1);
      break;
    case 'weekly':
      lastCompleted.setDate(lastCompleted.getDate() + 7);
      break;
    case 'bi-monthly':
      lastCompleted.setDate(lastCompleted.getDate() + 15);
      break;
    case 'monthly':
      lastCompleted.setMonth(lastCompleted.getMonth() + 1);
      break;
    default:
      return new Date(0); // Invalid interval
  }
  
  return lastCompleted;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting recurring tasks processing...');

    // Fetch all completed recurring tasks
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, isRecurring, recurrenceInterval, lastCompletedAt, isCompleted')
      .eq('isRecurring', true)
      .eq('isCompleted', true)
      .not('lastCompletedAt', 'is', null);

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTasks?.length || 0} completed recurring tasks`);

    const now = new Date();
    const tasksToReactivate: string[] = [];

    // Check each task to see if it should be reactivated
    for (const task of recurringTasks || []) {
      const nextRecurrence = calculateNextRecurrence(task.lastCompletedAt, task.recurrenceInterval);
      
      console.log(`Task ${task.id}: Next recurrence ${nextRecurrence.toISOString()}, Current time ${now.toISOString()}`);
      
      if (now >= nextRecurrence) {
        tasksToReactivate.push(task.id);
      }
    }

    console.log(`Reactivating ${tasksToReactivate.length} tasks`);

    // Reactivate tasks by setting isCompleted to false
    if (tasksToReactivate.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          isCompleted: false,
          startTime: now.toISOString()
        })
        .in('id', tasksToReactivate);

      if (updateError) {
        console.error('Error updating tasks:', updateError);
        throw updateError;
      }
    }

    const result = {
      processed: recurringTasks?.length || 0,
      reactivated: tasksToReactivate.length,
      reactivatedTaskIds: tasksToReactivate
    };

    console.log('Processing complete:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in process-recurring-tasks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});