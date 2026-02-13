'use client';

import { useEffect, useRef } from 'react';
import { notifyOrderReady } from '@/lib/notifications';

export const useOnlinePendingNotifications = (branchId, enabled = true) => {
  const previousOrdersRef = useRef([]);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !branchId) return;

    // Initial fetch (don't notify on first load)
    fetchPendingOrders(true);

    // Poll every 20 seconds
    pollingIntervalRef.current = setInterval(() => fetchPendingOrders(false), 20000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [branchId, enabled]);

  const fetchPendingOrders = async (isInitial = false) => {
    try {
      const response = await fetch('/api/cashier/online-orders?status=ACCEPTED,PREPARING,READY');
      
      if (!response.ok) {
        console.error('Failed to fetch pending orders:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (data.orders && Array.isArray(data.orders)) {
        // Check for orders that just became READY (skip notification on initial load)
        if (!isInitial && previousOrdersRef.current.length > 0) {
          const newlyReadyOrders = data.orders.filter(order => {
            const prevOrder = previousOrdersRef.current.find(prev => prev.id === order.id);
            // Order just became ready
            return order.onlineOrder.orderStatus === 'READY' && 
                   prevOrder && 
                   prevOrder.onlineOrder.orderStatus !== 'READY';
          });

          // Notify for each newly ready order
          newlyReadyOrders.forEach(order => {
            notifyOrderReady(order);
          });
        }

        // Update previous orders
        previousOrdersRef.current = data.orders;
      }
    } catch (error) {
      console.error('Error polling pending orders:', error);
    }
  };

  return null;
};
