'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Settings() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Table form
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    tableName: ''
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Menu Item form
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    hasSizes: false,
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
    regularPrice: ''
  });

  // Coupon form
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: ''
  });

  useEffect(() => {
    fetchTables();
    fetchCategories();
    fetchMenuItems();
    fetchEmployees();
    fetchCoupons();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/cashier/tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/cashier/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/cashier/menu');
      const data = await response.json();
      const allItems = data.categories?.flatMap(cat => 
        cat.menuItems.map(item => ({ ...item, categoryName: cat.name }))
      ) || [];
      setMenuItems(allItems);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/cashier/employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/cashier/all-coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    }
  };

  // Add Table
  const handleAddTable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/cashier/add-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableForm)
      });

      if (!response.ok) throw new Error('Failed to add table');

      alert('Table added successfully!');
      setTableForm({ tableNumber: '', tableName: '' });
      fetchTables();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const response = await fetch(`/api/cashier/delete-table?id=${tableId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete table');

      alert('Table deleted successfully!');
      fetchTables();
    } catch (error) {
      alert(error.message);
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/cashier/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (!response.ok) throw new Error('Failed to add category');

      alert('Category added successfully!');
      setCategoryForm({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Menu Item
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/cashier/add-menu-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemForm)
      });

      if (!response.ok) throw new Error('Failed to add menu item');

      alert('Menu item added successfully!');
      setMenuItemForm({
        name: '',
        description: '',
        categoryId: '',
        hasSizes: false,
        smallPrice: '',
        mediumPrice: '',
        largePrice: '',
        regularPrice: ''
      });
      fetchMenuItems();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Coupon
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/cashier/add-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });

      if (!response.ok) throw new Error('Failed to add coupon');

      alert('Coupon added successfully!');
      setCouponForm({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: ''
      });
      fetchCoupons();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Coupon Status
  const handleToggleCoupon = async (couponId, isActive) => {
    try {
      const response = await fetch('/api/cashier/toggle-coupon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, isActive: !isActive })
      });

      if (!response.ok) throw new Error('Failed to update coupon');

      alert('Coupon status updated!');
      fetchCoupons();
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/cashier/delete-employee?id=${employeeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete employee');

      alert('Employee deleted successfully!');
      fetchEmployees();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['tables', 'categories', 'menu', 'coupons', 'employees'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Tab */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Table Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Table</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number *
                </label>
                <input
                  type="text"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1, 2, A1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Name (Optional)
                </label>
                <input
                  type="text"
                  value={tableForm.tableName}
                  onChange={(e) => setTableForm({ ...tableForm, tableName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Window Table"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Table'}
              </button>
            </form>
          </div>

          {/* Existing Tables */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Tables</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">Table {table.tableNumber}</p>
                    {table.tableName && (
                      <p className="text-sm text-gray-600">{table.tableName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starters, Main Course"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Category description"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Categories</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="p-3 border rounded-lg">
                  <p className="font-semibold">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Menu Item</h3>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chicken Biryani"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={menuItemForm.categoryId}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, categoryId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={menuItemForm.hasSizes}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, hasSizes: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has Multiple Sizes
                  </span>
                </label>
              </div>

              {menuItemForm.hasSizes ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Small Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={menuItemForm.smallPrice}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, smallPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Medium Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={menuItemForm.mediumPrice}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, mediumPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Large Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={menuItemForm.largePrice}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, largePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuItemForm.regularPrice}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, regularPrice: e.target.value })}
                    required={!menuItemForm.hasSizes}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Menu Item'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Menu Items</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {menuItems.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.categoryName}</p>
                    </div>
                    <div className="text-right">
                      {item.hasSizes ? (
                        <div className="text-xs">
                          {item.smallPrice && <p>S: ₹{item.smallPrice}</p>}
                          {item.mediumPrice && <p>M: ₹{item.mediumPrice}</p>}
                          {item.largePrice && <p>L: ₹{item.largePrice}</p>}
                        </div>
                      ) : (
                        <p className="font-bold">₹{item.regularPrice}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Discount Coupon</h3>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SAVE20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 20% off on all orders"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={couponForm.discountType === 'PERCENTAGE' ? '20' : '100'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Coupon'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Coupons</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{coupon.code}</p>
                      {coupon.description && (
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                      )}
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <p>
                          <strong>Discount:</strong> {coupon.discountType === 'PERCENTAGE' 
                            ? `${coupon.discountValue}%` 
                            : `₹${coupon.discountValue}`}
                        </p>
                        {coupon.minOrderValue && (
                          <p><strong>Min Order:</strong> ₹{coupon.minOrderValue}</p>
                        )}
                        {coupon.maxDiscount && (
                          <p><strong>Max Discount:</strong> ₹{coupon.maxDiscount}</p>
                        )}
                        <p>
                          <strong>Valid:</strong> {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                        </p>
                        <p><strong>Used:</strong> {coupon.usageCount} times</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Branch Employees</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
