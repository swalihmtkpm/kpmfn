// Library Assistant — multilingual (Arabic/English/Malayalam), tool-calling over the library DB.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MODEL = 'google/gemini-2.5-pro';
const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const KEY = Deno.env.get('LOVABLE_API_KEY')!;

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_books',
      description: 'Search books by title, description, code, author or publisher name (both Arabic and English).',
      parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_authors',
      description: 'Search authors by name.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_publishers',
      description: 'Search publishers by name.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'List all categories.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_books',
      description: 'Recommend the highest-rated books, optionally filtered by category name.',
      parameters: { type: 'object', properties: { category: { type: 'string' }, limit: { type: 'number' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_book_full_text_excerpt',
      description: 'Read an excerpt of the full text of a book by id, starting at character offset.',
      parameters: { type: 'object', properties: { book_id: { type: 'string' }, offset: { type: 'number' }, length: { type: 'number' } }, required: ['book_id'] },
    },
  },
];

// Sanitize a free-text query for safe use inside a PostgREST `or()` filter.
// PostgREST splits on `,` and uses `()` and `*` as syntax; escaping prevents broken queries.
function safeQ(input: unknown): string {
  return String(input ?? '').trim().replace(/[,()*]/g, ' ').slice(0, 80);
}

async function execTool(name: string, args: any): Promise<unknown> {
  const q = safeQ(args?.query);
  const lim = Math.min(Number(args?.limit ?? 10), 25);
  if (name === 'search_books') {
    if (!q) return [];
    const { data, error } = await sb.from('books')
      .select('id, title_ar, title_en, book_code, average_rating, ratings_count, status, authors(name_ar,name_en), publishers(name_ar,name_en), categories(name_ar,name_en)')
      .or(`title_ar.ilike.%${q}%,title_en.ilike.%${q}%,description_ar.ilike.%${q}%,description_en.ilike.%${q}%,book_code.ilike.%${q}%`)
      .limit(lim);
    if (error) return { error: error.message };
    return data ?? [];
  }
  if (name === 'search_authors') {
    if (!q) return [];
    const { data, error } = await sb.from('authors').select('id,name_ar,name_en,bio_ar,bio_en').or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`).limit(lim);
    if (error) return { error: error.message };
    return data ?? [];
  }
  if (name === 'search_publishers') {
    if (!q) return [];
    const { data, error } = await sb.from('publishers').select('id,name_ar,name_en').or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`).limit(lim);
    if (error) return { error: error.message };
    return data ?? [];
  }
  if (name === 'list_categories') {
    const { data } = await sb.from('categories').select('id,name_ar,name_en').order('name_ar');
    return data ?? [];
  }
  if (name === 'recommend_books') {
    let qb = sb.from('books').select('id,title_ar,title_en,average_rating,ratings_count,categories(name_ar,name_en)').order('average_rating', { ascending: false }).limit(lim || 10);
    const cat = safeQ(args?.category);
    if (cat) {
      const { data: cats } = await sb.from('categories').select('id').or(`name_ar.ilike.%${cat}%,name_en.ilike.%${cat}%`);
      const ids = (cats ?? []).map((c) => c.id);
      if (ids.length) qb = qb.in('category_id', ids);
    }
    const { data } = await qb;
    return data ?? [];
  }
  if (name === 'get_book_full_text_excerpt') {
    const { data } = await sb.from('books').select('full_text,title_ar').eq('id', args.book_id).maybeSingle();
    if (!data?.full_text) return { error: 'No full text for this book.' };
    const off = Math.max(0, Number(args.offset ?? 0));
    const len = Math.min(Number(args.length ?? 4000), 8000);
    return { title: data.title_ar, excerpt: data.full_text.substring(off, off + len), end: off + len >= data.full_text.length };
  }
  return { error: 'unknown tool' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();

    const sys = `You are the Library Assistant for "مكتبة الامتياز" (Makthabathul Imthiyaz).
You speak Arabic, English, and Malayalam. Detect the user's language and reply in the same language.
You help users discover books, authors, publishers, and categories, and guide them through the app.
Always use the provided tools to look up real data from the library database — never invent books or authors.
Format answers in plain readable text. Do NOT use markdown symbols such as *, **, #, or _.
Keep answers concise and well structured with line breaks and dashes for lists.`;

    let convo = [{ role: 'system', content: sys }, ...messages];
    let final = '';

    for (let i = 0; i < 6; i++) {
      const resp = await fetch(GATEWAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: MODEL, messages: convo, tools, tool_choice: 'auto' }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(JSON.stringify({ error: `AI error ${resp.status}: ${txt}` }), { status: resp.status === 429 || resp.status === 402 ? resp.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const data = await resp.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;
      convo.push(msg);
      const calls = msg.tool_calls || [];
      if (!calls.length) { final = msg.content || ''; break; }
      for (const c of calls) {
        let args = {};
        try { args = JSON.parse(c.function.arguments || '{}'); } catch (_e) { /* noop */ }
        const result = await execTool(c.function.name, args);
        convo.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }

    return new Response(JSON.stringify({ reply: final || '...' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
