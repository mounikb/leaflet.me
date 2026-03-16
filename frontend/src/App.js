import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import GardenPage from './pages/GardenPage';
import TopicPage from './pages/TopicPage';
import DiscoverPage from './pages/DiscoverPage';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import EditProfileModal from './components/EditProfileModal';
import UsernameSetupModal from './components/UsernameSetupModal';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'garden' | 'topic' | 'discover'
  const [gardenUsername, setGardenUsername] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [gardenTopics, setGardenTopics] = useState([]);
  const [dragMode, setDragMode] = useState(false);
  const [gardenRefreshKey, setGardenRefreshKey] = useState(0);
  const [planting, setPlanting] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileTab, setEditProfileTab] = useState('bio');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      checkPageFromUrl();
      if (session) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (prof) setProfileData(prof);
      }
    });

    // Global edit profile event listeners
    const onEditBio    = () => { setEditProfileTab('bio');    setShowEditProfile(true); };
    const onEditTopics = () => { setEditProfileTab('topics'); setShowEditProfile(true); };
    window.addEventListener('leaflet:editbio',    onEditBio);
    window.addEventListener('leaflet:edittopics', onEditTopics);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuth(false);
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setProfileData(data);
          } else if (!session.user.user_metadata?.username) {
            // Google OAuth user with no profile yet
            setShowUsernameSetup(true);
          }
        });
      } else {
        // Signed out — go home and clear state
        setCurrentPage('home');
        setGardenUsername(null);
        setCurrentTopic(null);
        setGardenTopics([]);
        window.history.pushState({}, '', '/');
      }
    });

    // Bug 3: Browser back/forward button support
    function handlePopState() {
      checkPageFromUrl();
    }
    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('leaflet:editbio', onEditBio);
      window.removeEventListener('leaflet:edittopics', onEditTopics);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function checkPageFromUrl() {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'gardens' || path === 'discover') { setCurrentPage('discover'); return; }
    const parts = path.split('/');
    if (parts[0]) {
      setGardenUsername(parts[0]);
      if (parts[1]) {
        // Keep raw URL casing; TopicPage will query case-insensitively
        setCurrentTopic(parts[1]);
        setCurrentPage('topic');
      } else {
        setCurrentPage('garden');
      }
    }
  }


  function navigateToDiscover() {
    setCurrentPage('discover');
    setGardenUsername(null);
    setCurrentTopic(null);
    setGardenTopics([]);
    setDragMode(false);
    window.history.pushState({}, '', '/gardens');
  }

  async function handlePlantClick() {
    if (!session) { setShowAuth(true); return; }
    if (planting) return;
    setPlanting(true);

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
      setPlanting(false);
      navigateToGarden(username);
    } else {
      setPlanting(false);
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
    // Keep gardenTopics — same user, topics don't change
    window.history.pushState({}, '', `/${gardenUsername}/${topic.toLowerCase()}`);
  }

  function goHome() {
    setCurrentPage('home');
    setGardenUsername(null);
    setCurrentTopic(null);
    setGardenTopics([]);
    setDragMode(false);
    window.history.pushState({}, '', '/');
  }

  function goToGarden() {
    setCurrentTopic(null);
    setCurrentPage('garden');
    setGardenRefreshKey(k => k + 1);
    window.history.pushState({}, '', `/${gardenUsername}`);
  }

  const isOwnerGarden =
    currentPage !== 'home' && currentPage !== 'discover' &&
    !!session?.user &&
    (session.user.user_metadata?.username === gardenUsername ||
     session.user.email?.split('@')[0] === gardenUsername ||
     profileData?.username === gardenUsername);

  return (
    <div className="appShell">
      <div className="appFrame">
      <Navbar
        session={session}
        onAuthClick={() => setShowAuth(true)}
        onLogoClick={goHome}
        onDiscoverClick={navigateToDiscover}
        onAboutClick={() => { setGardenUsername('leaflet'); setCurrentTopic(null); setCurrentPage('garden'); setGardenTopics([]); setGardenRefreshKey(k => k+1); window.history.pushState({}, '', '/leaflet'); }}
        gardenTopics={currentPage !== 'home' && currentPage !== 'discover' ? gardenTopics : []}
        gardenUsername={currentPage !== 'home' && currentPage !== 'discover' ? gardenUsername : null}
        activeTopic={currentPage === 'topic' ? currentTopic : gardenUsername}
        onTopicClick={(t) => {
          if (t === gardenUsername) { goToGarden(); }
          else { navigateToTopic(t); }
        }}
        isOwnerGarden={isOwnerGarden}
        dragMode={dragMode}
        onDragModeToggle={() => setDragMode(d => !d)}
      />

      {currentPage === 'home' && (
        <HomePage onAuthClick={handlePlantClick} planting={planting} />
      )}

      {currentPage === 'discover' && (
        <DiscoverPage onVisitGarden={(username) => {
          setGardenUsername(username);
          setCurrentPage('garden');
          setGardenTopics([]);
          window.history.pushState({}, '', `/${username}`);
        }} />
      )}

      {currentPage === 'garden' && (
        <GardenPage
          key={gardenRefreshKey}
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
          onTopicsLoaded={setGardenTopics}
          onNavigateToTopic={navigateToTopic}
        />
      )}

      {currentPage === 'home' && <Footer />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showUsernameSetup && session && (
        <UsernameSetupModal
          session={session}
          onComplete={(username) => {
            setShowUsernameSetup(false);
            setShowOnboarding(true);
          }}
        />
      )}

      {showEditProfile && profileData && (
        <EditProfileModal
          profile={profileData}
          initialTab={editProfileTab}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => { setProfileData({ ...profileData, ...updated }); setShowEditProfile(false); }}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          session={session}
          onComplete={(username) => { setShowOnboarding(false); navigateToGarden(username); }}
          onSkip={(username) => { setShowOnboarding(false); navigateToGarden(username); }}
        />
      )}
    </div>
    </div>
  );
}