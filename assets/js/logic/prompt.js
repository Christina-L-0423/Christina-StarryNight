/* ============================================================
   logic/prompt.js —— 逻辑层：提示词拼装 + 回复后处理
   管什么：怎么把数据层的表拼成一次 AI 请求、怎么处理回复
   顺序：预设 → 角色设定 → 命中的世界书 → 命中的记忆库
        → 最近 N 轮上下文（每个角色可在「聊天设置」里单独调）
        → 调 API（logic/apiClient.js）→ 跑正则 → 按 ||| 分气泡 → 渲染
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  SN.logic = SN.logic || {};
  const store = SN.store;

  /* ---------- 0) 预设占位符：{{char}} {{user}} {{persona}} ---------- */
  /* 当前应用的面具：应用哪个面具，{{user}} 就替换成那个面具的名字 */
  function activeMask() {
    const state = store.state;
    const list = Array.isArray(state.masks) ? state.masks : [];
    let m = list.filter(function (x) {
      return x && x.id === state.activeMaskId;
    })[0];
    if (!m) m = list[0] || null;
    return m;
  }

  function fillPlaceholders(text, char) {
    const state = store.state;
    const mask = activeMask();
    return String(text == null ? "" : text)
      .split("{{char}}").join((char && char.name) || "")
      .split("{{user}}").join((mask && mask.name) || (state.user && state.user.name) || "朋友")
      .split("{{persona}}").join((char && (char.persona || char.content)) || "");
  }

  /* ---------- 1) 系统提示词的段落：预设 + 角色设定 + 用户面具 + 命中的记忆库 ----------
     世界书由 apiClient 里的既有逻辑负责带出，这里不重复拼。 */
  function systemSections(char, characterId) {
    const state = store.state;
    const sections = [];
    const id = characterId || (char && char.id) || "";

    /* 【系统提示词 / 预设】：优先用 activePresetId 指定的那条，否则用所有启用条目 */
    const bank = state.presets || [];
    const activeId = state.activePresetId;
    let presets = [];
    if (activeId) {
      const one = bank.filter(function (p) {
        return p && p.id === activeId && p.enabled !== false;
      })[0];
      if (one) presets = [one];
    }
    if (!presets.length) {
      presets = bank.filter(function (p) {
        return p && p.enabled !== false;
      });
    }
    presets = presets.filter(function (p) {
      return p.systemPrompt || p.content || p.text;
    });
    if (presets.length) {
      sections.push("【系统提示词 / 预设】");
      presets.forEach(function (p) {
        sections.push(fillPlaceholders(p.systemPrompt || p.content || p.text, char));
      });
    }

    /* 【角色设定】 */
    sections.push("【角色设定】");
    sections.push(
      (char && (char.persona || char.content)) || "一个温柔、真诚的聊天伙伴。"
    );

    /* 【用户设定】：当前应用的面具。应用哪个面具，AI 看到的用户就是谁。 */
    const mask = activeMask();
    if (mask) {
      sections.push("【用户设定】");
      sections.push("用户的名字是「" + (mask.name || "朋友") + "」。");
      if (mask.persona) sections.push(mask.persona);
    }

    /* 【记忆库（命中的条目）】 */
    const memories = SN.logic.memory ? SN.logic.memory.match(id) : [];
    if (memories.length) {
      sections.push("【记忆库（命中的条目）】");
      memories.forEach(function (m) {
        sections.push("- " + m);
      });
    }

    return sections;
  }

  /* ---------- 2) 回复后处理：跑正则 → 按 ||| 分气泡 ----------
     scope: "all"   整段回复先跑一遍再分气泡
     scope: "bubble" 分完气泡后每条单独跑
     字段兼容 pattern/find 两种写法 */
  function runOne(out, r) {
    try {
      const re = new RegExp(r.pattern || r.find, r.flags || "g");
      return out.replace(re, r.replace == null ? "" : r.replace);
    } catch (err) {
      console.warn("[StarryNight] 正则执行失败，已跳过：", r.pattern || r.find, err);
      return out;
    }
  }

  function processReply(text) {
    let out = String(text == null ? "" : text);

    const all = (store.state.regexes || []).filter(function (r) {
      return r && r.enabled !== false && (r.pattern || r.find) && r.scope !== "bubble";
    });
    all.forEach(function (r) {
      out = runOne(out, r);
    });

    let bubbles = out
      .split("|||")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });

    const perBubble = (store.state.regexes || []).filter(function (r) {
      return r && r.enabled !== false && (r.pattern || r.find) && r.scope === "bubble";
    });
    if (perBubble.length) {
      bubbles = bubbles.map(function (piece) {
        perBubble.forEach(function (r) {
          piece = runOne(piece, r);
        });
        return piece;
      });
      bubbles = bubbles.filter(function (s) {
        return s.length > 0;
      });
    }

    return bubbles;
  }

  /* ---------- 3) 上下文记忆：每个角色单独设「带多少轮」 ----------
     1 轮 = 用户 1 条 + AI 1 条（两条消息）；默认值与允许范围见 config.js 的
     SN.contextRounds（默认 100 轮、上限 500 轮、最少 1 轮）。
     存法：state.chatSettings[角色id].contextRounds；没设置过的角色走默认值。
     谁在用：聊天设置页（ui/views.js，读写）与拼请求的 apiClient.buildMessages（读）。 */
  const ROUNDS = Object.assign({ default: 100, min: 1, max: 500, step: 1 }, SN.contextRounds || {});

  /* 夹到合法范围；空值 / 非数字（没输数字）都当作默认值 */
  function clampRounds(value) {
    if (value === null || value === undefined) return ROUNDS.default;
    if (typeof value === "string" && !value.trim()) return ROUNDS.default;
    const n = Math.round(Number(value));
    if (!isFinite(n)) return ROUNDS.default;
    return Math.max(ROUNDS.min, Math.min(ROUNDS.max, n));
  }

  /* 这个角色到底带多少轮：改过就用改过的，没改过用默认值 */
  function roundsFor(characterId) {
    const map = store.state.chatSettings || {};
    const entry = map[characterId];
    return clampRounds(entry ? entry.contextRounds : null);
  }

  /* 写入（自动夹在 min ~ max 之间）；写进 state 后由数据层自动持久化 */
  function setRounds(characterId, value) {
    if (!characterId) return;
    const state = store.state;
    if (!state.chatSettings || typeof state.chatSettings !== "object") state.chatSettings = {};
    state.chatSettings[characterId] = Object.assign(
      {},
      state.chatSettings[characterId] || {},
      { contextRounds: clampRounds(value) }
    );
  }

  /* ---------- 4) AI 消息落库前自动处理 ----------
     包一层 pushMessage：凡是 AI 的回复（role "them"/"ai"），先跑正则、
     再按 ||| 拆成多条气泡；用户消息与空消息原样放行。
     （保持原函数的三参数签名 characterId / role / text 不变） */
  const originalPushMessage = store.pushMessage;
  store.pushMessage = function (characterId, role, text) {
    const isAI = role === "them" || role === "ai" || role === "assistant";
    const raw = typeof text === "string" ? text : "";
    if (!isAI || !raw.trim()) return originalPushMessage(characterId, role, text);

    const bubbles = processReply(raw);
    const pieces = bubbles.length ? bubbles : [raw];
    let last = null;
    pieces.forEach(function (piece) {
      last = originalPushMessage(characterId, role, piece);
    });
    return last;
  };

  /* ---------- 5) 备份/持久化带上逻辑层三张表 ----------
     包一层 snapshot：导出备份与 localStorage 保存都经过它。 */
  const originalSnapshot = store.snapshot;
  if (originalSnapshot) {
    store.snapshot = function () {
      const snap = originalSnapshot();
      snap.presets = store.state.presets || [];
      snap.regexes = store.state.regexes || [];
      snap.memoryBank = store.state.memoryBank || [];
      snap.activePresetId = store.state.activePresetId || "";
      snap.masks = store.state.masks || [];
      snap.activeMaskId = store.state.activeMaskId || "";
      return snap;
    };
  }

  SN.logic.systemSections = systemSections;
  SN.logic.processReply = processReply;
  SN.logic.activeMask = activeMask;
  /* 上下文记忆轮数：聊天设置页读写它，buildMessages 读它 */
  SN.logic.context = {
    rounds: roundsFor,
    setRounds: setRounds,
    clamp: clampRounds,
    MIN: ROUNDS.min,
    MAX: ROUNDS.max,
    DEFAULT: ROUNDS.default,
    STEP: ROUNDS.step
  };
})(window.SN);
