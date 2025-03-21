import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2, 
  Mail, 
  Search, 
  Filter,
  AlertCircle, 
  CheckCircle,
  User,
  Clock,
  Shield,
  EyeOff,
  Eye
} from 'lucide-react';
import { databases, DATABASE_ID, Query } from '@/lib/appwriteClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// User types from the adminAuth service
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

// Role badge component
const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const roleBadgeStyles = {
    admin: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-green-100 text-green-800'
  };

  const roleIcon = {
    admin: <Shield size={14} className="mr-1" />,
    editor: <Edit size={14} className="mr-1" />,
    viewer: <Eye size={14} className="mr-1" />
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center w-fit ${roleBadgeStyles[role]}`}>
      {roleIcon[role]}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

// Status badge component
const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
  const statusBadgeStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };

  const statusIcon = {
    active: <CheckCircle size={14} className="mr-1" />,
    inactive: <EyeOff size={14} className="mr-1" />,
    pending: <Clock size={14} className="mr-1" />
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center w-fit ${statusBadgeStyles[status]}`}>
      {statusIcon[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Main UsersList component
const UsersList: React.FC = () => {
  const { isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for new/edit user
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    role: 'viewer' as User['role'],
    status: 'pending' as User['status'],
    password: '',
    confirmPassword: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from the database
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get users collection 
      // In a real app, this would be restricted by authentication and authorization
      const response = await databases.listDocuments(
        DATABASE_ID,
        'users', // Replace with your actual collection ID
        []
      );
      
      const formattedUsers = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        avatar: doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random`,
        status: doc.status,
        lastLogin: doc.lastLogin || '-'
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Open create user form
  const handleCreateUser = () => {
    setFormValues({
      name: '',
      email: '',
      role: 'viewer',
      status: 'pending',
      password: '',
      confirmPassword: ''
    });
    setIsCreating(true);
    setIsEditing(false);
    setEditingUser(null);
  };

  // Open edit user form
  const handleEditUser = (user: User) => {
    setFormValues({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
      confirmPassword: ''
    });
    setIsEditing(true);
    setIsCreating(false);
    setEditingUser(user);
  };

  // Submit form for create/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formValues.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formValues.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      setError('Valid email is required');
      return;
    }

    // For new users, password is required
    if (isCreating) {
      if (!formValues.password) {
        setError('Password is required');
        return;
      }

      if (formValues.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (formValues.password !== formValues.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    // If editing and password is provided, validate it
    if (isEditing && formValues.password) {
      if (formValues.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (formValues.password !== formValues.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    try {
      if (isCreating) {
        // Create new user
        await databases.createDocument(
          DATABASE_ID,
          'users', // Replace with your actual collection ID
          'unique()', // Generate unique ID
          {
            name: formValues.name,
            email: formValues.email,
            role: formValues.role,
            status: formValues.status,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formValues.name)}&background=random`,
            // In a real implementation, you'd hash the password server-side
            // This is just a demo - NEVER store plain text passwords
            password: formValues.password, 
            createdAt: new Date().toISOString()
          }
        );
        
        setSuccess('User created successfully');
      } else if (isEditing && editingUser) {
        // Update existing user
        const updateData: Record<string, any> = {
          name: formValues.name,
          email: formValues.email,
          role: formValues.role,
          status: formValues.status,
          updatedAt: new Date().toISOString()
        };
        
        // Only include password if it was changed
        if (formValues.password) {
          updateData.password = formValues.password; // In real app, hash this
        }
        
        await databases.updateDocument(
          DATABASE_ID,
          'users', // Replace with your actual collection ID
          editingUser.id,
          updateData
        );
        
        setSuccess('User updated successfully');
      }
      
      // Refresh user list
      fetchUsers();
      
      // Close forms
      setIsCreating(false);
      setIsEditing(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user. Please try again.');
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        'users', // Replace with your actual collection ID
        userId
      );
      
      // Refresh user list
      fetchUsers();
      setSuccess('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    }
  };

  // Cancel form
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingUser(null);
    setError(null);
  };

  // Change user status
  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    setError(null);
    
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'users', // Replace with your actual collection ID
        userId,
        {
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      );
      
      // Refresh user list
      fetchUsers();
      setSuccess(`User status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={handleCreateUser}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add New User
          </button>
        )}
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="ml-2 text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start">
          <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="ml-2 text-green-700">{success}</p>
        </div>
      )}
      
      {/* Create/Edit User Form */}
      {(isCreating || isEditing) && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? 'Create New User' : 'Edit User'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formValues.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  {isAdmin && <option value="admin">Administrator</option>}
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formValues.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {isCreating ? 'Password' : 'New Password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formValues.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isCreating ? 'Enter password' : 'Leave blank to keep current password'}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formValues.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isCreating ? 'Create User' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="md:w-1/5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="md:w-1/5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={user.avatar} 
                              alt={`${user.name}'s avatar`} 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={20} className="text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {isAdmin && (
                          <>
                            {user.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="text-green-600 hover:text-green-900"
                                title="Activate user"
                                aria-label="Activate user"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                            
                            {user.status !== 'inactive' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(user.id, 'inactive')}
                                className="text-orange-600 hover:text-orange-900"
                                title="Deactivate user"
                                aria-label="Deactivate user"
                              >
                                <UserX size={18} />
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit user"
                              aria-label="Edit user"
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                              aria-label="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        
                        <a
                          href={`mailto:${user.email}`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Email user"
                          aria-label="Email user"
                        >
                          <Mail size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;