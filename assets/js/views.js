/* ============================================================
   views.js —— 每个应用点进去之后看到的内容
   一个组件 = 一个页面。目前都是“骨架 + 示例数据”，
   之后接 API、接后端，主要就是来改这里。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  const { ref, computed, nextTick } = Vue;

  /* 还没配置 API 时的本地演示回复（保证不配置也能玩） */
  const LOCAL_REPLY =
    "（本地演示回复）我还没连上真正的 AI。去「设置 → AI 接口」选一个服务商、填好密钥，点「测试连接」，我就能真正开口啦。";

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

      const errorText = ref("");

      function send() {
        const text = draft.value.trim();
        if (!text || !activeId.value || sending.value) return;

        const targetId = activeId.value;
        store.pushMessage(targetId, "me", text);
        draft.value = "";
        errorText.value = "";
        sending.value = true;
        scrollToBottom();

        /* 还没配置 API → 本地演示回复，保证应用始终可用 */
        if (!SN.api.isConfigured()) {
          window.setTimeout(function () {
            store.pushMessage(targetId, "them", LOCAL_REPLY);
            sending.value = false;
            scrollToBottom();
          }, 450);
          return;
        }

        /* 真实对话：先按当前历史组装消息，再放一个空气泡当“打字中” */
        let request;
        try {
          request = SN.api.buildMessages(targetId);
        } catch (err) {
          sending.value = false;
          errorText.value = err && err.message ? err.message : "消息组装失败。";
          return;
        }

        store.pushMessage(targetId, "them", "");
        const list = store.state.chats[targetId];
        const bubble = list[list.length - 1];

        SN.api
          .chat({
            messages: request,
            onDelta: function (full) {
              bubble.text = full;
              scrollToBottom();
            }
          })
          .then(function (full) {
            if (!bubble.text) bubble.text = full || "…";
            sending.value = false;
            scrollToBottom();
          })
          .catch(function (err) {
            const index = list.indexOf(bubble);
            if (index !== -1 && !bubble.text) list.splice(index, 1);
            if (err && err.name === "AbortError") {
              store.pushMessage(targetId, "them", "（已停止生成）");
            } else {
              errorText.value = (err && err.message) || "请求失败，请稍后再试。";
            }
            sending.value = false;
            scrollToBottom();
          });
      }

      /* 生成过程中可以点停止 */
      function stopReply() {
        SN.api.cancel();
      }

      return {
        characters: characters,
        activeCharacter: activeCharacter,
        messages: messages,
        draft: draft,
        sending: sending,
        errorText: errorText,
        lastText: lastText,
        openChat: openChat,
        backToList: backToList,
        send: send,
        stopReply: stopReply,
        /* 头部导航上报：会话详情时标题显示角色名，返回键回会话列表 */
        navTitle: computed(function () {
          return activeCharacter.value ? activeCharacter.value.name : "";
        }),
        navIsSub: computed(function () {
          return Boolean(activeCharacter.value);
        }),
        navBack: backToList,
        navBackLabel: "会话"
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
      </div>

      <div v-else>
        <div class="bubble-time">{{ activeCharacter.tagline }}</div>

        <div class="bubble-row" v-for="(m, i) in messages" :key="i" :class="{ 'bubble-row--me': m.role === 'me' }">
          <div class="bubble" :class="m.role === 'me' ? 'bubble--me' : 'bubble--them'">
            <template v-if="m.text">{{ m.text }}</template>
            <span v-else class="typing" aria-label="对方正在输入"><i></i><i></i><i></i></span>
          </div>
        </div>

        <div class="empty" v-if="!messages.length">还没有消息，说点什么吧。</div>

        <div class="api-error" v-if="errorText">{{ errorText }}</div>

        <form class="composer" @submit.prevent="send">
          <input class="input" v-model="draft" type="text" placeholder="说点什么…" />
          <button v-if="sending" class="send-btn send-btn--stop" type="button" title="停止生成" @click="stopReply">■</button>
          <button v-else class="send-btn" type="submit" :disabled="!draft.trim()">
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
      const customs = computed(function () {
        return store.state.customWallpapers;
      });
      const currentId = computed(function () {
        return settings.wallpaper;
      });

      function choose(id) {
        settings.wallpaper = id;
      }

      function resetWallpaper() {
        settings.wallpaper = SN.defaults.settings.wallpaper;
      }

      /* ---- 自定义壁纸：选图 → 压缩 → 入库 → 立即使用 ---- */
      const busy = ref(false);
      const status = ref("");

      function onAddImages(event) {
        if (busy.value) {
          event.target.value = "";
          return;
        }
        const files = Array.prototype.slice.call(event.target.files || []);
        event.target.value = ""; /* 清空 input，方便下次再选同一张图 */
        if (!files.length) return;

        busy.value = true;
        let done = 0;
        let failed = 0;

        function next() {
          if (!files.length) {
            busy.value = false;
            status.value = failed
              ? "有 " + failed + " 张图片添加失败（只支持常见图片格式）"
              : "已添加 " + done + " 张壁纸";
            window.setTimeout(function () {
              status.value = "";
            }, 2600);
            return;
          }
          const file = files.shift();
          SN.mediaStore
            .processImageFile(file)
            .then(function (dataUrl) {
              /* 名字取文件名（去掉扩展名），最长 12 个字 */
              const name =
                String(file.name || "我的壁纸")
                  .replace(/\.[a-z0-9]+$/i, "")
                  .slice(0, 12) || "我的壁纸";
              store.addCustomWallpaper(name, dataUrl);
              done += 1;
            })
            .catch(function (err) {
              failed += 1;
              console.warn("[StarryNight] 图片添加失败：", err);
            })
            .then(next);
        }
        next();
      }

      function removeImage(id) {
        SN.ui
          .confirm({
            message: "确定删除这张自定义壁纸吗？删除后无法找回。",
            confirmText: "删除",
            danger: true
          })
          .then(function (ok) {
            if (ok) store.removeCustomWallpaper(id);
          });
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
        customs: customs,
        currentId: currentId,
        choose: choose,
        resetWallpaper: resetWallpaper,
        busy: busy,
        status: status,
        onAddImages: onAddImages,
        removeImage: removeImage,
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
      <p class="section-title">我的壁纸</p>
      <div class="wallpaper-pick">
        <label class="wallpaper-pick__add">
          <sn-glyph name="plus" :size="20"></sn-glyph>
          <span>{{ busy ? "处理中…" : "添加图片" }}</span>
          <input type="file" accept="image/*" multiple hidden @change="onAddImages" />
        </label>
        <button class="wallpaper-pick__item is-custom" type="button" v-for="w in customs" :key="w.id"
          :class="{ 'is-active': w.id === currentId, 'is-broken': !w.dataUrl }"
          :style="{ backgroundImage: w.dataUrl ? 'url(' + w.dataUrl + ')' : 'none' }"
          @click="choose(w.id)">
          <span class="wallpaper-pick__name">{{ w.name }}</span>
          <span class="wallpaper-pick__del" aria-label="删除这张壁纸" @click.stop="removeImage(w.id)">×</span>
        </button>
      </div>
      <p class="field__hint" v-if="status">{{ status }}</p>

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

      /* ---- AI 接口：服务商预设 + 测试连接 ---- */
      const presets = SN.apiPresets || [];
      const testing = ref(false);
      const apiStatus = ref("");
      const apiStatusOk = ref(false);

      function applyPreset(preset) {
        /* 「自定义」= 清空地址从头填（模型名保留，可手动改或重新拉取） */
        if (preset.id === "custom") {
          settings.api.baseUrl = "";
          apiStatusOk.value = false;
          apiStatus.value = "自定义模式：接口地址已清空，请手动填写任意 OpenAI 兼容接口的地址与模型。";
          return;
        }
        settings.api.baseUrl = preset.baseUrl;
        settings.api.model = preset.model;
        apiStatusOk.value = false;
        apiStatus.value = "已填入「" + preset.name + "」的地址和模型（" + preset.hint + "）。再填入你的 API Key 即可。";
      }

      function testApi() {
        if (testing.value) return;
        testing.value = true;
        apiStatus.value = "正在测试连接…";
        SN.api
          .testConnection()
          .then(function (result) {
            apiStatusOk.value = !!result.ok;
            apiStatus.value = result.ok ? "连接成功！模型回复：「" + result.reply + "」" : result.message;
          })
          .catch(function () {
            apiStatusOk.value = false;
            apiStatus.value = "测试失败，请检查配置后重试。";
          })
          .then(function () {
            testing.value = false;
          });
      }

      /* ---- 拉取服务商模型列表（模型输入框旁的循环按钮） ---- */
      const models = ref([]);
      const showModels = ref(false);
      const loadingModels = ref(false);
      const modelsError = ref("");

      function fetchModels() {
        if (loadingModels.value) return;
        loadingModels.value = true;
        modelsError.value = "";
        SN.api
          .listModels()
          .then(function (ids) {
            models.value = ids;
            showModels.value = true;
          })
          .catch(function (err) {
            modelsError.value = err && err.message ? err.message : "拉取失败，请稍后再试。";
          })
          .then(function () {
            loadingModels.value = false;
          });
      }

      function pickModel(id) {
        settings.api.model = id;
        showModels.value = false;
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
        SN.ui
          .confirm({
            message: "确定要清空所有本地数据吗？聊天记录也会一起删除，且无法撤销。",
            confirmText: "清空",
            danger: true
          })
          .then(function (ok) {
            if (!ok) return;
            store.resetAll();
            status.value = "已恢复出厂设置。";
          });
      }

      /* ---- 设置内部分页："" = 主列表；"api" | "weather" | "data" | "about" ---- */
      const subPage = ref("");

      function openSub(name) {
        subPage.value = name;
      }

      return {
        settings: settings,
        weather: weather,
        status: status,
        fileInput: fileInput,
        presets: presets,
        testing: testing,
        apiStatus: apiStatus,
        apiStatusOk: apiStatusOk,
        applyPreset: applyPreset,
        testApi: testApi,
        models: models,
        showModels: showModels,
        loadingModels: loadingModels,
        modelsError: modelsError,
        fetchModels: fetchModels,
        pickModel: pickModel,
        useLiveWeather: useLiveWeather,
        refreshWeather: refreshWeather,
        exportData: exportData,
        pickFile: pickFile,
        onFile: onFile,
        askReset: askReset,
        subPage: subPage,
        openSub: openSub,
        changelog: SN.changelog,
        /* 头部导航上报：子页时标题显示对应名字，返回键回设置主列表 */
        navTitle: computed(function () {
          const names = { api: "API", weather: "天气与位置", data: "数据管理", changelog: "更新日志" };
          return names[subPage.value] || "";
        }),
        navIsSub: computed(function () {
          return Boolean(subPage.value);
        }),
        navBack: function () {
          subPage.value = "";
        },
        navBackLabel: "设置",
        version: SN.VERSION
      };
    },
    template: `
      <!-- 主列表：iOS 设置风格的分组导航，第一项是 AI 接口 -->
      <div v-if="!subPage">
        <p class="section-title">设置</p>
        <div class="list">
          <button class="row" type="button" @click="openSub('api')">
            <span class="row__main">
              <span class="row__label">API</span>
              <span class="row__sub">服务商、密钥、模型与测试连接</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('weather')">
            <span class="row__main">
              <span class="row__label">天气与位置</span>
              <span class="row__sub">显示的城市名与经纬度</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('data')">
            <span class="row__main">
              <span class="row__label">数据管理</span>
              <span class="row__sub">备份导出 / 导入 / 恢复出厂</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('changelog')">
            <span class="row__main">
              <span class="row__label">更新日志</span>
              <span class="row__sub">新功能与改动记录</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
        </div>
        <p class="field__hint">版本 {{ version }} · 数据存放在本机浏览器</p>
      </div>

      <!-- 子页：AI 接口 -->
      <div v-else-if="subPage === 'api'">
        <p class="field__hint">点一个服务商自动填好地址和模型（推荐 DeepSeek，便宜好用）：</p>
      <div class="chips">
        <button class="chip" type="button" v-for="p in presets" :key="p.id" @click="applyPreset(p)">{{ p.name }}</button>
      </div>
      <label class="field">
        <span class="field__label">接口地址 Base URL</span>
        <input class="input" v-model="settings.api.baseUrl" type="text" placeholder="https://api.deepseek.com/v1" />
      </label>
      <label class="field">
        <span class="field__label">API Key</span>
        <input class="input" v-model="settings.api.apiKey" type="password" placeholder="sk-...（只保存在本机）" />
      </label>
      <div class="field">
        <span class="field__label">模型名称</span>
        <div class="model-row">
          <input class="input" v-model="settings.api.model" type="text" placeholder="deepseek-chat" />
          <button class="model-fetch" :class="{ 'is-loading': loadingModels }" type="button"
            title="拉取模型列表" :disabled="loadingModels" @click="fetchModels">
            <sn-glyph name="refresh" :size="16"></sn-glyph>
          </button>
        </div>
        <p class="field__hint is-bad" v-if="modelsError">{{ modelsError }}</p>
      </div>
      <div class="list">
        <div class="row">
          <span class="row__main">
            <span class="row__label">随机性 temperature</span>
            <span class="row__sub">越小越稳重，越大越有想象力（当前 {{ settings.api.temperature }}）</span>
          </span>
          <input class="range" type="range" min="0" max="2" step="0.1" v-model.number="settings.api.temperature" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">回复长度上限</span>
            <span class="row__sub">max_tokens（当前 {{ settings.api.maxTokens }}）</span>
          </span>
          <input class="range" type="range" min="256" max="4096" step="128" v-model.number="settings.api.maxTokens" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">携带最近聊天</span>
            <span class="row__sub">一次带多少条历史给 AI（当前 {{ settings.api.contextCount }}）</span>
          </span>
          <input class="range" type="range" min="4" max="50" step="2" v-model.number="settings.api.contextCount" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">流式输出</span>
            <span class="row__sub">开启后回复像打字一样逐字出现</span>
          </span>
          <sn-switch v-model="settings.api.stream"></sn-switch>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn" type="button" :disabled="testing" @click="testApi">{{ testing ? "正在测试…" : "测试连接" }}</button>
      </div>
      <p class="field__hint" v-if="apiStatus" :class="apiStatusOk ? 'is-ok' : 'is-bad'">{{ apiStatus }}</p>

      <!-- 模型选择弹窗：拉取后从底部弹出，按首字母排序 -->
      <div class="modal-mask" v-if="showModels" @click.self="showModels = false">
        <div class="modal">
          <div class="modal__head">
            <span class="modal__title">选择模型</span>
            <button class="modal__close" type="button" @click="showModels = false">×</button>
          </div>
          <div class="modal__body">
            <button class="modal__item" type="button" v-for="m in models" :key="m"
              :class="{ 'is-current': m === settings.api.model }" @click="pickModel(m)">{{ m }}</button>
          </div>
          <div class="modal__foot">共 {{ models.length }} 个模型 · 按首字母排序</div>
        </div>
      </div>
      </div>

      <!-- 子页：天气与位置 -->
      <div v-else-if="subPage === 'weather'">
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
      </div>

      <!-- 子页：数据管理 -->
      <div v-else-if="subPage === 'data'">
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
      </div>

      <!-- 子页：更新日志 -->
      <div v-else-if="subPage === 'changelog'">
      <div class="changelog">
        <div class="changelog__item" v-for="log in changelog" :key="log.version">
          <span class="changelog__ver">{{ log.version }}</span>
          <div class="changelog__body">
            <p class="changelog__meta">{{ log.date }} · {{ log.title }}</p>
            <ul class="changelog__list">
              <li v-for="it in log.items" :key="it">{{ it }}</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    `
  };
})(window.SN);