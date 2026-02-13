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
    const {
      customerName,
      customerPhone,
      totalDebt,
      paidAmount,
      remainingAmount,
      paymentStatus
    } = body;

    // Check if customer already exists
    const existingCustomer = await prisma.debt.findFirst({
      where: {
        customerPhone
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      );
    }

    const debt = await prisma.debt.create({
      data: {
        customerName,
        customerPhone,
        totalDebt: parseFloat(totalDebt),
        paidAmount: parseFloat(paidAmount) || 0,
        remainingAmount: parseFloat(remainingAmount),
        paymentStatus
      }
    });

    return NextResponse.json({ debt }, { status: 201 });

  } catch (error) {
    console.error('Add debt customer error:', error);
    return NextResponse.json(
      { error: 'Failed to add debt customer' },
      { status: 500 }
    );
  }
}
