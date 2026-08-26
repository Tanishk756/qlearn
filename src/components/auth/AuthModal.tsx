/**
 * Authentication Modal: Sign In, Sign Up (Registration), Password Recovery
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'recovery';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, recoverPassword, resetPasswordWithCode, loginDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [quantumLevel, setQuantumLevel] = useState<
    'Beginner' | 'Student' | 'Researcher' | 'Quantum Engineer'
  >('Student');

  // Recovery Specific
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedCodeHint(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'recovery') => {
    resetFormState();
    setMode(newMode);
    setRecoveryStep('request');
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to sign in. Please verify credentials.');
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!name || !email || !password) {
      setErrorMessage('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      name,
      email,
      password,
      affiliation,
      quantumLevel,
    });
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Account created successfully! Welcome to Q-Learn Nexus.');
      setTimeout(() => onClose(), 800);
    } else {
      setErrorMessage(result.error || 'Failed to register account.');
    }
  };

  // Submit Password Recovery (Step 1)
  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const result = await recoverPassword(email);
    setIsLoading(false);

    if (result.success && result.recoveryCode) {
      setGeneratedCodeHint(result.recoveryCode);
      setRecoveryCode(result.recoveryCode); // Autofill for convenience in demo
      setSuccessMessage(`Recovery verification code generated for ${email}`);
      setRecoveryStep('verify');
    } else {
      setErrorMessage(result.error || 'Could not find an account with that email.');
    }
  };

  // Submit Password Reset (Step 2)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!recoveryCode || !newPassword) {
      setErrorMessage('Please enter the 6-digit code and a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await resetPasswordWithCode(email, recoveryCode, newPassword);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
      setTimeout(() => {
        handleSwitchMode('login');
      }, 1500);
    } else {
      setErrorMessage(result.error || 'Failed to reset password.');
    }
  };

  // Demo Login Quick Trigger
  const handleQuickDemo = (role: 'student' | 'researcher' | 'engineer') => {
    loginDemoUser(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        id="auth-modal-card"
        className="bg-[#FDFCF9] w-full max-w-md rounded-3xl border border-[#E8E4DA] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E4DA] flex items-center justify-between bg-[#F3F0E9]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center font-serif text-base font-bold">
              Ψ
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D3326]">
                {mode === 'login' && 'Sign In to Q-Learn'}
                {mode === 'register' && 'Create Quantum Account'}
                {mode === 'recovery' && 'Password Recovery'}
              </h3>
              <p className="text-[11px] text-[#6D7268]">
                {mode === 'login' && 'Access circuits, progress, and AI mentorship'}
                {mode === 'register' && 'Join the interactive quantum learning community'}
                {mode === 'recovery' && 'Securely reset your access credentials'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857B] hover:text-[#2D3326] hover:bg-[#E8E4DA] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Feedback Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#8DA47E]/15 text-[#5A634E] text-xs rounded-2xl border border-[#8DA47E]/30 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#8DA47E]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                  <input
                    id="auth-login-email"
                    type="email"
                    required
                    placeholder="user@quantum.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#5A634E]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('recovery')}
                    className="text-[11px] text-[#8DA47E] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                  <input
                    id="auth-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white pl-10 pr-10 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#8C857B] hover:text-[#2D3326]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="auth-login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#5A634E] hover:bg-[#474F3E] text-[#F3F0E9] font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Demo Logins */}
              <div className="pt-3 border-t border-[#E8E4DA]">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block text-center mb-2 tracking-wider">
                  Quick Demo Persona Sign-In
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student')}
                    className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-[11px] font-medium text-[#5A634E] flex flex-col items-center gap-1 transition-all"
                  >
                    <span>🎓 Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('researcher')}
                    className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-[11px] font-medium text-[#5A634E] flex flex-col items-center gap-1 transition-all"
                  >
                    <span>🔬 Researcher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('engineer')}
                    className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-[11px] font-medium text-[#5A634E] flex flex-col items-center gap-1 transition-all"
                  >
                    <span>💠 Engineer</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Mode 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                  <input
                    id="auth-register-name"
                    type="text"
                    required
                    placeholder="Erwin Schrödinger"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                  <input
                    id="auth-register-email"
                    type="email"
                    required
                    placeholder="schrodinger@vienna.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Institution / Lab
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-[#8C857B]" />
                    <input
                      id="auth-register-affiliation"
                      type="text"
                      placeholder="e.g. MIT, CERN"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      className="w-full bg-white pl-9 pr-3 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Experience Level
                  </label>
                  <select
                    id="auth-register-level"
                    value={quantumLevel}
                    onChange={(e: any) => setQuantumLevel(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  >
                    <option value="Beginner">Beginner (Intro)</option>
                    <option value="Student">Student (Physics/CS)</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Quantum Engineer">Quantum Engineer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Password
                  </label>
                  <input
                    id="auth-register-password"
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Confirm
                  </label>
                  <input
                    id="auth-register-confirm"
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
              </div>

              <button
                id="auth-register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#8DA47E] hover:bg-[#7B926C] text-white font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Quantum Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 3: PASSWORD RECOVERY */}
          {mode === 'recovery' && (
            <div className="space-y-4">
              {recoveryStep === 'request' ? (
                <form onSubmit={handleRecoveryRequest} className="space-y-3.5">
                  <p className="text-xs text-[#6D7268]">
                    Enter your account email address. We will generate an instant 6-digit recovery verification code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                      <input
                        id="auth-recovery-email"
                        type="email"
                        required
                        placeholder="your-email@quantum.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                      />
                    </div>
                  </div>

                  <button
                    id="auth-recovery-send-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#5A634E] hover:bg-[#474F3E] text-white font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Verification Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  {generatedCodeHint && (
                    <div className="p-3 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] text-xs text-[#5A634E]">
                      <span className="font-semibold block mb-0.5">Verification Code Generated:</span>
                      <span className="font-mono text-base font-bold tracking-widest text-[#2D3326]">
                        {generatedCodeHint}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="auth-recovery-code"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 849201"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full bg-white px-4 py-2.5 font-mono text-center tracking-widest text-sm rounded-2xl border border-[#E8E4DA] focus:outline-hidden focus:border-[#8DA47E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                      New Password
                    </label>
                    <input
                      id="auth-recovery-new-password"
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white px-4 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E]"
                    />
                  </div>

                  <button
                    id="auth-recovery-reset-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#8DA47E] hover:bg-[#7B926C] text-white font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reset Password & Save</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (Mode Switchers) */}
        <div className="px-6 py-3.5 bg-[#F3F0E9] border-t border-[#E8E4DA] flex items-center justify-between text-xs text-[#6D7268]">
          {mode === 'login' && (
            <>
              <span>Don't have an account?</span>
              <button
                id="auth-switch-to-register"
                onClick={() => handleSwitchMode('register')}
                className="text-[#5A634E] font-semibold hover:underline"
              >
                Create Account
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <span>Already registered?</span>
              <button
                id="auth-switch-to-login"
                onClick={() => handleSwitchMode('login')}
                className="text-[#5A634E] font-semibold hover:underline"
              >
                Sign In
              </button>
            </>
          )}

          {mode === 'recovery' && (
            <>
              <span>Remembered password?</span>
              <button
                id="auth-switch-back-login"
                onClick={() => handleSwitchMode('login')}
                className="text-[#5A634E] font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
