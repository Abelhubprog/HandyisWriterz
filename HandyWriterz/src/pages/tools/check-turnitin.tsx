import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, Upload, AlertCircle, CheckCircle, Loader2, X, Moon, Sun, 
  ArrowRight, CreditCard, Mail, ArrowDown, Shield, BarChart, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast'; // If you have toast library, or use a simple alert

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define interfaces
interface UploadStep {
  id: number;
  title: string;
  completed: boolean;
  current: boolean;
}

interface Receipt {
  id: string;
  documentName: string;
  documentSize: string;
  timeSent: string;
  timeReceived: string;
  service: string;
  status: string;
  paymentAmount: string;
  estimatedDelivery: string;
  deliveryMethod: string;
  email: string;
}

const TurnitinCheck: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [price, setPrice] = useState('5.00');

  // Define the upload steps with added email step
  const [steps, setSteps] = useState<UploadStep[]>([
    { id: 1, title: 'Enter Email', completed: false, current: true },
    { id: 2, title: 'Upload Document', completed: false, current: false },
    { id: 3, title: 'Confirm Details', completed: false, current: false },
    { id: 4, title: 'Submit & Pay', completed: false, current: false },
    { id: 5, title: 'Receipt', completed: false, current: false },
  ]);

  // Handle dark mode toggle with improved persistence
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle email submission
  const handleEmailSubmit = () => {
    if (!email) {
      setEmailError('Email address is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError(null);
    updateStepStatus(1, true);
    goToNextStep();
  };

  // Handle file drop with improved validation
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // File size validation (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB');
        return;
      }
      
      // File type validation
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, DOC, DOCX, and TXT files are supported');
        return;
      }
      
      setFile(file);
      setError(null);
      
      // Mark current step as completed
      updateStepStatus(2, true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  // Update step status
  const updateStepStatus = (stepId: number, completed: boolean) => {
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          return { ...step, completed };
        }
        return step;
      })
    );
  };

  // Progress to next step with animation
  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setSteps(prevSteps =>
        prevSteps.map(step => {
          if (step.id === currentStep) {
            return { ...step, current: false, completed: true };
          } else if (step.id === currentStep + 1) {
            return { ...step, current: true };
          }
          return step;
        })
      );
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  // Format file size with improved readability
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Generate a receipt ID with better uniqueness
  const generateReceiptId = (): string => {
    return 'TRN-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  // Handle file upload to Supabase with secure email handling
  const uploadToSupabase = async () => {
    if (!file || !email) return false;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Maximum number of retries
      const maxRetries = 3;
      let retries = 0;
      let success = false;
      
      while (retries < maxRetries && !success) {
        try {
          // Check if Supabase client is initialized properly
          if (!supabase) {
            throw new Error("Supabase client is not initialized correctly");
          }

          // Verify we have access to storage
          const { data: bucketData, error: bucketError } = await supabase.storage
            .getBucket('turnitin-documents')
            .catch(err => {
              console.error('Error checking bucket:', err);
              return { data: null, error: err };
            });
            
          if (bucketError) {
            console.warn('Bucket check failed, but proceeding with upload attempt:', bucketError.message);
          }
          
          // Upload file to Supabase Storage with progress tracking
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from('turnitin-documents')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
          }
          
          // Get the public URL for the file
          const filePath = data?.path || fileName;
          const fileUrl = supabase.storage
            .from('turnitin-documents')
            .getPublicUrl(filePath).data.publicUrl;
            
          // Store metadata in Supabase table including user email
          const metaData = {
            filename: file.name,
            filesize: file.size,
            filetype: file.type,
            upload_path: filePath,
            file_url: fileUrl,
            status: 'pending',
            created_at: new Date().toISOString(),
            user_email: email
          };
          
          const { data: insertData, error: insertError } = await supabase
            .from('document_uploads')
            .insert(metaData)
            .select();
          
          if (insertError) {
            console.error('Database insert error:', insertError);
            throw insertError;
          }
          
          // Verify data was inserted
          if (!insertData || insertData.length === 0) {
            throw new Error('Document metadata was not saved properly');
          }
          
          const uploadId = insertData[0]?.id;
          
          // Alternative approach if serverless function fails
          let emailSent = false;
          
          try {
            // Try to use serverless function first
            const { error: functionError } = await supabase.functions
              .invoke('send-turnitin-document', {
                body: { 
                  uploadId,
                  fileName: file.name,
                  userEmail: email,
                  fileUrl
                }
              });
            
            if (functionError) {
              console.error('Serverless function error:', functionError);
              throw functionError;
            }
            
            emailSent = true;
          } catch (functionErr) {
            console.error('Failed to send via serverless function:', functionErr);
            
            // If serverless function fails, try using a direct API call to your backend
            try {
              // This assumes you have an alternative API endpoint for sending the file
              const response = await fetch('/api/send-document', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  uploadId,
                  fileName: file.name,
                  userEmail: email,
                  fileUrl
                })
              });
              
              if (!response.ok) {
                throw new Error(`API response was not ok: ${response.status}`);
              }
              
              emailSent = true;
            } catch (apiErr) {
              console.error('Failed to send via API:', apiErr);
              throw new Error('Could not process document submission through available methods');
            }
          }
          
          if (!emailSent) {
            throw new Error('Failed to dispatch document for processing');
          }
          
          // Set upload ID for receipt
          setUploadId(uploadId);
          setUploadSuccess(true);
          success = true;
          return true;
          
        } catch (err: any) {
          console.error('Upload attempt error:', err);
          retries++;
          
          if (retries < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            console.log(`Retrying upload, attempt ${retries + 1} of ${maxRetries}`);
          } else {
            // All retries failed
            setError('An error occurred while uploading your document. Please check your internet connection and try again.');
            setUploadSuccess(false);
            return false;
          }
        }
      }
      
      // If we exit the while loop with success = false, all retries failed
      if (!success) {
        setError('Upload failed after multiple attempts. Please try again later.');
        return false;
      }
      
      return success;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document submission with improved feedback
  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to check');
      return;
    }

    try {
      const uploadSuccess = await uploadToSupabase();
      
      if (uploadSuccess) {
        // Create receipt
        const now = new Date();
        const receiptData: Receipt = {
          id: generateReceiptId(),
          documentName: file.name,
          documentSize: formatFileSize(file.size),
          timeSent: now.toLocaleTimeString(),
          timeReceived: now.toLocaleTimeString(),
          service: 'Check Turnitin',
          status: 'Generating AI and plagiarism reports...',
          paymentAmount: '£5',
          estimatedDelivery: '2-15 minutes',
          deliveryMethod: 'Email',
          email: email
        };
        
        setReceipt(receiptData);
        goToNextStep(); // Move to payment step
        
        // Notify the user of success
        toast?.success('Document uploaded successfully!') || 
          alert('Document uploaded successfully!');
      } else {
        // Show a more user-friendly error
        toast?.error('Upload failed. Please try again.') || 
          alert('Upload failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(`Submission error: ${err.message || 'Unknown error'}`);
      
      toast?.error('There was an error submitting your document.') || 
        alert('There was an error submitting your document.');
    }
  };

  // Handle payment selection with improved visual feedback
  const handlePaymentSelect = (method: string) => {
    setPaymentMethod(method);
    // Simulate payment processing
    setTimeout(() => {
      finalizePayment();
    }, 1500);
  };

  const finalizePayment = () => {
    setIsPaid(true);
    updateStepStatus(currentStep, true);
    goToNextStep();
    generateReceipt();
  };

  // Replace PayPal specific handlers with generic ones
  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
    finalizePayment();
    }, 2000);
  };

  // Enhanced step content rendering with animations
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Email Entry
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                Why we need your email
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Your email address is required to send you the plagiarism report once it's ready.
                We'll also use it to notify you about the status of your document check.
              </p>
              <div className="flex items-start mt-4 space-x-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We respect your privacy and will never share your email with third parties.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  className={`block w-full pl-10 pr-4 py-3 border ${
                    emailError 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors dark:bg-gray-800 dark:text-white`}
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              {emailError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </motion.div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEmailSubmit}
              className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
            >
              Continue to Upload
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
              <span>100% secure and confidential</span>
            </div>
          </motion.div>
        );
      
      case 2: // Upload Document
        return (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl flex items-center gap-3 flex-1">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Report will be sent to:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                </div>
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Change
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl flex items-center gap-3 flex-1">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated delivery time:</p>
                  <p className="font-medium text-gray-900 dark:text-white">2-15 minutes</p>
                </div>
              </div>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 scale-[1.02] shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500'
              } dark:text-white`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={`rounded-full p-4 ${
                  isDragActive 
                    ? 'bg-blue-100 dark:bg-blue-800/30' 
                    : 'bg-gray-100 dark:bg-gray-800/50'
                }`}>
                  <Upload className={`w-10 h-10 ${
                    isDragActive ? 'text-blue-500 dark:text-blue-400 animate-bounce' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </div>
                
                {isDragActive ? (
                  <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">Drop your file here</p>
                ) : (
                  <>
                    <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">Drag & drop your document here</p>
                    <p className="text-gray-600 dark:text-gray-400">or</p>
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transform hover:-translate-y-1">
                      Select Document
                    </button>
                  </>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 20MB)
                </p>
              </div>
            </div>

            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-3 p-5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800"
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium dark:text-white truncate">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex justify-between items-center pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={goToNextStep}
                disabled={!file}
                className={`py-2.5 px-6 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  !file
                    ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-md hover:shadow-lg'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        );
      
      case 3: // Confirm Details
        if (!file) return null;
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex-1">
                <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  Document Details
                </h3>
                <div className="space-y-3 divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">File Name:</span>
                    <span className="font-medium dark:text-white">{file.name}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">File Size:</span>
                    <span className="font-medium dark:text-white">{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">File Type:</span>
                    <span className="font-medium dark:text-white">{file.type.split('/')[1].toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">Email Address:</span>
                    <span className="font-medium dark:text-white">{email}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex-1">
                <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  Service Details
                </h3>
                <div className="space-y-3 divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">Service:</span>
                    <span className="font-medium dark:text-white">Turnitin Plagiarism Check</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">Cost:</span>
                    <span className="font-medium text-green-600 dark:text-green-500">£5</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">Delivery Time:</span>
                    <span className="font-medium dark:text-white">2-15 minutes</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-300">Delivery Method:</span>
                    <span className="font-medium dark:text-white">Email</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Document Analysis Process
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your document will be thoroughly analyzed for plagiarism using our advanced AI tools and Turnitin's comprehensive database of academic content, websites, and publications.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isUploading}
                className={`py-2.5 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  isUploading
                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-md hover:shadow-lg'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading... Please wait</span>
                  </>
                ) : (
                  <>
                    Submit Document
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Upload Error</p>
                  <p>{error}</p>
                  <button 
                    onClick={() => setError(null)} 
                    className="text-sm underline hover:text-red-800 dark:hover:text-red-300 mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 4: // Payment
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Payment Details</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your document has been uploaded successfully. Plagiarism reports will be generated after payment is completed.
              </p>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm mb-4 border border-yellow-200 dark:border-yellow-900">
                <p>Your report will be sent to your email address once payment is confirmed.</p>
              </div>
              <div className="font-bold text-3xl mb-6 text-center dark:text-white">
                <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">£5.00</span>
              </div>
              
              <div className="mt-6 space-y-4">
                <button
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    paymentMethod === 'card' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handlePaymentSelect('card')}
                >
                  <CreditCard size={18} />
                  Credit/Debit Card
                </button>
                
                <button
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    paymentMethod === 'bank' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handlePaymentSelect('bank')}
                >
                  <Mail size={18} />
                  Bank Transfer
                </button>
                
                {paymentMethod && (
                  <button
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay £{price}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
                  </div>
              </div>
          </motion.div>
        );

      case 5: // Receipt
        if (!receipt) return null;
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-green-500 dark:border-green-600 shadow-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Receipt</h3>
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="text-gray-600 dark:text-gray-400">Receipt ID:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.id}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Document:</div>
                  <div className="font-medium text-right dark:text-white truncate max-w-[200px]">{receipt.documentName}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Size:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.documentSize}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Uploaded:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.timeSent}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Service:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.service}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Status:</div>
                  <div className="font-medium text-right text-amber-600 dark:text-amber-500 flex items-center justify-end gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {receipt.status}
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Expected Delivery:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.estimatedDelivery}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Delivery Method:</div>
                  <div className="font-medium text-right dark:text-white">{receipt.deliveryMethod}</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-blue-300 dark:border-blue-700 shadow-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Receipt</h3>
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-gray-600 dark:text-gray-400">Amount Paid:</div>
                  <div className="font-bold text-right text-green-600 dark:text-green-500">{receipt.paymentAmount}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Payment Method:</div>
                  <div className="font-medium text-right dark:text-white">
                    {paymentMethod === 'card' ? 'Credit/Debit Card' : 
                     paymentMethod === 'bank' ? 'Bank Transfer' : 'N/A'}
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Transaction ID:</div>
                  <div className="font-medium text-right dark:text-white">TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Date:</div>
                  <div className="font-medium text-right dark:text-white">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </motion.div>
            
            <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
              <p>Thank you for your submission. The Turnitin report will be delivered to your email shortly.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setFile(null);
                  setReceipt(null);
                  setPaymentMethod(null);
                  setSteps(steps.map(step => ({...step, completed: false, current: step.id === 1})));
                }}
                className="py-2 px-4 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Submit Another Document
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // DEV-only debugging tool - remove in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Supabase configuration:', {
        url: supabaseUrl,
        keyAvailable: !!supabaseKey,
        clientInitialized: !!supabase
      });
      
      // Test the connection
      const testConnection = async () => {
        try {
          const { data, error } = await supabase.from('document_uploads').select('count', { count: 'exact' }).limit(0);
          if (error) throw error;
          console.log('Supabase connection test successful');
        } catch (err) {
          console.error('Supabase connection test failed:', err);
        }
      };
      
      testConnection();
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24 pb-12 px-4`}>
      <div className="max-w-4xl mx-auto">
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-8 transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Turnitin Plagiarism Check</h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Upload your document to check for potential plagiarism and ensure academic integrity.
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Progress Steps */}
          <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx === steps.length - 1 ? '' : 'pr-8 sm:pr-20'} flex-1`}>
                  <div className="flex items-center">
                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        step.completed
                          ? 'bg-blue-600 dark:bg-blue-700'
                          : step.current
                          ? 'border-2 border-blue-600 dark:border-blue-500'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm ${
                            step.current
                              ? 'text-blue-600 dark:text-blue-500'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={`absolute top-4 left-0 -ml-px mt-0.5 h-0.5 w-full ${
                          steps[stepIdx + 1].completed || steps[stepIdx + 1].current
                            ? 'bg-blue-600 dark:bg-blue-700'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 block text-xs ${
                      step.current
                        ? 'font-medium text-blue-600 dark:text-blue-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TurnitinCheck;