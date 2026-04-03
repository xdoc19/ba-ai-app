if (action === 'projects') {
  const { user_id } = req.body;
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      reports(progress_pct, milestone_status, report_date)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  // Attach last report to each project
  const projects = data.map(p => ({
    ...p,
    lastReport: p.reports?.sort((a,b) => new Date(b.report_date) - new Date(a.report_date))[0] || null
  }));
  return res.json({ projects });
}
