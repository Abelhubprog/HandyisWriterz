import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiUserX, FiChevronLeft } from 'react-icons/fi';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Emma Rodriguez',
  email: 'emma.rodriguez@example.com',
  role: 'Admin',
  status: 'active',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  bio: 'Healthcare professional with over 10 years of experience in pediatric nursing. Passionate about sharing knowledge and improving healthcare education.',
  createdAt: '2023-01-15T10:30:00.000Z',
};

interface UserFormData {
  name: string;
  email: string;
  role: string;
  status: string;
  bio: string;
  password?: string;
  confirmPassword?: string;
}

const UserEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewUser = id === 'new';
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'Author',
    status: 'active',
    bio: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!isNewUser && id) {
      // In a real application, we would fetch the user data from an API
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setFormData({
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          status: mockUser.status,
          bio: mockUser.bio,
          password: '',
          confirmPassword: '',
        });
        setLoading(false);
      }, 500);
    }
  }, [id, isNewUser]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (isNewUser || formData.password) {
      if (isNewUser && !formData.password) {
        newErrors.password = 'Password is required for new users';
      } else if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    // In a real application, we would send the data to an API
    setTimeout(() => {
      setSaving(false);
      navigate('/admin/users');
    }, 1000);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="mr-4 text-gray-500 hover:text-gray-700"
            title="Back to Users"
            aria-label="Back to Users"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isNewUser ? 'Create New User' : `Edit User: ${formData.name}`}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isNewUser ? 'Add a new user to the system' : 'Update user information and permissions'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiX className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            <FiSave className="-ml-1 mr-2 h-5 w-5" />
            {saving ? 'Saving...' : 'Save User'}
          </button>
          {!isNewUser && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiUserX className="-ml-1 mr-2 h-5 w-5" />
              Deactivate
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <form id="user-form" onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 pb-4 border-b border-gray-200 mb-4">User Information</h3>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Author">Author</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              <p className="mt-2 text-sm text-gray-500">Brief description of the user's background and expertise.</p>
            </div>
            
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 pb-4 border-b border-gray-200 mb-4">
                {isNewUser ? 'Set Password' : 'Change Password'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {isNewUser
                  ? 'Set an initial password for this user. They can change it later.'
                  : 'Leave blank to keep the current password.'}
              </p>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {isNewUser ? 'Password *' : 'New Password'}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.password ? 'border-red-300' : ''
                  }`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {isNewUser ? 'Confirm Password *' : 'Confirm New Password'}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.confirmPassword ? 'border-red-300' : ''
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditor; 