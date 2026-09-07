import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../lib/firebase';

export interface PrintShopProfile {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  primaryPrintTech: string; // e.g. "Digital Offset & Flex"
  defaultPaperStock: string; // e.g. "300 GSM Matte Art Card"
  defaultBleed: string; // e.g. "3mm"
}

export interface SavedPrintJob {
  id: string;
  title: string;
  toolType: string; // 'Doctor', 'Poster', 'Card', 'Preflight', 'Cost', 'Color', 'Resume', 'Enhance'
  status: 'Ready' | 'Warning' | 'Action Required' | 'Completed';
  summary: string;
  timestamp: string;
  details?: any;
}

export type PageName = 
  | 'landing' 
  | 'login' 
  | 'signup' 
  | 'forgot-password' 
  | 'dashboard' 
  | 'tools-hub' 
  | 'profile' 
  | 'faq' 
  | 'contact';

export type ToolType = 
  | 'doctor' 
  | 'poster' 
  | 'card' 
  | 'resume' 
  | 'enhance' 
  | 'cost' 
  | 'color' 
  | 'preflight'
  | 'passport'
  | 'order-wizard'
  | 'paper-manager'
  | 'idcard'
  | 'certificate'
  | 'pdf-tools';

interface AuthContextType {
  user: User | null;
  demoUser: { email: string; displayName: string } | null;
  isLoggedIn: boolean;
  currentPage: PageName;
  activeTool: ToolType;
  shopProfile: PrintShopProfile;
  jobHistory: SavedPrintJob[];
  setCurrentPage: (page: PageName) => void;
  setActiveTool: (tool: ToolType) => void;
  navigateToTool: (tool: ToolType) => void;
  handleGoogleLogin: () => Promise<void>;
  handleDemoLogin: () => void;
  handleLogout: () => Promise<void>;
  updateShopProfile: (profile: Partial<PrintShopProfile>) => void;
  savePrintJob: (job: Omit<SavedPrintJob, 'id' | 'timestamp'>) => void;
  deletePrintJob: (id: string) => void;
}

const defaultProfile: PrintShopProfile = {
  shopName: 'Apex Graphic Press',
  ownerName: 'Alex Vance',
  email: 'alex@apexgraphics.com',
  phone: '+1 (555) 019-2834',
  address: '102 Industrial Parkway, San Jose, CA',
  gstNumber: 'US-CA9821034',
  primaryPrintTech: 'Commercial Digital & Offset',
  defaultPaperStock: '300 GSM Gloss Art Card',
  defaultBleed: '3mm (0.125 in)',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<{ email: string; displayName: string } | null>({
    email: 'demo@printpilot.ai',
    displayName: 'Apex Graphic Press'
  });
  const [currentPage, setCurrentPage] = useState<PageName>('landing');
  const [activeTool, setActiveTool] = useState<ToolType>('preflight');
  const [shopProfile, setShopProfile] = useState<PrintShopProfile>(defaultProfile);
  const [jobHistory, setJobHistory] = useState<SavedPrintJob[]>(() => {
    try {
      const saved = localStorage.getItem('printpilot_jobs');
      return saved ? (JSON.parse(saved) as SavedPrintJob[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setDemoUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('printpilot_jobs', JSON.stringify(jobHistory));
  }, [jobHistory]);

  const isLoggedIn = !!user || !!demoUser;

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setCurrentPage('dashboard');
    } catch (e) {
      console.warn('Google sign in fallback to demo account', e);
      handleDemoLogin();
    }
  };

  const handleDemoLogin = () => {
    setDemoUser({
      email: 'alex@apexgraphics.com',
      displayName: 'Apex Graphic Press'
    });
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setDemoUser(null);
    setCurrentPage('landing');
  };

  const navigateToTool = (tool: ToolType) => {
    setActiveTool(tool);
    setCurrentPage('tools-hub');
  };

  const updateShopProfile = (updated: Partial<PrintShopProfile>) => {
    setShopProfile((prev) => ({ ...prev, ...updated }));
  };

  const savePrintJob = (job: Omit<SavedPrintJob, 'id' | 'timestamp'>) => {
    const newJob: SavedPrintJob = {
      ...job,
      id: 'job-' + Date.now(),
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setJobHistory((prev) => [newJob, ...prev]);
  };

  const deletePrintJob = (id: string) => {
    setJobHistory((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        demoUser,
        isLoggedIn,
        currentPage,
        activeTool,
        shopProfile,
        jobHistory,
        setCurrentPage,
        setActiveTool,
        navigateToTool,
        handleGoogleLogin,
        handleDemoLogin,
        handleLogout,
        updateShopProfile,
        savePrintJob,
        deletePrintJob
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
