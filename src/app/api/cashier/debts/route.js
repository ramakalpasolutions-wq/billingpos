import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('=== Debts API Called ===');
    
    const session = await auth();
    console.log('Session:', session?.user?.email);
    
    if (!session || !session.user) {
      console.log('No session - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['CASHIER', 'WAITER', 'CHAIRMAN'].includes(session.user.role)) {
      console.log('Insufficient permissions:', session.user.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('Fetching debts from database...');
    const debts = await prisma.debt.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Debts found:', debts.length);

    return NextResponse.json({ debts }, { status: 200 });

  } catch (error) {
    console.error('=== Debts API Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch debts',
        details: error.message
      },
      { status: 500 }
    );
  }
}
