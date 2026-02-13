import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all online orders for cashier's branch
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const branchId = session.user.branchId;

    const whereCondition = {
      branchId: branchId,
      orderType: 'ONLINE'
    };

    // Filter by online order status if provided
    if (statusParam) {
      const statuses = statusParam.split(',');
      whereCondition.onlineOrder = {
        orderStatus: {
          in: statuses
        }
      };
    }

    const onlineOrders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        onlineOrder: true,
        branch: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ orders: onlineOrders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching online orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online orders' },
      { status: 500 }
    );
  }
}

// Accept/Update online order status
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action } = body;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        onlineOrder: true,
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        },
        table: true
      }
    });

    if (!order || !order.onlineOrder) {
      return NextResponse.json({ error: 'Online order not found' }, { status: 404 });
    }

    // Check if order belongs to cashier's branch
    if (order.branchId !== session.user.branchId) {
      return NextResponse.json({ error: 'Unauthorized access to this order' }, { status: 403 });
    }

    let updateData = {};
    let orderUpdateData = {};
    let kot = null;

    switch (action) {
      case 'accept':
        updateData = {
          orderStatus: 'ACCEPTED',
          acceptedAt: new Date()
        };
        orderUpdateData = {
          status: 'KOT_SENT',
          kotSentAt: new Date()
        };
        
        // Create KOT for kitchen
        const kotNumber = `KOT-${Date.now()}`;
        
        // Prepare KOT items with details
        const kotItems = order.orderItems.map(item => ({
          name: item.menuItem.name,
          category: item.menuItem.category?.name || 'General',
          quantity: item.quantity,
          size: item.size || null,
          specialInstructions: item.specialInstructions || null
        }));

        kot = await prisma.kOT.create({
          data: {
            kotNumber: kotNumber,
            orderId: order.id,
            items: JSON.stringify(kotItems),
            status: 'PENDING'
          }
        });

        console.log(`✅ KOT Created: ${kotNumber} for Order: ${order.orderNumber}`);
        break;

      case 'ready':
        updateData = {
          orderStatus: 'READY',
          readyAt: new Date()
        };
        orderUpdateData = {
          status: 'READY'
        };
        
        // Update KOT status to READY
        await prisma.kOT.updateMany({
          where: { 
            orderId: order.id,
            status: { in: ['PENDING', 'PREPARING'] }
          },
          data: { status: 'READY' }
        });
        break;

      case 'picked_up':
        updateData = {
          orderStatus: 'PICKED_UP',
          pickedUpAt: new Date()
        };
        orderUpdateData = {
          status: 'COMPLETED'
        };
        break;

      case 'cancel':
        updateData = {
          orderStatus: 'CANCELLED'
        };
        orderUpdateData = {
          status: 'CANCELLED'
        };
        
        // Cancel associated KOTs
        await prisma.kOT.updateMany({
          where: { orderId: order.id },
          data: { status: 'CANCELLED' }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update online order
    await prisma.onlineOrder.update({
      where: { id: order.onlineOrder.id },
      data: updateData
    });

    // Update main order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: orderUpdateData,
      include: {
        onlineOrder: true,
        orderItems: {
          include: {
            menuItem: true
          }
        },
        kots: true
      }
    });

    return NextResponse.json({ 
      message: 'Order updated successfully',
      order: updatedOrder,
      kot: kot
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating online order:', error);
    return NextResponse.json(
      { error: 'Failed to update online order' },
      { status: 500 }
    );
  }
}
