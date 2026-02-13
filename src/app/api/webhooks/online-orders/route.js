import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify webhook signature (Swiggy/Zomato use different methods)
function verifyWebhookSignature(payload, signature, secret, platform) {
  if (platform === 'SWIGGY') {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return signature === expectedSignature;
  } else if (platform === 'ZOMATO') {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('base64');
    return signature === expectedSignature;
  }
  return false;
}

// Webhook to receive orders from Swiggy, Zomato, etc.
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Get signature from headers
    const signature = request.headers.get('x-webhook-signature');
    const platform = request.headers.get('x-platform') || body.platform;

    console.log('Webhook received:', { platform, body });

    // Extract data based on platform format
    let orderData;
    
    if (platform === 'SWIGGY') {
      orderData = parseSwiggyWebhook(body);
    } else if (platform === 'ZOMATO') {
      orderData = parseZomatoWebhook(body);
    } else if (platform === 'DUNZO') {
      orderData = parseDunzoWebhook(body);
    } else {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const {
      platformOrderId,
      branchId,
      customerName,
      customerPhone,
      deliveryAddress,
      items,
      subtotal,
      deliveryCharges,
      taxes
    } = orderData;

    // Verify branch exists and get config
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
      return NextResponse.json({ error: 'Invalid branch' }, { status: 400 });
    }

    // Verify webhook signature if configured
    if (signature) {
      const configField = `${platform.toLowerCase()}Config`;
      const config = branch[configField] ? JSON.parse(branch[configField]) : null;
      
      if (config && config.webhookSecret) {
        const isValid = verifyWebhookSignature(body, signature, config.webhookSecret, platform);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    // Calculate totals
    const cgst = taxes?.cgst || (subtotal * 2.5) / 100;
    const sgst = taxes?.sgst || (subtotal * 2.5) / 100;
    const grandTotal = subtotal + cgst + sgst + (deliveryCharges || 0);

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
            create: items.map(item => ({
              menuItemId: item.menuItemId,
              size: item.size || null,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.price * item.quantity
            }))
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
          deliveryAddress: deliveryAddress,
          orderStatus: 'RECEIVED'
        }
      });

      return { order, onlineOrder };
    });

    // Send success response back to platform
    return NextResponse.json({ 
      success: true,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      message: 'Order received successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process order', details: error.message },
      { status: 500 }
    );
  }
}

// Parse Swiggy webhook format
function parseSwiggyWebhook(body) {
  return {
    platformOrderId: body.order_id,
    branchId: body.restaurant_id, // Map this to your branch ID
    customerName: body.customer.name,
    customerPhone: body.customer.phone,
    deliveryAddress: body.delivery_address?.complete_address,
    items: body.items.map(item => ({
      menuItemId: item.item_id, // Map to your menu item ID
      quantity: item.quantity,
      size: item.variant || null,
      price: item.price
    })),
    subtotal: body.order_total,
    deliveryCharges: body.delivery_charges || 0,
    taxes: {
      cgst: body.cgst || 0,
      sgst: body.sgst || 0
    }
  };
}

// Parse Zomato webhook format
function parseZomatoWebhook(body) {
  return {
    platformOrderId: body.order_id,
    branchId: body.restaurant_id,
    customerName: body.customer_details?.name,
    customerPhone: body.customer_details?.phone,
    deliveryAddress: body.delivery_address,
    items: body.items.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity,
      size: item.variant_name || null,
      price: item.price
    })),
    subtotal: body.subtotal,
    deliveryCharges: body.delivery_charge || 0,
    taxes: {
      cgst: body.taxes?.cgst || 0,
      sgst: body.taxes?.sgst || 0
    }
  };
}

// Parse Dunzo webhook format
function parseDunzoWebhook(body) {
  return {
    platformOrderId: body.order_id,
    branchId: body.merchant_id,
    customerName: body.customer?.name,
    customerPhone: body.customer?.phone,
    deliveryAddress: body.pickup_details?.address,
    items: body.items.map(item => ({
      menuItemId: item.item_id,
      quantity: item.qty,
      size: null,
      price: item.price
    })),
    subtotal: body.order_value,
    deliveryCharges: 0,
    taxes: {
      cgst: body.tax_amount / 2 || 0,
      sgst: body.tax_amount / 2 || 0
    }
  };
}
