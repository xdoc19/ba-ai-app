import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  if (action === 'login') {
    const { name, pin } = req.body
    const { data, error } = await supabase
      .from('users').select('*')
      .eq('name', name).eq('pin', pin).single()
    if (error || !data) return res.status(401).json({ error: 'Invalid' })
    return res.json({ user: data })
  }

  if (action === 'projects') {
    const { user_id } = req.body
    const { data, error } = await supabase
      .from('projects')
      .select('*, reports(progress_pct, milestone_status, report_date)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error })
    const projects = data.map(p => ({
      ...p,
      lastReport: p.reports?.sort((a,b) => new Date(b.report_date) - new Date(a.report_date))[0] || null
    }))
    return res.json({ projects })
  }

  if (action === 'save_project') {
    const { user_id, project_id, project_name, scope } = req.body
    const { data, error } = await supabase
      .from('projects').insert({ user_id, project_id, project_name, scope })
      .select().single()
    if (error) return res.status(500).json({ error })
    return res.json({ project: data })
  }

  if (action === 'reports') {
    const { project_id } = req.body
    const { data, error } = await supabase
      .from('reports').select('*')
      .eq('project_id', project_id)
      .order('report_date', { ascending: false })
    if (error) return res.status(500).json({ error })
    return res.json({ reports: data })
  }

  if (action === 'save_report') {
    const { project_id, progress_pct, milestone_status, achievements, next_steps, decisions, critical_issues } = req.body
    const { data, error } = await supabase
      .from('reports').insert({ project_id, progress_pct, milestone_status, achievements, next_steps, decisions, critical_issues })
      .select().single()
    if (error) return res.status(500).json({ error })
    return res.json({ report: data })
  }

  if (req.method === 'POST') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(req.body)
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(404).end()
}
