/* global React, ReactDOM, Header, SideNav, ProfileMini, FooterCard,
   HomeView, TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus,
   ProfileSettings, ProfilePreviewCard, ProfileTipsCard,
   ExploreView, QuickSearchCard, InstanceStatusExtended,
   useTweaks, TweaksPanel, TweakSection, TweakSelect, TweakColor, TweakRadio, TweakToggle */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#a48bd9",
  "density": "comfortable",
  "wordmarkFont": "serif",
  "showTrademark": true,
  "darkComposer": false
}/*EDITMODE-END*/;

const initialPosts = [
  {
    id: 1, name: 'emi', handle: '@emichan@kolektiva.social', time: '16m',
    avClass: 'av-anime',
    body: "tiny update: fixed some bugs, added a toggle, and touched grass.\n\nthe internet can wait.",
    replies: 2, boosts: 7, favs: 42,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 2, name: 'signal', handle: '@signal@mastodon.online', time: '1h',
    avClass: '', avBanner: 'pixel-window',
    body: "dusk in the city 🌆",
    media: 'city',
    replies: 4, boosts: 15, favs: 120,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 3, name: 'orbit', handle: '@orbit@spacebear.net', time: '2h',
    avClass: 'av-orb',
    body: "Reminder: your instance is not the whole network.\nReach out. Follow across. The fediverse is bigger than your feed.",
    replies: 1, boosts: 23, favs: 89,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 4, name: 'sysadmin', handle: '@root@pleroma.social', time: '4h',
    avClass: 'av-pc-old',
    body: "Backup your data. Hug your cat. Update PleromaNet™.",
    replies: 3, boosts: 11, favs: 76,
    actions: { reply: false, boost: false, fav: false },
  },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('home'); // home | profile-settings | explore | local | federated
  const [settingsTab, setSettingsTab] = useState('Profile');
  const [posts, setPosts] = useState(initialPosts);
  const [composer, setComposer] = useState({ text: '', privacy: 'Public' });
  const [following, setFollowing] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [prevView, setPrevView] = useState('home');
  const [replyDraft, setReplyDraft] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('pn-theme') || 'cream');
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('pn-theme', theme);
  }, [theme]);
  const [profile, setProfile] = useState({
    displayName: 'dreambyte',
    username: 'dreambyte',
    instance: '@pleromanet.social',
    bio: 'living in a soft world',
    website: 'https://dreambyte.dev',
    location: 'somewhere on the internet',
    discoverable: true,
    indexable: true,
    showFollowers: true,
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    // derive accent-ink and accent-soft from accent
    const hex = tweaks.accent.replace('#', '');
    const r = parseInt(hex.slice(0,2), 16), g = parseInt(hex.slice(2,4), 16), b = parseInt(hex.slice(4,6), 16);
    document.documentElement.style.setProperty('--accent-ink', `rgb(${Math.floor(r*0.65)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.75)})`);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.18)`);
    document.documentElement.style.setProperty('--accent-soft-2', `rgba(${r}, ${g}, ${b}, 0.08)`);
  }, [tweaks.accent]);

  const onToggleAction = (id, key) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, actions: { ...p.actions, [key]: !p.actions[key] } } : p));
  };
  const toggleFollow = (id) => setFollowing(f => ({ ...f, [id]: !f[id] }));

  const openThread = (id) => {
    if (view !== 'thread') setPrevView(view);
    setThreadId(id);
    setView('thread');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeThread = () => { setView(prevView || 'home'); setThreadId(null); };

  // Build a synthetic thread for the given post
  const buildThread = (id) => {
    const focused = posts.find(p => p.id === id) || posts[0];
    const ancestors = [
      {
        id: 'a1', name: 'gridwave', handle: '@gridwave@retro.social', time: '5h',
        avClass: 'av-pixel-pc',
        body: "anyone else feel like the web got a little too loud lately?",
        replies: 18, boosts: 42, favs: 210,
        actions: { reply: false, boost: false, fav: false },
      },
    ];
    const replies = [
      {
        id: 'r1', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', time: '12m',
        avClass: 'av-anime',
        body: "this is the energy i needed today 🌙",
        replies: 2, boosts: 3, favs: 18,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [
          {
            id: 'r1a', name: 'dreambyte', handle: '@dreambyte@pleromanet.social', time: '8m',
            avClass: '', avBanner: 'sunset',
            body: "🤍",
            replies: 0, boosts: 0, favs: 4,
            actions: { reply: false, boost: false, fav: false },
            nestedReplies: [],
          },
        ],
      },
      {
        id: 'r2', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', time: '22m',
        avClass: 'av-grad-3',
        body: "touched grass too. recommend the slow internet diet.",
        replies: 0, boosts: 7, favs: 31,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [],
      },
      {
        id: 'r3', name: 'datagram', handle: '@datagram@retro.social', time: '34m',
        avClass: 'av-pixel-pc',
        body: "we used to log off. when did that stop being a thing.",
        replies: 4, boosts: 12, favs: 64,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [
          {
            id: 'r3a', name: 'orbit', handle: '@orbit@spacebear.net', time: '20m',
            avClass: 'av-orb',
            body: "around the time the algorithm replaced the timeline.",
            replies: 0, boosts: 5, favs: 22,
            actions: { reply: false, boost: false, fav: false },
            nestedReplies: [],
          },
        ],
      },
    ];
    return {
      ancestors,
      focused: {
        ...focused,
        fullTime: '4:18 PM · May 11, 2026',
        source: 'PleromaNet™ Web',
        views: '12.4K',
        bookmarks: 24,
      },
      replies,
    };
  };

  const onReplySubmit = () => {
    if (!replyDraft.trim()) return;
    setReplyDraft('');
  };

  const onPost = () => {
    if (!composer.text.trim()) return;
    const newPost = {
      id: Date.now(),
      name: 'dreambyte', handle: '@dreambyte@pleromanet.social', time: 'now',
      avClass: '', avBanner: 'sunset',
      body: composer.text,
      replies: 0, boosts: 0, favs: 0,
      actions: { reply: false, boost: false, fav: false },
    };
    setPosts(p => [newPost, ...p]);
    setComposer({ text: '', privacy: composer.privacy });
  };

  const wordmarkClass = tweaks.wordmarkFont === 'mono' ? 'wm-mono' : tweaks.wordmarkFont === 'sans' ? 'wm-sans' : '';

  if (!signedIn) {
    return <SignedOutView posts={posts} onSignIn={() => setSignedIn(true)}/>;
  }

  return (
    <div className="app" data-density={tweaks.density}>
      <style>{`
        ${wordmarkClass === 'wm-mono' ? '.brand-name { font-family: var(--mono); font-size: 22px; letter-spacing: -0.02em; }' : ''}
        ${wordmarkClass === 'wm-sans' ? '.brand-name { font-family: var(--sans); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }' : ''}
        ${!tweaks.showTrademark ? '.brand-name sup { display: none; }' : ''}
        ${tweaks.density === 'compact' ? '.post { padding: 12px 16px; } .composer { padding: 12px 16px; } .card-body, .card-head { padding-top: 9px; padding-bottom: 9px; }' : ''}
        ${tweaks.darkComposer ? '.composer { background: linear-gradient(180deg, #1a1538 0%, #2a1f4a 100%); color: #e8e2f5; } .composer-input { color: #e8e2f5; } .composer-input::placeholder { color: rgba(232,226,245,0.55); } .composer-tool { color: rgba(232,226,245,0.6); } .composer-tool:hover { background: rgba(255,255,255,0.08); color: white; } .composer-count { color: rgba(232,226,245,0.6); }' : ''}
      `}</style>
      <Header view={view} onView={(v) => { setView(v); setDrawerOpen(false); }} tweaks={tweaks} onMenu={() => setDrawerOpen(true)} theme={theme} setTheme={setTheme} onSignOut={() => setSignedIn(false)}/>
      <div className="shell">
        <div className="main">
          <aside>
            <ProfileMini/>
            <div className="card" style={{padding: '6px 0'}}>
              <SideNav
                view={view}
                onView={setView}
                settingsTab={settingsTab}
                onSettingsTab={setSettingsTab}
              />
            </div>
            <FooterCard/>
          </aside>

          <section className="center">
            {view === 'home' && (
              <HomeView
                tweaks={tweaks}
                posts={posts}
                onToggleAction={onToggleAction}
                composer={composer}
                setComposer={setComposer}
                onPost={onPost}
                onOpenThread={openThread}/>
            )}
            {view === 'local' && (
              <HomeView tweaks={tweaks} posts={posts.slice(2)} onToggleAction={onToggleAction} composer={composer} setComposer={setComposer} onPost={onPost} onOpenThread={openThread}/>
            )}
            {view === 'federated' && (
              <HomeView tweaks={tweaks} posts={posts} onToggleAction={onToggleAction} composer={composer} setComposer={setComposer} onPost={onPost} onOpenThread={openThread}/>
            )}
            {view === 'thread' && (
              <ThreadView
                thread={buildThread(threadId)}
                focusedId={threadId}
                onBack={closeThread}
                onAction={onToggleAction}
                onReply={onReplySubmit}
                replyDraft={replyDraft}
                setReplyDraft={setReplyDraft}/>
            )}
            {view === 'profile-settings' && (
              <ProfileSettings tab={settingsTab} profile={profile} setProfile={setProfile}/>
            )}
            {view === 'explore' && (
              <ExploreView posts={posts} onToggleAction={onToggleAction} following={following} toggleFollow={toggleFollow}/>
            )}
          </section>

          <aside>
            {view === 'home' || view === 'local' || view === 'federated' || view === 'thread' ? (
              <>
                <TrendsCard/>
                <WhoToFollow following={following} toggleFollow={toggleFollow}/>
                <ShortcutsCard/>
                <InstanceStatus/>
              </>
            ) : null}
            {view === 'profile-settings' && (
              <>
                <ProfilePreviewCard/>
                <ProfileTipsCard/>
              </>
            )}
            {view === 'explore' && (
              <>
                <QuickSearchCard/>
                <WhoToFollow following={following} toggleFollow={toggleFollow}/>
                <ShortcutsCard/>
                <InstanceStatusExtended/>
              </>
            )}
          </aside>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection title="Brand">
          <TweakRadio
            label="Wordmark font"
            value={tweaks.wordmarkFont}
            onChange={v => setTweak('wordmarkFont', v)}
            options={[
              { value: 'serif', label: 'Serif' },
              { value: 'sans', label: 'Sans' },
              { value: 'mono', label: 'Mono' },
            ]}/>
          <TweakToggle label="Show ™ trademark" value={tweaks.showTrademark} onChange={v => setTweak('showTrademark', v)}/>
        </TweakSection>
        <TweakSection title="Theme">
          <TweakColor label="Accent color" value={tweaks.accent} onChange={v => setTweak('accent', v)}/>
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}/>
          <TweakToggle label="Dark composer" value={tweaks.darkComposer} onChange={v => setTweak('darkComposer', v)}/>
        </TweakSection>
      </TweaksPanel>

      {/* Mobile drawer (left sidebar) */}
      <div className={"mobile-drawer-bg " + (drawerOpen ? 'open' : '')} onClick={() => setDrawerOpen(false)}></div>
      <div className={"mobile-drawer " + (drawerOpen ? 'open' : '')}>
        <div className="drawer-head">
          <div className="brand">
            <div className="brand-mark"><I.sparkBig/></div>
            <div className="brand-name">PleromaNet<sup>™</sup></div>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <ProfileMini/>
        <div className="card" style={{padding: '6px 0'}}>
          <SideNav
            view={view}
            onView={(v) => { setView(v); setDrawerOpen(false); }}
            settingsTab={settingsTab}
            onSettingsTab={(t) => { setSettingsTab(t); setDrawerOpen(false); }}
          />
        </div>
        <FooterCard/>
      </div>

      {/* Mobile sheet (right rail) */}
      <div className={"mobile-sheet-bg " + (sheetOpen ? 'open' : '')} onClick={() => setSheetOpen(false)}></div>
      <div className={"mobile-sheet " + (sheetOpen ? 'open' : '')}>
        <div className="sheet-grip"></div>
        <div className="sheet-head">
          <span className="sheet-title">{view === 'profile-settings' ? 'Profile preview' : view === 'explore' ? 'Discover' : 'Trends & Activity'}</span>
          <button className="drawer-close" onClick={() => setSheetOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        {view === 'home' || view === 'local' || view === 'federated' ? (
          <>
            <TrendsCard/>
            <WhoToFollow following={following} toggleFollow={toggleFollow}/>
            <ShortcutsCard/>
            <InstanceStatus/>
          </>
        ) : null}
        {view === 'profile-settings' && (
          <>
            <ProfilePreviewCard/>
            <ProfileTipsCard/>
          </>
        )}
        {view === 'explore' && (
          <>
            <QuickSearchCard/>
            <WhoToFollow following={following} toggleFollow={toggleFollow}/>
            <ShortcutsCard/>
            <InstanceStatusExtended/>
          </>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-bottom">
        <button className={"mob-tab " + (view === 'home' ? 'active' : '')} onClick={() => setView('home')}>
          <I.home/><span>Home</span>
        </button>
        <button className={"mob-tab " + (view === 'explore' ? 'active' : '')} onClick={() => setView('explore')}>
          <I.search/><span>Explore</span>
        </button>
        <button className="mob-tab" onClick={() => alert('Notifications')}>
          <I.bell/><span>Alerts</span>
          <span className="tab-badge">3</span>
        </button>
        <button className={"mob-tab " + (view === 'profile-settings' ? 'active' : '')} onClick={() => setView('profile-settings')}>
          <I.gear/><span>Settings</span>
        </button>
        <button className="mob-tab" onClick={() => setSheetOpen(true)}>
          <I.list/><span>More</span>
        </button>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
