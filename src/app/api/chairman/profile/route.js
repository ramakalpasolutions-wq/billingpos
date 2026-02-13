import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: session.user.restaurantId
      }
    });

    return NextResponse.json({ restaurant });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ownerName, phone, email, license, cgst, sgst, address } = body;

    const restaurant = await prisma.restaurant.update({
      where: {
        id: session.user.restaurantId
      },
      data: {
        ownerName,
        phone,
        email,
        license,
        cgst: cgst || null,
        sgst: sgst || null,
        address
      }
    });

    // Also update chairman user email if changed
    await prisma.user.updateMany({
      where: {
        restaurantId: session.user.restaurantId,
        role: 'CHAIRMAN'
      },
      data: {
        email,
        phone
      }
    });

    return NextResponse.json({ restaurant });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
