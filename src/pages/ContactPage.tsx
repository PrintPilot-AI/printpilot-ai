import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, Printer } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Technical Pre-press Inquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pre-press Support Team</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Contact PrintPilot Support
        </h1>
        <p className="text-sm text-slate-400">
          Need help calibrating your RIP software or configuring Firebase credentials? Our technical team is on call.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact info card */}
        <div className="space-y-6 p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">PrintPilot AI Support</h3>
              <p className="text-xs text-slate-400">Pre-press & Technical Services</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Email Desk</p>
                <p className="text-slate-400">support@printpilot.ai</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Operator Phone Line</p>
                <p className="text-slate-400">+1 (800) 555-PRINT (77468)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Global Headquarters</p>
                <p className="text-slate-400">500 Commercial Press Blvd, Suite 400<br />Chicago, IL 60607, USA</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Operating Hours</p>
                <p className="text-slate-400">Mon - Sat: 6:00 AM - 10:00 PM CST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800">
          {sent ? (
            <div className="p-8 text-center space-y-4 bg-emerald-950/50 border border-emerald-800 rounded-2xl animate-in fade-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Message Dispatched!</h3>
              <p className="text-xs text-slate-300">
                Thank you for contacting PrintPilot AI support. A pre-press technician will respond within 2 business hours.
              </p>
              <button
                onClick={() => setSent(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@printshop.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Inquiry Category</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                >
                  <option value="Technical Pre-press Inquiry">Technical Pre-press Inquiry</option>
                  <option value="Press Diagnostic Calibration">Press Diagnostic Calibration</option>
                  <option value="Enterprise RIP API Access">Enterprise RIP API Access</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, press specs, or issue..."
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
