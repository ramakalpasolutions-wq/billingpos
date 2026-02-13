import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = session.user.branchId;

    // Get all KOTs that are in PENDING, PREPARING, or READY status
    const kots = await prisma.kOT.findMany({
      where: {
        order: {
          branchId: branchId
        },
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      },
      include: {
        order: {
          include: {
            table: true,
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ kots }, { status: 200 });

  } catch (error) {
    console.error('Pending orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending orders', details: error.message },
      { status: 500 }
    );
  }
}
