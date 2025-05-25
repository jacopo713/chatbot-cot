import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, specialist, mode = 'thinking' } = await req.json();
    
    // Validazione input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    console.log('🤖 Chat API called with:', {
      messageCount: messages.length,
      specialist: specialist?.name || 'generic',
      mode: mode
    });

    // Prepara i messaggi per l'API
    let apiMessages = messages;
    
    // IMPORTANTE: Per la modalità thinking, usa SEMPRE chainOfThoughtPrompt
    if (specialist && mode === 'thinking') {
      if (!specialist.chainOfThoughtPrompt) {
        throw new Error(`Specialist ${specialist.name} missing chainOfThoughtPrompt`);
      }

      const systemPrompt = specialist.chainOfThoughtPrompt;
      
      apiMessages = [
        { 
          role: 'system', 
          content: systemPrompt
        },
        ...messages
      ];

      console.log('🧠 Using chainOfThoughtPrompt for', specialist.name);
    } else if (specialist?.systemPrompt) {
      // Modalità normale (se mai servisse)
      apiMessages = [
        { role: 'system', content: specialist.systemPrompt },
        ...messages
      ];
      console.log('💬 Using systemPrompt for', specialist.name);
    }

    console.log('📤 Sending to DeepSeek:', {
      systemPromptLength: apiMessages[0]?.content?.length || 0,
      mode: mode,
      specialist: specialist?.name
    });

    // Configurazione con timeout ridotto per chain of thought
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi

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
        temperature: mode === 'thinking' ? 0.9 : 0.7, // Più creatività per thinking
        max_tokens: mode === 'thinking' ? 1500 : 2000,
        // Aggiungiamo stop sequences per evitare che dia risposte finali
        stop: mode === 'thinking' ? [
          "Risposta finale:",
          "La mia risposta è:",
          "In conclusione:",
          "Per rispondere alla tua domanda:",
          "Ecco la soluzione:"
        ] : undefined
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ DeepSeek API error:', response.status, response.statusText);
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Stream processing
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
            buffer = lines.pop() || '';

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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      ...parsed,
                      mode: mode, // Includi modalità nel response
                      specialist: specialist?.name || 'generic'
                    })}\n\n`));
                  }
                } catch (e) {
                  console.warn('⚠️ Skipping malformed JSON:', data.substring(0, 100) + '...');
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('❌ Stream error:', error);
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
    console.error('❌ Chat API Error:', error);
    
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
    } else if (error.message?.includes('chainOfThoughtPrompt')) {
      errorMessage = 'Specialist configuration error: ' + error.message;
      statusCode = 500;
    }

    return NextResponse.json(
      { error: errorMessage, debug: error.message },
      { status: statusCode }
    );
  }
}
