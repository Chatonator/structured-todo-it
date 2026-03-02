import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  screenshot_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export function useSubmitBugReport() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBugReport = async (
    title: string,
    description: string,
    screenshotFile?: File | null
  ) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let screenshotUrl: string | null = null;

      if (screenshotFile) {
        const ext = screenshotFile.name.split('.').pop() || 'png';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(path, screenshotFile, { contentType: screenshotFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('bug-screenshots')
          .getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('bug_reports').insert({
        user_id: user.id,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        screenshot_url: screenshotUrl,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast({ title: 'Bug signalé', description: 'Merci pour votre signalement !' });
      return true;
    } catch (err: any) {
      logger.error('Failed to submit bug report', { error: err.message }, err);
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le signalement.', variant: 'destructive' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBugReport, isSubmitting };
}

export function useBugReportsList(statusFilter?: string) {
  return useQuery({
    queryKey: ['bug-reports', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BugReport[];
    },
  });
}

export function useUpdateBugReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const updates: Record<string, any> = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();

      const { error } = await supabase.from('bug_reports').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast({ title: 'Bug mis à jour' });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}
