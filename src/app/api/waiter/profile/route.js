import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'WAITER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get waiter details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        },
        branch: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('Error fetching waiter profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}
