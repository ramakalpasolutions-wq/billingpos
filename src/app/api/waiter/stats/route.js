import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const branchId = session.user.branchId;

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders count by this waiter
    const todayOrders = await prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get tips for current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const tips = await prisma.tip.findMany({
      where: {
        userId: userId,
        date: {
          gte: firstDayOfMonth
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);

    return NextResponse.json({ 
      todayOrders,
      tips,
      totalTips
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
