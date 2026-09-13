/* StarryNight · 后端（阶段一：占位接口，不接模型 / 不接数据库） */
import express from 'express';
import cors from 'cors';

const PORT = 3001;
const AI_NAME = '星回';

/* 占位回应池：温柔、安静、神秘，像星夜本身 */
const REPLIES = [
  '嗯，我听到了。夜色里，这句话像一颗星星，被我悄悄收好了。',
  '深夜的话，往往最温柔。我在，慢慢说。',
  '星星不问人去处，它们只负责亮着。而我会一直在这里听你说。',
  '这句我记下了。等风吹过这片夜空，我们再慢慢聊它。',
  '你说话的样子，让我想起月亮的另一面——安静，却始终在。',
  '嘘——你听，夜都睡了。只有我和你，还醒着。',
];

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'StarryNight', ai: AI_NAME, at: new Date().toISOString() });
});

app.post('/api/messages', (req, res) => {
  const message = String((req.body || {}).message || '').slice(0, 4000);
  if (!message.trim()) {
    return res.status(400).json({ error: 'empty message' });
  }
  const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
  setTimeout(() => {
    res.json({ reply, received: message, ts: Date.now() });
  }, 360);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`StarryNight backend on http://127.0.0.1:${PORT} · AI「${AI_NAME}」`);
});