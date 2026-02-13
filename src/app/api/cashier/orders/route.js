import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tableId, items, newItems, action, discountCoupon, discount, isUpdate } = body;

    console.log('Cashier order request:', { 
      tableId, 
      itemCount: items?.length, 
      newItemsCount: newItems?.length,
      action,
      discount,
      isUpdate 
    });

    if (!tableId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Table ID and items are required' }, { status: 400 });
    }

    // Check existing order
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: { in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY', 'BILL_REQUESTED'] }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        kots: true
      }
    });

    let order;
    let newItemsForKot = newItems || [];

    if (existingOrder) {
      // === EXISTING ORDER - UPDATE ===
      console.log('Updating existing order:', existingOrder.id);
      
      // Calculate totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        if (!item.menuItemId || !item.price || !item.quantity) {
          console.error('Invalid item:', item);
          continue;
        }

        const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
        subtotal += itemTotal;

        processedItems.push({
          menuItemId: item.menuItemId,
          size: item.size || null,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          totalPrice: itemTotal,
          kotSent: false
        });
      }

      if (processedItems.length === 0) {
        return NextResponse.json({ error: 'No valid items in order' }, { status: 400 });
      }

      // Calculate taxes
      const discountAmount = parseFloat(discount) || existingOrder.discount || 0;
      const discountedSubtotal = subtotal - discountAmount;
      const cgst = (discountedSubtotal * 2.5) / 100;
      const sgst = (discountedSubtotal * 2.5) / 100;
      const grandTotal = discountedSubtotal + cgst + sgst;

      const orderData = {
        subtotal: subtotal,
        discount: discountAmount,
        discountCoupon: discountCoupon || existingOrder.discountCoupon,
        cgst: cgst,
        sgst: sgst,
        grandTotal: grandTotal,
        updatedAt: new Date()
      };

      // Update status based on action
      if (action === 'save_kot') {
        orderData.status = 'KOT_SENT';
        orderData.kotSentAt = new Date();
      } else if (action === 'bill') {
        orderData.status = 'BILL_REQUESTED';
        orderData.isBillGenerated = true;
      }

      // Delete old order items
      await prisma.orderItem.deleteMany({
        where: { orderId: existingOrder.id }
      });

      // Update order
      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          ...orderData,
          orderItems: {
            create: processedItems
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          table: true,
          kots: true
        }
      });

      // ====== CREATE NEW KOT FOR NEW ITEMS ONLY ======
      if ((action === 'save_kot' || action === 'bill') && newItemsForKot && newItemsForKot.length > 0) {
        const kotCount = order.kots.length;
        const kotNumber = `KOT${order.id.slice(-4)}-${kotCount + 1}`;
        
        console.log(`Creating NEW KOT #${kotCount + 1} with ${newItemsForKot.length} NEW items only`);
        
        await prisma.kOT.create({
          data: {
            kotNumber,
            orderId: order.id,
            items: JSON.stringify(newItemsForKot.map(item => ({
              name: item.name,
              size: item.size || null,
              quantity: item.quantity
            }))),
            status: 'PENDING',
            printedAt: new Date()
          }
        });

        console.log(`✅ New KOT created: ${kotNumber} with ONLY new/increased items`);
      }

    } else {
      // === NEW ORDER ===
      console.log('Creating new order for table:', tableId);

      const orderCount = await prisma.order.count();
      const orderNumber = `ORD${Date.now()}-${orderCount + 1}`;

      // Calculate totals
      let subtotal = 0;
      const orderItems = items.map(item => {
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity);
        const totalPrice = price * quantity;
        subtotal += totalPrice;
        
        return {
          menuItemId: item.menuItemId,
          size: item.size || null,
          quantity: quantity,
          price: price,
          totalPrice: totalPrice,
          kotSent: action === 'save_kot' || action === 'bill'
        };
      });

      const discountAmount = parseFloat(discount) || 0;
      const discountedSubtotal = subtotal - discountAmount;
      const cgst = (discountedSubtotal * 2.5) / 100;
      const sgst = (discountedSubtotal * 2.5) / 100;
      const grandTotal = discountedSubtotal + cgst + sgst;

      order = await prisma.order.create({
        data: {
          orderNumber,
          orderType: 'DINE_IN',
          tableId,
          branchId: session.user.branchId,
          userId: session.user.id,
          status: action === 'save' ? 'PENDING' : 'KOT_SENT',
          subtotal,
          discount: discountAmount,
          discountCoupon: discountCoupon || null,
          cgst,
          sgst,
          grandTotal,
          kotSentAt: action === 'save_kot' || action === 'bill' ? new Date() : null,
          isBillGenerated: action === 'bill',
          orderItems: {
            create: orderItems
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          table: true
        }
      });

      // ====== CREATE FIRST KOT ======
      if (action === 'save_kot' || action === 'bill') {
        const kotNumber = `KOT${order.id.slice(-4)}-1`;
        
        console.log('Creating first KOT:', kotNumber);
        
        await prisma.kOT.create({
          data: {
            kotNumber,
            orderId: order.id,
            items: JSON.stringify(items.map(item => ({
              name: item.name,
              size: item.size || null,
              quantity: item.quantity
            }))),
            status: 'PENDING',
            printedAt: new Date()
          }
        });

        console.log('✅ First KOT created:', kotNumber);
      }

      newItemsForKot = items;
    }

    // Update table availability
    await prisma.table.update({
      where: { id: tableId },
      data: { isAvailable: false }
    });

    console.log('Order saved successfully:', order.id);

    return NextResponse.json({ 
      success: true,
      order: order,
      newKotItems: newItemsForKot,
      message: existingOrder 
        ? `Order updated. ${newItemsForKot.length} new item(s) ${action === 'save_kot' || action === 'bill' ? 'sent to kitchen' : 'added'}`
        : 'Order created successfully',
      kotCreated: (action === 'save_kot' || action === 'bill') && newItemsForKot.length > 0
    }, { status: 200 });

  } catch (error) {
    console.error('Cashier order error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Fetch single order
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const tableId = searchParams.get('tableId');

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          table: true,
          user: true,
          payment: true,
          kots: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return NextResponse.json({ order }, { status: 200 });
    }

    if (tableId) {
      const order = await prisma.order.findFirst({
        where: {
          tableId: tableId,
          status: {
            in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY', 'BILL_REQUESTED']
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          table: true,
          user: true,
          kots: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return NextResponse.json({ order }, { status: 200 });
    }

    return NextResponse.json({ error: 'Order ID or Table ID required' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
