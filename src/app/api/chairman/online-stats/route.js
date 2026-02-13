import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const period = searchParams.get('period') || 'today';

    // Date ranges
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

    const whereCondition = {
      restaurantId: session.user.restaurantId,
      orderType: 'ONLINE',
      createdAt: {
        gte: startDate
      }
    };

    if (branchId && branchId !== 'all') {
      whereCondition.branchId = branchId;
    }

    // Total online orders
    const totalOrders = await prisma.order.count({
      where: whereCondition
    });

    // Total revenue from online orders
    const revenueData = await prisma.order.aggregate({
      where: {
        ...whereCondition,
        status: 'COMPLETED'
      },
      _sum: {
        grandTotal: true
      }
    });

    // Orders by platform
    const ordersByPlatform = await prisma.order.findMany({
      where: whereCondition,
      include: {
        onlineOrder: true
      }
    });

    const platformStats = ordersByPlatform.reduce((acc, order) => {
      if (order.onlineOrder) {
        const platform = order.onlineOrder.platform;
        if (!acc[platform]) {
          acc[platform] = { count: 0, revenue: 0 };
        }
        acc[platform].count += 1;
        acc[platform].revenue += order.grandTotal;
      }
      return acc;
    }, {});

    const ordersByPlatformFormatted = Object.entries(platformStats).map(([platform, data]) => ({
      platform,
      count: data.count,
      revenue: data.revenue
    }));

    // Orders by status
    const ordersByStatus = ordersByPlatform.reduce((acc, order) => {
      if (order.onlineOrder) {
        const status = order.onlineOrder.orderStatus;
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status] += 1;
      }
      return acc;
    }, {});

    const ordersByStatusFormatted = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count
    }));

    // Cancelled orders
    const cancelledOrders = await prisma.order.count({
      where: {
        ...whereCondition,
        status: 'CANCELLED'
      }
    });

    // Average order value
    const avgOrderValue = totalOrders > 0 
      ? (revenueData._sum.grandTotal || 0) / totalOrders 
      : 0;

    // Branch-wise breakdown
    const branchStats = await prisma.order.groupBy({
      by: ['branchId'],
      where: {
        restaurantId: session.user.restaurantId,
        orderType: 'ONLINE',
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        grandTotal: true
      }
    });

    // Get branch names
    const branches = await prisma.branch.findMany({
      where: {
        restaurantId: session.user.restaurantId
      },
      select: {
        id: true,
        name: true
      }
    });

    const branchStatsWithNames = branchStats.map(stat => {
      const branch = branches.find(b => b.id === stat.branchId);
      return {
        branchId: stat.branchId,
        branchName: branch?.name || 'Unknown',
        orderCount: stat._count.id,
        revenue: stat._sum.grandTotal || 0
      };
    });

    return NextResponse.json({
      totalOrders,
      totalRevenue: revenueData._sum.grandTotal || 0,
      cancelledOrders,
      avgOrderValue,
      ordersByPlatform: ordersByPlatformFormatted,
      ordersByStatus: ordersByStatusFormatted,
      branchStats: branchStatsWithNames
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching online stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
