import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, specialist } = await req.json();
    
    // Validazione input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Prepara i messaggi per l'API
    let apiMessages = messages;
    
    // Se abbiamo uno specialista, aggiungi il system prompt (con lunghezza limitata)
    if (specialist?.systemPrompt) {
      // Limita la lunghezza del system prompt per evitare timeout
      const truncatedPrompt = specialist.systemPrompt.length > 500 
        ? specialist.systemPrompt.substring(0, 500) + "..."
        : specialist.systemPrompt;

      apiMessages = [
        { role: 'system', content: truncatedPrompt },
        ...messages
      ];
    }

    console.log('Sending request to DeepSeek API...', {
      messageCount: apiMessages.length,
      hasSpecialist: !!specialist,
      specialist: specialist?.name || 'generic'
    });

    // Configurazione con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi timeout

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        stream: true,
        temperature: specialist ? 0.7 : 0.5,
        max_tokens: 1500, // Riduciamo per evitare timeout
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status, response.statusText);
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    // Creiamo uno stream per il client con gestione errori migliorata
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response stream'));
          return;
        }

        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Mantieni l'ultima linea incompleta

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '') continue;

              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  }
                } catch (e) {
                  console.warn('Skipping malformed JSON:', data);
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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

  } catch (error: any) {
    console.error('API Error:', error);
    
    // Gestione errori specifica
    let errorMessage = 'Failed to process request';
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - please try again';
      statusCode = 408;
    } else if (error.message?.includes('DEEPSEEK_API_KEY')) {
      errorMessage = 'API configuration error';
      statusCode = 500;
    } else if (error.message?.includes('fetch failed')) {
      errorMessage = 'Network connection error - please check your connection';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, debug: error.message },
      { status: statusCode }
    );
  }
}
