import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import SEO from '@/components/SEO';
import SigningLayout from '@/components/SigningLayout';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number').max(20),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/portal';
      navigate(redirect);
    }
  }, [user, navigate, searchParams]);

  const handleLogin = async (data: LoginFormData) => {
    setError('');
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError(error.message || 'An error occurred during login');
      }
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setError('');
    const { error } = await signUp(data.email, data.password, {
      display_name: data.displayName,
      company_name: data.companyName,
      phone: data.phone,
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
        setActiveTab('login');
      } else {
        setError(error.message || 'An error occurred during signup');
      }
    }
  };

  return (
    <SigningLayout>
      <SEO 
        title="Client Portal Login | Notroom"
        description="Access your client portal to track signing orders and manage your account."
        canonical="/auth"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 py-12 pt-32">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Access your CROP account to manage mail and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...loginForm.register('password')}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        {...signupForm.register('displayName')}
                      />
                    </div>
                    {signupForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Your Company LLC"
                        className="pl-10"
                        {...signupForm.register('companyName')}
                      />
                    </div>
                    {signupForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                        {...signupForm.register('phone')}
                      />
                    </div>
                    {signupForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...signupForm.register('password')}
                      />
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...signupForm.register('confirmPassword')}
                      />
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                    {signupForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need help? <a href="/contact" className="text-primary hover:underline">Contact Support</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SigningLayout>
  );
}
