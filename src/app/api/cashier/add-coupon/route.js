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
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom,
      validUntil
    } = body;

    const coupon = await prisma.discountCoupon.create({
      data: {
        code,
        description: description || null,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: true,
        usageCount: 0
      }
    });

    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error) {
    console.error('Coupon creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
