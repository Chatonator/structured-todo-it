begin;

update public.items
set category = case category
  when 'Obligation' then 'critical'
  when 'Quotidien' then 'urgent'
  when 'Envie' then 'important'
  when 'Autres' then 'low_priority'
  else category
end
where category in ('Obligation', 'Quotidien', 'Envie', 'Autres');

update public.items
set metadata = jsonb_set(
  metadata,
  '{category}',
  to_jsonb(
    case metadata ->> 'category'
      when 'Obligation' then 'critical'
      when 'Quotidien' then 'urgent'
      when 'Envie' then 'important'
      when 'Autres' then 'low_priority'
      else metadata ->> 'category'
    end
  ),
  true
)
where metadata ? 'category'
  and metadata ->> 'category' in ('Obligation', 'Quotidien', 'Envie', 'Autres');

update public.team_tasks
set category = case category
  when 'Obligation' then 'critical'
  when 'Quotidien' then 'urgent'
  when 'Envie' then 'important'
  when 'Autres' then 'low_priority'
  else category
end
where category in ('Obligation', 'Quotidien', 'Envie', 'Autres');

commit;
