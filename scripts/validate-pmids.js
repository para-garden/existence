#!/usr/bin/env bun
// Validate PMIDs in docs against NCBI E-utilities API.
//
// Usage:
//   bun scripts/validate-pmids.js [--search]
//
//   --search  Attempt to find correct PMIDs for "PMID unverified" entries
//             via NCBI esearch (author + year extracted from context).
//             Prints candidates only — never writes files automatically.
//
// Rate limits:
//   Without API key: 3 req/s. With key: 10 req/s.
//   Set NCBI_API_KEY env var to use a key (free at
//   https://www.ncbi.nlm.nih.gov/account/).
//
// Batching:
//   PMIDs are validated in batches of up to 200 per esummary request.
//   Unverified entries are searched individually (author + year context).

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const API_KEY = process.env.NCBI_API_KEY ?? '';
const RATE_DELAY = API_KEY ? 110 : 340; // ms between requests
const BATCH_SIZE = 200;

const doSearch = process.argv.includes('--search');

// ── File scanning ────────────────────────────────────────────────────────────

// Files that contain "PMID unverified" as instructional text rather than
// as a citation marker — excluded from the unverified scan only.
const UNVERIFIED_SCAN_EXCLUDE = new Set(['CLAUDE.md', 'MEMORY.md']);

async function* walkMd(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      yield* walkMd(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield full;
    }
  }
}

const PMID_RE = /PMID\s+(\d{5,8})/g;
const UNVERIFIED_RE = /PMID\s+unverified/gi;

async function scanFile(path) {
  const text = await readFile(path, 'utf8');
  const lines = text.split('\n');
  const verified = [];
  const unverified = [];

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const lineNo = i + 1;
    const rel = relative(ROOT, path);

    for (const m of ln.matchAll(PMID_RE)) {
      verified.push({ pmid: m[1], file: rel, line: lineNo, context: ln.trim() });
    }

    if (UNVERIFIED_RE.test(ln)) {
      unverified.push({ file: rel, line: lineNo, context: ln.trim() });
    }
    UNVERIFIED_RE.lastIndex = 0;
  }

  return { verified, unverified };
}

// ── NCBI API ─────────────────────────────────────────────────────────────────

function apiUrl(endpoint, params) {
  const p = new URLSearchParams(params);
  if (API_KEY) p.set('api_key', API_KEY);
  return `${API_BASE}/${endpoint}?${p}`;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Fetch summaries for up to BATCH_SIZE PMIDs at once.
// Returns Map<pmid, summary|null>.
async function fetchSummaryBatch(pmids) {
  const url = apiUrl('esummary.fcgi', {
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'json',
  });
  const res = await fetch(url);
  if (!res.ok) return new Map(pmids.map(id => [id, null]));
  const json = await res.json();
  const result = json?.result ?? {};
  return new Map(pmids.map(id => {
    const s = result[id];
    return [id, (s && !s.error) ? s : null];
  }));
}

async function searchPmid(query) {
  const url = apiUrl('esearch.fcgi', { db: 'pubmed', term: query, retmax: 5, retmode: 'json' });
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.esearchresult?.idlist ?? [];
}

function formatSummary(s) {
  const authors = (s.authors ?? []).slice(0, 3).map(a => a.name).join(', ');
  const more = (s.authors?.length ?? 0) > 3 ? ' et al.' : '';
  const year = s.pubdate?.slice(0, 4) ?? '????';
  const journal = s.source ?? '';
  const title = (s.title ?? '').replace(/\.$/, '').slice(0, 80);
  const trunc = (s.title?.length ?? 0) > 80 ? '…' : '';
  return `${authors}${more} (${year}) ${journal} — ${title}${trunc}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const allVerified = new Map();  // pmid → [{ file, line, context }]
  const allUnverified = [];

  for await (const path of walkMd(ROOT)) {
    const { verified, unverified } = await scanFile(path);
    for (const v of verified) {
      if (!allVerified.has(v.pmid)) allVerified.set(v.pmid, []);
      allVerified.get(v.pmid).push({ file: v.file, line: v.line, context: v.context });
    }
    const basename = path.split('/').pop();
    if (!UNVERIFIED_SCAN_EXCLUDE.has(basename)) {
      allUnverified.push(...unverified);
    }
  }

  const pmids = [...allVerified.keys()].sort((a, b) => Number(a) - Number(b));
  console.log(`\nFound ${pmids.length} unique PMIDs, ${allUnverified.length} unverified markers\n`);

  // ── Validate PMIDs in batches ──────────────────────────────────────────────
  if (pmids.length > 0) {
    console.log('── Validating PMIDs ─────────────────────────────────────────────────────────\n');
    let invalid = 0;
    const summaries = new Map();

    for (let i = 0; i < pmids.length; i += BATCH_SIZE) {
      const batch = pmids.slice(i, i + BATCH_SIZE);
      await sleep(RATE_DELAY);
      const results = await fetchSummaryBatch(batch);
      for (const [id, s] of results) summaries.set(id, s);
    }

    for (const pmid of pmids) {
      const summary = summaries.get(pmid);
      const locations = allVerified.get(pmid);
      const locStr = locations.map(l => `${l.file}:${l.line}`).join(', ');

      if (!summary) {
        console.log(`INVALID  ${pmid}  [${locStr}]`);
        invalid++;
      } else {
        console.log(`VALID    ${pmid}  [${locStr}]`);
        console.log(`         ${formatSummary(summary)}`);
      }
    }

    console.log(`\n${invalid} invalid / ${pmids.length} total\n`);
  }

  // ── Report unverified ──────────────────────────────────────────────────────
  if (allUnverified.length > 0) {
    console.log('── Unverified PMIDs ─────────────────────────────────────────────────────────\n');
    for (const u of allUnverified) {
      console.log(`${u.file}:${u.line}`);
      console.log(`  ${u.context.slice(0, 120)}`);

      if (doSearch) {
        // Heuristic: "Author(s) YYYY — PMID unverified"
        const m = u.context.match(/([A-Z][a-z]+(?:\s+et\s+al\.)?)\s+((?:19|20)\d{2})\s*[—–-]/);
        if (m) {
          const [, author, year] = m;
          const query = `${author}[Author] ${year}[PDAT]`;
          await sleep(RATE_DELAY);
          const ids = await searchPmid(query);
          if (ids.length === 0) {
            console.log(`  search: no results for "${query}"`);
          } else {
            console.log(`  search candidates for "${query}":`);
            if (ids.length > 0) {
              await sleep(RATE_DELAY);
              const results = await fetchSummaryBatch(ids);
              for (const [id, s] of results) {
                if (s) console.log(`    PMID ${id}  ${formatSummary(s)}`);
              }
            }
          }
        } else {
          console.log(`  (couldn't extract author/year — search manually)`);
        }
      }
      console.log();
    }

    if (!doSearch) {
      console.log('Run with --search to attempt NCBI lookup for unverified entries.\n');
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
