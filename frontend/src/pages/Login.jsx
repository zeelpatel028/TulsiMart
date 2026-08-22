import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { 
  Store, 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Send,
  Sparkle
} from 'lucide-react';
import CartLoader from '../components/common/CartLoader';

export const Login = () => {
  // Step 1: Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: OTP verification
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedOtp, setDispatchedOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [timer, setTimer] = useState(300); // 5 minute countdown

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const { sendOtp, verifyOtp, login } = useAuth();
  const navigate = useNavigate();
  const otpInputRefs = useRef([]);

  // Timer countdown effect for OTP step
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle Step 1: Credentials Submit & Send OTP via Nodemailer
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await sendOtp(username, password);
    if (res.success) {
      setDispatchedOtp(res.data.otp_code || '123456');
      setUserEmail(res.data.email || `${username}@tulsimart.com`);
      setOtpSuccessMsg(`OTP sent via Nodemailer to ${res.data.email || 'your email'}`);
      setStep(2);
      setTimer(300);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  // Handle Step 2: OTP Input changes
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handle Resend OTP via Nodemailer
  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    const res = await sendOtp(username, password);
    if (res.success) {
      setDispatchedOtp(res.data.otp_code || '123456');
      setOtpSuccessMsg('New 6-digit OTP re-sent via Nodemailer!');
      setTimer(300);
    } else {
      setError(res.error || 'Failed to resend OTP.');
    }
    setResending(false);
  };

  // Handle Final OTP Verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all 6 digits of your OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await verifyOtp(username, fullOtp);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid OTP code. Please check and try again.');
    }
    setLoading(false);
  };

  // Format MM:SS timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen animated-mesh-bg flex flex-col justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden text-slate-100 selection:bg-[#88BDF2] selection:text-slate-900">
      
      {/* Background Animated Floating Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#88BDF2]/30 to-blue-600/20 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/20 to-sky-400/20 blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Floating Animated Icons in Background */}
      <div className="absolute top-16 left-[15%] text-slate-600/30 animate-float-slow pointer-events-none">
        <ShoppingBag className="w-12 h-12" />
      </div>
      <div className="absolute bottom-20 left-[10%] text-slate-600/30 animate-float-delayed pointer-events-none">
        <Store className="w-14 h-14" />
      </div>
      <div className="absolute top-24 right-[12%] text-slate-600/30 animate-float-slow pointer-events-none" style={{ animationDelay: '1s' }}>
        <ShieldCheck className="w-10 h-10" />
      </div>
      <div className="absolute bottom-28 right-[18%] text-slate-600/30 animate-float-delayed pointer-events-none" style={{ animationDelay: '4s' }}>
        <Mail className="w-12 h-12" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900/80 p-3 shadow-2xl border border-slate-700/80 backdrop-blur-xl flex items-center justify-center mb-4 group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#88BDF2]/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <img
              src="/logo.png"
              alt="Tulsi Mart Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-md"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading flex items-center justify-center gap-2">
            Tulsi Mart
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#88BDF2]/20 text-[#88BDF2] border border-[#88BDF2]/30">
              v2.0 2FA
            </span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-medium">
            Grocery Shop Management & Admin Portal
          </p>
        </div>

        {/* Login Glassmorphism Card */}
        <div className="mt-8 bg-slate-900/70 backdrop-blur-2xl py-7 sm:py-9 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/70 relative overflow-hidden">
          
          {/* Card subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#88BDF2] to-transparent opacity-80" />

          {/* Active Loading Overlay with Custom Shopping Cart SVG */}
          {loading && (
            <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 transition-all">
              <CartLoader 
                text={step === 1 ? "Authenticating credentials & sending OTP..." : "Verifying 2FA OTP & Logging In..."} 
                size="lg" 
              />
            </div>
          )}



          {/* Global Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-medium rounded-2xl flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* STEP 1: Credentials Form */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Username or Staff Email
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800/90 border border-slate-700 focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20 rounded-xl outline-none text-white transition-all placeholder:text-slate-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-slate-800/90 border border-slate-700 focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20 rounded-xl outline-none text-white transition-all placeholder:text-slate-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full font-bold text-sm py-3.5 bg-gradient-to-r from-[#88BDF2] to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-900 border-none shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                  Send Nodemailer OTP →
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification Screen */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleOtpSubmit}>
              
              {/* Nodemailer Dispatch Badge */}
              <div className="p-3.5 rounded-2xl bg-sky-950/70 border border-sky-500/40 text-sky-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-sky-300 mb-1">
                  <Mail className="w-4 h-4 text-[#88BDF2]" /> Nodemailer Service Activated
                </div>
                <p className="text-[11px] text-slate-300">
                  OTP code has been sent to <strong className="text-white">{userEmail}</strong>. Please check your email inbox.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="otp-digit-0" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit Security OTP
                  </label>
                  <span className="text-xs font-mono font-bold text-[#88BDF2]">
                    ⏱ {formatTime(timer)}
                  </span>
                </div>

                {/* 6 Individual Digit Inputs */}
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      name={`otp_digit_${idx}`}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-full h-12 text-center text-xl font-bold font-mono bg-slate-800/90 border border-slate-700 focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/30 rounded-xl outline-none text-white transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full font-bold text-sm py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 border-none shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 rounded-xl transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify OTP & Access Dashboard
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    ← Back to Login
                  </button>

                  <button
                    type="button"
                    disabled={resending || timer > 270}
                    onClick={handleResendOtp}
                    className="text-[#88BDF2] hover:text-sky-300 disabled:text-slate-600 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    Resend OTP
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Nodemailer Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <Sparkle className="w-3.5 h-3.5 text-[#88BDF2]" />
              Secured with 2-Factor OTP & Nodemailer SMTP Transport
            </p>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          © 2026 Tulsi Mart. Grocery Management & Admin Portal.
        </p>

      </div>
    </div>
  );
};

export default Login;
