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
    const { tableNumber, tableName } = body;

    const table = await prisma.table.create({
      data: {
        tableNumber,
        tableName: tableName || null,
        branchId: session.user.branchId,
        isAvailable: true
      }
    });

    return NextResponse.json({ table }, { status: 201 });

  } catch (error) {
    console.error('Table creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}
