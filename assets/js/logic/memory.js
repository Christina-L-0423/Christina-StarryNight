/* ============================================================
   logic/memory.js —— 逻辑层：记忆库命中匹配 + 增删改查
   数据存放在数据层（state.memoryBank / state.worldbook），
   这里只负责「怎么判断命中」和「怎么管理条目」。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  SN.logic = SN.logic || {};

  function entryText(m) {
    return (m && (m.text || m.content || m.summary)) || "";
  }

  function entryKeywords(m) {
    if (!m) return [];
    let keys = [];
    if (Array.isArray(m.keywords)) keys = m.keywords.slice();
    else if (typeof m.keywords === "string" && m.keywords.trim()) {
      keys = m.keywords.split(/[,，、;；\s]+/);
    }
    if (!keys.length) {
      const text = entryText(m);
      if (text) keys = [text];
    }
    return keys
      .map(function (k) {
        return String(k).trim();
      })
      .filter(Boolean);
  }

  /* 角色最近几条用户消息，作为命中判断的“检索范围” */
  function recentUserText(characterId, count) {
    const chats = SN.store.state.chats || {};
    const list = chats[characterId] || [];
    const n = count || 8;
    return list
      .slice(-n)
      .filter(function (m) {
        return m && (m.role === "me" || m.role === "user");
      })
      .map(function (m) {
        return m.text || "";
      })
      .join("\n");
  }

  /* ---------- 记忆库：返回命中的条目文本（直接进提示词） ---------- */
  function match(characterId) {
    const bank = SN.store.state.memoryBank || [];
    if (!bank.length) return [];
    const haystack = recentUserText(characterId);
    if (!haystack) {
      /* 没有近期消息时只带置顶记忆，避免每次全量带上 */
      return bank
        .filter(function (m) { return m && m.pinned && m.enabled !== false; })
        .map(entryText)
        .filter(Boolean);
    }
    const hits = [];
    bank.forEach(function (m) {
      if (!m || m.enabled === false) return;
      const text = entryText(m);
      if (!text) return;
      /* pinned：置顶记忆，不参与命中判断，永远带上 */
      if (m.pinned) {
        hits.push(text);
        return;
      }
      const keys = entryKeywords(m);
      if (!keys.length) return;
      const hit = keys.some(function (k) {
        return haystack.indexOf(k) !== -1;
      });
      if (hit) hits.push(text);
    });
    return hits;
  }

  /* ---------- 记忆库：增删改查（设置层直接调用） ---------- */
  function makeId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  function add(text, keywords, pinned) {
    const state = SN.store.state;
    if (!Array.isArray(state.memoryBank)) state.memoryBank = [];
    state.memoryBank.push({
      id: makeId("mem"),
      text: String(text || "").trim(),
      keywords: Array.isArray(keywords)
        ? keywords
        : String(keywords || "")
            .split(/[,，、]/)
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean),
      pinned: !!pinned,
      enabled: true,
      createdAt: new Date().toISOString()
    });
    if (SN.store.persistNow) SN.store.persistNow();
  }

  function remove(id) {
    const state = SN.store.state;
    if (!Array.isArray(state.memoryBank)) return;
    state.memoryBank = state.memoryBank.filter(function (m) {
      return !m || m.id !== id;
    });
    if (SN.store.persistNow) SN.store.persistNow();
  }

  function toggle(id) {
    const state = SN.store.state;
    (state.memoryBank || []).forEach(function (m) {
      if (m && m.id === id) m.enabled = m.enabled === false;
    });
    if (SN.store.persistNow) SN.store.persistNow();
  }

  function clear() {
    SN.store.state.memoryBank = [];
    if (SN.store.persistNow) SN.store.persistNow();
  }

  /* ---------- 世界书命中：constant 常驻；keywords 在最近对话里命中才带 ---------- */
  function recentTalkText(characterId, count) {
    const chats = SN.store.state.chats || {};
    const list = chats[characterId] || [];
    return list
      .slice(-(count || 12))
      .map(function (m) {
        return (m && m.text) || "";
      })
      .join("\n");
  }

  function worldbookKeywords(w) {
    if (!w) return [];
    let keys = [];
    if (Array.isArray(w.keywords)) keys = w.keywords.slice();
    else if (typeof w.keywords === "string" && w.keywords.trim()) {
      keys = w.keywords.split(/[,，、;；\s]+/);
    }
    return keys
      .map(function (k) {
        return String(k).trim();
      })
      .filter(Boolean);
  }

  function matchWorldbook(characterId) {
    const book = SN.store.state.worldbook || [];
    if (!book.length) return [];
    const haystack = recentTalkText(characterId);
    const hits = [];
    book.forEach(function (w) {
      if (!w || w.enabled === false) return;
      if (w.constant) {
        hits.push(w);
        return;
      }
      if (!haystack) return;
      const keys = worldbookKeywords(w);
      if (!keys.length) return;
      const hit = keys.some(function (k) {
        return haystack.indexOf(k) !== -1;
      });
      if (hit) hits.push(w);
    });
    return hits;
  }

  SN.logic.memory = {
    match: match,
    add: add,
    remove: remove,
    toggle: toggle,
    clear: clear,
    entryText: entryText
  };
  SN.logic.matchWorldbook = matchWorldbook;
})(window.SN);
