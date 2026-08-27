import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Store, 
  Lock, 
  User, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Shield,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendOtp, verifyOtp, storeSettings } = useAuth();
  const { showToast } = useNotification();
  const { theme } = useTheme();

  // Step 1: 'credentials', Step 2: 'otp'
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Resend Timer
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        if (otpInputRefs[0]?.current) otpInputRefs[0].current.focus();
      }, 100);
    }
  }, [step]);

  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto move focus to next box
    if (digit && index < 5) {
      if (otpInputRefs[index + 1]?.current) {
        otpInputRefs[index + 1].current.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        if (otpInputRefs[index - 1]?.current) {
          otpInputRefs[index - 1].current.focus();
        }
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newDigits = pasteData.split('');
      while (newDigits.length < 6) newDigits.push('');
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteData.length, 5);
      if (otpInputRefs[nextIndex]?.current) {
        otpInputRefs[nextIndex].current.focus();
      }
    }
  };

  const handleCredentialsSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(username.trim(), password.trim());
      if (res.success) {
        if (res.data?.otp_required) {
          setMaskedEmail(res.data.masked_email || res.data.email || 'your email');
          if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
          setStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
          setTimer(60);
          setCanResend(false);
          showToast(res.data.message || '📩 6-Digit OTP code sent to your email!', 'success');
        } else {
          showToast('Login successful! Opening Dashboard...', 'success');
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      } else {
        showToast(res.error || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Authentication failed. Check backend database connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      showToast('Please enter all 6 digits of your OTP code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(username.trim(), fullOtp);
      if (res.success) {
        showToast(`🎉 2FA Verified! Logged in as ${res.user?.name || username}.`, 'success');
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        showToast(res.error || 'Invalid OTP code. Please try again.', 'error');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      showToast('Failed to verify OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      const res = await sendOtp(username.trim(), password.trim());
      if (res.success && res.data?.otp_required) {
        if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
        setOtpDigits(['', '', '', '', '', '']);
        setTimer(60);
        setCanResend(false);
        showToast('📩 A new 6-digit OTP code has been sent to your email!', 'success');
      }
    } catch {
      showToast('Failed to resend OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const storeName = storeSettings?.store_name || 'Tulsi Mart';
  const tagline = storeSettings?.tagline || 'Supermarket & Grocery Management System';
  const logo = storeSettings?.store_logo || '/logo.png';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#88BDF2]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#384959]/50 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card with Glassmorphism */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 text-white transition-all">
          
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#384959] via-[#4A5D6E] to-[#88BDF2] p-3 shadow-xl border border-white/10 mx-auto transition-transform hover:scale-105">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-full h-full object-contain filter drop-shadow-md"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight font-heading text-white">
                {storeName}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-medium">
                {tagline}
              </p>
            </div>
          </div>

          {/* STEP 1: USERNAME & PASSWORD FORM */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">Username *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter admin / staff username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-[#88BDF2] focus:ring-1 focus:ring-[#88BDF2] outline-none text-sm text-white transition-all font-mono"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-[#88BDF2] focus:ring-1 focus:ring-[#88BDF2] outline-none text-sm text-white transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#384959] via-[#4A5D6E] to-[#384959] hover:from-[#4A5D6E] hover:to-[#384959] text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to POS Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: STUNNING 6-DIGIT OTP VERIFICATION UI */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 text-xs">
              {/* Header Badge Card */}
              <div className="bg-gradient-to-b from-blue-950/80 to-slate-900 border border-blue-800/40 p-5 rounded-2xl space-y-3 text-center relative overflow-hidden">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#88BDF2]/30 rounded-full blur-md animate-pulse" />
                  <div className="relative p-3 rounded-full bg-gradient-to-tr from-[#384959] to-[#88BDF2] text-white shadow-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base font-heading">2FA Security OTP Required</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    We dispatched a 6-digit verification code to your email:
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 rounded-xl text-[#88BDF2] font-mono font-bold text-xs border border-blue-700/40 shadow-inner">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{maskedEmail}</span>
                </div>
              </div>

              {/* Dev Test Code Banner */}
              {devOtp && (
                <div className="bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl text-center space-y-0.5 backdrop-blur-md">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Dev Test OTP Code</span>
                  <div className="font-mono text-base font-black text-amber-300 tracking-[0.25em]">{devOtp}</div>
                </div>
              )}

              {/* 6-DIGIT OTP INPUT PIN GRID */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300 text-center uppercase tracking-wider text-[11px]">
                  Enter 6-Digit Verification PIN
                </label>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-10 sm:w-12 h-12 sm:h-14 text-center font-mono font-black text-lg sm:text-xl rounded-xl sm:rounded-2xl bg-slate-950 border transition-all duration-200 outline-none ${
                        digit
                          ? 'border-[#88BDF2] text-[#88BDF2] ring-2 ring-[#88BDF2]/30 bg-slate-900 shadow-md'
                          : 'border-slate-800 text-white focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Countdown */}
              <div className="flex items-center justify-between text-slate-400 text-xs px-1">
                <span>Didn't receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#88BDF2] hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Resend in 00:{timer < 10 ? `0${timer}` : timer}</span>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#384959] via-[#4A5D6E] to-[#88BDF2] hover:from-[#4A5D6E] hover:to-[#384959] text-white font-extrabold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span>Verifying 2FA OTP...</span>
                ) : (
                  <>
                    <span>Verify Security Code</span>
                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Username Login
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected by 100% Database Authentication & 2FA OTP Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
