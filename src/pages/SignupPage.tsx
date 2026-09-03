import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, UserPlus, Mail, Lock, Building, Layers, ArrowRight } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { handleDemoLogin, updateShopProfile, setCurrentPage } = useAuth();
  
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [printTech, setPrintTech] = useState('Commercial Digital & Offset');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      updateShopProfile({
        shopName: shopName || 'My Print Studio',
        email: email || 'operator@printstudio.com',
        primaryPrintTech: printTech
      });
      handleDemoLogin();
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
            <Printer className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Print Shop Account</h2>
          <p className="text-xs text-slate-400">Deploy AI Pre-press & Pre-flight tools for your business</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Print Shop Business Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Apex Graphics & Digital Press"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Primary Printing Technology</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <select
                value={printTech}
                onChange={(e) => setPrintTech(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white focus:outline-none"
              >
                <option value="Commercial Digital & Offset">Commercial Digital & Offset</option>
                <option value="Wide Format Flex & Billboard Vinyl">Wide Format Flex & Billboard Vinyl</option>
                <option value="Screen Printing & Apparel">Screen Printing & Apparel</option>
                <option value="Packaging & Die-Cut Boxes">Packaging & Die-Cut Boxes</option>
                <option value="Corporate Stationery & Cards">Corporate Stationery & Cards</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Operator Email</label>
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register & Launch Workspace</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <button onClick={() => setCurrentPage('login')} className="text-indigo-400 font-semibold hover:underline">
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};
