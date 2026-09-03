import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { setCurrentPage } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
        
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
          <Printer className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400">Enter your print shop account email to receive a password recovery link.</p>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-sm text-white">Reset Email Dispatched</p>
            <p className="text-slate-300">We've sent recovery instructions to <span className="font-mono text-white">{email}</span>. Check your inbox.</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-colors"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Account Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@apexgraphics.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="pt-2">
          <button
            onClick={() => setCurrentPage('login')}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
