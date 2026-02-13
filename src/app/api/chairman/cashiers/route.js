import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cashiers = await prisma.user.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        role: 'CASHIER'
      },
      include: {
        branch: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ cashiers });

  } catch (error) {
    console.error('Cashiers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashiers' },
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
    const {
      name,
      address,
      aadharNumber,
      email,
      password,
      confirmPassword,
      photo,
      branchId,
      phone,
      assignedHours
    } = body;

    // Validate passwords
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create cashier
    const cashier = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        aadharNumber,
        photo: photo || null,
        role: 'CASHIER',
        assignedHours: assignedHours || null,
        restaurantId: session.user.restaurantId,
        branchId: branchId || null
      },
      include: {
        branch: true
      }
    });

    return NextResponse.json({ cashier }, { status: 201 });

  } catch (error) {
    console.error('Cashier creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create cashier' },
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
    const cashierId = searchParams.get('id');

    await prisma.user.delete({
      where: { id: cashierId }
    });

    return NextResponse.json({ message: 'Cashier deleted successfully' });

  } catch (error) {
    console.error('Cashier deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cashier' },
      { status: 500 }
    );
  }
}
