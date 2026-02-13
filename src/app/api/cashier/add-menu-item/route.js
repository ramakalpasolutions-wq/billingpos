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
      name,
      description,
      categoryId,
      hasSizes,
      smallPrice,
      mediumPrice,
      largePrice,
      regularPrice
    } = body;

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        categoryId,
        hasSizes,
        smallPrice: hasSizes && smallPrice ? parseFloat(smallPrice) : null,
        mediumPrice: hasSizes && mediumPrice ? parseFloat(mediumPrice) : null,
        largePrice: hasSizes && largePrice ? parseFloat(largePrice) : null,
        regularPrice: !hasSizes && regularPrice ? parseFloat(regularPrice) : null,
        isAvailable: true
      }
    });

    return NextResponse.json({ menuItem }, { status: 201 });

  } catch (error) {
    console.error('Menu item creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
