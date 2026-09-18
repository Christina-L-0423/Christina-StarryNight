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

  /* 一次性数据迁移（v0.4）：默认示例世界书清空、默认角色只保留 Christina。
     只对老数据跑一次并打标记；之后用户自己添加的内容、导入的备份都不会再被动。 */
  const MIGRATIONS_KEY = "starrynight.migrations.v1";
  (function runMigrations() {
    let flags = {};
    try {
      flags = JSON.parse(localStorage.getItem(MIGRATIONS_KEY) || "{}") || {};
    } catch (err) {
      flags = {};
    }
    let changed = false;
    if (!flags.removeSampleWorldbook) {
      if (Array.isArray(saved.worldbook)) saved.worldbook = [];
      flags.removeSampleWorldbook = true;
      changed = true;
    }
    if (!flags.keepOnlyChristina) {
      /* 老版本的示例角色（星野零零 / 夜航星）不再需要，清掉；
         用户自己加的角色不动，否则导入备份后会被误删。 */
      const SAMPLE_CHARACTER_IDS = ["xingye", "yohang"];
      if (Array.isArray(saved.characters)) {
        saved.characters = saved.characters.filter(function (c) {
          return c && SAMPLE_CHARACTER_IDS.indexOf(c.id) === -1;
        });
      }
      if (saved.chats && typeof saved.chats === "object") {
        SAMPLE_CHARACTER_IDS.forEach(function (id) {
          delete saved.chats[id];
        });
      }
      flags.keepOnlyChristina = true;
      changed = true;
    }
    if (!flags.stripCharacterTagline) {
      /* 角色「简介」字段已废弃：老数据里的一起删掉 */
      if (Array.isArray(saved.characters)) {
        saved.characters.forEach(function (c) {
          if (c) delete c.tagline;
        });
      }
      flags.stripCharacterTagline = true;
      changed = true;
    }
    if (changed) {
      try {
        localStorage.setItem(MIGRATIONS_KEY, JSON.stringify(flags));
      } catch (err) {
        /* 存不上标记也没关系：本次会话内已经清理完成 */
      }
    }
  })();

  /* 设置合并：settings.api 是嵌套对象，浅合并会在旧数据上丢新字段，所以单独深合并 */
  function mergeSettings(savedSettings) {
    const merged = Object.assign(clone(SN.defaults.settings), savedSettings || {});
    merged.api = Object.assign(clone(SN.defaults.settings.api), (savedSettings && savedSettings.api) || {});
    return merged;
  }

  /* ---------- 锁定角色（官方默认角色）的强制同步 ----------
     config.js 里标记了 locked: true 的角色属于「官方设定」：
     1) 每次打开页面都用文件里的最新设定覆盖本地存储里的旧版本（用户改了刷新就还原）
     2) 导入备份时也不会被备份里的旧设定覆盖
     用户自己添加的角色不受影响，按原顺序保留在后面。 */
  function withLockedCharacters(list) {
    const locked = SN.defaults.characters.filter(function (c) {
      return c && c.locked;
    });
    const lockedIds = locked.map(function (c) {
      return c.id;
    });
    const keep = (Array.isArray(list) ? list : []).filter(function (c) {
      return c && c.id && lockedIds.indexOf(c.id) === -1;
    });
    return locked.map(clone).concat(keep);
  }

  /* ---------- 全局状态 ---------- */
  const state = reactive({
    /** 当前打开的应用 id；null 表示正在看桌面 */
    activeApp: null,
    /** 打开应用时附带的小参数（例如角色编辑页的 { characterId }） */
    appParams: {},
    settings: mergeSettings(saved.settings),
    user: Object.assign(clone(SN.defaults.user), saved.user || {}),
    characters: withLockedCharacters(saved.characters),
    worldbook: saved.worldbook || clone(SN.defaults.worldbook),
    forumPosts: saved.forumPosts || clone(SN.defaults.forumPosts),
    chats: saved.chats || clone(SN.defaults.chats),
    /* 逻辑层三张表：系统提示词/预设、正则、记忆库 */
    presets: Array.isArray(saved.presets) ? saved.presets : clone((SN.defaults && SN.defaults.presets) || []),
    regexes: Array.isArray(saved.regexes) ? saved.regexes : clone((SN.defaults && SN.defaults.regexes) || []),
    memoryBank: Array.isArray(saved.memoryBank) ? saved.memoryBank : clone((SN.defaults && SN.defaults.memoryBank) || []),
    /* 当前使用的预设 id（逻辑层 prompt.js 优先用它挑预设） */
    activePresetId: saved.activePresetId || (SN.defaults && SN.defaults.activePresetId) || "",
    /* 自定义壁纸列表（只存 id 和名字；图片本体在 mediaStore 的图片库里） */
    customWallpapers: Array.isArray(saved.customWallpapers) ? saved.customWallpapers : []
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
  const CUSTOM_PREFIX = "custom_";

  const wallpaper = computed(function () {
    const id = state.settings.wallpaper;
    if (typeof id === "string" && id.indexOf(CUSTOM_PREFIX) === 0) {
      const meta = state.customWallpapers.filter(function (w) {
        return w.id === id;
      })[0];
      if (meta) {
        /* 自定义图片壁纸：按深色主题显示白字，不叠加星点 */
        return { id: meta.id, name: meta.name, type: "image", isImage: true, scheme: "dark", stars: false };
      }
    }
    return SN.findWallpaper(id) || SN.findWallpaper(SN.defaults.settings.wallpaper);
  });

  /* 壁纸元素的完整样式：内置壁纸 = CSS 渐变；自定义 = 图片 dataURL */
  const wallpaperStyle = computed(function () {
    const wp = wallpaper.value;
    if (wp.isImage) {
      const meta =
        state.customWallpapers.filter(function (w) {
          return w.id === wp.id;
        })[0] || {};
      return { backgroundImage: meta.dataUrl ? 'url("' + meta.dataUrl + '")' : "none" };
    }
    return { backgroundImage: wp.css };
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
      chats: clone(state.chats),
      /* 自定义壁纸只存 id + 名字，图片本体不放进 localStorage（太大了） */
      customWallpapers: state.customWallpapers.map(function (w) {
        return { id: w.id, name: w.name };
      })
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
      return [state.settings, state.user, state.characters, state.worldbook, state.forumPosts, state.chats, state.customWallpapers];
    },
    persistSoon,
    { deep: true }
  );

  /* ---------- 打开 / 关闭应用 ---------- */
  /* 传 id 字符串或应用对象都可以，这里统一成 id。
     params 可选：给页面传一点进入时需要的参数，例如角色编辑页的 { characterId } */
  function openApp(target, params) {
    if (!target) return;
    state.activeApp = typeof target === "string" ? target : target.id;
    state.appParams = params && typeof params === "object" ? Object.assign({}, params) : {};
  }

  function closeApp() {
    state.activeApp = null;
    state.appParams = {};
  }

  /* ---------- 聊天小工具 ---------- */
  function timeStamp() {
    return clock.value.hm;
  }

  /* quote 可选：引用回复时带上的那段小引用文字 */
  function pushMessage(characterId, role, text, quote) {
    if (!state.chats[characterId]) state.chats[characterId] = [];
    /* ts：真实时间戳（毫秒）。聊天上方的微信式时间分割线、会话列表右上角的
       「上次聊天时间」都靠它算；旧备份里的消息没有 ts，界面会自动退回显示 time 字符串 */
    const message = { role: role, text: text, time: timeStamp(), ts: Date.now() };
    if (quote) message.quote = quote;
    state.chats[characterId].push(message);
  }

  function clearChat(characterId) {
    state.chats[characterId] = [];
  }

  /* ---------- 自定义壁纸 ---------- */

  /* 启动时调用：从图片库把图片内容补回列表（列表里平时只有 id 和名字） */
  function hydrateWallpaperImages() {
    if (!SN.mediaStore) return;
    state.customWallpapers.forEach(function (w) {
      if (!w.dataUrl) {
        const dataUrl = SN.mediaStore.get(w.id);
        if (dataUrl) w.dataUrl = dataUrl;
      }
    });
  }

  /* 添加一张自定义壁纸（dataUrl 已经是压缩过的图片），并立即使用 */
  function addCustomWallpaper(name, dataUrl) {
    const id = CUSTOM_PREFIX + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    state.customWallpapers.push({ id: id, name: name || "我的壁纸", dataUrl: dataUrl });
    if (SN.mediaStore) SN.mediaStore.put(id, dataUrl);
    state.settings.wallpaper = id;
    return id;
  }

  /* 删除一张自定义壁纸；如果删的是正在用的，就退回默认壁纸 */
  function removeCustomWallpaper(id) {
    const index = state.customWallpapers.findIndex(function (w) {
      return w.id === id;
    });
    if (index === -1) return;
    state.customWallpapers.splice(index, 1);
    if (SN.mediaStore) SN.mediaStore.remove(id);
    if (state.settings.wallpaper === id) {
      state.settings.wallpaper = SN.defaults.settings.wallpaper;
    }
  }

  /* ---------- 备份：导出成 JSON 文件 ---------- */
  function exportData() {
    const payload = {
      app: SN.APP_NAME,
      version: SN.VERSION,
      exportedAt: new Date().toISOString(),
      data: snapshot(),
      /* 自定义壁纸的图片一起打包，换设备也能恢复 */
      images: SN.mediaStore ? SN.mediaStore.entries() : []
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
    if (payload.settings) {
      /* 深合并，保证嵌套的 settings.api 字段在旧备份上也完整 */
      state.settings = mergeSettings(payload.settings);
    }
    if (payload.user) Object.assign(state.user, payload.user);
    if (Array.isArray(payload.characters)) state.characters = withLockedCharacters(payload.characters);
    if (Array.isArray(payload.worldbook)) state.worldbook = payload.worldbook;
    if (Array.isArray(payload.forumPosts)) state.forumPosts = payload.forumPosts;
    if (payload.chats) state.chats = payload.chats;
    if (Array.isArray(payload.presets)) state.presets = payload.presets;
    if (Array.isArray(payload.regexes)) state.regexes = payload.regexes;
    if (Array.isArray(payload.memoryBank)) state.memoryBank = payload.memoryBank;
    if (typeof payload.activePresetId === "string") state.activePresetId = payload.activePresetId;

    /* 恢复自定义壁纸：列表 + 把图片写回本机图片库 */
    const imageMap = {};
    if (Array.isArray(payload.images)) {
      payload.images.forEach(function (img) {
        if (img && img.id && typeof img.dataUrl === "string") imageMap[img.id] = img.dataUrl;
      });
    }
    if (Array.isArray(payload.customWallpapers)) {
      state.customWallpapers = payload.customWallpapers.map(function (w) {
        const dataUrl =
          (w && w.dataUrl) || imageMap[w.id] || (SN.mediaStore ? SN.mediaStore.get(w.id) : null) || "";
        return { id: w.id, name: w.name, dataUrl: dataUrl };
      });
      state.customWallpapers.forEach(function (w) {
        if (w.dataUrl && SN.mediaStore) SN.mediaStore.put(w.id, w.dataUrl);
      });
    }
    /* 备份里已经不存在的自定义壁纸，别再挂在设置上 */
    if (typeof state.settings.wallpaper === "string" && state.settings.wallpaper.indexOf("custom_") === 0) {
      const stillThere = state.customWallpapers.some(function (w) {
        return w.id === state.settings.wallpaper;
      });
      if (!stillThere) state.settings.wallpaper = SN.defaults.settings.wallpaper;
    }

    persistNow();
  }

  /* ---------- 备份：从 JSON 文件恢复 ---------- */
  function importData(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const parsed = JSON.parse(String(reader.result));
          const payload = Object.assign({}, parsed && parsed.data ? parsed.data : parsed);
          /* 图片库（自定义壁纸）单独放在备份文件的顶层，一起合并进恢复数据 */
          if (parsed && Array.isArray(parsed.images)) payload.images = parsed.images;
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
    state.presets = clone((SN.defaults && SN.defaults.presets) || []);
    state.regexes = clone((SN.defaults && SN.defaults.regexes) || []);
    state.memoryBank = clone((SN.defaults && SN.defaults.memoryBank) || []);
    state.activePresetId = (SN.defaults && SN.defaults.activePresetId) || "";
    state.customWallpapers = [];
    if (SN.mediaStore && SN.mediaStore.clear) SN.mediaStore.clear();
    state.activeApp = null;
    persistNow();
  }

  /* ---------- 对外暴露的接口 ---------- */
  SN.store = {
    state: state,
    clock: clock,
    wallpaper: wallpaper,
    wallpaperStyle: wallpaperStyle,
    schemeClass: schemeClass,
    weather: weather,
    openApp: openApp,
    closeApp: closeApp,
    hydrateWallpaperImages: hydrateWallpaperImages,
    addCustomWallpaper: addCustomWallpaper,
    removeCustomWallpaper: removeCustomWallpaper,
    pushMessage: pushMessage,
    clearChat: clearChat,
    timeStamp: timeStamp,
    exportData: exportData,
    importData: importData,
    applySnapshot: applySnapshot,
    resetAll: resetAll,
    persistNow: persistNow,
    snapshot: snapshot
  };
})(window.SN);