import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Update orders with null updatedAt
    const result = await prisma.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { updatedAt: null },
          u: { $set: { updatedAt: new Date() } },
          multi: true
        }
      ]
    });

    return NextResponse.json({ 
      message: 'Data fixed',
      result
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
