import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import {
  Phone,
  MessageSquare,
  FileText,
  User,
  Bell,
  Settings,
  LogOut,
  Camera,
  Trash,
  Archive,
  Download,
  ExternalLink,
  Inbox,
  FileCheck,
  Clock,
  AlertCircle,
  ChevronLeft,
  Calculator,
  PoundSterling,
  Wallet,
  CreditCard,
  Send,
  Clock4,
  Upload,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [studyLevel, setStudyLevel] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [module, setModule] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.createRef<HTMLInputElement>();

  const [showTurnitinModal, setShowTurnitinModal] = useState(false);
  const [turnitinFile, setTurnitinFile] = useState<File | null>(null);
  const [turnitinResult, setTurnitinResult] = useState<any>(null);
  const [isCheckingTurnitin, setIsCheckingTurnitin] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const turnitinFileInputRef = React.createRef<HTMLInputElement>(null);

  const supportAreas = [
    { id: 'adult', title: 'Adult Health Nursing', icon: '👨‍⚕️' },
    { id: 'mental', title: 'Mental Health Nursing', icon: '🧠' },
    { id: 'child', title: 'Child Nursing', icon: '👶' },
    { id: 'disability', title: 'Disability Nursing', icon: '♿' },
    { id: 'social', title: 'Social Work', icon: '🤝' },
    { id: 'special', title: 'Special Education Needs', icon: '📚' }
  ];

  const services = [
    { id: 'dissertation', title: 'Dissertation', icon: '📑', desc: 'Expert dissertation writing support' },
    { id: 'essays', title: 'Essays', icon: '✍️', desc: 'Professional essay writing' },
    { id: 'reflection', title: 'Placement Reflections', icon: '📝', desc: 'Clinical reflection writing' },
    { id: 'reports', title: 'Reports', icon: '📊', desc: 'Detailed academic reports' },
    { id: 'portfolio', title: 'E-Portfolio', icon: '💼', desc: 'Portfolio development' }
  ];

  const mockOrders = [
    {
      id: '1',
      title: 'Adult Health Essay',
      status: 'in-progress',
      dueDate: '2024-03-15',
      wordCount: 2750,
      price: 150.00,
      service: 'essays',
      area: 'adult'
    },
    {
      id: '2',
      title: 'Mental Health Dissertation',
      status: 'completed',
      dueDate: '2024-02-28',
      wordCount: 12000,
      price: 785.45,
      service: 'dissertation',
      area: 'mental'
    }
  ];

  const calculatePrice = (words: number, service: string, level: string, date: string) => {
    if (words < 100 || words > 100000) {
      return null;
    }

    const daysUntilDue = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const useHigherRate = 
      service === 'dissertation' || 
      level === 'Level 7' || 
      daysUntilDue < 2;

    const baseRate = useHigherRate ? 18 : 15;
    return (words / 275) * baseRate;
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data: userRole } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(userRole?.role === 'admin');
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (wordCount && studyLevel && dueDate && selectedService) {
      const price = calculatePrice(wordCount, selectedService.id, studyLevel, dueDate);
      setCalculatedPrice(price);
    }
  }, [wordCount, studyLevel, dueDate, selectedService]);

  const handleQuickCall = () => {
    window.open('https://join.skype.com/invite/IZLQkPuieqX2');
  };

  const handleQuickMessage = () => {
    window.open('https://wa.me/254711264993?text=Hi,%20I%20need%20help%20with%20my%20assignment');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentOptions(true);
  };

  const handleCryptoPayment = async () => {
    try {
      if (!calculatedPrice) {
        alert('Please complete the order form first');
        return;
      }

      const response = await fetch('/api/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: calculatedPrice,
          currency: 'USD',
          email: user?.primaryEmailAddress?.emailAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const { hosted_url, id } = await response.json();
      
      // Store the charge ID for later verification
      localStorage.setItem('currentChargeId', id);
      
      // Open Coinbase Commerce checkout in a new window
      const checkoutWindow = window.open(hosted_url, '_blank');
      
      // Listen for payment status changes
      const checkPaymentStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/check-charge/${id}`);
          const { status } = await statusResponse.json();
          
          if (status === 'COMPLETED') {
            setShowPaymentOptions(false);
            alert('Payment successful!');
            checkoutWindow?.close();
            // Clear the stored charge ID
            localStorage.removeItem('currentChargeId');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      };

      // Check payment status every 5 seconds
      const statusInterval = setInterval(checkPaymentStatus, 5000);

      // Clear interval when window closes
      const handleWindowClose = () => {
        clearInterval(statusInterval);
        localStorage.removeItem('currentChargeId');
      };

      window.addEventListener('unload', handleWindowClose);
      return () => {
        window.removeEventListener('unload', handleWindowClose);
        clearInterval(statusInterval);
      };
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handlePayPalPayment = () => {
    window.open('https://www.paypal.com/ncp/payment/QGYH6P5XKGFPE', '_blank');
    setShowPaymentOptions(false);
  };

  const handleRemittancePayment = () => {
    window.open('https://wa.me/254711264993?text=I want to pay with Taptapsend, World Remit, or Skrill', '_blank');
    setShowPaymentOptions(false);
  };

  const handlePayLater = () => {
    alert('Your order has been saved. You can pay later from your dashboard.');
    setShowPaymentOptions(false);
    setActiveTab('orders');
    setSelectedService(null);
    setSelectedArea(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      setFiles(Array.from(files));
      alert('Files uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTurnitinFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    setTurnitinFile(file);
    setTurnitinResult(null);
  };

  const handleTurnitinCheck = async () => {
    if (!turnitinFile) {
      alert('Please select a file first');
      return;
    }

    setIsCheckingTurnitin(true);
    let checkoutWindow: Window | null = null;
    let statusInterval: NodeJS.Timeout;

    try {
      // First, create a payment intent
      const paymentResponse = await fetch('/api/create-turnitin-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 5, // £5 fixed price
          currency: 'GBP',
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.message || 'Failed to create payment');
      }

      const { hosted_url, id: chargeId } = await paymentResponse.json();
      
      // Open Coinbase Commerce checkout
      checkoutWindow = window.open(hosted_url, '_blank');
      
      // Start payment timer
      const startTime = Date.now();
      const PAYMENT_TIMEOUT = 15 * 60 * 1000; // 15 minutes
      
      // Poll for payment status
      const checkPaymentStatus = async () => {
        try {
          // Check if payment window is closed
          if (checkoutWindow?.closed) {
            clearInterval(statusInterval);
            setIsCheckingTurnitin(false);
            return;
          }

          // Check if payment has timed out
          if (Date.now() - startTime > PAYMENT_TIMEOUT) {
            clearInterval(statusInterval);
            checkoutWindow?.close();
            setIsCheckingTurnitin(false);
            alert('Payment timeout. Please try again.');
            return;
          }

          const statusResponse = await fetch(`/api/check-charge/${chargeId}`);
          if (!statusResponse.ok) {
            const error = await statusResponse.json();
            throw new Error(error.message || 'Failed to check payment status');
          }

          const { status, charge } = await statusResponse.json();
          
          if (status === 'COMPLETED') {
            clearInterval(statusInterval);
            
            // Show processing message
            setProcessingMessage('Processing document...');
            
            // Payment successful, now send document for Turnitin check
            const formData = new FormData();
            formData.append('file', turnitinFile);
            formData.append('chargeId', chargeId);

            const response = await fetch('/api/check-turnitin', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to check Turnitin');
            }

            const result = await response.json();
            setTurnitinResult(result);
            checkoutWindow?.close();
            setProcessingMessage('');
            
            // Show success message
            alert(`Document processed successfully!\nSimilarity score: ${result.similarity}%`);
          } else if (status === 'FAILED') {
            clearInterval(statusInterval);
            checkoutWindow?.close();
            throw new Error('Payment failed. Please try again.');
          }
        } catch (error) {
          clearInterval(statusInterval);
          checkoutWindow?.close();
          console.error('Error checking payment status:', error);
          alert(error instanceof Error ? error.message : 'Failed to process payment');
          setIsCheckingTurnitin(false);
          setProcessingMessage('');
        }
      };

      // Check payment status every 5 seconds
      statusInterval = setInterval(checkPaymentStatus, 5000);

      // Clean up on unmount
      return () => {
        clearInterval(statusInterval);
        checkoutWindow?.close();
      };
    } catch (error) {
      console.error('Turnitin check error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process Turnitin check');
      checkoutWindow?.close();
    } finally {
      setIsCheckingTurnitin(false);
      setProcessingMessage('');
    }
  };

  const handleLogout = async () => {
    if (!user || isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await clerk.signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'No email available';
  const userName = user?.fullName || user?.username || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b fixed w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                H
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                HandyWriterz
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <span className="font-medium hidden sm:inline">
                  {userName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  isLoggingOut 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 bg-white w-64 border-r z-30">
        <div className="h-16 border-b flex items-center justify-center">
          <span className="font-medium">Dashboard</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg ${
              activeTab === 'orders' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Active Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg ${
              activeTab === 'completed' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileCheck className="h-5 w-5" />
            <span>Completed Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg ${
              activeTab === 'messages' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg ${
              activeTab === 'settings' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 p-2 rounded-lg mt-4 ${
              isLoggingOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="h-5 w-5" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="pt-16 lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back{user ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-gray-600">
              Get expert help with your academic work. Choose a subject area to get started.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleQuickCall}
              className="p-6 bg-green-600 text-white rounded-xl hover:opacity-90 transition-all"
            >
              <Phone className="h-6 w-6 mb-2" />
              <h3 className="font-semibold mb-1">Quick Call</h3>
              <p className="text-sm opacity-90">Get instant help via Skype</p>
            </button>

            <button
              onClick={handleQuickMessage}
              className="p-6 bg-[#25D366] text-white rounded-xl hover:opacity-90 transition-all"
            >
              <MessageSquare className="h-6 w-6 mb-2" />
              <h3 className="font-semibold mb-1">Quick Message</h3>
              <p className="text-sm opacity-90">Chat with us on WhatsApp</p>
            </button>
          </div>

          {/* Active Orders Tab */}
          {activeTab === 'orders' && !selectedArea && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Active Orders</h2>
                <button 
                  onClick={() => setSelectedArea('adult')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  New Order
                </button>
              </div>
              {mockOrders
                .filter(order => order.status === 'in-progress')
                .map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.title}</h3>
                        <p className="text-gray-600">
                          {order.wordCount.toLocaleString()} words • Due {new Date(order.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                        In Progress
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        £{order.price.toFixed(2)}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View Details
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Support Areas Selection */}
          {activeTab === 'orders' && !selectedService && selectedArea && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={() => setSelectedArea(null)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back
                </button>
                <h2 className="text-xl font-bold">Select Service Type</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="p-6 rounded-xl border hover:border-blue-600 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <h3 className="font-medium">{service.title}</h3>
                        <p className="text-sm text-gray-600">{service.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Form */}
          {activeTab === 'orders' && selectedService && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={() => setSelectedService(null)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back
                </button>
                <h2 className="text-xl font-bold">Order Details</h2>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Word Count</label>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setWordCount(value);
                      if (value < 100 || value > 100000) {
                        e.target.setCustomValidity('Word count must be between 100 and 100,000');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                    className="w-full p-3 border rounded-lg pr-24"
                    placeholder="Enter word count"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                    className="absolute right-2 top-2 p-1 text-blue-600 hover:text-blue-700"
                    title="Show price calculation"
                  >
                    <Calculator className="h-5 w-5" />
                  </button>
                </div>
                {calculatedPrice !== null && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Estimated Price: </span>
                    <span className="text-blue-600">£{calculatedPrice.toFixed(2)}</span>
                  </div>
                )}
                {showPriceBreakdown && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm">
                    <h4 className="font-medium mb-2">Price Calculation</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• £18/275 words for dissertations</li>
                      <li>• £18/275 words for Level 7 work</li>
                      <li>• £18/275 words for urgent orders (&lt; 2 days)</li>
                      <li>• £15/275 words for all other cases</li>
                    </ul>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Module</label>
                  <input
                    type="text"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter module name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Study Level</label>
                  <select
                    value={studyLevel}
                    onChange={(e) => setStudyLevel(e.target.value)}
                    required
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select level</option>
                    <option value="Level 4">Level 4 (Year 1)</option>
                    <option value="Level 5">Level 5 (Year 2)</option>
                    <option value="Level 6">Level 6 (Year 3)</option>
                    <option value="Level 7">Level 7 (Masters)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4}
                    className="w-full p-3 border rounded-lg resize-none"
                    placeholder="Enter your specific requirements..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Files</label>
                  <div className="mt-1 flex items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                      disabled={uploading}
                    >
                      <Upload className="h-5 w-5" />
                      {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                    {files.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {files.length} file(s) uploaded
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PoundSterling className="h-4 w-4" />
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Options Modal */}
          {showPaymentOptions && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-6">Choose Payment Method</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={handleCryptoPayment}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <span className="font-medium">Pay with Crypto</span>
                      <p className="text-sm text-gray-600">Bitcoin, Ethereum, USDC accepted</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={handlePayPalPayment}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <span className="font-medium">Pay with PayPal</span>
                      <p className="text-sm text-gray-600">Credit/Debit Cards accepted</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleRemittancePayment}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Send className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <span className="font-medium">Pay with Money Transfer</span>
                      <p className="text-sm text-gray-600">Taptapsend, World Remit, Skrill</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={handlePayLater}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Clock4 className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <span className="font-medium">Pay Later</span>
                      <p className="text-sm text-gray-600">Save order and pay when ready</p>
                    </div>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowPaymentOptions(false)}
                  className="mt-4 w-full p-3 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Completed Orders Tab */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6">Completed Orders</h2>
              {mockOrders
                .filter(order => order.status === 'completed')
                .map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.title}</h3>
                        <p className="text-gray-600">
                          {order.wordCount.toLocaleString()} words • Completed {new Date(order.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                        Completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        £{order.price.toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-bold">Messages</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No messages yet</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Picture</h3>
                    <p className="text-sm text-gray-500">Upload a new photo or choose an avatar</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-lg"
                    placeholder="your@email.com"
                    value={userEmail}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
                  <div className="flex gap-2">
                    <select className="w-24 p-3 border rounded-lg">
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+91">+91</option>
                    </select>
                    <input
                      type="tel"
                      className="flex-1 p-3 border rounded-lg"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        // logout();
                      }
                    }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                    <span>Delete Account</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700">
                    <Archive className="h-4 w-4" />
                    <span>Archive Profile</span>
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {showTurnitinModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Check Turnitin</h2>
                  <button
                    onClick={() => {
                      setTurnitinFile(null);
                      setTurnitinResult(null);
                      setShowTurnitinModal(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {!turnitinResult ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Upload your document to check for plagiarism.
                      <br />
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                    
                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={turnitinFileInputRef}
                        onChange={handleTurnitinFileSelect}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        id="turnitinFileInput"
                      />
                      
                      <div 
                        onClick={() => turnitinFileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to select a file
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Maximum file size: 10MB
                        </p>
                      </div>

                      {turnitinFile && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {turnitinFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Size: {(turnitinFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              onClick={() => setTurnitinFile(null)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {processingMessage && (
                        <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg">
                          <div className="inline-flex items-center">
                            <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                            <p className="text-sm text-blue-600">{processingMessage}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setTurnitinFile(null);
                            setShowTurnitinModal(false);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTurnitinCheck}
                          disabled={!turnitinFile || isCheckingTurnitin}
                          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                            !turnitinFile || isCheckingTurnitin
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isCheckingTurnitin ? (
                            <div className="inline-flex items-center">
                              <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                              Processing...
                            </div>
                          ) : (
                            'Check Turnitin (£5)'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Results</h3>
                    <p className={`text-${turnitinResult.similarity > 20 ? 'red' : 'green'}-600 font-medium`}>
                      Similarity Score: {turnitinResult.similarity}%
                    </p>
                    {turnitinResult.matches.map((match: any, index: number) => (
                      <div key={index} className="mt-2">
                        <p className="text-sm font-medium">
                          Source: {match.source}
                        </p>
                        <p className="text-sm text-gray-500">
                          Match: {match.percentage}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

