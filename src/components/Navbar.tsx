import React, { useState } from 'react';
import { useAuth, PageName, ToolType } from '../context/AuthContext';
import {
  Printer,
  Sparkles,
  LayoutDashboard,
  User as UserIcon,
  HelpCircle,
  Mail,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  Image as ImageIcon,
  CreditCard,
  FileText,
  Sliders,
  DollarSign,
  Palette,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Award,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    isLoggedIn, 
    currentPage, 
    setCurrentPage, 
    navigateToTool, 
    shopProfile, 
    handleLogout 
  } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const toolsList: { id: ToolType; label: string; icon: React.ComponentType<{ className?: string }>; badge: string; desc: string }[] = [
    { id: 'passport', label: 'Passport Photo Maker', icon: ShieldCheck, badge: 'ICAO', desc: '35×45mm framing, bg removal, 300 DPI' },
    { id: 'preflight', label: 'Pre-flight Checker', icon: CheckCircle2, badge: 'Audit', desc: 'Real DPI, colour mode & bleed check' },
    { id: 'doctor', label: 'Print Doctor', icon: Stethoscope, badge: 'Diagnostic', desc: 'Rule-based banding, hickeys & blur fixes' },
    { id: 'enhance', label: 'Image Enhancer', icon: Sliders, badge: 'Canvas', desc: 'Local upscale, sharpen & auto-levels' },
    { id: 'card', label: 'Visiting Card Studio', icon: CreditCard, badge: 'Card', desc: 'Front/back themes with real QR codes' },
    { id: 'resume', label: 'Resume Builder', icon: FileText, badge: 'A4', desc: 'User-driven templates & live preview' },
    { id: 'pdf-tools', label: 'PDF Toolkit', icon: Layers, badge: 'pdf-lib', desc: 'Merge, split, rotate, reorder & info' },
    { id: 'cost', label: 'Print Cost Estimator', icon: DollarSign, badge: 'Finance', desc: 'Sheet nesting, GSM weight & margins' },
    { id: 'color', label: 'Colour Advisor', icon: Palette, badge: 'Pre-press', desc: 'RGB→CMYK, TAC & nearest Pantone' },
    { id: 'poster', label: 'Poster Generator', icon: ImageIcon, badge: 'Vector', desc: 'Deterministic SVG poster layouts' },
    { id: 'certificate', label: 'Certificate Generator', icon: Award, badge: 'A4', desc: 'Editable award certificates' },
    { id: 'idcard', label: 'ID Card Designer', icon: CreditCard, badge: 'CR80', desc: '85.6×54mm cards with QR credential' },
  ];

  const handleNavClick = (page: PageName) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
  };

  const handleToolSelect = (tool: ToolType) => {
    navigateToTool(tool);
    setToolsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/[0.03] backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <button 
            onClick={() => handleNavClick('landing')} 
            className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                PrintPilot <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">AI</span>
              </span>
              <span className="text-[10px] text-gray-400 block -mt-1 font-medium">Browser-Local Print Production Toolkit</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleNavClick('landing')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                currentPage === 'landing'
                  ? 'text-white bg-white/10 border border-white/10 backdrop-blur-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>

            {/* AI Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  currentPage === 'tools-hub'
                    ? 'text-white bg-white/10 border border-white/10 backdrop-blur-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Tools Hub</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu */}
              {toolsDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-80 rounded-2xl bg-[#090d16]/90 backdrop-blur-md border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setToolsDropdownOpen(false)}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
                    12 Print Production Tools
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-96 overflow-y-auto">
                    {toolsList.map((tool) => {
                      const IconComp = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolSelect(tool.id)}
                          className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors group"
                        >
                          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white group-hover:text-blue-300">
                                {tool.label}
                              </span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                                {tool.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {tool.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  currentPage === 'dashboard'
                    ? 'text-white bg-white/10 border border-white/10 backdrop-blur-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Dashboard</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('faq')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                currentPage === 'faq'
                  ? 'text-white bg-white/10 border border-white/10 backdrop-blur-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>FAQ</span>
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                currentPage === 'contact'
                  ? 'text-white bg-white/10 border border-white/10 backdrop-blur-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Contact</span>
            </button>
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium flex items-center space-x-2 transition-all ${
                    currentPage === 'profile'
                      ? 'border-blue-500/50 bg-blue-500/20 text-white backdrop-blur-sm'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {shopProfile.shopName.charAt(0)}
                  </div>
                  <span className="max-w-[120px] truncate">{shopProfile.shopName}</span>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center space-x-1.5"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span>Log In</span>
                </button>

                <button
                  onClick={() => handleNavClick('signup')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Start Free</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleNavClick('landing')}
              className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('tools-hub')}
              className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Tools Hub (12 Tools)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">Hub</span>
            </button>

            {isLoggedIn && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-500" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavClick('profile')}
                  className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Shop Profile ({shopProfile.shopName})</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleNavClick('faq')}
              className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>FAQ & Pre-Press Specs</span>
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Contact & Support</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-medium text-sm text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNavClick('signup')}
                  className="py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm text-center shadow"
                >
                  Start Free
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
