import { NextRequest, NextResponse } from 'next/server';
import { AISynthesizer } from '@/services/aiSynthesizer';

export async function POST(req: NextRequest) {
  try {
    const { userQuery, chainOfThoughts } = await req.json();
    
    // Validazione input
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'Invalid userQuery' },
        { status: 400 }
      );
    }

    if (!Array.isArray(chainOfThoughts) || chainOfThoughts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty chainOfThoughts array' },
        { status: 400 }
      );
    }

    console.log('🧠 Synthesis API called with:', {
      queryLength: userQuery.length,
      chainCount: chainOfThoughts.length,
      validChains: chainOfThoughts.filter(c => c.content && c.isComplete && !c.error).length
    });

    // Chiama il servizio di sintesi
    const synthesis = await AISynthesizer.synthesize({
      userQuery,
      chainOfThoughts
    });

    console.log('✅ Synthesis completed successfully');

    return NextResponse.json({
      synthesis,
      timestamp: new Date().toISOString(),
      chainCount: chainOfThoughts.length,
      specialistsInvolved: synthesis.specialistsUsed.length
    });

  } catch (error: any) {
    console.error('❌ Synthesis API Error:', error);
    
    let errorMessage = 'Failed to synthesize chain of thoughts';
    let statusCode = 500;

    if (error.message?.includes('No valid chain')) {
      errorMessage = 'No valid chain of thoughts available for synthesis';
      statusCode = 400;
    } else if (error.message?.includes('DeepSeek API')) {
      errorMessage = 'AI synthesis service temporarily unavailable';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, debug: error.message },
      { status: statusCode }
    );
  }
}
