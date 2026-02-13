import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();
    
    // Only CHAIRMAN or CASHIER can reset orders
    if (!session || !['CHAIRMAN', 'CASHIER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmReset } = body;

    if (!confirmReset) {
      return NextResponse.json(
        { error: 'Confirmation required to reset orders' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting order reset...');

    // Delete all KOTs first (due to foreign key constraint)
    const deletedKots = await prisma.kOT.deleteMany({});
    console.log(`✅ Deleted ${deletedKots.count} KOTs`);

    // Delete all order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    // Delete all orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    // Reset all tables to available
    const updatedTables = await prisma.table.updateMany({
      data: {
        isAvailable: true
      }
    });
    console.log(`✅ Reset ${updatedTables.count} tables to available`);

    // Optional: Reset tips (uncomment if you want to clear tips too)
    // const deletedTips = await prisma.tip.deleteMany({});
    // console.log(`✅ Deleted ${deletedTips.count} tips`);

    console.log('✅ Order reset completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'All orders reset successfully',
      deleted: {
        orders: deletedOrders.count,
        orderItems: deletedOrderItems.count,
        kots: deletedKots.count
      },
      reset: {
        tables: updatedTables.count
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error resetting orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset orders',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
