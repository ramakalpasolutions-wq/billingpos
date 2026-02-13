import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: {
        restaurantId: session.user.restaurantId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ branches });

  } catch (error) {
    console.error('Branches fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, phone } = body;

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        restaurantId: session.user.restaurantId
      }
    });

    return NextResponse.json({ branch }, { status: 201 });

  } catch (error) {
    console.error('Branch creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('id');

    await prisma.branch.delete({
      where: { id: branchId }
    });

    return NextResponse.json({ message: 'Branch deleted successfully' });

  } catch (error) {
    console.error('Branch deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
