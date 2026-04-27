/**
 * /api/stats   GET
 * Returns live platform stats: user count, active listings, upcoming events.
 * Uses the service-role key (bypasses RLS for accurate counts).
 * Response is cached for 5 minutes on Vercel edge.
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.json({ users: 0, listings: 0, events: 0 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const [
    { count: users    },
    { count: listings },
    { count: events   },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('housing_listings').select('*', { count: 'exact', head: true }).eq('is_approved', true).eq('is_rented', false),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
  ]);

  res.json({
    users:    users    || 0,
    listings: listings || 0,
    events:   events   || 0,
  });
}
