import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiUserPlus, FiMail, FiUserCheck, FiUserX } from 'react-icons/fi';

// Mock user data
const mockUsers = [
  { 
    id: '1', 
    name: 'Emma Rodriguez', 
    email: 'emma.rodriguez@example.com', 
    role: 'Admin', 
    status: 'active',
    lastLogin: '2023-06-10T14:32:00.000Z',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  { 
    id: '2', 
    name: 'David Thompson', 
    email: 'david.thompson@example.com', 
    role: 'Editor', 
    status: 'active',
    lastLogin: '2023-06-09T10:15:00.000Z',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  { 
    id: '3', 
    name: 'Sarah Johnson', 
    email: 'sarah.johnson@example.com', 
    role: 'Author', 
    status: 'active',
    lastLogin: '2023-06-08T16:45:00.000Z',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  { 
    id: '4', 
    name: 'Michael Chen', 
    email: 'michael.chen@example.com', 
    role: 'Author', 
    status: 'inactive',
    lastLogin: '2023-05-20T09:22:00.000Z',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
  },
  { 
    id: '5', 
    name: 'Lisa Brown', 
    email: 'lisa.brown@example.com', 
    role: 'Editor', 
    status: 'pending',
    lastLogin: null,
    avatar: 'https://randomuser.me/api/portraits/women/91.jpg'
  }
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string | null;
  avatar?: string;
}

const UsersList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/users/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiUserPlus className="-ml-1 mr-2 h-5 w-5" />
            Add User
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <div className="max-w-md w-full">
            <label htmlFor="search" className="sr-only">
              Search users
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                name="search"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search by name, email or role"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>
        
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
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            <a href={`mailto:${user.email}`} className="flex items-center">
                              <FiMail className="mr-1 h-3 w-3" />
                              {user.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {user.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            aria-label="Activate user"
                            title="Activate user"
                          >
                            <FiUserCheck className="h-5 w-5" />
                          </button>
                        )}
                        {user.status !== 'inactive' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                            className="text-red-600 hover:text-red-900"
                            aria-label="Deactivate user"
                            title="Deactivate user"
                          >
                            <FiUserX className="h-5 w-5" />
                          </button>
                        )}
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
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