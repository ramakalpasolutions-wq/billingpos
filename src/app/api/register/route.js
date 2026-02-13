import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      restaurantName,
      ownerName,
      phone,
      email,
      license,
      cgst,
      sgst,
      address,
      registrationCode,
      password,
      confirmPassword
    } = body;

    // Validate registration code
    if (registrationCode !== process.env.COMPANY_REGISTRATION_CODE) {
      return NextResponse.json(
        { error: 'Invalid registration code' },
        { status: 400 }
      );
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if restaurant already exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { name: restaurantName }
    });

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant with this name already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant and chairman user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          ownerName,
          phone,
          email,
          license,
          cgst: cgst || null,
          sgst: sgst || null,
          address,
          registrationCode
        }
      });

      // Create chairman user
      const chairman = await tx.user.create({
        data: {
          name: ownerName,
          email,
          password: hashedPassword,
          phone,
          address,
          role: 'CHAIRMAN',
          restaurantId: restaurant.id
        }
      });

      return { restaurant, chairman };
    });

    return NextResponse.json(
      { 
        message: 'Registration successful',
        restaurantId: result.restaurant.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
