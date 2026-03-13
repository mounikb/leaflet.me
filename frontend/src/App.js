import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import GardenPage from './pages/GardenPage';
import TopicPage from './pages/TopicPage';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'garden' | 'topic'
  const [gardenUsername, setGardenUsername] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [gardenTopics, setGardenTopics] = useState([]);
  const [dragMode, setDragMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkPageFromUrl();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function checkPageFromUrl() {
    const path = window.location.pathname.replace('/', '');
    const parts = path.split('/');
    if (parts[0]) {
      setGardenUsername(parts[0]);
      if (parts[1]) {
        setCurrentTopic(parts[1]);
        setCurrentPage('topic');
      } else {
        setCurrentPage('garden');
      }
    }
  }

  async function handlePlantClick() {
    if (!session) { setShowAuth(true); return; }

    // Always fetch username from profiles table — most reliable source
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, onboarded')
      .eq('id', session.user.id)
      .single();

    // Fall back to user_metadata username, then email prefix as last resort
    const username = profile?.username
      || session.user.user_metadata?.username
      || session.user.email.split('@')[0];

    if (profile?.onboarded) {
      navigateToGarden(username);
    } else {
      setShowOnboarding(true);
    }
  }

  function navigateToGarden(username) {
    setGardenUsername(username);
    setCurrentTopic(null);
    setCurrentPage('garden');
    setGardenTopics([]);
    window.history.pushState({}, '', `/${username}`);
  }

  function navigateToTopic(topic) {
    setCurrentTopic(topic);
    setCurrentPage('topic');
    window.history.pushState({}, '', `/${gardenUsername}/${topic.toLowerCase()}`);
  }

  function goHome() {
    setCurrentPage('home');
    setGardenUsername(null);
    setCurrentTopic(null);
    setGardenTopics([]);
    window.history.pushState({}, '', '/');
  }

  function goToGarden() {
    setCurrentTopic(null);
    setCurrentPage('garden');
    window.history.pushState({}, '', `/${gardenUsername}`);
  }

  return (
    <>
      <Navbar
        session={session}
        onAuthClick={() => setShowAuth(true)}
        onLogoClick={goHome}
        gardenTopics={currentPage !== 'home' ? gardenTopics : []}
        gardenUsername={currentPage !== 'home' ? gardenUsername : null}
        activeTopic={currentPage === 'topic' ? currentTopic : gardenUsername}
        onTopicClick={(t) => {
          if (t === gardenUsername) { goToGarden(); }
          else { navigateToTopic(t); }
        }}
        isOwnerGarden={
          currentPage !== 'home' &&
          session?.user &&
          (session.user.user_metadata?.username === gardenUsername ||
           session.user.email?.split('@')[0] === gardenUsername)
        }
        dragMode={dragMode}
        onDragModeToggle={() => setDragMode(d => !d)}
      />

      {currentPage === 'home' && (
        <HomePage onAuthClick={handlePlantClick} />
      )}

      {currentPage === 'garden' && (
        <GardenPage
          username={gardenUsername}
          session={session}
          onTopicsLoaded={setGardenTopics}
          onNavigateToTopic={navigateToTopic}
          dragMode={dragMode}
        />
      )}

      {currentPage === 'topic' && (
        <TopicPage
          username={gardenUsername}
          topic={currentTopic}
          session={session}
          onBack={goToGarden}
          dragMode={dragMode}
        />
      )}

      {currentPage === 'home' && <Footer />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showOnboarding && (
        <OnboardingModal
          session={session}
          onComplete={(username) => { setShowOnboarding(false); navigateToGarden(username); }}
          onSkip={(username) => { setShowOnboarding(false); navigateToGarden(username); }}
        />
      )}
    </>
  );
}