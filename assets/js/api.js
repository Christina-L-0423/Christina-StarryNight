/* ============================================================
   api.js —— 真正的 AI 对话（OpenAI 兼容接口）
   DeepSeek / 硅基流动 / OpenRouter / OpenAI / 本地 Ollama
   这些服务商都遵守同一套接口格式，所以一个模块全通吃。
   密钥只存在你自己的浏览器里，请求从你的设备直达服务商。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  /* ---------- 小工具 ---------- */

  function apiSettings() {
    return SN.store.state.settings.api;
  }

  /* 把 Base URL 拼成完整的 chat/completions 地址
     （用户填 https://api.deepseek.com/v1 或填到域名根都行） */
  function joinUrl(baseUrl) {
    let url = String(baseUrl || "").trim().replace(/\/+$/, "");
    if (!url) return "";
    if (url.indexOf("/chat/completions") !== url.length - "/chat/completions".length) {
      url += "/chat/completions";
    }
    return url;
  }

  function isLocalUrl(url) {
    return /\/\/(localhost|127\.0\.0\.1)/.test(String(url || ""));
  }

  /* 是否已经配置到能发请求的程度 */
  function isConfigured() {
    const api = apiSettings();
    return Boolean(api && api.baseUrl && api.model && (api.apiKey || isLocalUrl(api.baseUrl)));
  }

  /* ---------- 把各种报错翻译成人话 ---------- */
  function friendlyError(err) {
    const raw = err && err.message ? String(err.message) : String(err || "");
    const httpMatch = raw.match(/^HTTP (\d+)/);

    if (httpMatch) {
      const code = Number(httpMatch[1]);
      if (code === 401 || code === 403) {
        return "密钥无效或没有权限（HTTP " + code + "）。请检查 API Key 是否填对、有没有过期。";
      }
      if (code === 402) return "账户余额不足（HTTP 402），请去服务商后台充值后重试。";
      if (code === 404) {
        return "接口地址或模型名不对（HTTP 404）。检查 Base URL 是否多了/少了 /v1，模型名是否拼写正确。";
      }
      if (code === 429) return "请求太频繁或额度受限（HTTP 429），休息几秒再试。";
      if (code >= 500) return "服务商服务器暂时出错（HTTP " + code + "），稍后再试。";
      return "接口返回错误（HTTP " + code + "）。";
    }
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(raw)) {
      return (
        "连不上接口地址。请检查：① 网络是否可用；② Base URL 是否写对；" +
        "③ 该服务商是否允许浏览器直接调用（跨域限制）。" +
        "本地 Ollama 需设置环境变量 OLLAMA_ORIGINS=* 并重启后再试。"
      );
    }
    if (raw) return raw;
    return "请求失败，请稍后再试。";
  }

  /* ---------- 组装发给 AI 的消息（系统设定 + 世界书 + 最近聊天） ---------- */
  function buildMessages(characterId) {
    const state = SN.store.state;
    const char = state.characters.filter(function (c) {
      return c.id === characterId;
    })[0];
    if (!char) throw new Error("找不到这个角色，请重新从会话列表进入。");

    const api = apiSettings();
    const lines = [];

    lines.push("你在一个「AI 陪伴小手机」应用里扮演角色「" + char.name + "」，和用户持续聊天。");
    lines.push("角色设定：" + (char.persona || char.tagline || "一个温柔、真诚的聊天伙伴。"));
    if (char.greeting) {
      lines.push("你的开场白是「" + char.greeting + "」，仅供了解语气，不要重复念出来。");
    }
    if (state.worldbook && state.worldbook.length) {
      lines.push("以下是世界书设定，聊天时请遵守：");
      state.worldbook.forEach(function (item) {
        lines.push("【" + item.title + "】" + item.content);
      });
    }
    lines.push(
      "对话对象是「" + (state.user.name || "朋友") + "」。要求：始终用中文口语；" +
        "保持角色不出戏；不要声称自己是 AI 或模型；回复像微信聊天一样自然简短；不要每条都以反问结尾。"
    );

    const keep = Math.max(2, Number(api.contextCount) || 20);
    const history = (state.chats[characterId] || [])
      .slice(-keep)
      .map(function (m) {
        return { role: m.role === "me" ? "user" : "assistant", content: m.text };
      })
      .filter(function (m) {
        return m.content;
      });

    return [{ role: "system", content: lines.join("\n") }].concat(history);
  }

  /* ---------- 解析流式输出的每一行（纯函数，方便自动化测试） ---------- */
  function parseSSELines(lines) {
    const out = { texts: [], done: false };
    lines.forEach(function (line) {
      const trimmed = String(line || "").trim();
      if (trimmed.indexOf("data:") !== 0) return;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        out.done = true;
        return;
      }
      try {
        const obj = JSON.parse(payload);
        const delta = obj && obj.choices && obj.choices[0] && obj.choices[0].delta;
        if (delta && typeof delta.content === "string" && delta.content) out.texts.push(delta.content);
      } catch (err) {
        /* 忽略无法解析的行（有些服务商会夹注释行） */
      }
    });
    return out;
  }

  /* ---------- 逐块读取流式回复；每有新文字就回调 onDelta(累计全文) ---------- */
  function readStream(response, onDelta) {
    const reader = response.body.getReader();
    const decoder = new window.TextDecoder();
    let buffer = "";
    let full = "";

    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) return full;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        const parsed = parseSSELines(lines);
        if (parsed.texts.length) {
          full += parsed.texts.join("");
          onDelta(full);
        }
        return pump();
      });
    }

    return pump().then(function (text) {
      if (!String(text).trim()) throw new Error("服务商返回了空回复");
      return text;
    });
  }

  /* ---------- 发起一次对话 ---------- */
  let controller = null;

  function chat(opts) {
    const api = apiSettings();
    if (!isConfigured()) {
      return Promise.reject(
        new Error("尚未配置 API：请到「设置 → AI 接口」选服务商、填密钥，再点「测试连接」。")
      );
    }

    /* 决定是否流式：需要回调 + 开关打开 + 浏览器支持（jsdom/老浏览器自动退回整段模式） */
    const useStream =
      Boolean(opts && opts.onDelta) &&
      opts.noStream !== true &&
      api.stream !== false &&
      typeof window.TextDecoder === "function";

    const headers = { "Content-Type": "application/json" };
    if (api.apiKey) headers.Authorization = "Bearer " + String(api.apiKey).trim();

    const body = {
      model: String(api.model || "").trim(),
      messages: opts.messages,
      temperature: Number(api.temperature),
      stream: useStream
    };
    const maxTokens = Number(opts.maxTokens || api.maxTokens);
    if (maxTokens) body.max_tokens = maxTokens;

    controller = typeof window.AbortController === "function" ? new window.AbortController() : null;

    return fetch(joinUrl(api.baseUrl), {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    })
      .then(function (resp) {
        if (!resp.ok) {
          return resp.text().then(function (raw) {
            throw new Error("HTTP " + resp.status + (raw ? " " + String(raw).slice(0, 200) : ""));
          });
        }
        if (useStream) {
          if (!resp.body || !resp.body.getReader) {
            throw new Error("当前浏览器不支持流式输出，请在设置里关闭「流式输出」后再试。");
          }
          return readStream(resp, opts.onDelta);
        }
        return resp.json().then(function (data) {
          const choice = data && data.choices && data.choices[0];
          const text =
            choice && choice.message && typeof choice.message.content === "string"
              ? choice.message.content.trim()
              : "";
          if (!text) throw new Error("服务商返回了空回复");
          return text;
        });
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") {
          const aborted = new Error("已停止生成");
          aborted.name = "AbortError";
          throw aborted;
        }
        throw new Error(friendlyError(err));
      });
  }

  /* 停止当前正在生成的回复（聊天页的“停止”按钮） */
  function cancel() {
    if (controller) controller.abort();
  }

  /* 设置页的「测试连接」：发一条极小的请求，确认配置是否正确 */
  function testConnection() {
    const api = apiSettings();
    if (!api.baseUrl) return Promise.resolve({ ok: false, message: "请先填写接口地址 Base URL。" });
    if (!api.model) return Promise.resolve({ ok: false, message: "请先填写模型名称。" });
    if (!api.apiKey && !isLocalUrl(api.baseUrl)) {
      return Promise.resolve({ ok: false, message: "请先填写 API Key（本地 Ollama 可以不填）。" });
    }
    return chat({ messages: [{ role: "user", content: "请只回复两个字：成功" }], noStream: true, maxTokens: 16 })
      .then(function (text) {
        return { ok: true, reply: text };
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") {
          return { ok: false, message: "已取消。" };
        }
        return { ok: false, message: err && err.message ? err.message : "测试失败。" };
      });
  }

  SN.api = {
    isConfigured: isConfigured,
    buildMessages: buildMessages,
    chat: chat,
    cancel: cancel,
    testConnection: testConnection,
    joinUrl: joinUrl,
    /* 下划线开头 = 内部工具，暴露出来给自动化测试用 */
    _parseSSELines: parseSSELines
  };
})(window.SN);
