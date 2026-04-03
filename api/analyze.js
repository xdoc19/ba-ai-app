const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  if (action === 'login') {
    const { name, pin } = req.body;
    const { data, error } = await supabase
      .from('users').select('*')
      .eq('name', name).eq('pin', pin).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid' });
    return res.json({ user: data });
  }

  if (action === 'projects') {
    const { user_id } = req.body;
    const { data, error } = await supabase
      .from('projects')
      .select('*, reports(progress_pct, milestone_status, report_date)')
