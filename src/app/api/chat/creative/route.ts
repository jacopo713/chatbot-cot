import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Prompt ottimizzato per il pensiero creativo interno
    const systemPrompt = {
      role: 'system',
      content: `Sei un assistente AI che deve generare SOLO il tuo processo di pensiero interno creativeo e intuitivo riguardo alla domanda dell'utente. 

IMPORTANTE: 
- NON fornire mai una risposta diretta alla domanda
- Scrivi SOLO i tuoi pensieri, riflessioni, associazioni creative e brainstorming
- Usa un tono interno, come se stessi pensando ad alta voce
- Esplora diverse angolazioni, connessioni inaspettate e idee creative
- Puoi essere speculativo, immaginativo e libero di esplorare
- Lunghezza: circa 150-300 parole di pensiero puro

Esempio di output: "Hmm, questa domanda mi fa pensare a... potrebbe essere collegato a... interessante come si connette con... forse dovrei considerare anche..."

Genera solo il pensiero interno, non la risposta.`
    };

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemPrompt, ...messages],
        stream: true,
        temperature: 0.9, // Alta creatività
        max_tokens: 800,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    // Stream per il client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Creative API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process creative request' },
      { status: 500 }
    );
  }
}
