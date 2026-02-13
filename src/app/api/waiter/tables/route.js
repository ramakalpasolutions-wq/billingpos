import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || session.user.branchId;

    // Get all tables for the branch
    const tables = await prisma.table.findMany({
      where: {
        branchId: branchId
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY']
            }
          },
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: {
        tableNumber: 'asc'
      }
    });

    return NextResponse.json({ tables }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}
