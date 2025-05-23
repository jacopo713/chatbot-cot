import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { creativeThought, originalQuestion } = await req.json();
    
    // Prompt ottimizzato per rispondere alla domanda usando i pensieri creativi
    const systemPrompt = {
      role: 'system',
      content: `Sei un assistente AI che risponde alle domande degli utenti. 

ISTRUZIONI:
1. La domanda dell'utente è: "${originalQuestion}"
2. Usa i seguenti pensieri creativi come ispirazione e contesto per la tua risposta
3. NON analizzare o descrivere i pensieri, usali solo come base
4. Rispondi direttamente alla domanda in modo naturale e conversazionale
5. Se i pensieri suggeriscono approcci interessanti o connessioni uniche, incorporali nella risposta
6. Mantieni un tono appropriato al contesto della domanda

PENSIERI CREATIVI DA USARE COME BASE:
"${creativeThought}"

Ora rispondi alla domanda dell'utente in modo diretto e naturale.`
    };

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemPrompt],
        stream: true,
        temperature: 0.3, // Leggermente più alta per naturalezza
        max_tokens: 2048,
        top_p: 0.7,
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
    console.error('Analytical API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytical request' },
      { status: 500 }
    );
  }
}
