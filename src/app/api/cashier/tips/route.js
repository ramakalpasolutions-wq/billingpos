import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all tips for the branch
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' or 'settled'
    const branchId = session.user.branchId;

    const whereClause = {
      branchId: branchId
    };

    if (status === 'pending') {
      whereClause.isSettled = false;
    } else if (status === 'settled') {
      whereClause.isSettled = true;
    }

    const tips = await prisma.tip.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by user for summary
    const tipsByUser = tips.reduce((acc, tip) => {
      const userId = tip.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: tip.user,
          totalTips: 0,
          pendingTips: 0,
          settledTips: 0,
          tips: []
        };
      }
      acc[userId].totalTips += tip.amount;
      if (tip.isSettled) {
        acc[userId].settledTips += tip.amount;
      } else {
        acc[userId].pendingTips += tip.amount;
      }
      acc[userId].tips.push(tip);
      return acc;
    }, {});

    return NextResponse.json({ 
      tips,
      tipsByUser: Object.values(tipsByUser)
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}

// PUT - Mark tip as settled
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tipId, tipIds } = body;

    if (tipIds && Array.isArray(tipIds)) {
      // Settle multiple tips at once (for a specific waiter)
      await prisma.tip.updateMany({
        where: {
          id: { in: tipIds },
          isSettled: false
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
          settledBy: session.user.id
        }
      });

      return NextResponse.json({
        message: `${tipIds.length} tips marked as settled`
      }, { status: 200 });

    } else if (tipId) {
      // Settle single tip
      const tip = await prisma.tip.update({
        where: { id: tipId },
        data: {
          isSettled: true,
          settledAt: new Date(),
          settledBy: session.user.id
        },
        include: {
          user: true
        }
      });

      return NextResponse.json({
        message: 'Tip marked as settled',
        tip
      }, { status: 200 });

    } else {
      return NextResponse.json(
        { error: 'tipId or tipIds required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error settling tip:', error);
    return NextResponse.json(
      { error: 'Failed to settle tip' },
      { status: 500 }
    );
  }
}
