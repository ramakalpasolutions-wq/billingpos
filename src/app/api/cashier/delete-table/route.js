import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('id');

    await prisma.table.delete({
      where: { id: tableId }
    });

    return NextResponse.json({ message: 'Table deleted successfully' });

  } catch (error) {
    console.error('Table deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
