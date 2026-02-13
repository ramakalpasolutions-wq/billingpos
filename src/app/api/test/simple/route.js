import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Debts API route called');
    
    // Test 1: Can we return JSON?
    return NextResponse.json({ 
      debts: [],
      test: 'API route is working'
    });

  } catch (error) {
    console.error('Debts API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
