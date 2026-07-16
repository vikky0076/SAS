import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPasswordWithCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qToken = searchParams.get('token') || searchParams.get('oobCode');
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token || !password || !confirmPassword) {
      return toast.error('All fields are required');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithCode(token, password);

      if (result.success) {
        toast.success('Password reset successful! Please log in with your new password.');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image with Zoom Animation */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-zoom-animate" 
        style={{ backgroundImage: "url('/classroom_bg.png')" }}
      />
      {/* Dark transparent overlay */}
      <div className="absolute inset-0 bg-slate-950/45 z-0 backdrop-blur-xs"></div>

      {/* Floating particles decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 15 + 15}s`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-200 hover:text-white transition-colors">
            <FiArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex px-5 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#FF3B3B] items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30 mb-4 glow-orange tracking-widest"
          >
            SAS
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Reset Password</h2>
          <p className="text-xs font-bold text-orange-200 mt-1 tracking-wider uppercase drop-shadow-sm">Enter details to reset your password</p>
        </div>

        <div className="glass-card p-8 glow-orange-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-650">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-655">Reset Token</label>
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="glass-input w-full font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-655">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-655">Confirm New Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255, 107, 0, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
