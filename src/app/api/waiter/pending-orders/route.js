import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = session.user.branchId;

    // Get all KOTs that are in PENDING, PREPARING, or READY status
    const kots = await prisma.kOT.findMany({
      where: {
        order: {
          branchId: branchId,
          userId: session.user.id // Only show orders created by this waiter
        },
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      },
      include: {
        order: {
          include: {
            table: true,
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ kots }, { status: 200 });

  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending orders', details: error.message },
      { status: 500 }
    );
  }
}

// Mark KOT as picked up
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { kotId } = body;

    if (!kotId) {
      return NextResponse.json({ error: 'KOT ID is required' }, { status: 400 });
    }

    // Update KOT status to COMPLETED
    await prisma.kOT.update({
      where: { id: kotId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'KOT marked as picked up' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating KOT:', error);
    return NextResponse.json(
      { error: 'Failed to update KOT', details: error.message },
      { status: 500 }
    );
  }
}
