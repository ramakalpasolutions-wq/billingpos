import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = session.user.branchId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get stats
    const [pendingOrders, preparingOrders, completedToday] = await Promise.all([
      // Pending (KOT_SENT)
      prisma.order.count({
        where: {
          branchId: branchId,
          status: 'KOT_SENT'
        }
      }),
      // Preparing
      prisma.order.count({
        where: {
          branchId: branchId,
          status: 'PREPARING'
        }
      }),
      // Completed today
      prisma.order.count({
        where: {
          branchId: branchId,
          status: {
            in: ['READY', 'COMPLETED']
          },
          updatedAt: {
            gte: today
          }
        }
      })
    ]);

    return NextResponse.json({
      pendingOrders,
      preparingOrders,
      completedToday
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching kitchen stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
