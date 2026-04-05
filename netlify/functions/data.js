/**
 * Netlify Function: /api/data
 *
 * Reads and writes workout-data.json directly to the GitHub repo.
 * GitHub IS the database. Every save triggers a Netlify redeploy.
 *
 * Required Netlify env vars:
 *   GITHUB_TOKEN  — Personal Access Token with repo write access
 *   GITHUB_REPO   — e.g. "sanath/workout-tracker"
 *   GITHUB_BRANCH — e.g. "main" (defaults to main)
 */

const FILE_PATH = 'data/workout-data.json';
const REC_FILE_PATH = 'data/recommendations.json';

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'workout-tracker-app',
  };
}

async function getFile(token, repo, path, branch = 'main') {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const json = await res.json();
  const content = JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8'));
  return { content, sha: json.sha };
}

async function putFile(token, repo, path, branch = 'main', data, sha, message) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} — ${err}`);
  }
  return res.json();
}

export default async (req, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS });
  }

  const TOKEN  = process.env.GITHUB_TOKEN;
  const REPO   = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!TOKEN || !REPO) {
    return Response.json({ error: 'Missing GITHUB_TOKEN or GITHUB_REPO env vars' }, { status: 500, headers: CORS });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'data'; // 'data' | 'recommendations'
    const filePath = type === 'recommendations' ? REC_FILE_PATH : FILE_PATH;

    // ── GET: read file from GitHub ──────────────────────────────────────────
    if (req.method === 'GET') {
      const { content } = await getFile(TOKEN, REPO, filePath, BRANCH);
      return Response.json(content || {}, { headers: CORS });
    }

    // ── POST: write file to GitHub ──────────────────────────────────────────
    if (req.method === 'POST') {
      const body = await req.json();
      const { sha } = await getFile(TOKEN, REPO, filePath, BRANCH);
      const date = new Date().toISOString().split('T')[0];
      const message = type === 'recommendations'
        ? `AI recommendations update — ${date}`
        : `Workout log update — ${date}`;
      await putFile(TOKEN, REPO, filePath, BRANCH, body, sha, message);
      return Response.json({ ok: true }, { headers: CORS });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });

  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
};

export const config = { path: '/api/data' };
