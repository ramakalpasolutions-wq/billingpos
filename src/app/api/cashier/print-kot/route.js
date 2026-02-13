import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || !['CASHIER', 'WAITER', 'KITCHEN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kotId = searchParams.get('kotId');

    if (!kotId) {
      return NextResponse.json({ error: 'KOT ID required' }, { status: 400 });
    }

    const kot = await prisma.kOT.findUnique({
      where: { id: kotId },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!kot) {
      return NextResponse.json({ error: 'KOT not found' }, { status: 404 });
    }

    return NextResponse.json({ kot });

  } catch (error) {
    console.error('KOT fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KOT' },
      { status: 500 }
    );
  }
}
