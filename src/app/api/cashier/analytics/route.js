import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Date filters
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const baseFilter = {
      branchId: session.user.branchId,
      createdAt: { gte: startDate }
    };

    // Get analytics
    const [
      todaySales,
      todayOrders,
      todayOnlineOrders,
      liveOrders,
      cancelledOrders,
      tipsCollected
    ] = await Promise.all([
      // Today Sales
      prisma.payment.aggregate({
        where: {
          order: baseFilter,
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      }),

      // Today Orders
      prisma.order.count({
        where: {
          ...baseFilter,
          status: { in: ['COMPLETED', 'READY'] }
        }
      }),

      // Online Orders
      prisma.order.count({
        where: {
          ...baseFilter,
          orderType: 'ONLINE'
        }
      }),

      // Live Orders (in progress)
      prisma.order.count({
        where: {
          branchId: session.user.branchId,
          status: { in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY'] }
        }
      }),

      // Cancelled Orders
      prisma.order.count({
        where: {
          ...baseFilter,
          status: 'CANCELLED'
        }
      }),

      // Tips Collected
      prisma.tip.aggregate({
        where: {
          branchId: session.user.branchId,
          date: { gte: startDate }
        },
        _sum: { amount: true }
      })
    ]);

    // Get graph data
    const graphData = await getGraphData(session.user.branchId, period);

    return NextResponse.json({
      todaySales: todaySales._sum.amountPaid || 0,
      todayOrders,
      todayOnlineOrders,
      liveOrders,
      cancelledOrders,
      tipsCollected: tipsCollected._sum.amount || 0,
      graphData
    });

  } catch (error) {
    console.error('Cashier analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getGraphData(branchId, period) {
  const now = new Date();
  const data = [];

  if (period === 'today') {
    // Last 24 hours (6 intervals of 4 hours)
    for (let i = 5; i >= 0; i--) {
      const startHour = i * 4;
      const endHour = (i + 1) * 4;
      
      const startTime = new Date(now);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(endHour, 0, 0, 0);

      const sales = await prisma.payment.aggregate({
        where: {
          order: {
            branchId,
            createdAt: { gte: startTime, lt: endTime }
          },
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      });

      data.push({
        label: `${startHour}:00-${endHour}:00`,
        sales: sales._sum.amountPaid || 0
      });
    }
  } else if (period === 'month') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const sales = await prisma.payment.aggregate({
        where: {
          order: {
            branchId,
            createdAt: { gte: startOfDay, lte: endOfDay }
          },
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      });

      data.push({
        label: startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: sales._sum.amountPaid || 0
      });
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const sales = await prisma.payment.aggregate({
        where: {
          order: {
            branchId,
            createdAt: { gte: startOfMonth, lte: endOfMonth }
          },
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      });

      data.push({
        label: startOfMonth.toLocaleDateString('en-US', { month: 'short' }),
        sales: sales._sum.amountPaid || 0
      });
    }
  }

  return data;
}
