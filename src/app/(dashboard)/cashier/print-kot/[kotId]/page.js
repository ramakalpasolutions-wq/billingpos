'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PrintKOT() {
  const params = useParams();
  const [kot, setKot] = useState(null);

  useEffect(() => {
    fetchKOT();
  }, []);

  const fetchKOT = async () => {
    try {
      const response = await fetch(`/api/cashier/print-kot?kotId=${params.kotId}`);
      const data = await response.json();
      setKot(data.kot);
      
      // Auto print after 1 second
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch KOT:', error);
    }
  };

  if (!kot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading KOT...</p>
      </div>
    );
  }

  const items = JSON.parse(kot.items);

  return (
    <div className="max-w-sm mx-auto p-4 print:p-6">
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold">KITCHEN ORDER TICKET</h1>
        <p className="text-lg font-semibold mt-2">{kot.kotNumber}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm"><strong>Order:</strong> {kot.order.orderNumber}</p>
        <p className="text-sm"><strong>Table:</strong> {kot.order.table?.tableNumber || 'N/A'}</p>
        <p className="text-sm"><strong>Time:</strong> {new Date(kot.printedAt).toLocaleTimeString('en-IN')}</p>
        <p className="text-sm"><strong>Date:</strong> {new Date(kot.printedAt).toLocaleDateString('en-IN')}</p>
      </div>

      <div className="border-y-2 border-black py-3 mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Size</th>
              <th className="text-right py-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 font-semibold">{item.name}</td>
                <td className="py-2 text-center text-sm">{item.size || '-'}</td>
                <td className="py-2 text-right font-bold text-lg">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center border-t-2 border-black pt-4">
        <p className="text-sm font-semibold">Status: {kot.status}</p>
        <p className="text-xs mt-2 text-gray-600">This is a computer generated KOT</p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
