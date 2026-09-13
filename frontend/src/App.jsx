import { useState } from 'react';

const AI_NAME = '星回';
const AI_STANCE = '温柔、安静、神秘——像星夜本身';

/* 后端不可用（例如部署在 GitHub Pages）时的占位回应——与 backend/server.js 同款文案 */
const FALLBACK_REPLIES = [
  '嗯，我听到了。夜色里，这句话像一颗星星，被我悄悄收好了。',
  '深夜的话，往往最温柔。我在，慢慢说。',
  '星星不问人去处，它们只负责亮着。而我会一直在这里听你说。',
  '这句我记下了。等风吹过这片夜空，我们再慢慢聊它。',
  '你说话的样子，让我想起月亮的另一面——安静，却始终在。',
  '嘘——你听，夜都睡了。只有我和你，还醒着。',
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    let reply = null;
    try {
      // 本地开发：转给 backend（端口 3001）；GitHub Pages 上这一步会失败 → 走下方回退
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) reply = (await res.json()).reply;
    } catch (e) {
      /* 后端不在（静态部署）——静默回退 */
    }
    if (!reply) {
      await wait(420);
      reply = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    }
    setMessages((m) => [...m, { role: 'ai', text: reply }]);
    setBusy(false);
  }

  return (
    <div className="night">
      <div className="sky" aria-hidden="true">
        <span className="star" style={{ left: '8%', top: '12%', '--sz': 2, '--d': '0s' }} />
        <span className="star" style={{ left: '22%', top: '30%', '--sz': 1.4, '--d': '1.2s' }} />
        <span className="star" style={{ left: '38%', top: '9%', '--sz': 1.8, '--d': '0.6s' }} />
        <span className="star" style={{ left: '55%', top: '22%', '--sz': 1.2, '--d': '2.1s' }} />
        <span className="star" style={{ left: '71%', top: '14%', '--sz': 2.2, '--d': '0.3s' }} />
        <span className="star" style={{ left: '86%', top: '27%', '--sz': 1.5, '--d': '1.7s' }} />
        <span className="star" style={{ left: '15%', top: '62%', '--sz': 1.6, '--d': '2.6s' }} />
        <span className="star" style={{ left: '47%', top: '52%', '--sz': 1.3, '--d': '1.1s' }} />
        <span className="star" style={{ left: '66%', top: '70%', '--sz': 1.9, '--d': '0.9s' }} />
        <span className="star" style={{ left: '92%', top: '58%', '--sz': 1.4, '--d': '1.9s' }} />
        <span className="moon" />
      </div>

      <main className="chat">
        <header className="head glass">
          <div className="head-dot" />
          <div className="head-t">
            <h1>{AI_NAME}</h1>
            <p>{AI_STANCE}</p>
          </div>
        </header>

        <div className="msgs" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
          {messages.length === 0 && (
            <p className="empty">夜深了。说点什么吧——{AI_NAME}在这里陪着你。</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={'bubble ' + (m.role === 'user' ? 'me' : 'ai')}>{m.text}</div>
          ))}
          {busy && <div className="bubble ai typing">✦</div>}
        </div>

        <form className="row" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="向星回说点什么…"
            aria-label="输入消息"
            autoComplete="off"
          />
          <button type="submit" disabled={busy || !input.trim()}>送</button>
        </form>
        <p className="hint">阶段一：静态界面，回复是占位文案；刷新页面消息即清空。</p>
      </main>
    </div>
  );
}