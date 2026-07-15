import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiKey } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { sendResetEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your email');
    }

    setLoading(true);
    try {
      const result = await sendResetEmail(email);
      if (result.success) {
        toast.success('Password reset email sent! Check your inbox for instructions.');
        setResetToken('firebase-email-sent'); // Simulates a token to show the next screen step
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center" 
      style={{ backgroundImage: "url('/classroom_bg.png')" }}
    >
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
            className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#FF3B3B] items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/30 mb-4 glow-orange"
          >
            S
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Forgot Password</h2>
          <p className="text-xs font-bold text-orange-200 mt-1 tracking-wider uppercase drop-shadow-sm">Recover your account password</p>
        </div>

        <div className="glass-card p-8 glow-orange-border">
          {!resetToken ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-650">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-11"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255, 107, 0, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Sending Request...' : 'Generate Reset Token'}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] mx-auto flex items-center justify-center">
                <FiKey className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reset Token Generated</h3>
                <p className="text-xs text-slate-500 mt-2">
                  In a real production environment, this token is sent to your registered email address. For this self-contained demo, please copy the code below.
                </p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl select-all font-mono text-sm font-bold text-slate-700">
                {resetToken}
              </div>
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`}
                className="w-full inline-block py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-sm shadow-md text-center transition-all hover:opacity-90"
              >
                Proceed to Reset Password
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
