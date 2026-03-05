-- Trigger function: notify admin when a bug report is inserted
CREATE OR REPLACE FUNCTION public.notify_admin_on_bug_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid := 'a72dc5ca-c281-46c0-a16c-139676705564';
  _type_label text;
BEGIN
  IF NEW.type = 'bug' THEN
    _type_label := '🐛 Nouveau bug';
  ELSE
    _type_label := '💡 Nouvelle suggestion';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _admin_id,
    'warning',
    _type_label || ' : ' || LEFT(NEW.title, 80),
    LEFT(NEW.description, 200),
    jsonb_build_object('bug_report_id', NEW.id, 'reporter_id', NEW.user_id, 'severity', NEW.severity)
  );

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_notify_admin_on_bug_report
  AFTER INSERT ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_bug_report();