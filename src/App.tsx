import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ToolsHubPage } from './pages/ToolsHubPage';
import { ProfilePage } from './pages/ProfilePage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';

const AppContent: React.FC = () => {
  const { currentPage } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'signup':
        return <SignupPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'tools-hub':
        return <ToolsHubPage />;
      case 'profile':
        return <ProfilePage />;
      case 'faq':
        return <FAQPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Frosted Glass Background Ambient Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-[40%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <Navbar />
        <main className="flex-1">
          {renderPage()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
