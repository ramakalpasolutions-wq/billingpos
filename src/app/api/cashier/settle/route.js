import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      paymentMode,
      amountPaid,
      tipAmount = 0,
      balanceAmount = 0,
      debtCustomerName,
      debtCustomerPhone
    } = body;

    // Get the order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        user: true // This is the waiter/cashier who created the order
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      let debtId = null;

      // Handle debt payment
      if (paymentMode === 'DEBT') {
        let debt = await tx.debt.findFirst({
          where: { customerPhone: debtCustomerPhone }
        });

        if (debt) {
          debt = await tx.debt.update({
            where: { id: debt.id },
            data: {
              totalDebt: debt.totalDebt + order.grandTotal,
              remainingAmount: debt.remainingAmount + order.grandTotal,
              paymentStatus: 'PENDING'
            }
          });
        } else {
          debt = await tx.debt.create({
            data: {
              customerName: debtCustomerName,
              customerPhone: debtCustomerPhone,
              totalDebt: order.grandTotal,
              paidAmount: 0,
              remainingAmount: order.grandTotal,
              paymentStatus: 'PENDING'
            }
          });
        }

        debtId = debt.id;
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          paymentMode: paymentMode,
          amountPaid: amountPaid,
          tipAmount: tipAmount,
          balanceAmount: balanceAmount,
          debtId: debtId,
          paymentStatus: paymentMode === 'DEBT' ? 'DEBT' : 'COMPLETED'
        }
      });

      // Create tip record for the WAITER who took the order (NOT SETTLED YET)
      let tip = null;
      if (tipAmount > 0 && order.userId) {
        tip = await tx.tip.create({
          data: {
            userId: order.userId, // Waiter/Cashier who took the order gets the tip
            branchId: order.branchId,
            tableNumber: order.table?.tableName || order.table?.tableNumber || 'N/A',
            amount: tipAmount,
            paymentMode: paymentMode,
            isSettled: false, // Not yet physically given to waiter
            date: new Date()
          }
        });
      }

      // Update order status to COMPLETED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          isBillGenerated: true
        }
      });

      // Mark table as available
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { isAvailable: true }
        });
      }

      return { payment, tip, waiterName: order.user?.name };
    });

    return NextResponse.json({
      message: 'Payment successful',
      payment: result.payment,
      tip: result.tip,
      waiterName: result.waiterName
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: error.message },
      { status: 500 }
    );
  }
}
