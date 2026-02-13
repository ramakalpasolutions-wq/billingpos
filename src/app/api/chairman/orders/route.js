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
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause - only show orders from branches belonging to this restaurant
    const where = {
      branch: {
        restaurantId: session.user.restaurantId
      }
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by branch if provided
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        payment: true,
        kots: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Calculate statistics
    const totalOrders = orders.length;
    
    // Revenue from orders with COMPLETED payment
    const paidRevenue = orders.reduce((sum, order) => {
      if (order.payment && order.payment.status === 'COMPLETED') {
        return sum + order.grandTotal;
      }
      return sum;
    }, 0);

    // Revenue from all COMPLETED orders (regardless of payment record)
    const completedOrderRevenue = orders.reduce((sum, order) => {
      if (order.status === 'COMPLETED') {
        return sum + order.grandTotal;
      }
      return sum;
    }, 0);

    // Total revenue from all orders
    const totalOrderRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

    // Count orders by payment status
    const ordersWithPayment = orders.filter(o => o.payment && o.payment.status === 'COMPLETED').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    const pendingPayments = orders.filter(o => !o.payment || o.payment.status !== 'COMPLETED').length;

    const summary = {
      totalOrders,
      totalRevenue: paidRevenue > 0 ? paidRevenue : completedOrderRevenue, // Use completed order revenue if no payment records
      totalOrderRevenue,
      ordersWithPayment,
      completedOrders,
      pendingPayments
    };

    console.log('Order Summary:', {
      totalOrders,
      ordersWithPayment,
      completedOrders,
      paidRevenue,
      completedOrderRevenue,
      totalOrderRevenue
    });

    return NextResponse.json({ 
      orders,
      summary 
    }, { status: 200 });

  } catch (error) {
    console.error('Chairman orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
