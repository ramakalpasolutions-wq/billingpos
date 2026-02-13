import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      aadharNumber,
      photo,
      role,
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

    // Create employee
    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        aadharNumber,
        photo: photo || null,
        role,
        assignedHours: assignedHours || null,
        restaurantId: session.user.restaurantId,
        branchId: session.user.branchId
      }
    });

    return NextResponse.json({ employee }, { status: 201 });

  } catch (error) {
    console.error('Employee creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
