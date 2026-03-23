import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isbn } = await req.json();
    if (!isbn) {
      return new Response(JSON.stringify({ error: 'ISBN i nevojshëm' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Try Google Books first
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    const googleData = await googleRes.json();

    if (googleData.totalItems > 0) {
      const book = googleData.items[0].volumeInfo;
      return new Response(JSON.stringify({
        titulli: book.title || '',
        autori: book.authors ? book.authors.join(', ') : '',
        pershkrimi: book.description || '',
        kopertina: book.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        zhaneri: book.categories ? book.categories[0] : '',
        isbn: cleanIsbn,
        source: 'google',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback to Open Library
    const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
    const olData = await olRes.json();
    const olBook = olData[`ISBN:${cleanIsbn}`];

    if (olBook) {
      return new Response(JSON.stringify({
        titulli: olBook.title || '',
        autori: olBook.authors ? olBook.authors.map((a: any) => a.name).join(', ') : '',
        pershkrimi: '',
        kopertina: olBook.cover?.medium || '',
        zhaneri: olBook.subjects ? olBook.subjects[0]?.name || '' : '',
        isbn: cleanIsbn,
        source: 'openlibrary',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Nuk u gjet asnjë libër me këtë ISBN' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gabim i brendshëm' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
