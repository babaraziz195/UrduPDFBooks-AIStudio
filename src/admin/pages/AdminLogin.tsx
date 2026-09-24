import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AdminUser } from '../../types/admin';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToWebsite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToWebsite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await authService.login(email, password);
      if (error || !user) {
        setErrorMessage(error || 'Invalid administrator credentials. Please verify your email and password.');
      } else {
        onLoginSuccess(user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsForgotLoading(true);
    setForgotStatus(null);
    try {
      const res = await authService.resetPassword(forgotEmail);
      setForgotStatus(res);
    } catch {
      setForgotStatus({ success: false, message: 'Could not send reset link. Try again later.' });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleQuickSandboxLogin = () => {
    setEmail('admin@urdupdfbooks.com');
    setPassword('admin1234');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1A3E2F_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1A3E2F] border border-[#C5A869]/40 flex items-center justify-center text-[#C5A869] mx-auto shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-serif">
            Urdu<span className="text-[#C5A869]">PDF</span>Books
          </h2>
          <p className="mt-1 text-sm text-gray-600 font-medium">
            Administrative Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-200/80">
          {/* Supabase Status Pill */}
          <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#1A3E2F]" />
              Auth Engine:
            </span>
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                supabaseReady
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {supabaseReady ? 'Supabase Auth' : 'Sandbox Admin Mode'}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@urdupdfbooks.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F] focus:border-[#1A3E2F] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-[#1A3E2F] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F] focus:border-[#1A3E2F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#1A3E2F] focus:ring-[#1A3E2F] w-4 h-4"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-[#1A3E2F] hover:bg-[#133224] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3E2F] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A869]" />
                </>
              )}
            </button>
          </form>

          {/* Sandbox helper */}
          {!supabaseReady && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">
                Evaluating without Supabase credentials yet?
              </p>
              <button
                type="button"
                onClick={handleQuickSandboxLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5A869]/15 hover:bg-[#C5A869]/25 text-[#1A3E2F] text-xs font-bold transition-colors cursor-pointer border border-[#C5A869]/30"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#C5A869]" />
                <span>Fill Sandbox Admin Credentials</span>
              </button>
            </div>
          )}
        </div>

        {/* Back to public site */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
          >
            ← Return to UrduPDFBooks Public Library
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Reset Administrator Password</h3>
            <p className="text-xs text-gray-600 mt-1">
              Enter your registered Supabase administrator email to receive password reset instructions.
            </p>

            {forgotStatus && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  forgotStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {forgotStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@urdupdfbooks.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotStatus(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3E2F] hover:bg-[#133224] rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isForgotLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Send Reset Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
