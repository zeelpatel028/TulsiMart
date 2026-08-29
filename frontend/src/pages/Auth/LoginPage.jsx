import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendOtp, verifyOtp, storeSettings } = useAuth();
  const { showToast } = useNotification();

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
    
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(trimmedUsername, trimmedPassword);
      if (res.success) {
        if (res.data?.otp_required) {
          setMaskedEmail(res.data.masked_email || res.data.email || 'your email');
          if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
          setStep('otp');
          setTimer(60);
          setCanResend(false);
          showToast('📩 Security OTP Sent to your email inbox.', 'info');
        } else {
          showToast('Welcome back! Login successful.', 'success');
          const from = location.state?.from?.pathname || '/billing';
          navigate(from, { replace: true });
        }
      } else {
        showToast(res.error || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      showToast('Login failed. Please check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      showToast('Please enter full 6-digit OTP code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(username.trim(), otpCode);
      if (res.success) {
        showToast('🎉 Security OTP Verified! Welcome to POS Portal.', 'success');
        const from = location.state?.from?.pathname || '/billing';
        navigate(from, { replace: true });
      } else {
        showToast(res.error || 'Invalid or expired OTP code.', 'error');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      showToast('OTP verification failed.', 'error');
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
        showToast('📩 A new OTP code has been sent to your email!', 'success');
      } else {
        showToast(res.error || 'Failed to resend OTP code.', 'error');
      }
    } catch {
      showToast('Failed to resend OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const storeName = storeSettings?.store_name || 'Tulsi Mart';
  const tagline = storeSettings?.tagline || 'Supermarket POS & Management System';
  const logo = storeSettings?.store_logo || '/logo.png';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-[#88BDF2] selection:text-[#384959]">
      
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#384959]/30 to-[#88BDF2]/15 rounded-full blur-[140px]" />
      </div>

      {/* Sleek Centered Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl p-6 sm:p-8 relative z-10 space-y-6">
        
        {/* BRAND HEADER: LOGO & PROJECT NAME */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#384959] via-[#4A5D6E] to-[#88BDF2] p-3 shadow-lg border border-white/20">
            <img 
              src={logo} 
              alt={storeName} 
              className="w-full h-full object-contain filter drop-shadow"
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight font-heading text-white">
              {storeName}
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium max-w-xs mx-auto">
              {tagline}
            </p>
          </div>
        </div>

        {/* STEP 1: USERNAME & PASSWORD LOGIN */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-semibold text-slate-300">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20 outline-none text-sm text-white transition-all font-mono placeholder:text-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20 outline-none text-sm text-white transition-all font-mono placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#384959] via-[#4A5D6E] to-[#384959] hover:from-[#4A5D6E] hover:to-[#5B7185] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.99] border border-[#88BDF2]/30 mt-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#88BDF2]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: CLEAN 6-DIGIT OTP STEP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#88BDF2]/10 text-[#88BDF2] mb-2 border border-[#88BDF2]/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Security Verification</h2>
              <p className="text-slate-400 text-xs">
                Enter the 6-digit code sent to <strong className="text-slate-200">{maskedEmail}</strong>
              </p>
            </div>

            {/* Dev Test Code Banner */}
            {devOtp && (
              <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded-xl text-center backdrop-blur-md">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Dev Test OTP</span>
                <span className="font-mono text-sm font-black text-amber-300 tracking-widest">{devOtp}</span>
              </div>
            )}

            {/* 6-DIGIT INPUT */}
            <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-digit-${index}`}
                  name={`otp_digit_${index}`}
                  aria-label={`OTP Digit ${index + 1}`}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  ref={otpInputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={`w-10 h-12 text-center font-mono font-bold text-lg rounded-xl bg-slate-950 border transition-all outline-none ${
                    digit
                      ? 'border-[#88BDF2] text-[#88BDF2] ring-2 ring-[#88BDF2]/20 bg-slate-900'
                      : 'border-slate-800 text-white focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20'
                  }`}
                />
              ))}
            </div>

            {/* Resend Timer */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#88BDF2] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Resend
                </button>
              ) : (
                <span className="font-mono text-slate-400">Resend in {timer}s</span>
              )}
            </div>

            {/* Submit Verification */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#384959] via-[#4A5D6E] to-[#88BDF2] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & Login</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
