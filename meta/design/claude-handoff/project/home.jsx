/* global React, I, VaporBanner */
const { useState: useStateF } = React;

// ============ Home feed ============
function HomeView({ tweaks, posts, onToggleAction, composer, setComposer, onPost, onOpenThread }) {
  const [tab, setTab] = useStateF('Home');
  return (
    <div className="card">
      <div className="tabs">
        {['Home', 'Local', 'Federated'].map(t => (
          <button key={t} className={"tab " + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
        <div className="tab-spacer"></div>
        <button className="tab-action" title="Filters"><I.sliders style={{width: 16, height: 16}}/></button>
      </div>
      <Composer composer={composer} setComposer={setComposer} onPost={onPost}/>
      <div>
        {posts.map(p => <Post key={p.id} post={p} onAction={(k) => onToggleAction(p.id, k)} onOpen={() => onOpenThread && onOpenThread(p.id)}/>)}
      </div>
    </div>
  );
}

function Composer({ composer, setComposer, onPost }) {
  const remaining = 500 - (composer.text || '').length;
  return (
    <div className="composer">
      <div className="composer-av av-grad-1" style={{borderRadius: 4, overflow: 'hidden'}}>
        <VaporBanner variant="sunset"/>
      </div>
      <div>
        <textarea
          className="composer-input"
          placeholder="What's on your mind?"
          value={composer.text}
          onChange={e => setComposer({...composer, text: e.target.value})}
        />
        <div className="composer-row">
          <button className="composer-tool" title="Image"><I.image style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="GIF" style={{fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600}}>GIF</button>
          <button className="composer-tool" title="Poll"><I.poll style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Emoji"><I.smile style={{width: 18, height: 18}}/></button>
          <button className="composer-tool cw" title="Content warning">CW</button>
          <button className="composer-tool privacy">
            <I.globe style={{width: 13, height: 13}}/>
            <span>{composer.privacy}</span>
            <I.chevDown style={{width: 12, height: 12}}/>
          </button>
          <span className="composer-spacer"></span>
          <span className="composer-count" style={{color: remaining < 50 ? 'var(--bad)' : 'var(--muted)'}}>{remaining}</span>
          <button className="btn-primary" onClick={onPost} disabled={!composer.text.trim()}>Post</button>
        </div>
      </div>
    </div>
  );
}

function Post({ post, onAction, onOpen }) {
  const click = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    onOpen && onOpen();
  };
  return (
    <div className="post" onClick={click} style={{cursor: onOpen ? 'pointer' : 'default'}}>
      <div className={"post-av " + post.avClass}>
        {post.avBanner && <VaporBanner variant={post.avBanner}/>}
      </div>
      <div style={{minWidth: 0}}>
        <div className="post-head">
          <span className="post-name">{post.name}</span>
          <a className="post-handle">{post.handle}</a>
          <span className="post-time">{post.time}</span>
        </div>
        <div className="post-body">{post.body}</div>
        {post.media && (
          <div className="post-media">
            <VaporBanner variant={post.media}/>
          </div>
        )}
        <div className="post-actions">
          <button className={"post-action reply " + (post.actions.reply ? 'on' : '')} onClick={() => onAction('reply')}>
            <I.reply/> {post.replies}
          </button>
          <button className={"post-action boost " + (post.actions.boost ? 'on' : '')} onClick={() => onAction('boost')}>
            <I.boost/> {post.boosts + (post.actions.boost ? 1 : 0)}
          </button>
          <button className={"post-action fav " + (post.actions.fav ? 'on' : '')} onClick={() => onAction('fav')}>
            <I.star fill={post.actions.fav ? 'currentColor' : 'none'}/> {post.favs + (post.actions.fav ? 1 : 0)}
          </button>
          <button className="post-more" title="More"><I.more style={{width: 16, height: 16}}/></button>
        </div>
      </div>
    </div>
  );
}

// ============ Right column cards (Home) ============
function TrendsCard() {
  const trends = [
    { rank: 1, tag: '#fediverse', count: '12.4K' },
    { rank: 2, tag: '#IndieWeb', count: '6,213' },
    { rank: 3, tag: '#pleroma', count: '5,105' },
    { rank: 4, tag: '#vaporwave', count: '3,901' },
    { rank: 5, tag: '#selfhosted', count: '2,844' },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Trends</span>
        <I.trend style={{width: 16, height: 16, color: 'var(--muted)'}}/>
      </div>
      <div className="trend-list">
        {trends.map(t => (
          <button key={t.rank} className="trend-item">
            <span className="trend-rank">{t.rank}</span>
            <span>
              <div className="trend-tag">{t.tag}</div>
              <div className="trend-meta">{t.count} posts</div>
            </span>
          </button>
        ))}
      </div>
      <button className="card-foot">View all trends →</button>
    </div>
  );
}

function WhoToFollow({ following, toggleFollow }) {
  const sugg = [
    { id: 'nyan', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', av: 'av-anime' },
    { id: 'datagram', name: 'datagram', handle: '@datagram@retro.social', av: 'av-pixel-pc' },
    { id: 'soft', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', av: 'av-grad-3' },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Who to follow</span>
        <I.users style={{width: 16, height: 16, color: 'var(--muted)'}}/>
      </div>
      <div style={{padding: '6px 0'}}>
        {sugg.map(s => (
          <div key={s.id} className="suggest">
            <div className={"suggest-av " + s.av}></div>
            <div>
              <div className="suggest-name">{s.name}</div>
              <div className="suggest-handle">{s.handle}</div>
            </div>
            <button
              className={"btn-follow " + (following[s.id] ? 'following' : '')}
              onClick={() => toggleFollow(s.id)}>
              {following[s.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
      <button className="card-foot">View more suggestions →</button>
    </div>
  );
}

function ShortcutsCard() {
  const shorts = [
    { ico: I.pencil, label: 'Compose new post', key: 'N' },
    { ico: I.msg, label: 'Direct messages', key: 'M' },
    { ico: I.bookmark, label: 'Bookmarks', key: 'B' },
    { ico: I.list, label: 'Lists', key: 'L' },
    { ico: I.gear, label: 'User settings', key: 'S' },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Shortcuts</span>
        <I.bolt style={{width: 16, height: 16, color: 'var(--muted)'}}/>
      </div>
      <div style={{padding: '6px 0'}}>
        {shorts.map((s, i) => {
          const Ico = s.ico;
          return (
            <button key={i} className="short">
              <span className="ico"><Ico style={{width: 14, height: 14}}/></span>
              <span>{s.label}</span>
              <span className="key">{s.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InstanceStatus() {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Instance status</span>
        <I.pulse style={{width: 16, height: 16, color: 'var(--muted)'}}/>
      </div>
      <div>
        <div className="status-row">
          <span className="l">pleromanet.social</span>
          <span className="pill">All systems normal</span>
        </div>
        <div className="status-row">
          <span className="l">Uptime</span>
          <span className="r">30d 12h 42m</span>
        </div>
        <div className="status-row">
          <span className="l">Users</span>
          <span className="r">2,487</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeView, Composer, Post, TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus });
