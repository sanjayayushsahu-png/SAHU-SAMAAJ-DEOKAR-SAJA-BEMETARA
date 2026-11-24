import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner3D from './components/HeroBanner3D';
import FeedSection from './components/FeedSection';
import SahityaSection from './components/SahityaSection';
import ItihasSection from './components/ItihasSection';
import DirectoryEventsSection from './components/DirectoryEventsSection';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import {
  INITIAL_POSTS,
  INITIAL_SAHITYA,
  INITIAL_HISTORY,
  INITIAL_SAMAJ_RATNA,
  INITIAL_DIRECTORY,
  INITIAL_DHARMASHALAS,
  INITIAL_EVENTS,
} from './data/chhattisgarhData';
import { t } from './utils/i18n';
import { api, getAuthToken, setAuthToken } from './utils/api';

const STORAGE_KEYS = {
  posts: 'sscg_posts_v1',
  sahitya: 'sscg_sahitya_v1',
  history: 'sscg_history_v1',
  events: 'sscg_events_v1',
  directory: 'sscg_directory_v1',
  dharmashalas: 'sscg_dharmashalas_v1',
  samajRatna: 'sscg_ratna_v1',
  user: 'sscg_user_v1',
  lang: 'sscg_lang_v1',
  fontScale: 'sscg_font_scale_v1',
  requireApproval: 'sscg_req_approval_v1',
};

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [lang, setLang] = useState(() => loadState(STORAGE_KEYS.lang, 'hi'));
  const [fontScale, setFontScale] = useState(() => loadState(STORAGE_KEYS.fontScale, 1));
  const [currentUser, setCurrentUser] = useState(() => loadState(STORAGE_KEYS.user, null));
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [requireApproval, setRequireApproval] = useState(() =>
    loadState(STORAGE_KEYS.requireApproval, true)
  );

  const [posts, setPosts] = useState(() => loadState(STORAGE_KEYS.posts, INITIAL_POSTS));
  const [sahitya, setSahitya] = useState(() => loadState(STORAGE_KEYS.sahitya, INITIAL_SAHITYA));
  const [historyItems, setHistoryItems] = useState(() =>
    loadState(STORAGE_KEYS.history, INITIAL_HISTORY)
  );
  const [events, setEvents] = useState(() => loadState(STORAGE_KEYS.events, INITIAL_EVENTS));
  const [directory, setDirectory] = useState(() =>
    loadState(STORAGE_KEYS.directory, INITIAL_DIRECTORY)
  );
  const [dharmashalas, setDharmashalas] = useState(() =>
    loadState(STORAGE_KEYS.dharmashalas, INITIAL_DHARMASHALAS)
  );
  const [samajRatna, setSamajRatna] = useState(() =>
    loadState(STORAGE_KEYS.samajRatna, INITIAL_SAMAJ_RATNA)
  );

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [serverConnected, setServerConnected] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toast, setToast] = useState('');

  // Sync with MySQL backend on startup & whenever tab becomes visible again
  useEffect(() => {
    let active = true;
    const syncFromServer = () => {
      api
        .bootstrap()
        .then((data) => {
          if (!active || !data) return;
          setServerConnected(true);
          if (Array.isArray(data.posts)) setPosts(data.posts);
          if (Array.isArray(data.sahitya) && data.sahitya.length > 0) setSahitya(data.sahitya);
          if (Array.isArray(data.historyItems) && data.historyItems.length > 0) {
            setHistoryItems(data.historyItems);
          }
          if (Array.isArray(data.events) && data.events.length > 0) setEvents(data.events);
          if (Array.isArray(data.directory) && data.directory.length > 0) {
            setDirectory(data.directory);
          }
          if (Array.isArray(data.dharmashalas) && data.dharmashalas.length > 0) {
            setDharmashalas(data.dharmashalas);
          }
          if (Array.isArray(data.samajRatna) && data.samajRatna.length > 0) {
            setSamajRatna(data.samajRatna);
          }
          if (typeof data.requireApproval === 'boolean') {
            setRequireApproval(data.requireApproval);
          }
        })
        .catch(() => {
          if (active) setServerConnected(false);
        });
    };

    syncFromServer();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncFromServer();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Auto-issue server auth token if user logged in earlier while offline
  useEffect(() => {
    if (!serverConnected || !currentUser || getAuthToken()) return;
    if (currentUser.role === 'member' && currentUser.mobile) {
      api
        .loginMember({
          name: currentUser.name,
          mobile: currentUser.mobile,
          district: currentUser.district,
          districtHi: currentUser.districtHi,
          blockVillage: currentUser.blockVillage || 'Chhattisgarh',
        })
        .then((res) => {
          if (res?.token) setAuthToken(res.token);
        })
        .catch(() => {});
    }
  }, [serverConnected, currentUser]);

  // Persist offline cache in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
    } catch {
      // Ignore quota exceeded for large uploads
    }
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sahitya, JSON.stringify(sahitya));
  }, [sahitya]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(historyItems));
  }, [historyItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.directory, JSON.stringify(directory));
  }, [directory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dharmashalas, JSON.stringify(dharmashalas));
  }, [dharmashalas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.samajRatna, JSON.stringify(samajRatna));
  }, [samajRatna]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lang, JSON.stringify(lang));
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontScale, JSON.stringify(fontScale));
    document.documentElement.style.fontSize = `${Math.round(fontScale * 16)}px`;
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.requireApproval, JSON.stringify(requireApproval));
  }, [requireApproval]);

  // Offline & PWA Install listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(
      user.role === 'super_admin'
        ? t(lang, 'सुपर एडमिन संजय कुमार साहू के रूप में लॉगिन सफल!', 'Signed in as Super Admin Sanjay Kumar Sahu!')
        : t(lang, `स्वागत है, ${user.name}!`, `Welcome, ${user.name}!`)
    );
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    if (activeTab === 'admin') setActiveTab('feed');
    showToast(t(lang, 'आप सफलतापूर्वक लॉग आउट हो गए हैं।', 'You have signed out.'));
  };

  // Feed Actions (with MySQL API sync + clear error handling)
  const handleCreatePost = async (newPostData) => {
    if (serverConnected) {
      try {
        const created = await api.createPost(newPostData);
        setPosts((prev) => [created, ...prev]);
        showToast(
          created.status === 'approved'
            ? t(lang, 'आपकी पोस्ट सर्वर पर लाइव प्रकाशित हो गई!', 'Your post is now live on the server!')
            : t(lang, 'पोस्ट एडमिन स्वीकृति के लिए सर्वर पर भेजी गई है।', 'Post submitted to server for Admin approval.')
        );
        return;
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          setAuthToken('');
          setAuthModalOpen(true);
          showToast(
            t(
              lang,
              'सत्र समाप्त हो गया — सर्वर पर पोस्ट सेव करने के लिए कृपया एक बार फिर लॉगिन करें।',
              'Session expired — please sign in again to save your post to the server.'
            )
          );
          return;
        }
        showToast(
          t(
            lang,
            `सर्वर पर पोस्ट सेव नहीं हो सकी: ${err?.message || 'त्रुटि'}`,
            `Could not save post to server: ${err?.message || 'Error'}`
          )
        );
        return;
      }
    }

    const isAdmin = currentUser?.role === 'super_admin';
    const post = {
      id: `post-${Date.now()}`,
      ...newPostData,
      featured: false,
      status: isAdmin || !requireApproval ? 'approved' : 'pending',
      authorName: currentUser.nameHi || currentUser.name,
      authorNameEn: currentUser.name,
      authorMobile: currentUser.mobile,
      authorRole: currentUser.role,
      district: currentUser.district,
      districtHi: currentUser.districtHi,
      blockVillage: currentUser.blockVillage,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    setPosts((prev) => [post, ...prev]);
    showToast(
      t(
        lang,
        '⚠️ ऑफ़लाइन मोड: पोस्ट केवल इसी डिवाइस पर सेव हुई है (सभी डिवाइस हेतु Hostinger api/config.php जोड़ें)।',
        '⚠️ Offline mode: Post saved on this device only (configure Hostinger api/config.php for live sync).'
      )
    );
  };

  const handleToggleLike = async (postId) => {
    if (!currentUser) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const exists = p.likes.includes(currentUser.id);
        return {
          ...p,
          likes: exists ? p.likes.filter((id) => id !== currentUser.id) : [...p.likes, currentUser.id],
        };
      })
    );
    if (serverConnected) {
      api.toggleLike(postId).catch(() => {});
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!currentUser) return;
    let newComment = {
      id: `c-${Date.now()}`,
      authorName: currentUser.nameHi || currentUser.name,
      districtHi: currentUser.districtHi,
      text,
      createdAt: new Date().toISOString(),
    };
    if (serverConnected) {
      try {
        newComment = await api.addComment(postId, text);
      } catch {
        // use local fallback comment
      }
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
  };

  const handleApprovePost = (postId) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: 'approved' } : p)));
    if (serverConnected) api.approvePost(postId).catch(() => {});
    showToast(t(lang, 'पोस्ट स्वीकृत कर प्रकाशित की गई।', 'Post approved and published.'));
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (serverConnected) api.deletePost(postId).catch(() => {});
    showToast(t(lang, 'पोस्ट हटा दी गई।', 'Post deleted.'));
  };

  const handleToggleFeatured = (postId) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, featured: !p.featured } : p)));
    if (serverConnected) api.toggleFeatured(postId).catch(() => {});
  };

  const handleSetRequireApproval = (nextVal) => {
    setRequireApproval(nextVal);
    if (serverConnected) api.setRequireApproval(nextVal).catch(() => {});
  };

  // Sahitya, History, Events, Directory, Dharmashala & Samaj Ratna Full CRUD Actions
  const handleAddSahitya = async (item) => {
    let created = { id: `sahitya-${Date.now()}`, ...item };
    if (serverConnected) {
      try {
        created = await api.addSahitya(item);
      } catch {
        // fallback local
      }
    }
    setSahitya((prev) => [created, ...prev]);
    showToast(t(lang, 'नया भजन / साहित्य जोड़ा गया।', 'New Sahitya item added.'));
  };

  const handleUpdateSahitya = async (id, item) => {
    setSahitya((prev) => prev.map((i) => (i.id === id ? { ...i, ...item, id } : i)));
    if (serverConnected) api.updateSahitya(id, item).catch(() => {});
    showToast(t(lang, 'भजन / साहित्य अपडेट किया गया।', 'Sahitya item updated.'));
  };

  const handleDeleteSahitya = (id) => {
    setSahitya((prev) => prev.filter((i) => i.id !== id));
    if (serverConnected) api.deleteSahitya(id).catch(() => {});
    showToast(t(lang, 'भजन / साहित्य हटाया गया।', 'Sahitya item deleted.'));
  };

  const handleAddHistory = async (item) => {
    let created = { id: `hist-${Date.now()}`, ...item };
    if (serverConnected) {
      try {
        created = await api.addHistory(item);
      } catch {
        // fallback local
      }
    }
    setHistoryItems((prev) => [...prev, created]);
    showToast(t(lang, 'इतिहास प्रसंग जोड़ा गया।', 'History entry added.'));
  };

  const handleUpdateHistory = async (id, item) => {
    setHistoryItems((prev) => prev.map((h) => (h.id === id ? { ...h, ...item, id } : h)));
    if (serverConnected) api.updateHistory(id, item).catch(() => {});
    showToast(t(lang, 'इतिहास प्रसंग अपडेट किया गया।', 'History entry updated.'));
  };

  const handleDeleteHistory = (id) => {
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    if (serverConnected) api.deleteHistory(id).catch(() => {});
    showToast(t(lang, 'इतिहास प्रसंग हटाया गया।', 'History entry deleted.'));
  };

  const handleAddEvent = async (ev) => {
    let created = { id: `evt-${Date.now()}`, rsvpCount: 1, rsvpedByMe: false, ...ev };
    if (serverConnected) {
      try {
        created = await api.addEvent(ev);
      } catch {
        // fallback local
      }
    }
    setEvents((prev) => [created, ...prev]);
    showToast(t(lang, 'नया कार्यक्रम प्रकाशित हुआ।', 'New event published.'));
  };

  const handleUpdateEvent = async (id, ev) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...ev, id } : e)));
    if (serverConnected) api.updateEvent(id, ev).catch(() => {});
    showToast(t(lang, 'कार्यक्रम अपडेट किया गया।', 'Event updated.'));
  };

  const handleDeleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (serverConnected) api.deleteEvent(id).catch(() => {});
    showToast(t(lang, 'कार्यक्रम हटाया गया।', 'Event deleted.'));
  };

  const handleAddDirectory = async (member) => {
    let created = { id: `dir-${Date.now()}`, ...member };
    if (serverConnected) {
      try {
        created = await api.addDirectory(member);
      } catch {
        // fallback local
      }
    }
    setDirectory((prev) => [created, ...prev]);
    showToast(t(lang, 'नए पदाधिकारी जोड़े गए।', 'Office bearer added.'));
  };

  const handleUpdateDirectory = async (id, member) => {
    setDirectory((prev) => prev.map((d) => (d.id === id ? { ...d, ...member, id } : d)));
    if (serverConnected) api.updateDirectory(id, member).catch(() => {});
    showToast(t(lang, 'पदाधिकारी विवरण अपडेट किया गया।', 'Office bearer updated.'));
  };

  const handleDeleteDirectory = (id) => {
    setDirectory((prev) => prev.filter((d) => d.id !== id));
    if (serverConnected) api.deleteDirectory(id).catch(() => {});
    showToast(t(lang, 'पदाधिकारी हटाए गए।', 'Office bearer deleted.'));
  };

  const handleAddDharmashala = async (dh) => {
    let created = { id: `dhar-${Date.now()}`, ...dh };
    if (serverConnected) {
      try {
        created = await api.addDharmashala(dh);
      } catch {
        // fallback local
      }
    }
    setDharmashalas((prev) => [created, ...prev]);
    showToast(t(lang, 'नई धर्मशाला / समाज भवन जोड़ा गया।', 'Dharmashala added.'));
  };

  const handleUpdateDharmashala = async (id, dh) => {
    setDharmashalas((prev) => prev.map((d) => (d.id === id ? { ...d, ...dh, id } : d)));
    if (serverConnected) api.updateDharmashala(id, dh).catch(() => {});
    showToast(t(lang, 'धर्मशाला विवरण अपडेट किया गया।', 'Dharmashala updated.'));
  };

  const handleDeleteDharmashala = (id) => {
    setDharmashalas((prev) => prev.filter((d) => d.id !== id));
    if (serverConnected) api.deleteDharmashala(id).catch(() => {});
    showToast(t(lang, 'धर्मशाला हटाई गई।', 'Dharmashala deleted.'));
  };

  const handleAddRatna = async (r) => {
    let created = { id: `ratna-${Date.now()}`, ...r };
    if (serverConnected) {
      try {
        created = await api.addRatna(r);
      } catch {
        // fallback local
      }
    }
    setSamajRatna((prev) => [created, ...prev]);
    showToast(t(lang, 'नया समाज रत्न जोड़ा गया।', 'Samaj Ratna added.'));
  };

  const handleUpdateRatna = async (id, r) => {
    setSamajRatna((prev) => prev.map((x) => (x.id === id ? { ...x, ...r, id } : x)));
    if (serverConnected) api.updateRatna(id, r).catch(() => {});
    showToast(t(lang, 'समाज रत्न अपडेट किया गया।', 'Samaj Ratna updated.'));
  };

  const handleDeleteRatna = (id) => {
    setSamajRatna((prev) => prev.filter((x) => x.id !== id));
    if (serverConnected) api.deleteRatna(id).catch(() => {});
    showToast(t(lang, 'समाज रत्न हटाया गया।', 'Samaj Ratna deleted.'));
  };

  const handleToggleRsvp = (eventId) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const next = !ev.rsvpedByMe;
        if (serverConnected) api.toggleRsvp(eventId, next).catch(() => {});
        return {
          ...ev,
          rsvpedByMe: next,
          rsvpCount: Math.max(0, ev.rsvpCount + (next ? 1 : -1)),
        };
      })
    );
  };

  const handleResetDemo = () => {
    setPosts(INITIAL_POSTS);
    setSahitya(INITIAL_SAHITYA);
    setHistoryItems(INITIAL_HISTORY);
    setEvents(INITIAL_EVENTS);
    setDirectory(INITIAL_DIRECTORY);
    setDharmashalas(INITIAL_DHARMASHALAS);
    setSamajRatna(INITIAL_SAMAJ_RATNA);
    showToast(t(lang, 'डेमो डेटा रीसेट कर दिया गया।', 'Demo data restored.'));
  };

  const pendingCount = posts.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-cream-200 pb-20 lg:pb-0">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lang={lang}
        setLang={setLang}
        fontScale={fontScale}
        setFontScale={setFontScale}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        pendingCount={pendingCount}
        isOffline={isOffline}
      />

      {/* Show 3D Hero Section prominently on Home Feed */}
      {activeTab === 'feed' && (
        <HeroBanner3D
          lang={lang}
          onNavigate={setActiveTab}
          onOpenComposer={() => {
            if (!currentUser) {
              setAuthModalOpen(true);
            } else {
              setShowComposer(true);
            }
          }}
          canInstallPwa={!!deferredPrompt}
          onInstallPwa={handleInstallPwa}
          stats={{
            posts: posts.filter((p) => p.status === 'approved').length,
            events: events.length,
          }}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'feed' && (
          <FeedSection
            lang={lang}
            posts={posts}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onCreatePost={handleCreatePost}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onToggleFeatured={handleToggleFeatured}
            onDeletePost={handleDeletePost}
            showComposer={showComposer}
            setShowComposer={setShowComposer}
            requireApproval={requireApproval}
          />
        )}

        {activeTab === 'sahitya' && <SahityaSection lang={lang} items={sahitya} />}

        {activeTab === 'itihas' && (
          <ItihasSection
            lang={lang}
            historyItems={historyItems}
            samajRatna={samajRatna}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryEventsSection
            lang={lang}
            directory={directory}
            dharmashalas={dharmashalas}
            events={events}
            onToggleRsvp={handleToggleRsvp}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'super_admin' && (
          <AdminDashboard
            lang={lang}
            posts={posts}
            sahitya={sahitya}
            historyItems={historyItems}
            events={events}
            directory={directory}
            dharmashalas={dharmashalas}
            samajRatna={samajRatna}
            requireApproval={requireApproval}
            setRequireApproval={handleSetRequireApproval}
            onApprovePost={handleApprovePost}
            onDeletePost={handleDeletePost}
            onToggleFeatured={handleToggleFeatured}
            onAddSahitya={handleAddSahitya}
            onUpdateSahitya={handleUpdateSahitya}
            onDeleteSahitya={handleDeleteSahitya}
            onAddHistory={handleAddHistory}
            onUpdateHistory={handleUpdateHistory}
            onDeleteHistory={handleDeleteHistory}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddDirectory={handleAddDirectory}
            onUpdateDirectory={handleUpdateDirectory}
            onDeleteDirectory={handleDeleteDirectory}
            onAddDharmashala={handleAddDharmashala}
            onUpdateDharmashala={handleUpdateDharmashala}
            onDeleteDharmashala={handleDeleteDharmashala}
            onAddRatna={handleAddRatna}
            onUpdateRatna={handleUpdateRatna}
            onDeleteRatna={handleDeleteRatna}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-10 bg-maroon-900 text-gold-200/90 border-t-4 border-gold-500 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-serifHindi text-lg font-bold text-gold-100">
              {t(lang, 'साहू समाज छत्तीसगढ़ • जय भक्त माता कर्मा', 'Sahu Samaj Chhattisgarh • Jai Bhakt Maa Karma')}
            </div>
            <p className="text-xs text-gold-300/75 mt-1">
              {t(
                lang,
                'सुपर एडमिन: संजय कुमार साहू • ऑफ़लाइन-सक्षम प्रोग्रेसिव वेब ऐप (PWA)',
                'Super Admin: Sanjay Kumar Sahu • Offline-Ready Progressive Web App (PWA)'
              )}
            </p>
          </div>
          <div className="text-xs text-gold-300/75 flex flex-col sm:items-end gap-1">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {serverConnected
                ? t(lang, 'लाइव MySQL सर्वर से जुड़ा है', 'Connected to Live MySQL Server')
                : t(lang, 'लोकल ऑफ़लाइन मोड (PWA कैश)', 'Local Offline Mode (PWA Cache)')}
            </span>
            <span>
              © {new Date().getFullYear()} {t(lang, 'साहू समाज छत्तीसगढ़ डिजिटल चौपाल', 'Sahu Samaj Chhattisgarh')}
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        lang={lang}
        onLogin={handleLogin}
        serverConnected={serverConnected}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-maroon-900 text-gold-100 border-2 border-gold-500 shadow-2xl text-sm font-semibold animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
