import { NextRequest, NextResponse } from 'next/server';
import { AISpecialistRouter } from '@/services/aiSpecialistRouter';

export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();
    
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    console.log('🤖 AI-Powered Router API called with:', userInput.substring(0, 100) + '...');

    // Usa il nuovo AI Specialist Router
    const decision = await AISpecialistRouter.route(userInput);
    
    return NextResponse.json({
      decision,
      timestamp: new Date().toISOString(),
      routerType: 'ai-powered' // Indica che stiamo usando AI routing
    });

  } catch (error) {
    console.error('❌ AI Specialist Router API Error:', error);
    return NextResponse.json(
      { error: 'Failed to route request with AI', debug: error.message },
      { status: 500 }
    );
  }
}
