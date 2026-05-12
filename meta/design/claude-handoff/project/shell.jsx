/* global React, I */
const { useState: useStateA } = React;

// ============ Vaporwave / pixel placeholder components ============
function VaporBanner({ variant = 'sunset', className = '' }) {
  if (variant === 'pixel-window') {
    return (
      <div className={"pw-banner " + className}>
        <div className="pw-banner-bar">
          <div className="pw-banner-dot"></div>
          <div className="pw-banner-dot y"></div>
          <div className="pw-banner-dot g"></div>
        </div>
        <div className="pw-banner-content">
          <div className="vw-placeholder">
            <div className="vw-stars"></div>
            <div className="vw-sun"></div>
            <div className="vw-grid"></div>
            <div className="vw-palm"></div>
            <div className="vw-city"></div>
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'city') {
    return (
      <div className={"vw-placeholder " + className} style={{background: 'linear-gradient(180deg, #0c0a28 0%, #2a1f4a 30%, #6b4d8e 60%, #d889a0 100%)'}}>
        <div className="vw-stars"></div>
        <div style={{position: 'absolute', right: '20%', top: '20%', width: 30, height: 4, background: 'rgba(255,255,255,0.7)', borderRadius: 2}}></div>
        <div style={{position: 'absolute', right: '15%', top: '15%', fontSize: 14, color: 'rgba(255,255,255,0.8)'}}>☾</div>
        <CityScape />
      </div>
    );
  }
  if (variant === 'space') {
    return (
      <div className={"vw-placeholder " + className} style={{background: 'radial-gradient(ellipse at 30% 30%, #2a1f4a 0%, #0c0a1a 70%)'}}>
        <div className="vw-stars"></div>
        <div style={{position: 'absolute', right: '25%', top: '20%', width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #5a4a7a, #1a1538)', boxShadow: '0 0 20px rgba(108, 77, 142, 0.4)'}}></div>
      </div>
    );
  }
  // sunset default
  return (
    <div className={"vw-placeholder " + className}>
      <div className="vw-stars"></div>
      <div className="vw-sun"></div>
      <div className="vw-grid"></div>
      <div className="vw-palm"></div>
      <div className="vw-city"></div>
    </div>
  );
}

function CityScape() {
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '60%'}}>
      <defs>
        <linearGradient id="cityG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0f30" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#0a0520" stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d="M0 80 L20 80 L20 50 L40 50 L40 70 L60 70 L60 30 L80 30 L80 60 L100 60 L100 45 L120 45 L120 70 L140 70 L140 25 L160 25 L160 55 L180 55 L180 40 L200 40 L200 65 L220 65 L220 35 L240 35 L240 50 L260 50 L260 30 L280 30 L280 60 L300 60 L300 45 L320 45 L320 55 L340 55 L340 35 L360 35 L360 65 L380 65 L380 50 L400 50 L400 100 L0 100 Z" fill="url(#cityG)"/>
      {/* Window dots */}
      {[[25,55],[28,60],[45,55],[48,60],[65,40],[68,45],[68,50],[85,45],[88,40],[88,50],[105,55],[108,50],[125,50],[128,55],[145,35],[148,30],[165,40],[168,45],[185,55],[188,60],[205,50],[208,45],[225,45],[228,40],[245,42],[248,45],[265,40],[268,35],[285,40],[288,45],[305,55],[308,50],[325,55],[328,50],[345,45],[348,40],[365,45],[368,50],[385,55],[388,60]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="2" height="2" fill={i % 3 === 0 ? "#f78fb3" : "#ffd1a8"} opacity="0.85"/>
      ))}
    </svg>
  );
}

// ============ Header ============
function Header({ view, onView, tweaks, onMenu, theme, setTheme, onSignOut }) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const navs = [
    { id: 'home', label: 'Home' },
    { id: 'local', label: 'Local' },
    { id: 'federated', label: 'Federated' },
    { id: 'explore', label: 'Explore' },
    { id: 'about', label: 'About' },
  ];
  React.useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e) => {
      if (!e.target.closest('.user-chip') && !e.target.closest('.user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);
  return (
    <header className="header">
      <div className="shell">
        <div className="header-inner">
          <div className="brand">
            <button className="menu-btn" onClick={onMenu} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <div className="brand-mark">
              <I.sparkBig />
            </div>
            <div>
              <div className="brand-name">
                {tweaks.brand || 'PleromaNet'}<sup>™</sup>
              </div>
            </div>
            <div className="brand-tag">A federated<br/>social web</div>
          </div>
          <nav className="nav">
            {navs.map(n => (
              <button
                key={n.id}
                className={"nav-item " + ((view === n.id || (view === 'profile-settings' && n.id === 'home')) ? 'active' : '')}
                onClick={() => onView(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="header-right" style={{position: 'relative'}}>
            <div className="search">
              <I.search style={{width: 14, height: 14, color: 'var(--muted)'}}/>
              <input placeholder="Search..." />
              <span className="kbd">⌘K</span>
            </div>
            <button className="icon-btn" aria-label="Notifications">
              <I.bell style={{width: 20, height: 20}}/>
              <span className="badge">3</span>
            </button>
            <button className="user-chip" onClick={() => setUserMenuOpen(v => !v)}>
              <div className="av av-grad-1" style={{width: 28, height: 28, borderRadius: '50%', overflow: 'hidden'}}>
                <VaporBanner variant="sunset"/>
              </div>
              <span style={{fontWeight: 500}}>dreambyte</span>
              <I.chevDown style={{width: 14, height: 14, color: 'var(--muted)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s'}}/>
            </button>
            {userMenuOpen && <UserMenu onView={(v) => { onView(v); setUserMenuOpen(false); }} theme={theme} setTheme={setTheme} onSignOut={() => { setUserMenuOpen(false); onSignOut && onSignOut(); }}/>}
          </div>
        </div>
      </div>
    </header>
  );
}

function UserMenu({ onView, theme, setTheme, onSignOut }) {
  const themes = [
    { id: 'cream', label: 'Cream', grad: 'linear-gradient(135deg, #f5f1e8 50%, #a48bd9 50%)' },
    { id: 'dusk', label: 'Dusk', grad: 'linear-gradient(135deg, #2a1f4a 50%, #e7a8c9 50%)' },
    { id: 'drive', label: 'Drive', grad: 'linear-gradient(135deg, #0c0a28 50%, #7dc4be 50%)' },
  ];
  return (
    <div className="user-menu">
      <div className="user-menu-head">
        <div className="user-menu-av">
          <VaporBanner variant="sunset"/>
        </div>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="user-menu-name">dreambyte</div>
          <div className="user-menu-handle">@dreambyte@pleromanet.social</div>
        </div>
      </div>
      <div className="user-menu-stats">
        <div className="user-menu-stat"><div className="user-menu-stat-v">1,248</div><div className="user-menu-stat-l">Posts</div></div>
        <div className="user-menu-stat"><div className="user-menu-stat-v">312</div><div className="user-menu-stat-l">Following</div></div>
        <div className="user-menu-stat"><div className="user-menu-stat-v">1,921</div><div className="user-menu-stat-l">Followers</div></div>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item" onClick={() => onView('profile-settings')}>
          <I.users style={{width: 16, height: 16}}/><span>View profile</span>
          <I.arrowR style={{width: 13, height: 13, marginLeft: 'auto', color: 'var(--muted-2)'}}/>
        </button>
        <button className="user-menu-item"><I.bookmark style={{width: 16, height: 16}}/><span>Bookmarks</span></button>
        <button className="user-menu-item"><I.star style={{width: 16, height: 16}}/><span>Favorites</span></button>
        <button className="user-menu-item"><I.list style={{width: 16, height: 16}}/><span>Lists</span></button>
        <button className="user-menu-item">
          <I.lock style={{width: 16, height: 16}}/><span>Drafts &amp; scheduled</span>
          <span className="user-menu-badge">2</span>
        </button>
      </div>
      <div className="user-menu-sec">
        <div className="user-menu-label">Appearance</div>
        <div className="user-menu-themes">
          {themes.map(t => (
            <button
              key={t.id}
              className={"user-menu-theme " + (theme === t.id ? 'active' : '')}
              onClick={() => setTheme(t.id)}
              title={t.label}>
              <span style={{background: t.grad}}></span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item" onClick={() => onView('profile-settings')}>
          <I.gear style={{width: 16, height: 16}}/><span>Settings</span><span className="kbd" style={{marginLeft: 'auto'}}>S</span>
        </button>
        <button className="user-menu-item"><I.info style={{width: 16, height: 16}}/><span>Keyboard shortcuts</span><span className="kbd" style={{marginLeft: 'auto'}}>?</span></button>
        <button className="user-menu-item"><I.ext style={{width: 16, height: 16}}/><span>About this instance</span></button>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item">
          <svg viewBox="0 0 24 24" fill="none" style={{width: 16, height: 16}}><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M16 7l3 3-3 3M19 10h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Switch account</span>
        </button>
        <button className="user-menu-item user-menu-danger" onClick={onSignOut}>
          <svg viewBox="0 0 24 24" fill="none" style={{width: 16, height: 16}}><path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 8l-4 4 4 4M6 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Sign out</span>
        </button>
      </div>
      <div className="user-menu-foot">
        <span>PleromaNet™ 2.4.58</span><span className="user-menu-dot"></span><span>pleromanet.social</span>
      </div>
    </div>
  );
}

// ============ Side nav (left col) ============
function SideNav({ view, onView, settingsTab, onSettingsTab }) {
  const items = [
    { id: 'home', label: 'Home', ico: I.home },
    { id: 'local', label: 'Local', ico: I.users },
    { id: 'federated', label: 'Federated', ico: I.globe },
    { id: 'notifs', label: 'Notifications', ico: I.bell, count: 3 },
    { id: 'msg', label: 'Messages', ico: I.msg },
    { id: 'bookmarks', label: 'Bookmarks', ico: I.bookmark },
    { id: 'lists', label: 'Lists', ico: I.list },
    { id: 'settings', label: 'Settings', ico: I.gear, hasSub: true },
  ];
  const settingsActive = view === 'profile-settings';
  const subNav = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account', 'Import / Export', 'Development'];
  return (
    <nav className="side-nav">
      {items.map(it => {
        const Ico = it.ico;
        const isActive = (it.id === 'home' && view === 'home') || (it.id === 'settings' && settingsActive) || (it.id === view);
        return (
          <React.Fragment key={it.id}>
            <button
              className={"side-nav-item " + (isActive ? 'active' : '')}
              onClick={() => {
                if (it.id === 'home') onView('home');
                else if (it.id === 'settings') onView('profile-settings');
                else if (it.id === 'federated') onView('federated');
                else if (it.id === 'local') onView('local');
              }}>
              <span className="ico"><Ico style={{width: 18, height: 18}}/></span>
              <span>{it.label}</span>
              {it.count ? <span className="count">{it.count}</span> : it.id === 'home' && isActive ? <span className="grip"><I.grip style={{width: 14, height: 14}}/></span> : null}
            </button>
            {it.id === 'settings' && settingsActive && (
              <div className="side-sub">
                {subNav.map(s => (
                  <button
                    key={s}
                    className={"side-sub-item " + (settingsTab === s ? 'active' : '')}
                    onClick={() => onSettingsTab(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ============ Profile mini card ============
function ProfileMini() {
  return (
    <div className="card">
      <div className="profile-mini-banner">
        <VaporBanner variant="pixel-window"/>
      </div>
      <div className="profile-mini-info">
        <div className="profile-mini-name">dreambyte</div>
        <div className="profile-mini-handle">@dreambyte@pleroma.social</div>
        <div className="profile-mini-bio">living in a soft world</div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Posts</div>
          <div className="stat-value">1,248</div>
        </div>
        <div className="stat">
          <div className="stat-label">Following</div>
          <div className="stat-value">312</div>
        </div>
        <div className="stat">
          <div className="stat-label">Followers</div>
          <div className="stat-value">1,921</div>
        </div>
      </div>
    </div>
  );
}

// ============ Footer card ============
function FooterCard() {
  return (
    <div className="card footer-card">
      <div><span className="v">PLEROMANET™ 2.4.58</span></div>
      <div style={{marginTop: 4, fontFamily: 'var(--sans)', fontSize: 11.5, letterSpacing: 0}}>© 2024 PleromaNet™ Contributors</div>
      <div className="footer-links">
        <a>Docs</a>
        <span style={{color: 'var(--muted-2)'}}>·</span>
        <a>GitHub</a>
        <span style={{color: 'var(--muted-2)'}}>·</span>
        <a>About</a>
      </div>
    </div>
  );
}

Object.assign(window, { Header, SideNav, ProfileMini, FooterCard, VaporBanner, CityScape });
