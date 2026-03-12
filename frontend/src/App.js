import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthModal from './components/AuthModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false); // close modal on login
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Navbar session={session} onAuthClick={() => setShowAuth(true)} />
      <HomePage onAuthClick={() => setShowAuth(true)} />
      <Footer />

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}