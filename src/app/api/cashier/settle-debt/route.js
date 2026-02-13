import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    console.log('=== Settle Debt API Called ===');
    
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['CASHIER', 'WAITER', 'CHAIRMAN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { debtId, amount, paymentMode } = body;

    console.log('Settling debt:', { debtId, amount, paymentMode });

    const settlementAmount = parseFloat(amount);

    if (!settlementAmount || settlementAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid settlement amount' },
        { status: 400 }
      );
    }

    // Get debt record
    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    });

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    if (debt.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Debt already paid' },
        { status: 400 }
      );
    }

    if (settlementAmount > debt.remainingAmount) {
      return NextResponse.json(
        { error: 'Settlement amount exceeds remaining debt' },
        { status: 400 }
      );
    }

    // Update debt
    const newPaidAmount = debt.paidAmount + settlementAmount;
    const newRemainingAmount = debt.remainingAmount - settlementAmount;
    const newPaymentStatus = newRemainingAmount === 0 ? 'PAID' : 'PARTIAL';

    console.log('Updating debt:', { newPaidAmount, newRemainingAmount, newPaymentStatus });

    const updatedDebt = await prisma.debt.update({
      where: { id: debtId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      }
    });

    console.log('Debt settled successfully');

    return NextResponse.json({ 
      debt: updatedDebt,
      message: 'Debt settled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('=== Settle Debt Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to settle debt',
        details: error.message
      },
      { status: 500 }
    );
  }
}
