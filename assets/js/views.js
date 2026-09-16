/* ============================================================
   views.js —— 每个应用点进去之后看到的内容
   一个组件 = 一个页面。目前都是“骨架 + 示例数据”，
   之后接 API、接后端，主要就是来改这里。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  const { ref, computed, nextTick } = Vue;

  /* 找不到数据时的兜底提示文字 */
  const MOCK_REPLY =
    "（本地示例回复）我已经收到啦。等你在「设置 → AI 接口」里填好地址和密钥，这里会变成真正的回答。";

  /* ============================================================
     1) 聊天：会话列表 → 点进去是聊天界面
     ============================================================ */
  SN.components["sn-chat-view"] = {
    name: "sn-chat-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const activeId = ref(null);
      const draft = ref("");
      const sending = ref(false);

      const characters = computed(function () {
        return store.state.characters;
      });

      const activeCharacter = computed(function () {
        return (
          characters.value.filter(function (c) {
            return c.id === activeId.value;
          })[0] || null
        );
      });

      const messages = computed(function () {
        return store.state.chats[activeId.value] || [];
      });

      function lastText(id) {
        const list = store.state.chats[id] || [];
        const last = list[list.length - 1];
        return last ? last.text : "还没有聊天记录，点进去说第一句话吧";
      }

      function scrollToBottom() {
        nextTick(function () {
          const box = document.querySelector(".app-screen .app-body");
          if (box) box.scrollTop = box.scrollHeight;
        });
      }

      function openChat(id) {
        activeId.value = id;
        scrollToBottom();
      }

      function backToList() {
        activeId.value = null;
      }

      function send() {
        const text = draft.value.trim();
        if (!text || !activeId.value || sending.value) return;

        const targetId = activeId.value;
        store.pushMessage(targetId, "me", text);
        draft.value = "";
        scrollToBottom();

        /* 这里先给一个本地假回复，方便看效果；接入 API 后替换成真实请求 */
        sending.value = true;
        window.setTimeout(function () {
          store.pushMessage(targetId, "them", MOCK_REPLY);
          sending.value = false;
          scrollToBottom();
        }, 700);
      }

      return {
        characters: characters,
        activeCharacter: activeCharacter,
        messages: messages,
        draft: draft,
        sending: sending,
        lastText: lastText,
        openChat: openChat,
        backToList: backToList,
        send: send
      };
    },
    template: `
      <div v-if="!activeCharacter">
        <p class="section-title">全部会话</p>
        <div class="list">
          <button class="row" type="button" v-for="c in characters" :key="c.id" @click="openChat(c.id)">
            <span class="avatar" :style="{ backgroundImage: c.gradient }">{{ c.name.charAt(0) }}</span>
            <span class="row__main">
              <span class="row__label">{{ c.name }}</span>
              <span class="row__sub">{{ lastText(c.id) }}</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
        </div>
        <p class="field__hint">
          现在是本地示例会话（只存在你自己的浏览器里）。接入真实 AI 需要到
          「设置 → AI 接口」填写接口地址与密钥。
        </p>
      </div>

      <div v-else>
        <div class="app-header__bar">
          <button class="back-btn" type="button" @click="backToList">
            <sn-glyph name="chevron-left" :size="18"></sn-glyph><span>会话</span>
          </button>
          <span class="row__value">{{ activeCharacter.name }}</span>
        </div>

        <div class="bubble-time">{{ activeCharacter.tagline }}</div>

        <div class="bubble-row" v-for="(m, i) in messages" :key="i" :class="{ 'bubble-row--me': m.role === 'me' }">
          <div class="bubble" :class="m.role === 'me' ? 'bubble--me' : 'bubble--them'">{{ m.text }}</div>
        </div>

        <div class="empty" v-if="!messages.length">还没有消息，说点什么吧。</div>

        <form class="composer" @submit.prevent="send">
          <input class="input" v-model="draft" type="text" placeholder="说点什么…" />
          <button class="send-btn" type="submit" :disabled="!draft.trim()">
            <sn-glyph name="send" :size="18"></sn-glyph>
          </button>
        </form>
      </div>
    `
  };

  /* ============================================================
     2) 美化：换壁纸、调外观
     ============================================================ */
  SN.components["sn-beautify-view"] = {
    name: "sn-beautify-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const settings = store.state.settings;

      const wallpapers = SN.wallpapers;
      const currentId = computed(function () {
        return settings.wallpaper;
      });

      function choose(id) {
        settings.wallpaper = id;
      }

      function resetWallpaper() {
        settings.wallpaper = SN.defaults.settings.wallpaper;
      }

      /* 用 computed 的 get/set 写法，就能直接配合 v-model 使用 */
      const dockLabels = computed({
        get: function () {
          return settings.dockLabels;
        },
        set: function (value) {
          settings.dockLabels = value;
        }
      });

      const battery = computed({
        get: function () {
          return settings.battery;
        },
        set: function (value) {
          settings.battery = Number(value) || 0;
        }
      });

      return {
        wallpapers: wallpapers,
        currentId: currentId,
        choose: choose,
        resetWallpaper: resetWallpaper,
        dockLabels: dockLabels,
        battery: battery
      };
    },
    template: `
      <p class="section-title">壁纸</p>
      <div class="wallpaper-pick">
        <button class="wallpaper-pick__item" type="button" v-for="w in wallpapers" :key="w.id"
          :class="{ 'is-active': w.id === currentId }" :style="{ backgroundImage: w.css }"
          @click="choose(w.id)">
          <span class="wallpaper-pick__name">{{ w.name }}</span>
        </button>
      </div>
      <p class="field__hint">选用浅色壁纸时，文字会自动变成深色，保证看得清。</p>

      <p class="section-title">桌面外观</p>
      <div class="list">
        <div class="row">
          <span class="row__main">
            <span class="row__label">Dock 显示应用名称</span>
            <span class="row__sub">关掉之后更像原生 iOS</span>
          </span>
          <sn-switch v-model="dockLabels"></sn-switch>
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">状态栏电量</span>
            <span class="row__sub">左右拖动试试，图标会跟着变</span>
          </span>
          <input class="range" type="range" min="0" max="100" v-model.number="battery" />
        </div>
      </div>

      <div class="btn-row">
        <button class="btn" type="button" @click="resetWallpaper">恢复默认壁纸</button>
      </div>

      <p class="field__hint">
        上传自己的壁纸、单独替换某个 APP 的图标，会在后面的版本里加上（需要先做图片存储）。
      </p>
    `
  };

  /* ============================================================
     3) 论坛：帖子列表（示例数据，可点赞）
     ============================================================ */
  SN.components["sn-forum-view"] = {
    name: "sn-forum-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const categories = ["推荐", "角色讨论", "经验分享", "闲聊"];
      const filter = ref("推荐");

      const posts = computed(function () {
        const all = store.state.forumPosts;
        if (filter.value === "推荐") return all;
        return all.filter(function (p) {
          return p.category === filter.value;
        });
      });

      function like(post) {
        post.likes += 1; /* 本地假点赞，只为看交互效果 */
      }

      return {
        categories: categories,
        filter: filter,
        posts: posts,
        like: like
      };
    },
    template: `
      <div class="chips">
        <button class="chip" type="button" v-for="c in categories" :key="c"
          :class="{ 'is-active': c === filter }" @click="filter = c">{{ c }}</button>
      </div>

      <div class="card post" v-for="p in posts" :key="p.id">
        <div class="post__head">
          <span class="avatar post__avatar">{{ p.author.charAt(0) }}</span>
          <span class="row__main">
            <span class="row__label">{{ p.author }}</span>
            <span class="row__sub">{{ p.category }}</span>
          </span>
        </div>
        <p class="post__title">{{ p.title }}</p>
        <p class="post__excerpt">{{ p.excerpt }}</p>
        <div class="post__actions">
          <button class="chip" type="button" @click="like(p)">
            <sn-glyph name="heart" :size="14"></sn-glyph>{{ p.likes }}
          </button>
          <span class="chip"><sn-glyph name="comment" :size="14"></sn-glyph>{{ p.comments }}</span>
        </div>
      </div>

      <div class="empty" v-if="!posts.length">这个分类下还没有帖子。</div>

      <p class="field__hint">
        论坛现在用的是本地示例数据。真正的发帖、评论需要后端服务器（Stage 3 再做）。
      </p>
    `
  };

  /* ============================================================
     4) 世界书：AI 的设定资料库
     ============================================================ */
  SN.components["sn-worldbook-view"] = {
    name: "sn-worldbook-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const filter = ref("全部");

      /* 分类是从条目里自动收集出来的，加新条目不用改这里 */
      const categories = computed(function () {
        const list = ["全部"];
        store.state.worldbook.forEach(function (item) {
          if (list.indexOf(item.category) === -1) list.push(item.category);
        });
        return list;
      });

      const entries = computed(function () {
        if (filter.value === "全部") return store.state.worldbook;
        return store.state.worldbook.filter(function (item) {
          return item.category === filter.value;
        });
      });

      return {
        filter: filter,
        categories: categories,
        entries: entries
      };
    },
    template: `
      <div class="chips">
        <button class="chip" type="button" v-for="c in categories" :key="c"
          :class="{ 'is-active': c === filter }" @click="filter = c">{{ c }}</button>
      </div>

      <div class="list">
        <div class="row" v-for="item in entries" :key="item.id">
          <span class="row__main">
            <span class="row__label">{{ item.title }}</span>
            <span class="row__sub row__sub--wrap">{{ item.content }}</span>
          </span>
          <span class="chip">{{ item.category }}</span>
        </div>
      </div>

      <div class="empty" v-if="!entries.length">这个世界书分类还是空的。</div>

      <p class="field__hint">
        世界书的作用：以后接入 API 时，小手机会自动挑选相关条目放进提示词，
        让 AI 记住你的设定。编辑/新增条目会在后续版本加上。
      </p>
    `
  };

  /* ============================================================
     5) 角色集：管理角色卡
     ============================================================ */
  SN.components["sn-characters-view"] = {
    name: "sn-characters-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;

      const characters = computed(function () {
        return store.state.characters;
      });

      /* 点角色卡 → 直接进聊天页 */
      function startChat() {
        store.openApp("chat");
      }

      return {
        characters: characters,
        startChat: startChat
      };
    },
    template: `
      <div class="card-grid">
        <button class="tile" type="button" v-for="c in characters" :key="c.id" @click="startChat">
          <span class="avatar avatar--lg" :style="{ backgroundImage: c.gradient }">{{ c.name.charAt(0) }}</span>
          <span class="tile__name">{{ c.name }}</span>
          <span class="tile__desc">{{ c.tagline }}</span>
        </button>
      </div>

      <div class="btn-row">
        <button class="btn" type="button" disabled>新建角色卡（后续版本）</button>
      </div>

      <p class="field__hint">
        点任意角色可以直接跳到「聊天」。角色卡的名字、头像、开场白，
        都可以在 config.js 的 characters 里改。
      </p>
    `
  };

  /* ============================================================
     6) 用户：个人主页
     ============================================================ */
  SN.components["sn-profile-view"] = {
    name: "sn-profile-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const user = store.state.user;

      const stats = computed(function () {
        const chats = store.state.chats;
        const messageCount = Object.keys(chats).reduce(function (sum, key) {
          return sum + (chats[key] ? chats[key].length : 0);
        }, 0);
        return {
          characters: store.state.characters.length,
          entries: store.state.worldbook.length,
          messages: messageCount
        };
      });

      return {
        user: user,
        stats: stats
      };
    },
    template: `
      <div class="card profile">
        <span class="avatar avatar--lg" :style="{ backgroundImage: user.gradient }">{{ user.name.charAt(0) }}</span>
        <p class="profile__name">{{ user.name }}</p>
        <p class="profile__sign">{{ user.signature }}</p>
      </div>

      <p class="section-title">资料</p>
      <label class="field">
        <span class="field__label">昵称</span>
        <input class="input" v-model="user.name" type="text" />
      </label>
      <label class="field">
        <span class="field__label">签名</span>
        <input class="input" v-model="user.signature" type="text" />
      </label>
      <p class="field__hint">改完会自动保存到本机浏览器，刷新页面也不会丢。</p>

      <p class="section-title">统计</p>
      <div class="list">
        <div class="row">
          <span class="row__main"><span class="row__label">角色</span></span>
          <span class="row__value">{{ stats.characters }} 位</span>
        </div>
        <div class="row">
          <span class="row__main"><span class="row__label">世界书条目</span></span>
          <span class="row__value">{{ stats.entries }} 条</span>
        </div>
        <div class="row">
          <span class="row__main"><span class="row__label">聊天消息</span></span>
          <span class="row__value">{{ stats.messages }} 条</span>
        </div>
      </div>
    `
  };

  /* ============================================================
     7) 设置：API、天气位置、数据备份
     ============================================================ */
  SN.components["sn-settings-view"] = {
    name: "sn-settings-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;
      const settings = store.state.settings;
      const weather = store.weather;

      const status = ref("");
      const fileInput = ref(null);

      /* v-model 要配合 get/set 形式的 computed，才能真的写回数据 */
      function bindSetting(key) {
        return computed({
          get: function () {
            return settings[key];
          },
          set: function (value) {
            settings[key] = value;
          }
        });
      }

      const useLiveWeather = bindSetting("useLiveWeather");

      function refreshWeather() {
        status.value = "正在获取天气…";
        SN.weather.refresh().then(function () {
          status.value = "天气已更新（" + (weather.value.live ? "实时数据" : "示例数据") + "）";
        });
      }

      function exportData() {
        store.exportData();
        status.value = "备份文件已开始下载，请留意浏览器右上角的下载提示。";
      }

      function pickFile() {
        if (fileInput.value) fileInput.value.click();
      }

      function onFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        store
          .importData(file)
          .then(function () {
            status.value = "导入成功，数据已恢复。";
          })
          .catch(function (err) {
            status.value = "导入失败：" + err.message;
          })
          .finally(function () {
            event.target.value = "";
          });
      }

      function askReset() {
        if (!window.confirm("确定要清空所有本地数据吗？聊天记录也会一起删除，且无法撤销。")) return;
        store.resetAll();
        status.value = "已恢复出厂设置。";
      }

      return {
        settings: settings,
        weather: weather,
        status: status,
        fileInput: fileInput,
        useLiveWeather: useLiveWeather,
        refreshWeather: refreshWeather,
        exportData: exportData,
        pickFile: pickFile,
        onFile: onFile,
        askReset: askReset,
        version: SN.VERSION
      };
    },
    template: `
      <p class="section-title">AI 接口</p>
      <label class="field">
        <span class="field__label">接口地址 Base URL</span>
        <input class="input" v-model="settings.apiBaseUrl" type="text" placeholder="例如 https://api.openai.com/v1" />
      </label>
      <label class="field">
        <span class="field__label">API Key</span>
        <input class="input" v-model="settings.apiKey" type="password" placeholder="sk-...（只保存在本机）" />
      </label>
      <label class="field">
        <span class="field__label">模型名称</span>
        <input class="input" v-model="settings.model" type="text" placeholder="例如 gpt-4o-mini" />
      </label>
      <div class="list">
        <div class="row">
          <span class="row__main">
            <span class="row__label">随机性 temperature</span>
            <span class="row__sub">越小越稳重，越大越有想象力</span>
          </span>
          <input class="range" type="range" min="0" max="2" step="0.1" v-model.number="settings.temperature" />
        </div>
      </div>
      <p class="field__hint">
        配置只保存在你自己的浏览器里，不会上传到任何服务器。真实对话请求会在 Stage 2 接上。
      </p>

      <p class="section-title">天气与位置</p>
      <label class="field">
        <span class="field__label">位置名称（只用于显示）</span>
        <input class="input" v-model="settings.locationName" type="text" placeholder="例如 锦江区" />
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field__label">纬度</span>
          <input class="input" v-model.number="settings.latitude" type="number" step="0.01" />
        </label>
        <label class="field">
          <span class="field__label">经度</span>
          <input class="input" v-model.number="settings.longitude" type="number" step="0.01" />
        </label>
      </div>
      <div class="list">
        <div class="row">
          <span class="row__main">
            <span class="row__label">使用实时天气</span>
            <span class="row__sub">关闭后只显示示例数据</span>
          </span>
          <sn-switch v-model="useLiveWeather"></sn-switch>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn" type="button" @click="refreshWeather">立即刷新天气</button>
      </div>
      <p class="field__hint">
        当前：{{ weather.temp }}° {{ weather.text }} · {{ weather.live ? '实时数据' : '示例数据' }}
      </p>

      <p class="section-title">数据管理</p>
      <div class="list">
        <button class="row" type="button" @click="exportData">
          <span class="row__main">
            <span class="row__label">导出备份</span>
            <span class="row__sub">把全部数据保存成一个 JSON 文件</span>
          </span>
          <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
        </button>
        <button class="row" type="button" @click="pickFile">
          <span class="row__main">
            <span class="row__label">导入备份</span>
            <span class="row__sub">从 JSON 文件恢复数据</span>
          </span>
          <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
        </button>
        <button class="row" type="button" @click="askReset">
          <span class="row__main">
            <span class="row__label">恢复出厂设置</span>
            <span class="row__sub">清空本机全部数据</span>
          </span>
          <sn-glyph class="row__chev" name="trash" :size="18"></sn-glyph>
        </button>
      </div>
      <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile" />
      <p class="field__hint" v-if="status">{{ status }}</p>

      <p class="section-title">关于</p>
      <div class="list">
        <div class="row">
          <span class="row__main"><span class="row__label">版本</span></span>
          <span class="row__value">{{ version }}</span>
        </div>
        <div class="row">
          <span class="row__main"><span class="row__label">数据存放位置</span></span>
          <span class="row__value">本机浏览器</span>
        </div>
        <div class="row">
          <span class="row__main"><span class="row__label">天气数据来源</span></span>
          <span class="row__value">Open-Meteo</span>
        </div>
      </div>
    `
  };
})(window.SN);