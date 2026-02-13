import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { couponId, isActive } = body;

    await prisma.discountCoupon.update({
      where: { id: couponId },
      data: { isActive }
    });

    return NextResponse.json({ message: 'Coupon updated successfully' });

  } catch (error) {
    console.error('Coupon update error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}
