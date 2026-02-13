import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['CASHIER', 'WAITER', 'CHAIRMAN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tableNumber = searchParams.get('tableNumber');

    // Build filter
    const where = {
      branchId: session.user.branchId
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    if (tableNumber) {
      where.table = {
        tableNumber: tableNumber
      };
    }

    console.log('Fetching orders...');

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        orderItems: {
          include: {
            menuItem: true
          }
        },
        payment: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    console.log('Orders fetched successfully:', orders.length);

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error) {
    console.error('Order history fetch error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch order history', 
        details: error.message
      },
      { status: 500 }
    );
  }
}
