import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Total Branches
    const totalBranches = await prisma.branch.count({
      where: { isActive: true }
    });

    // Total Employees
    const totalEmployees = await prisma.user.count();

    // Total Orders
    const totalOrders = await prisma.order.count({
      where: {
        status: 'COMPLETED'
      }
    });

    // Total Revenue
    const totalRevenueResult = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: {
        grandTotal: true
      }
    });

    // Today's Orders
    const todayOrders = await prisma.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Today's Revenue
    const todayRevenueResult = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        grandTotal: true
      }
    });

    // This Month's Orders
    const monthOrders = await prisma.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // This Month's Revenue
    const monthRevenueResult = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        grandTotal: true
      }
    });

    const stats = {
      totalBranches,
      totalRevenue: totalRevenueResult._sum.grandTotal || 0,
      totalOrders,
      totalEmployees,
      todayRevenue: todayRevenueResult._sum.grandTotal || 0,
      todayOrders,
      monthRevenue: monthRevenueResult._sum.grandTotal || 0,
      monthOrders
    };

    return NextResponse.json({ stats }, { status: 200 });

  } catch (error) {
    console.error('Error fetching chairman stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
