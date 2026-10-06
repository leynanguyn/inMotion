// Shared trace store for inMotion. Vercel serverless function backed by Redis
// (Upstash, added from the Vercel Marketplace). No npm dependencies: it talks to
// Redis over its REST API. Traces live in one Redis list, capped at MAX_TRACES,
// so pushes from many visitors at once can't overwrite each other.

const KEY = 'inmotion:traces';
const MAX_TRACES = 32;
const MAX_PATH_POINTS = 128;
const MAX_BODY_BYTES = 60000;

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(commands) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return r.json();
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const vec = (v) => v && num(v.x) && num(v.y) && num(v.z);

function sanitize(t) {
  if (!t || typeof t !== 'object') return null;
  if (typeof t.id !== 'string' || t.id.length > 64) return null;
  if (!Array.isArray(t.path) || t.path.length < 2 || t.path.length > MAX_PATH_POINTS) return null;
  for (const p of t.path) if (!vec(p) || !num(p.t)) return null;
  if (!vec(t.restPos) || !num(t.hue) || !num(t.strength) || !num(t.duration)) return null;
  return {
    id: t.id,
    path: t.path.map((p) => ({ x: p.x, y: p.y, z: p.z, t: p.t })),
    duration: t.duration,
    hue: t.hue,
    strength: t.strength,
    restPos: { x: t.restPos.x, y: t.restPos.y, z: t.restPos.z },
    completedAt: Date.now(), // server clock, so "most recent" is consistent for everyone
    respondsTo: typeof t.respondsTo === 'string' ? t.respondsTo : null,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) {
    return res.status(500).json({ error: 'Redis is not connected to this project yet.' });
  }
  try {
    if (req.method === 'GET') {
      const [{ result }] = await redis([['LRANGE', KEY, 0, -1]]);
      const traces = (result || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ traces });
    }
    if (req.method === 'POST') {
      if (JSON.stringify(req.body || '').length > MAX_BODY_BYTES) return res.status(413).json({ error: 'too large' });
      const trace = sanitize(req.body);
      if (!trace) return res.status(400).json({ error: 'invalid trace' });
      await redis([['RPUSH', KEY, JSON.stringify(trace)], ['LTRIM', KEY, -MAX_TRACES, -1]]);
      return res.status(200).json({ trace });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(502).json({ error: 'storage error' });
  }
}
