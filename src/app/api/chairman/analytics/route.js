import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const period = searchParams.get('period') || 'today'; // today, month, year

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

    // Base filter
    const baseFilter = {
      restaurantId: session.user.restaurantId,
      createdAt: { gte: startDate },
      ...(branchId && branchId !== 'all' ? { branchId } : {})
    };

    // Get analytics data
    const [totalRevenue, totalOrders, onlineOrders, cancelledOrders, totalStaff] = 
      await Promise.all([
        // Total Revenue
        prisma.payment.aggregate({
          where: {
            order: baseFilter,
            paymentStatus: 'COMPLETED'
          },
          _sum: { amountPaid: true }
        }),

        // Total Orders
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

        // Cancelled Orders
        prisma.order.count({
          where: {
            ...baseFilter,
            status: 'CANCELLED'
          }
        }),

        // Total Staff
        prisma.user.count({
          where: {
            restaurantId: session.user.restaurantId,
            role: { in: ['CASHIER', 'WAITER', 'KITCHEN'] },
            ...(branchId && branchId !== 'all' ? { branchId } : {})
          }
        })
      ]);

    // Get revenue graph data (last 7 days for today, last 12 months for year)
    const graphData = await getGraphData(session.user.restaurantId, branchId, period);

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      totalOrders,
      onlineOrders,
      cancelledOrders,
      totalStaff,
      graphData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getGraphData(restaurantId, branchId, period) {
  const now = new Date();
  const data = [];

  if (period === 'today' || period === 'month') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const revenue = await prisma.payment.aggregate({
        where: {
          order: {
            restaurantId,
            ...(branchId && branchId !== 'all' ? { branchId } : {}),
            createdAt: { gte: startOfDay, lte: endOfDay }
          },
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      });

      data.push({
        date: startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue._sum.amountPaid || 0
      });
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const revenue = await prisma.payment.aggregate({
        where: {
          order: {
            restaurantId,
            ...(branchId && branchId !== 'all' ? { branchId } : {}),
            createdAt: { gte: startOfMonth, lte: endOfMonth }
          },
          paymentStatus: 'COMPLETED'
        },
        _sum: { amountPaid: true }
      });

      data.push({
        date: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: revenue._sum.amountPaid || 0
      });
    }
  }

  return data;
}
