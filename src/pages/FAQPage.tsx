import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, FileText, Printer, ShieldCheck } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = ['All', 'Pre-flight & File Specs', 'AI Print Doctor', 'Color & CMYK', 'Cost Estimating'];

  const faqItems = [
    {
      category: 'Pre-flight & File Specs',
      question: 'What is the ideal DPI resolution for handheld flyers vs outdoor banners?',
      answer: 'Handheld flyers, brochures, and visiting cards viewed up close require 300 DPI at 100% scale. For large format flex banners (e.g. 10x4ft billboards viewed from 10+ feet away), 100 DPI to 150 DPI is standard to keep file sizes manageable while delivering razor-sharp optical clarity.'
    },
    {
      category: 'Pre-flight & File Specs',
      question: 'Why is 3mm bleed margin essential for commercial printing?',
      answer: 'Guillotine paper cutters have a minor mechanical tolerance (+/- 1mm). Bleed extends artwork beyond the final trim line so that after cutting, there are no unprinted white paper slivers along edges.'
    },
    {
      category: 'AI Print Doctor',
      question: 'How does the AI Print Doctor diagnose horizontal roller banding?',
      answer: 'Horizontal banding is usually caused by dampening roller nip pressure imbalance, worn doctor blades, or gear chatter. The AI analyzes your press model and paper GSM to recommend mechanical adjustment values and solvent viscosity settings.'
    },
    {
      category: 'Color & CMYK',
      question: 'What happens when an RGB file is printed on a CMYK offset press without conversion?',
      answer: 'RGB screen colors have a wider bright gamut (cyan, magenta, lime green). When directly sent to CMYK plates without gamut mapping, bright blues shift toward dull purple and neon greens become muddy olive. PrintPilot AI Color Advisor detects shifts beforehand and recommends exact Pantone PMS spot matches.'
    },
    {
      category: 'Cost Estimator',
      question: 'How does the AI Print Cost Estimator calculate gang-run sheet utilization?',
      answer: 'The Cost Estimator uses a nesting algorithm calculating how many "ups" (e.g. 8-up on 19x25" parent sheet) fit with gripper margins, cut gutters, and trim marks, minimizing paper waste percentage.'
    }
  ];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Knowledge Base & Specs</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-400">
          Commercial pre-press standards, press troubleshooting guides, and AI tool usage documentation.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto pt-4">
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-7" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions (e.g., DPI, bleed, banding, CMYK)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-xl"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No FAQ items match your query.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between space-x-4 font-bold text-white hover:text-indigo-400 transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">{faq.category}</span>
                  <p className="text-sm sm:text-base text-slate-100">{faq.question}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openIndex === idx ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>

              {openIndex === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
