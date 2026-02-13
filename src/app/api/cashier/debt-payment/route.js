import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { debtId, paymentAmount } = body;

    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    });

    if (!debt) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    const newPaidAmount = debt.paidAmount + parseFloat(paymentAmount);
    const newRemainingAmount = debt.totalDebt - newPaidAmount;

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newRemainingAmount <= 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING'
      }
    });

    return NextResponse.json({ message: 'Payment recorded successfully' });

  } catch (error) {
    console.error('Debt payment error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
