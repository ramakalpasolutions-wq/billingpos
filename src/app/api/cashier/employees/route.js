import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: {
        branchId: session.user.branchId,
        role: { in: ['WAITER', 'KITCHEN'] }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ employees });

  } catch (error) {
    console.error('Employees fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
