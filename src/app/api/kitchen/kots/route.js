import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all pending KOTs for kitchen
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const branchId = session.user.branchId;

    const kots = await prisma.kOT.findMany({
      where: {
        status: status,
        order: {
          branchId: branchId
        }
      },
      include: {
        order: {
          include: {
            table: true,
            onlineOrder: true,
            orderItems: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ kots }, { status: 200 });
  } catch (error) {
    console.error('Error fetching KOTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KOTs' },
      { status: 500 }
    );
  }
}

// Update KOT status
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'KITCHEN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { kotId, status } = body; // status: 'PREPARING', 'READY'

    const kot = await prisma.kOT.update({
      where: { id: kotId },
      data: { 
        status: status,
        updatedAt: new Date()
      },
      include: {
        order: {
          include: {
            onlineOrder: true,
            table: true
          }
        }
      }
    });

    // If KOT is marked as READY, update the order status
    if (status === 'READY') {
      await prisma.order.update({
        where: { id: kot.orderId },
        data: { status: 'READY' }
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
    } else if (status === 'PREPARING') {
      await prisma.order.update({
        where: { id: kot.orderId },
        data: { status: 'PREPARING' }
      });

      // Update online order status
      if (kot.order.onlineOrder) {
        await prisma.onlineOrder.update({
          where: { orderId: kot.orderId },
          data: { orderStatus: 'PREPARING' }
        });
      }
    }

    return NextResponse.json({ 
      message: 'KOT updated successfully',
      kot: kot
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating KOT:', error);
    return NextResponse.json(
      { error: 'Failed to update KOT' },
      { status: 500 }
    );
  }
}
