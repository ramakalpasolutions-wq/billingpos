import toast from 'react-hot-toast';

// Play notification sound for NEW orders (higher pitch, urgent - double beep)
const playNewOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // First beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second beep
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 1200;
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 200);
  } catch (error) {
    console.error('Failed to play new order sound:', error);
  }
};

// Play notification sound for PENDING order updates (softer, single beep)
const playPendingOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.error('Failed to play pending order sound:', error);
  }
};

// Show desktop notification if permitted
const showDesktopNotification = (title, message, orderId, url = '/cashier/online-orders') => {
  if (typeof window === 'undefined') return;
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `online-order-${orderId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = url;
      notification.close();
    };

    setTimeout(() => notification.close(), 15000);
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return false;
  
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};

// Show new order notification (for Online Orders page - NEW orders)
export const notifyNewOnlineOrder = (order) => {
  if (!order || !order.onlineOrder) return;

  const platform = order.onlineOrder.platform;
  const orderNumber = order.orderNumber;
  const amount = order.grandTotal.toFixed(2);
  const customerName = order.customerName || 'Customer';

  const message = `New ${platform} order from ${customerName} - ₹${amount}`;
  
  toast.success(
    (t) => (
      <div className="flex items-start gap-3">
        <div className="text-3xl animate-bounce">🔔</div>
        <div className="flex-1">
          <p className="font-bold text-lg mb-1">🆕 New Online Order!</p>
          <p className="text-sm mb-1">{message}</p>
          <p className="text-xs opacity-75">Order #{orderNumber}</p>
        </div>
      </div>
    ),
    {
      duration: 15000,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        minWidth: '350px',
        padding: '20px',
        border: '2px solid #fff',
      },
      icon: '🛵',
    }
  );

  playNewOrderSound();

  showDesktopNotification(
    '🛵 New Online Order!',
    message,
    order.id,
    '/cashier/online-orders'
  );
};

// Show order ready notification (for Online Pending page - orders become READY)
export const notifyOrderReady = (order) => {
  if (!order) return;

  const platform = order.onlineOrder?.platform || 'Platform';
  const orderNumber = order.orderNumber;
  const amount = order.grandTotal.toFixed(2);

  const message = `${platform} Order #${orderNumber} is ready for pickup - ₹${amount}`;
  
  toast.success(
    (t) => (
      <div className="flex items-start gap-3">
        <div className="text-3xl">✅</div>
        <div className="flex-1">
          <p className="font-bold text-lg mb-1">Order Ready!</p>
          <p className="text-sm mb-1">{message}</p>
          <p className="text-xs opacity-75">Ready for pickup now</p>
        </div>
      </div>
    ),
    {
      duration: 10000,
      style: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#fff',
        minWidth: '350px',
        padding: '20px',
      },
      icon: '📦',
    }
  );

  playPendingOrderSound();

  showDesktopNotification(
    '✅ Order Ready for Pickup!',
    message,
    order.id,
    '/cashier/online-pending'
  );
};

// Show order accepted notification
export const notifyOrderAccepted = (order) => {
  if (!order) return;

  const platform = order.onlineOrder?.platform || 'Platform';
  const orderNumber = order.orderNumber;

  const message = `${platform} Order #${orderNumber} accepted and sent to kitchen`;
  
  toast.success(
    (t) => (
      <div className="flex items-start gap-3">
        <div className="text-2xl">👨‍🍳</div>
        <div className="flex-1">
          <p className="font-bold text-base mb-1">Order Accepted!</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        color: '#fff',
        minWidth: '300px',
        padding: '16px',
      },
    }
  );

  playPendingOrderSound();
};

// Show order status update
export const notifyOrderStatusUpdate = (orderNumber, status) => {
  const statusMessages = {
    'READY': `✅ Order #${orderNumber} ready for pickup`,
    'PICKED_UP': `📦 Order #${orderNumber} picked up`,
    'CANCELLED': `❌ Order #${orderNumber} cancelled`,
    'ACCEPTED': `✓ Order #${orderNumber} accepted`
  };

  const statusColors = {
    'READY': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'PICKED_UP': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    'CANCELLED': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    'ACCEPTED': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
  };

  toast(statusMessages[status] || `Order #${orderNumber} ${status}`, {
    icon: status === 'READY' ? '✅' : status === 'PICKED_UP' ? '📦' : status === 'CANCELLED' ? '❌' : '✓',
    duration: 5000,
    style: {
      background: statusColors[status] || '#363636',
      color: '#fff',
      padding: '16px',
    }
  });

  if (status === 'READY') {
    playPendingOrderSound();
  }
};
