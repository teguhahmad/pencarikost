import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Store, ChevronLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const MarketplaceAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError) throw signInError;

        const from = (location.state as any)?.from || '/marketplace';
        navigate(from);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: 'tenant'
            }
          }
        });

        if (signUpError) throw signUpError;

        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/marketplace/reset-password`,
      });

      if (error) throw error;

      setSuccess('Password reset instructions have been sent to your email');
      setTimeout(() => {
        setIsForgotPassword(false);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        {(isForgotPassword || !isLogin) && (
          <button
            onClick={() => {
              setIsForgotPassword(false);
              if (!isLogin) setIsLogin(true);
            }}
            className="mb-6 text-blue-600 flex items-center"
          >
            <ChevronLeft size={20} />
            <span>Kembali</span>
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 text-blue-600 mb-8">
          <Store size={32} />
          <h1 className="text-3xl font-bold">Kostopia</h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 rounded-2xl p-4">
            {success}
          </div>
        )}

        {/* Form */}
        <form 
          onSubmit={isForgotPassword ? handleForgotPassword : handleAuth}
          className="space-y-4"
        >
          {!isLogin && !isForgotPassword && (
            <div>
              <input
                type="text"
                name="name"
                placeholder="Nama Lengkap"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isForgotPassword && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Kata Sandi"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Konfirmasi Kata Sandi"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-blue-600"
              >
                Lupa kata sandi?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isForgotPassword ? (
              'Kirim Link Reset'
            ) : isLogin ? (
              'Masuk'
            ) : (
              'Daftar'
            )}
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  name: ''
                });
              }}
              className="w-full py-3 text-blue-600 font-medium bg-blue-50 rounded-2xl"
            >
              {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceAuth;