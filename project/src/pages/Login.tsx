import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Mail, Lock, AlertCircle, Building2, User, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackoffice, setIsBackoffice] = useState(false);
  const [signupCooldown, setSignupCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signupCooldown > 0) {
      timer = setInterval(() => {
        setSignupCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [signupCooldown]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (!user) throw new Error('Login failed');

        if (isBackoffice) {
          const { data: backofficeUser, error: backofficeError } = await supabase
            .from('backoffice_users')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (backofficeError) throw backofficeError;
          
          if (!backofficeUser) {
            throw new Error('Unauthorized access to backoffice');
          }

          navigate('/backoffice');
        } else {
          const from = (location.state as any)?.from || '/properties';
          navigate(from);
        }
      } else {
        // Check cooldown
        if (signupCooldown > 0) {
          throw new Error(`Mohon tunggu ${signupCooldown} detik sebelum mencoba mendaftar kembali`);
        }

        // Sign up
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('rate_limit')) {
            setSignupCooldown(10); // Set 10 second cooldown
            throw new Error('Mohon tunggu beberapa saat sebelum mencoba mendaftar kembali');
          }
          throw signUpError;
        }

        if (!user) throw new Error('Terjadi kesalahan saat mendaftar');

        // Wait for user metadata to be available
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create initial user settings
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert([{ 
            user_id: user.id,
            email_notifications: true,
            payment_reminders: true,
            maintenance_updates: true,
            new_tenants: true,
            currency: 'IDR',
            date_format: 'DD/MM/YYYY',
            payment_reminder_days: 5,
            session_timeout: 30,
            login_notifications: true,
            two_factor_enabled: false
          }]);

        if (settingsError) throw settingsError;

        navigate('/properties');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message === 'Unauthorized access to backoffice'
            ? 'Anda tidak memiliki akses ke backoffice'
            : err.message === 'Invalid login credentials'
            ? 'Email atau kata sandi salah'
            : err.message
        );
      } else {
        setError('Terjadi kesalahan');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/properties`
        }
      });

      if (error) throw error;

      // The redirect will happen automatically
    } catch (err) {
      console.error('Error with Google auth:', err);
      setError('Gagal login dengan Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          Kostopia
        </h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {isBackoffice ? 'Backoffice Login' : (isLogin ? 'Masuk ke akun Anda' : 'Daftar akun baru')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && signupCooldown > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-md p-4">
              Mohon tunggu {signupCooldown} detik sebelum mencoba mendaftar kembali
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nama Lengkap
                </label>
                <div className="mt-1 relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center"
                disabled={loading || (!isLogin && signupCooldown > 0)}
              >
                {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
              </Button>
            </div>
          </form>

          {!isBackoffice && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Atau lanjutkan dengan</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full flex justify-center items-center gap-2"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {isLogin ? 'Masuk dengan Google' : 'Daftar dengan Google'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full flex justify-center items-center"
              onClick={() => {
                if (isBackoffice) {
                  setIsBackoffice(false);
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
                setError(null);
              }}
              icon={isBackoffice ? <Building2 size={16} /> : undefined}
            >
              {isBackoffice ? 'Kembali ke Login User' : 
               (isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk')}
            </Button>

            {!isBackoffice && isLogin && (
              <Button
                variant="outline"
                className="w-full flex justify-center items-center mt-2"
                onClick={() => setIsBackoffice(true)}
                icon={<Building2 size={16} />}
              >
                Login Backoffice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;