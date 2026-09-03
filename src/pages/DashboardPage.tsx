import React, { useState } from 'react';
import { useAuth, ToolType, SavedPrintJob } from '../context/AuthContext';
import { 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  Stethoscope, 
  Image as ImageIcon, 
  CreditCard, 
  Sliders, 
  Palette, 
  ArrowRight,
  Filter,
  Check,
  AlertTriangle,
  Building,
  Award,
  Layers
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { shopProfile, jobHistory, navigateToTool, deletePrintJob, setCurrentPage } = useAuth();
  
  const [filterTool, setFilterTool] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<SavedPrintJob | null>(null);

  const [activeCategory, setActiveCategory] = useState<'all' | 'doc' | 'photo' | 'design' | 'print'>('all');

  const toolsLaunchList: { id: ToolType; label: string; icon: any; color: string; desc: string; category: 'doc' | 'photo' | 'design' | 'print'; categoryLabel: string }[] = [
    // Printing Tools
    { id: 'order-wizard', label: '7-Step Print Order Wizard', icon: Sparkles, color: 'from-blue-600 to-indigo-700', desc: 'Guided order workflow & RIP quote', category: 'print', categoryLabel: 'Printing' },
    { id: 'paper-manager', label: 'Paper Size & Quality', icon: Sliders, color: 'from-blue-500 to-cyan-600', desc: 'A3-A6, GSM stocks & finishes', category: 'print', categoryLabel: 'Printing' },
    { id: 'doctor', label: 'AI Print Doctor', icon: Stethoscope, color: 'from-amber-500 to-red-500', desc: 'Fix banding & dampening defects', category: 'print', categoryLabel: 'Printing' },

    // Photo Tools
    { id: 'passport', label: 'Passport Photo Maker', icon: ImageIcon, color: 'from-emerald-500 to-teal-600', desc: 'Auto bg removal & A4 sheet layout', category: 'photo', categoryLabel: 'Photo' },
    { id: 'idcard', label: 'ID Card Designer', icon: CreditCard, color: 'from-blue-600 to-teal-600', desc: 'CR80 PVC School & Office ID cards', category: 'photo', categoryLabel: 'Photo' },
    { id: 'enhance', label: 'AI Image Enhancer', icon: Sliders, color: 'from-indigo-500 to-blue-600', desc: 'DPI calculator & sharpening', category: 'photo', categoryLabel: 'Photo' },

    // Document Tools
    { id: 'resume', label: 'AI Resume Builder V2', icon: FileText, color: 'from-emerald-600 to-cyan-600', desc: 'ATS, Pakistani & Gulf print specs', category: 'doc', categoryLabel: 'Document' },
    { id: 'certificate', label: 'Certificate Generator', icon: Award, color: 'from-amber-500 to-yellow-600', desc: '300 DPI School & Course Certificates', category: 'doc', categoryLabel: 'Document' },
    { id: 'pdf-tools', label: 'PDF Toolkit Pro', icon: Layers, color: 'from-sky-500 to-blue-600', desc: 'Merge, split, compress & convert PDFs', category: 'doc', categoryLabel: 'Document' },
    { id: 'preflight', label: 'AI Readiness Checker', icon: CheckCircle2, color: 'from-teal-500 to-emerald-600', desc: 'Verify 300 DPI, CMYK & Bleeds', category: 'doc', categoryLabel: 'Document' },
    { id: 'cost', label: 'AI Print Cost Estimator', icon: DollarSign, color: 'from-cyan-500 to-blue-600', desc: 'Paper GSM, ink & profit quote', category: 'doc', categoryLabel: 'Document' },

    // Design Tools
    { id: 'poster', label: 'AI Poster Generator', icon: ImageIcon, color: 'from-indigo-500 to-purple-600', desc: 'Draft 300 DPI vector posters', category: 'design', categoryLabel: 'Design' },
    { id: 'card', label: 'AI Visiting Card V2', icon: CreditCard, color: 'from-purple-500 to-pink-600', desc: 'Double-sided vector cards', category: 'design', categoryLabel: 'Design' },
    { id: 'color', label: 'AI Color Advisor', icon: Palette, color: 'from-fuchsia-500 to-rose-600', desc: 'RGB to CMYK & Pantone codes', category: 'design', categoryLabel: 'Design' },
  ];

  const filteredJobs = jobHistory.filter((job) => {
    if (filterTool === 'all') return true;
    return job.toolType.toLowerCase() === filterTool.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Dashboard Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-blue-900/40 to-slate-900 border border-indigo-700/40 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Operator Workspace
            </span>
            <span className="text-xs text-slate-400 font-mono">{shopProfile.primaryPrintTech}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {shopProfile.shopName} Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Welcome back, <span className="text-indigo-300 font-semibold">{shopProfile.ownerName}</span>. Your AI pre-press engine is active and ready.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateToTool('preflight')}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>New Pre-flight Audit</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('profile')}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* METRICS STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Jobs Processed Today</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">18 <span className="text-xs font-normal text-slate-400">jobs</span></p>
          <p className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24% vs yesterday</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Pre-flight Pass Avg</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">96.4%</p>
          <p className="text-xs text-slate-400">Zero press rejections this week</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>AI Cost Saved</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">$1,420.00</p>
          <p className="text-xs text-emerald-400 font-medium">Estimated pre-press hours saved</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Default Paper Preference</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-base font-bold text-white truncate">{shopProfile.defaultPaperStock}</p>
          <p className="text-xs text-slate-400">Bleed: {shopProfile.defaultBleed}</p>
        </div>

      </div>

      {/* QUICK LAUNCH AI TOOLS GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>AI Tools Hub Categories</span>
          </h2>

          {/* Category Filter Badges */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'all', label: 'All Tools' },
              { id: 'doc', label: '📄 Document' },
              { id: 'photo', label: '🖼️ Photo' },
              { id: 'design', label: '🎨 Design' },
              { id: 'print', label: '🖨️ Printing' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {toolsLaunchList
            .filter((t) => activeCategory === 'all' || t.category === activeCategory)
            .map((tool) => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigateToTool(tool.id)}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all group flex items-start space-x-3.5"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${tool.color} text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {tool.label}
                      </h3>
                    </div>
                    <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mt-0.5">
                      {tool.categoryLabel}
                    </span>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* RECENT PRINT JOBS & PRE-FLIGHT AUDITS */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Print Jobs & Audits</h2>
            <p className="text-xs text-slate-400">History of AI Print Doctor diagnoses, pre-flight certificates, and card drafts</p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Tools</option>
              <option value="Preflight">Pre-flight</option>
              <option value="Doctor">Print Doctor</option>
              <option value="Card">Visiting Card</option>
              <option value="Cost">Cost Estimator</option>
            </select>
          </div>
        </div>

        {/* Job List Table */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No jobs found for the selected filter.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{job.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      job.status === 'Ready' || job.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded font-mono">
                      {job.toolType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{job.summary}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{job.timestamp}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePrintJob(job.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/50 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">{selectedJob.title}</h3>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            
            <div className="space-y-2 text-xs text-slate-300">
              <p><span className="text-slate-500 font-medium">Tool Module:</span> {selectedJob.toolType}</p>
              <p><span className="text-slate-500 font-medium">Status:</span> {selectedJob.status}</p>
              <p><span className="text-slate-500 font-medium">Logged At:</span> {selectedJob.timestamp}</p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 mt-2">
                {selectedJob.summary}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
