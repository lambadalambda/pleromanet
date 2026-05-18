/* global React, I, VaporBanner, Avatar, PostHead, PostBody, PostCW, PostBoost, PostMedia, PostActions,
   Card, CardHead, CardFoot, Button, Pill, StatusRow,
   OekakiModal */
const { useState: useStateF } = React;

// ============ Home feed ============
function HomeView({ tweaks, posts, onToggleAction, composer, setComposer, onPost, onOpenThread, onVote }) {
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
        {posts.map(p => <Post key={p.id} post={p} onAction={(k) => onToggleAction(p.id, k)} onOpen={() => onOpenThread && onOpenThread(p.id)} onVote={onVote}/>)}
      </div>
    </div>
  );
}

function Composer({ composer, setComposer, onPost }) {
  const [oekOpen, setOekOpen] = React.useState(false);
  const remaining = 500 - (composer.text || '').length;
  const hasCW = composer.cw != null;
  const hasPoll = composer.poll != null;

  const toggleCW = () => {
    if (hasCW) setComposer({...composer, cw: null});
    else setComposer({...composer, cw: ''});
  };
  const togglePoll = () => {
    if (hasPoll) setComposer({...composer, poll: null});
    else setComposer({
      ...composer,
      poll: { choices: ['', '', ''], duration: '24h', multi: false, hideUntil: true },
    });
  };
  const setCW = (v) => setComposer({...composer, cw: v});
  const setPoll = (p) => setComposer({...composer, poll: {...composer.poll, ...p}});
  const setChoice = (i, v) => setPoll({ choices: composer.poll.choices.map((x, j) => j === i ? v : x) });
  const removeChoice = (i) => {
    if (composer.poll.choices.length <= 2) return;
    setPoll({ choices: composer.poll.choices.filter((_, j) => j !== i) });
  };
  const addChoice = () => {
    if (composer.poll.choices.length >= 6) return;
    setPoll({ choices: [...composer.poll.choices, ''] });
  };

  return (
    <div className="composer">
      <Avatar variant="compose" avBanner="sunset"/>
      <div>
        <textarea
          className="composer-input"
          placeholder="What's on your mind?"
          value={composer.text}
          onChange={e => setComposer({...composer, text: e.target.value})}
        />
        {hasCW && (
          <div className="composer-cw">
            <span className="composer-cw-l">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width: 13, height: 13}}>
                <path d="M8 1.5l7 12.5H1L8 1.5z"/><path d="M8 6v4M8 12v.5"/>
              </svg>
              CW
            </span>
            <input
              className="composer-cw-input"
              value={composer.cw}
              onChange={e => setCW(e.target.value)}
              placeholder="One short line · what readers see before opening"
              maxLength={100}
              autoFocus
            />
            <button className="composer-cw-x" onClick={toggleCW} title="Remove CW">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{width: 14, height: 14}}>
                <path d="M4 4l8 8M12 4l-8 8"/>
              </svg>
            </button>
          </div>
        )}
        {hasPoll && (
          <div className="composer-poll">
            <div className="composer-poll-head">
              <I.poll style={{width: 13, height: 13}}/>
              Poll · 2–6 choices
              <button className="composer-poll-x" onClick={togglePoll} title="Remove poll">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{width: 13, height: 13}}>
                  <path d="M4 4l8 8M12 4l-8 8"/>
                </svg>
              </button>
            </div>
            {composer.poll.choices.map((c, i) => (
              <div key={i} className="composer-poll-opt">
                <span className="composer-poll-handle">
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width: 12, height: 12}}>
                    <circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/>
                    <circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/>
                    <circle cx="6" cy="12" r="1"/><circle cx="10" cy="12" r="1"/>
                  </svg>
                </span>
                <input
                  className="composer-poll-input"
                  value={c}
                  onChange={e => setChoice(i, e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                  maxLength={50}
                />
                <span className={"composer-poll-counter " + ((c || '').length > 40 ? 'over' : '')}>{(c || '').length}/50</span>
                <button
                  className={"composer-poll-rm " + (composer.poll.choices.length <= 2 ? 'disabled' : '')}
                  onClick={() => removeChoice(i)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{width: 12, height: 12}}>
                    <path d="M4 4l8 8M12 4l-8 8"/>
                  </svg>
                </button>
              </div>
            ))}
            <button
              className={"composer-poll-add " + (composer.poll.choices.length >= 6 ? 'disabled' : '')}
              onClick={addChoice}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={{width: 12, height: 12}}>
                <path d="M8 3v10M3 8h10"/>
              </svg>
              Add choice
            </button>
            <div className="composer-poll-settings">
              <div className="composer-poll-setting">
                <label className="composer-poll-setting-l">Duration</label>
                <select className="composer-poll-select" value={composer.poll.duration} onChange={e => setPoll({duration: e.target.value})}>
                  <option value="5m">5 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="6h">6 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="3d">3 days</option>
                  <option value="7d">7 days</option>
                </select>
              </div>
              <div className="composer-poll-setting">
                <label className="composer-poll-setting-l">Voting</label>
                <select className="composer-poll-select" value={composer.poll.multi ? 'multi' : 'single'} onChange={e => setPoll({multi: e.target.value === 'multi'})}>
                  <option value="single">Single choice</option>
                  <option value="multi">Multiple choices</option>
                </select>
              </div>
              <button
                className="composer-poll-toggle"
                onClick={(e) => { e.preventDefault(); setPoll({hideUntil: !composer.poll.hideUntil}); }}
                style={{background: 'none', border: 'none', padding: 0}}>
                <span className={"pp-tog " + (composer.poll.hideUntil ? 'on' : '')}/>
                <span>Hide totals until poll ends</span>
              </button>
            </div>
          </div>
        )}
        <div className="composer-row">
          <button className="composer-tool" title="Image"><I.image style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Draw (Oekaki)" onClick={() => setOekOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}>
              <path d="M3 21l4-1 11.5-11.5a2.121 2.121 0 00-3-3L4 17l-1 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M14 6l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M5 19l1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
          <button className={"composer-tool " + (hasPoll ? 'active' : '')} title="Poll" onClick={togglePoll}>
            <I.poll style={{width: 18, height: 18}}/>
          </button>
          <button className="composer-tool" title="Emoji"><I.smile style={{width: 18, height: 18}}/></button>
          <button className={"composer-tool cw " + (hasCW ? 'active' : '')} title="Content warning" onClick={toggleCW}>CW</button>
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
      <OekakiModal
        open={oekOpen}
        onClose={() => setOekOpen(false)}
        onAttach={(dataURL) => {
          setComposer({
            ...composer,
            text: composer.text + (composer.text ? '\n' : '') + '🖌️ attached an oekaki sketch',
            oekaki: dataURL,
          });
          setOekOpen(false);
        }}
      />
    </div>
  );
}

function Post({ post, onAction, onOpen, onVote }) {
  const click = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    onOpen && onOpen();
  };
  const openLightbox = (idx) => {
    if (!post.attachments || !post.attachments.length) return;
    const opener = window.openLightbox;
    if (opener) opener(post.attachments, idx, {
      name: post.name, handle: post.handle,
      avClass: post.avClass, avBanner: post.avBanner,
    });
  };
  return (
    <PostBoost post={post}>
      <div className="post" onClick={click} style={{cursor: onOpen ? 'pointer' : 'default'}}>
        <Avatar post={post}/>
        <div style={{minWidth: 0}}>
          <PostHead post={post}/>
          <PostCW post={post}>
            <PostBody body={post.body} addressees={post.addressees}/>
            <QuotedPost quoted={post.quotedPost}/>
            <PostMedia post={post} onOpen={openLightbox} onVote={onVote}/>
          </PostCW>
          <PostActions post={post} onAction={onAction}/>
        </div>
      </div>
    </PostBoost>
  );
}

// ============ Attachment components moved to attachments.jsx ============
// PhotoGrid, VideoAttachment, AudioAttachment, CompactAudio, MediaHeroStrip,
// AttachmentLightbox, AttachmentLightboxHost, openLightbox

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
    <Card>
      <CardHead title="Trends" icon={I.trend}/>
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
      <CardFoot>View all trends →</CardFoot>
    </Card>
  );
}

function WhoToFollow({ following, toggleFollow }) {
  const sugg = [
    { id: 'nyan', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', av: 'av-anime' },
    { id: 'datagram', name: 'datagram', handle: '@datagram@retro.social', av: 'av-pixel-pc' },
    { id: 'soft', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', av: 'av-grad-3' },
  ];
  return (
    <Card>
      <CardHead title="Who to follow" icon={I.users}/>
      <div style={{padding: '6px 0'}}>
        {sugg.map(s => (
          <div key={s.id} className="suggest">
            <div className={"suggest-av " + s.av}></div>
            <div>
              <div className="suggest-name">{s.name}</div>
              <div className="suggest-handle">{s.handle}</div>
            </div>
            <Button
              variant="follow"
              className={following[s.id] ? 'following' : ''}
              onClick={() => toggleFollow(s.id)}>
              {following[s.id] ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </div>
      <CardFoot>View more suggestions →</CardFoot>
    </Card>
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
    <Card>
      <CardHead title="Shortcuts" icon={I.bolt}/>
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
    </Card>
  );
}

function InstanceStatus() {
  return (
    <Card>
      <CardHead title="Instance status" icon={I.pulse}/>
      <div>
        <StatusRow label="pleromanet.social" value={<Pill>All systems normal</Pill>}/>
        <StatusRow label="Uptime" value="30d 12h 42m"/>
        <StatusRow label="Users" value="2,487"/>
      </div>
    </Card>
  );
}

Object.assign(window, {
  HomeView, Composer, Post,
  TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus,
});
