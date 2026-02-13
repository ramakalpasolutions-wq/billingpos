'use client';

import { useEffect, useRef } from 'react';
import { notifyNewOnlineOrder } from '@/lib/notifications';

export const useOnlineOrderNotifications = (branchId, enabled = true) => {
  const previousOrdersRef = useRef([]);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !branchId) return;

    // Initial fetch (don't notify on first load)
    fetchOrders(true);

    // Poll every 15 seconds
    pollingIntervalRef.current = setInterval(() => fetchOrders(false), 15000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [branchId, enabled]);

  const fetchOrders = async (isInitial = false) => {
    try {
      const response = await fetch('/api/cashier/online-orders?status=RECEIVED');
      
      if (!response.ok) {
        console.error('Failed to fetch orders:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (data.orders && Array.isArray(data.orders)) {
        // Check for new orders (skip notification on initial load)
        if (!isInitial && previousOrdersRef.current.length > 0) {
          const newOrders = data.orders.filter(order => 
            !previousOrdersRef.current.some(prevOrder => prevOrder.id === order.id)
          );

          // Notify for each new order
          newOrders.forEach(order => {
            notifyNewOnlineOrder(order);
          });
        }

        // Update previous orders
        previousOrdersRef.current = data.orders;
      }
    } catch (error) {
      console.error('Error polling online orders:', error);
    }
  };

  return null;
};
