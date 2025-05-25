import { NextRequest, NextResponse } from 'next/server';
import { MultiSpecialistRouter } from '@/services/multiSpecialistRouter';

export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();
    
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const decision = MultiSpecialistRouter.route(userInput);
    
    return NextResponse.json({
      decision,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multi-Specialist Router API Error:', error);
    return NextResponse.json(
      { error: 'Failed to route request' },
      { status: 500 }
    );
  }
}
