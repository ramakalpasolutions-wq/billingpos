'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function StaffManagement() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [staffByBranch, setStaffByBranch] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (session) {
      fetchStaff();
    }
  }, [session, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/chairman/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch
      });
      
      const response = await fetch(`/api/chairman/staff?${params}`);
      const data = await response.json();
      
      setStaff(data.staff || []);
      setStaffByBranch(data.staffByBranch || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = selectedRole === 'all' 
    ? staff 
    : staff.filter(s => s.role === selectedRole);

  const getRoleBadgeColor = (role) => {
    const colors = {
      CASHIER: 'bg-blue-100 text-blue-800',
      WAITER: 'bg-green-100 text-green-800',
      KITCHEN: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="CASHIER">Cashier</option>
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN">Kitchen</option>
          </select>
        </div>
      </div>

      {/* Staff by Branch Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Staff by Branch & Category</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading staff data...</div>
          ) : staffByBranch.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No staff data found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Branch Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Cashiers
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Waiters
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Kitchen Staff
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Total Staff
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffByBranch.map((branch) => (
                  <tr key={branch.branchId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.branchName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {branch.cashiers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {branch.waiters}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {branch.kitchen}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                      {branch.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* All Staff Members List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">All Staff Members</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No staff members found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned Hours
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {member.photo && (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.branch?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.assignedHours || 'Not set'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
