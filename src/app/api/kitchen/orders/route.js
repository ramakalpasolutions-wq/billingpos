import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all KOTs for kitchen (exclude READY ones)
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = session.user.branchId;

    // Get only PENDING and PREPARING KOTs (exclude READY)
    const kots = await prisma.kOT.findMany({
      where: {
        order: {
          branchId: branchId
        },
        status: {
          in: ['PENDING', 'PREPARING']
        }
      },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            onlineOrder: true // Include online order details
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    return NextResponse.json({ kots }, { status: 200 });

  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update order status (for backward compatibility - updates all KOTs of an order)
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Valid status transitions for kitchen
    const validStatuses = ['PREPARING', 'READY'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PREPARING or READY' },
        { status: 400 }
      );
    }

    // Get the order first to check if it's online
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        onlineOrder: true
      }
    });

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status,
        updatedAt: new Date()
      },
      include: {
        table: true,
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: true,
        onlineOrder: true
      }
    });

    // Also update all KOTs for this order
    await prisma.kOT.updateMany({
      where: {
        orderId: orderId,
        status: {
          in: ['PENDING', 'PREPARING']
        }
      },
      data: {
        status: status,
        updatedAt: new Date()
      }
    });

    // If it's an online order and marked as READY, update online order status
    if (status === 'READY' && order.onlineOrder) {
      await prisma.onlineOrder.update({
        where: { orderId: orderId },
        data: {
          orderStatus: 'READY',
          readyAt: new Date()
        }
      });
    } else if (status === 'PREPARING' && order.onlineOrder) {
      await prisma.onlineOrder.update({
        where: { orderId: orderId },
        data: {
          orderStatus: 'PREPARING'
        }
      });
    }

    return NextResponse.json({
      message: `Order marked as ${status}`,
      order: updatedOrder
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update individual KOT status
export async function PATCH(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { kotId, status } = body;

    if (!kotId || !status) {
      return NextResponse.json(
        { error: 'KOT ID and status are required' },
        { status: 400 }
      );
    }

    // Valid status transitions for kitchen
    const validStatuses = ['PREPARING', 'READY'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PREPARING or READY' },
        { status: 400 }
      );
    }

    // Update the specific KOT
    const kot = await prisma.kOT.update({
      where: { id: kotId },
      data: {
        status: status,
        updatedAt: new Date()
      },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            onlineOrder: true
          }
        }
      }
    });

    // Check if we need to update the order status
    // If this KOT is marked as READY, check if all KOTs for this order are READY
    if (status === 'READY') {
      const allKots = await prisma.kOT.findMany({
        where: {
          orderId: kot.orderId
        }
      });

      const allReady = allKots.every(k => k.status === 'READY' || k.status === 'COMPLETED');

      if (allReady) {
        // Update order status to READY
        await prisma.order.update({
          where: { id: kot.orderId },
          data: {
            status: 'READY',
            updatedAt: new Date()
          }
        });

        // If it's an online order, update online order status too
        if (kot.order.onlineOrder) {
          await prisma.onlineOrder.update({
            where: { orderId: kot.orderId },
            data: {
              orderStatus: 'READY',
              readyAt: new Date()
            }
          });
        }
      }
    } else if (status === 'PREPARING') {
      // Update order to PREPARING if it's still in KOT_SENT
      const currentOrder = await prisma.order.findUnique({
        where: { id: kot.orderId },
        include: { onlineOrder: true }
      });

      if (currentOrder.status === 'KOT_SENT') {
        await prisma.order.update({
          where: { id: kot.orderId },
          data: {
            status: 'PREPARING',
            updatedAt: new Date()
          }
        });

        // Update online order status if applicable
        if (currentOrder.onlineOrder) {
          await prisma.onlineOrder.update({
            where: { orderId: kot.orderId },
            data: {
              orderStatus: 'PREPARING'
            }
          });
        }
      }
    }

    return NextResponse.json({
      message: `KOT ${kot.kotNumber} marked as ${status}`,
      kot
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating KOT status:', error);
    return NextResponse.json(
      { error: 'Failed to update KOT status', details: error.message },
      { status: 500 }
    );
  }
}
