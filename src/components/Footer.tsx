import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, navigateToTool } = useAuth();

  return (
    <footer className="bg-white/[0.02] text-gray-400 border-t border-white/5 backdrop-blur-md transition-colors z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-white/5">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PrintPilot <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">AI</span>
              </span>
            </div>
            
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              A browser-local print production toolkit for commercial printers, digital print shops, sign shops and packaging teams. Every tool runs deterministic print math client-side — no external AI or file uploads.
            </p>

            <div className="flex items-center space-x-3 text-xs text-gray-400 pt-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Runs 100% Locally</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">Exact DPI &amp; Print Specs</span>
            </div>
          </div>

          {/* Tools Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Tools</span>
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => navigateToTool('passport')} className="hover:text-blue-400 transition-colors">
                  Passport Photo Maker
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('preflight')} className="hover:text-blue-400 transition-colors">
                  Pre-flight Checker
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('doctor')} className="hover:text-blue-400 transition-colors">
                  Print Doctor
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('enhance')} className="hover:text-blue-400 transition-colors">
                  Image Enhancer
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('pdf-tools')} className="hover:text-blue-400 transition-colors">
                  PDF Toolkit
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('cost')} className="hover:text-blue-400 transition-colors">
                  Print Cost Estimator
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('color')} className="hover:text-blue-400 transition-colors">
                  Colour Advisor
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => setCurrentPage('landing')} className="hover:text-white transition-colors">
                  Landing Page
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('tools-hub')} className="hover:text-white transition-colors">
                  Tools Hub
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('faq')} className="hover:text-white transition-colors">
                  FAQ & Pre-Press Specs
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} className="hover:text-white transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('login')} className="hover:text-white transition-colors">
                  Sign In / Register
                </button>
              </li>
            </ul>
          </div>

          {/* Future Innovations */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Future Roadmap
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center justify-between">
                <span>WhatsApp Ordering</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">Soon</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Cloud Direct Print</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">Soon</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Invoice &amp; GST</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">Soon</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Mobile iOS/Android</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">Q4</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} PrintPilot AI — Browser-Local Print Production Toolkit.</p>
          <div className="flex items-center space-x-6">
            <button onClick={() => setCurrentPage('faq')} className="hover:text-gray-400 transition-colors">Privacy & Security</button>
            <button onClick={() => setCurrentPage('contact')} className="hover:text-gray-400 transition-colors">System Support</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
