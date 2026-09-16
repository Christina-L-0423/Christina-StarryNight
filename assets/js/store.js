/* ============================================================
   store.js —— 小手机的“大脑”
   负责：全局状态、时间、壁纸、本地存储（刷新不丢数据）、
         打开/关闭应用、数据导出与导入
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  const { reactive, computed, ref, watch } = Vue;

  const STORAGE_KEY = "starrynight.state.v1";

  /* 深拷贝小工具：避免示例数据被真实数据污染 */
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ---------- 读取本地已保存的数据 ---------- */
  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.warn("[StarryNight] 本地数据读取失败，将使用默认值：", err);
      return {};
    }
  }

  const saved = readStorage();

  /* ---------- 全局状态 ---------- */
  const state = reactive({
    /** 当前打开的应用 id；null 表示正在看桌面 */
    activeApp: null,
    settings: Object.assign(clone(SN.defaults.settings), saved.settings || {}),
    user: Object.assign(clone(SN.defaults.user), saved.user || {}),
    characters: saved.characters || clone(SN.defaults.characters),
    worldbook: saved.worldbook || clone(SN.defaults.worldbook),
    forumPosts: saved.forumPosts || clone(SN.defaults.forumPosts),
    chats: saved.chats || clone(SN.defaults.chats)
  });

  /* ---------- 时间：每秒刷新 ---------- */
  const now = ref(new Date());

  window.setInterval(function () {
    now.value = new Date();
  }, 1000);

  const clock = computed(function () {
    const d = now.value;
    const pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    const week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return {
      hm: pad(d.getHours()) + ":" + pad(d.getMinutes()),
      /** 例如：9月16日 星期三 */
      date: d.getMonth() + 1 + "月" + d.getDate() + "日 " + week[d.getDay()]
    };
  });

  /* ---------- 壁纸与明暗主题 ---------- */
  const wallpaper = computed(function () {
    return SN.findWallpaper(state.settings.wallpaper);
  });

  const schemeClass = computed(function () {
    return wallpaper.value.scheme === "light" ? "theme-light" : "theme-dark";
  });

  /* ---------- 天气（真正取数据由 weather.js 负责） ---------- */
  const weather = ref({
    temp: 24,
    text: "晴",
    icon: "sun",
    live: false,
    loading: false,
    updatedAt: ""
  });

  /* ---------- 本地存储 ---------- */
  function snapshot() {
    return {
      settings: clone(state.settings),
      user: clone(state.user),
      characters: clone(state.characters),
      worldbook: clone(state.worldbook),
      forumPosts: clone(state.forumPosts),
      chats: clone(state.chats)
    };
  }

  function persistNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (err) {
      console.warn("[StarryNight] 保存失败（可能是浏览器的隐私模式）：", err);
    }
  }

  let saveTimer = null;
  function persistSoon() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persistNow, 300);
  }

  /* 任何一处数据变化，都会自动保存到本地 */
  watch(
    function () {
      return [state.settings, state.user, state.characters, state.worldbook, state.forumPosts, state.chats];
    },
    persistSoon,
    { deep: true }
  );

  /* ---------- 打开 / 关闭应用 ---------- */
  /* 传 id 字符串或应用对象都可以，这里统一成 id */
  function openApp(target) {
    if (!target) return;
    state.activeApp = typeof target === "string" ? target : target.id;
  }

  function closeApp() {
    state.activeApp = null;
  }

  /* ---------- 聊天小工具 ---------- */
  function timeStamp() {
    return clock.value.hm;
  }

  function pushMessage(characterId, role, text) {
    if (!state.chats[characterId]) state.chats[characterId] = [];
    state.chats[characterId].push({ role: role, text: text, time: timeStamp() });
  }

  function clearChat(characterId) {
    state.chats[characterId] = [];
  }

  /* ---------- 备份：导出成 JSON 文件 ---------- */
  function exportData() {
    const payload = {
      app: SN.APP_NAME,
      version: SN.VERSION,
      exportedAt: new Date().toISOString(),
      data: snapshot()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    a.href = url;
    a.download =
      "starrynight-backup-" +
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function applySnapshot(payload) {
    if (payload.settings) Object.assign(state.settings, payload.settings);
    if (payload.user) Object.assign(state.user, payload.user);
    if (Array.isArray(payload.characters)) state.characters = payload.characters;
    if (Array.isArray(payload.worldbook)) state.worldbook = payload.worldbook;
    if (Array.isArray(payload.forumPosts)) state.forumPosts = payload.forumPosts;
    if (payload.chats) state.chats = payload.chats;
    persistNow();
  }

  /* ---------- 备份：从 JSON 文件恢复 ---------- */
  function importData(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const parsed = JSON.parse(String(reader.result));
          const payload = parsed && parsed.data ? parsed.data : parsed;
          if (!payload || typeof payload !== "object") {
            throw new Error("这个文件看起来不是小手机的备份");
          }
          applySnapshot(payload);
          resolve(payload);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () {
        reject(new Error("文件读取失败"));
      };
      reader.readAsText(file);
    });
  }

  /* ---------- 恢复出厂设置 ---------- */
  function resetAll() {
    state.settings = clone(SN.defaults.settings);
    state.user = clone(SN.defaults.user);
    state.characters = clone(SN.defaults.characters);
    state.worldbook = clone(SN.defaults.worldbook);
    state.forumPosts = clone(SN.defaults.forumPosts);
    state.chats = clone(SN.defaults.chats);
    state.activeApp = null;
    persistNow();
  }

  /* ---------- 对外暴露的接口 ---------- */
  SN.store = {
    state: state,
    clock: clock,
    wallpaper: wallpaper,
    schemeClass: schemeClass,
    weather: weather,
    openApp: openApp,
    closeApp: closeApp,
    pushMessage: pushMessage,
    clearChat: clearChat,
    timeStamp: timeStamp,
    exportData: exportData,
    importData: importData,
    resetAll: resetAll,
    persistNow: persistNow,
    snapshot: snapshot
  };
})(window.SN);