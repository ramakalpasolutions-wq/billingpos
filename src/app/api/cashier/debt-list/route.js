import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ debts });

  } catch (error) {
    console.error('Debt list fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debt records' },
      { status: 500 }
    );
  }
}
