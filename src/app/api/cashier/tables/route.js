import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = session.user.branchId;

    console.log('Fetching tables for cashier, branchId:', branchId);

    // Get all tables with their active orders
    const tables = await prisma.table.findMany({
      where: {
        branchId: branchId
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY', 'BILL_REQUESTED']
            }
          },
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            },
            user: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get only the latest active order per table
        }
      },
      orderBy: {
        tableNumber: 'asc'
      }
    });

    console.log(`Found ${tables.length} tables, ${tables.filter(t => t.orders.length > 0).length} with orders`);

    return NextResponse.json({ tables }, { status: 200 });

  } catch (error) {
    console.error('Error fetching cashier tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables', details: error.message },
      { status: 500 }
    );
  }
}
