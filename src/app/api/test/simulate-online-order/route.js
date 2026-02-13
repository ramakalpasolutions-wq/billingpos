import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is a TEST endpoint to simulate online orders from Swiggy/Zomato
// In production, real orders will come through /api/webhooks/online-orders

export async function POST(request) {
  try {
    const body = await request.json();
    const { branchId, platform } = body;

    if (!branchId || !platform) {
      return NextResponse.json(
        { error: 'branchId and platform are required' },
        { status: 400 }
      );
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        users: {
          where: { role: 'CASHIER' },
          take: 1
        }
      }
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Get some menu items for testing
    const menuItems = await prisma.menuItem.findMany({
      where: { 
        restaurantId: branch.restaurantId,
        isAvailable: true
      },
      take: 3
    });

    if (menuItems.length === 0) {
      return NextResponse.json(
        { error: 'No menu items available. Please add menu items first.' },
        { status: 400 }
      );
    }

    // Generate random order data
    const platformOrderId = `TEST-${Date.now()}`;
    const customerNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh'];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const customerPhone = `98765${Math.floor(Math.random() * 90000) + 10000}`;

    // Create order items from menu
    const orderItems = menuItems.map(item => ({
      menuItemId: item.id,
      quantity: Math.floor(Math.random() * 3) + 1,
      size: item.sizes && item.sizes.length > 0 ? item.sizes[0] : null,
      price: item.price,
      totalPrice: item.price * (Math.floor(Math.random() * 3) + 1)
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const cgst = (subtotal * 2.5) / 100;
    const sgst = (subtotal * 2.5) / 100;
    const grandTotal = subtotal + cgst + sgst;

    // Create order with transaction
    const result = await prisma.$transaction(async (tx) => {
      const orderNumber = `${platform}-${platformOrderId}`;

      // Create main order
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          orderType: 'ONLINE',
          branchId: branchId,
          userId: branch.users[0]?.id || branchId,
          customerName: customerName,
          customerPhone: customerPhone,
          status: 'PENDING',
          subtotal: subtotal,
          cgst: cgst,
          sgst: sgst,
          grandTotal: grandTotal,
          orderItems: {
            create: orderItems.map(item => ({
              menuItemId: item.menuItemId,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.totalPrice
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // Create online order record
      const onlineOrder = await tx.onlineOrder.create({
        data: {
          orderId: order.id,
          platform: platform,
          platformOrderId: platformOrderId,
          customerName: customerName,
          customerPhone: customerPhone,
          deliveryAddress: `${Math.floor(Math.random() * 999) + 1}, Test Street, Hyderabad`,
          orderStatus: 'RECEIVED'
        }
      });

      return { order, onlineOrder };
    });

    console.log(`✅ Test order created: ${result.order.orderNumber}`);

    return NextResponse.json({
      success: true,
      message: `Test ${platform} order created successfully!`,
      order: result.order,
      onlineOrder: result.onlineOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating test order:', error);
    return NextResponse.json(
      { error: 'Failed to create test order', details: error.message },
      { status: 500 }
    );
  }
}
