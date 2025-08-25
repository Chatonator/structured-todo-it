import { supabase } from '@/supabaseClient';

export const testRecurringTasks = async () => {
  try {
    console.log('Testing recurring tasks processing...');
    
    const { data, error } = await supabase.functions.invoke('process-recurring-tasks', {
      body: {}
    });
    
    if (error) {
      console.error('Error invoking recurring tasks function:', error);
      return false;
    }
    
    console.log('Recurring tasks processing result:', data);
    return true;
  } catch (error) {
    console.error('Failed to test recurring tasks:', error);
    return false;
  }
};