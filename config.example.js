/**
 * LOCAL DEVELOPMENT CONFIG
 *
 * 1. Copy this file → config.js   (config.js is gitignored — never commit it)
 * 2. Fill in your real values from supabase.com → Settings → API
 * 3. Make sure index.html loads  <script src="config.js" onerror=""></script>
 *    BEFORE  <script src="main.js"></script>
 *
 * In production (Vercel), these values come from the /api/config serverless
 * function which reads process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY.
 */
window.SUPABASE_URL      = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-public-key-here';
