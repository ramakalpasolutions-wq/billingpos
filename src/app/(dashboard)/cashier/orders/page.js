'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CashierOrders() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [originalCart, setOriginalCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountCoupon, setDiscountCoupon] = useState('');
  const [showTableSelection, setShowTableSelection] = useState(true);

  useEffect(() => {
    fetchTables();
    fetchMenu();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/cashier/tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/cashier/menu');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setShowTableSelection(false);
    setSelectedCategory(null);
    
    if (table.orders && table.orders.length > 0) {
      const order = table.orders[0];
      setExistingOrder(order);
      setDiscount(order.discount || 0);
      setDiscountCoupon(order.discountCoupon || '');
      
      const existingCart = order.orderItems.map(item => ({
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size
      }));
      
      setCart(existingCart);
      setOriginalCart(JSON.parse(JSON.stringify(existingCart)));
    } else {
      setExistingOrder(null);
      setCart([]);
      setOriginalCart([]);
      setDiscount(0);
      setDiscountCoupon('');
    }
  };

  const handleBackToTables = () => {
    setShowTableSelection(true);
    setSelectedTable(null);
    setExistingOrder(null);
    setCart([]);
    setOriginalCart([]);
    setSelectedCategory(null);
    setDiscount(0);
    setDiscountCoupon('');
  };

  const handleAddToCart = (menuItem, size = null) => {
    const price = size 
      ? menuItem[`${size.toLowerCase()}Price`]
      : menuItem.regularPrice;

    const existingItemIndex = cart.findIndex(
      item => item.menuItemId === menuItem.id && item.size === size
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: price,
        quantity: 1,
        size: size
      }]);
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = cart.filter((_, i) => i !== index);
      setCart(newCart);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const calculateSubtotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal(cart);
    const discountAmount = parseFloat(discount) || 0;
    const afterDiscount = subtotal - discountAmount;
    const cgst = (afterDiscount * 2.5) / 100;
    const sgst = (afterDiscount * 2.5) / 100;
    return {
      subtotal,
      discount: discountAmount,
      cgst,
      sgst,
      grandTotal: afterDiscount + cgst + sgst
    };
  };

  const getNewItemsOnly = () => {
    if (!existingOrder) {
      return cart;
    }

    const newItems = [];

    cart.forEach(currentItem => {
      const originalItem = originalCart.find(
        orig => orig.menuItemId === currentItem.menuItemId && orig.size === currentItem.size
      );

      if (!originalItem) {
        newItems.push(currentItem);
      } else if (currentItem.quantity > originalItem.quantity) {
        newItems.push({
          ...currentItem,
          quantity: currentItem.quantity - originalItem.quantity
        });
      }
    });

    return newItems;
  };

  const handleSaveOrder = async (action) => {
    if (!selectedTable || cart.length === 0) {
      alert('Please select a table and add items to cart');
      return;
    }

    const newItemsForKot = getNewItemsOnly();

    if (existingOrder && newItemsForKot.length === 0 && action === 'save_kot') {
      alert('No new items to send to kitchen. All items were already sent.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/cashier/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          items: cart,
          newItems: newItemsForKot,
          action: action,
          discount: discount,
          discountCoupon: discountCoupon,
          isUpdate: !!existingOrder
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        throw new Error('Invalid response from server');
      }

      let actionMessage = '';
      if (action === 'save') {
        actionMessage = 'Order saved successfully!';
      } else if (action === 'save_kot') {
        if (existingOrder && newItemsForKot.length > 0) {
          actionMessage = `New KOT created with ${newItemsForKot.length} item(s)!`;
        } else {
          actionMessage = 'Order sent to kitchen!';
        }
      } else if (action === 'bill') {
        actionMessage = 'Order ready for settlement!';
      }

      alert(actionMessage);

      await fetchTables();
      handleBackToTables();

    } catch (error) {
      console.error('Error saving order:', error);
      alert(error.message || 'An error occurred while saving the order');
    } finally {
      setSaving(false);
    }
  };

  const handleSettleOrder = () => {
    if (!existingOrder) {
      alert('No order to settle');
      return;
    }
    router.push(`/cashier/settle?orderId=${existingOrder.id}`);
  };

  const totals = calculateTotal();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600 mt-1">Manage table orders and billing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Tables or Categories */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {showTableSelection ? (
              /* Table Selection View */
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Select a Table ({tables.length})
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {tables.map((table) => {
                    const hasOrder = table.orders && table.orders.length > 0;
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          hasOrder
                            ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                            : 'border-green-300 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">🪑</div>
                          <p className="font-semibold text-gray-800">
                            {table.tableName || `Table ${table.tableNumber}`}
                          </p>
                          <div className="flex items-center justify-center mt-2">
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${
                                hasOrder ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                            />
                            <p className={`text-xs ${
                              hasOrder ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {hasOrder ? 'Has Order' : 'Available'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Categories and Menu Items View */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedTable.tableName || `Table ${selectedTable.tableNumber}`}
                    {existingOrder && (
                      <span className="ml-2 text-sm font-normal text-orange-600">
                        (Editing Order)
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={handleBackToTables}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                  >
                    ← Back to Tables
                  </button>
                </div>

                {/* Show existing order info */}
                {existingOrder && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-blue-800">
                        📋 Order: {existingOrder.orderNumber}
                      </p>
                      <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                        {existingOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      Current Total: ₹{existingOrder.grandTotal.toFixed(2)}
                    </p>
                    
                    {/* Show what's new */}
                    {(() => {
                      const newItems = getNewItemsOnly();
                      if (newItems.length > 0) {
                        return (
                          <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                            <p className="text-xs font-semibold text-green-800 mb-1">
                              🆕 New items to be sent to kitchen ({newItems.length}):
                            </p>
                            <div className="space-y-1">
                              {newItems.map((item, idx) => (
                                <div key={idx} className="text-xs text-green-700 flex justify-between">
                                  <span>{item.name} {item.size && `(${item.size})`}</span>
                                  <span className="font-semibold">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <p className="text-xs text-blue-600 mt-2">
                            💡 Add more items or increase quantities to send a new KOT
                          </p>
                        );
                      }
                    })()}

                    {/* Settle Button for Existing Order */}
                    <button
                      onClick={handleSettleOrder}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                    >
                      💳 Settle Payment
                    </button>
                  </div>
                )}

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedCategory?.id === category.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Items */}
                {selectedCategory ? (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">
                      {selectedCategory.name} Items
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {selectedCategory.menuItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          
                          {item.hasSizes ? (
                            <div className="mt-3 space-y-2">
                              {item.smallPrice && (
                                <button
                                  onClick={() => handleAddToCart(item, 'SMALL')}
                                  className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded border"
                                >
                                  <span className="text-sm font-medium">Small</span>
                                  <span className="text-indigo-600 font-semibold">₹{item.smallPrice}</span>
                                </button>
                              )}
                              {item.mediumPrice && (
                                <button
                                  onClick={() => handleAddToCart(item, 'MEDIUM')}
                                  className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded border"
                                >
                                  <span className="text-sm font-medium">Medium</span>
                                  <span className="text-indigo-600 font-semibold">₹{item.mediumPrice}</span>
                                </button>
                              )}
                              {item.largePrice && (
                                <button
                                  onClick={() => handleAddToCart(item, 'LARGE')}
                                  className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded border"
                                >
                                  <span className="text-sm font-medium">Large</span>
                                  <span className="text-indigo-600 font-semibold">₹{item.largePrice}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-full mt-3 flex justify-between items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                            >
                              <span>Add</span>
                              <span>₹{item.regularPrice}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Select a category to view menu items
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Section - Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="font-semibold text-gray-700 mb-3">
              {existingOrder ? '📝 Order Items' : '🛒 Cart'}
            </h3>
            
            {cart.length > 0 ? (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item, index) => {
                    const originalItem = originalCart.find(
                      orig => orig.menuItemId === item.menuItemId && orig.size === item.size
                    );
                    const isNewItem = !originalItem;
                    const quantityIncreased = originalItem && item.quantity > originalItem.quantity;
                    const isModified = isNewItem || quantityIncreased;

                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isModified ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                            {isNewItem && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-200 text-green-800 rounded font-semibold">
                                NEW
                              </span>
                            )}
                            {quantityIncreased && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded font-semibold">
                                +{item.quantity - originalItem.quantity}
                              </span>
                            )}
                          </div>
                          {item.size && <p className="text-xs text-gray-500">{item.size}</p>}
                          <p className="text-xs text-gray-600">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            className="w-6 h-6 bg-white border rounded hover:bg-gray-100 text-sm"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            className="w-6 h-6 bg-white border rounded hover:bg-gray-100 text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Discount Section */}
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2 text-sm">💳 Discount</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={discountCoupon}
                      onChange={(e) => setDiscountCoupon(e.target.value)}
                      placeholder="Coupon code"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="Amount (₹)"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Total Breakdown */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-₹{totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">CGST (2.5%):</span>
                    <span className="font-medium">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST (2.5%):</span>
                    <span className="font-medium">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold text-gray-800">Grand Total:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ₹{totals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSaveOrder('save')}
                    disabled={saving || !selectedTable}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleSaveOrder('save_kot')}
                    disabled={saving || !selectedTable}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm"
                  >
                    {saving ? '...' : 'KOT'}
                  </button>
                  <button
                    onClick={() => handleSaveOrder('bill')}
                    disabled={saving || !selectedTable}
                    className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm"
                  >
                    {saving ? '...' : 'Bill'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-500 text-sm">
                  {selectedTable ? 'Add items to cart' : 'Select a table first'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
