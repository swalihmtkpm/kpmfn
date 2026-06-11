// Book Assistant — limited to a single book's text. No other books, no store files, no internet.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MODEL = 'google/gemini-2.5-pro';
const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const KEY = Deno.env.get('LOVABLE_API_KEY')!;

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { book_id, messages } = await req.json();
    if (!book_id) return new Response(JSON.stringify({ error: 'book_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: book } = await sb.from('books').select('title_ar,title_en,full_text').eq('id', book_id).maybeSingle();
    if (!book?.full_text) return new Response(JSON.stringify({ error: 'No text available for this book.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Cap context (Gemini handles huge context but stay safe).
    const text = book.full_text.length > 200_000 ? book.full_text.substring(0, 200_000) : book.full_text;

    const sys = `You are the Book Assistant for the book titled "${book.title_ar}"${book.title_en ? ` (${book.title_en})` : ''}.
You can only use the text of THIS BOOK provided below. You must NOT use any other book, any external source, or your prior knowledge.
If the answer is not in the provided text, say so honestly.
You can: summarize chapters, answer questions about the book, explain sections, and find topics inside the book.
Detect the user's language (Arabic, English, or Malayalam) and reply in the same language.
Format answers in plain readable text. Do NOT use markdown symbols such as *, **, #, or _.

BOOK TEXT:
"""
${text}
"""`;

    const resp = await fetch(GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: sys }, ...messages] }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: `AI error ${resp.status}: ${txt}` }), { status: resp.status === 429 || resp.status === 402 ? resp.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
