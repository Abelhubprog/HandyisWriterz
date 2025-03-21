import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EyeIcon, EyeOffIcon, LoaderCircle } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  useEffect(() => {
    // Check if already authenticated and redirect to admin dashboard
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && (user.role === 'admin' || user.role === 'editor')) {
          router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [router]);

  const validate = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await authService.adminLogin(email, password);

      if (user) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('adminEmail', email);
        } else {
          localStorage.removeItem('adminEmail');
        }

        toast.success('Login successful!');
        router.push('/admin/dashboard');
      } else {
        setErrors({
          general: 'Invalid credentials or insufficient permissions'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('adminEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Admin Login | HandyWriterz</title>
        <meta name="description" content="Login to HandyWriterz admin dashboard" />
      </Head>

      <div className="flex min-h-screen bg-gray-50">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="flex flex-col items-center">
              <Image
                src="/logo.png"
                alt="HandyWriterz Logo"
                width={60}
                height={60}
                className="mb-4"
              />
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Admin Login
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Login to access the admin dashboard
              </p>
            </div>

            {errors.general && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-sm text-red-700">
                    {errors.general}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="mt-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`block w-full rounded-md ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600" id="email-error">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label 
                      htmlFor="password" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full rounded-md ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600" id="password-error">
                          {errors.password}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => 
                          setRememberMe(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </Label>
                    </div>

                    <div className="text-sm">
                      <Link
                        href="/admin/forgot-password"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="submit"
                      className="flex w-full justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-600 to-blue-700">
            <div className="flex h-full flex-col items-center justify-center p-12 text-white">
              <h2 className="text-3xl font-bold mb-6">HandyWriterz Admin</h2>
              <p className="text-lg max-w-md text-center">
                Manage content, users, and settings for your HandyWriterz platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 