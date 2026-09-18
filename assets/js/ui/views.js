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

  /* 自定义应用图标压到 256px 就够（图标本身只有几十像素，压小一点省空间） */
  const ICON_EDGE = 256;

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
        if (!last) return "还没有聊天记录，点进去说第一句话吧";
        /* 会话列表只放一行预览：换行压成空格，超长截断（CSS 还会再补省略号） */
        const oneLine = String(last.text || "").replace(/\s+/g, " ").trim();
        return oneLine.length > 24 ? oneLine.slice(0, 24) + "…" : oneLine;
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
      const showMenu = ref(false); /* 底栏「更多」弹出的操作面板 */

      /*
        还没被 AI 回复的消息条数：
        从最后一条往上数，连续有几条「我」发的消息就返回几。
        这个数字会显示在回复键的小角标上。
      */
      const pendingCount = computed(function () {
        let count = 0;
        const list = messages.value;
        for (let i = list.length - 1; i >= 0; i -= 1) {
          if (list[i].role === "me") count += 1;
          else break;
        }
        return count;
      });

      /* 真正发请求：回复键和「重新生成」都走这里 */
      function requestReply(targetId) {
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
            const finalText = bubble.text || full || "…";
            /* 逻辑层管线收尾：跑正则 → 按 ||| 分气泡（第一条写进占位气泡，其余追加落库） */
            const bubbles =
              SN.logic && SN.logic.processReply ? SN.logic.processReply(finalText) : [finalText];
            bubble.text = bubbles.length ? bubbles[0] : "…";
            bubbles.slice(1).forEach(function (piece) {
              store.pushMessage(targetId, "them", piece);
            });
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

      /*
        发送键：只把输入框里的文字放进聊天框，AI 暂时不回复。
        （想让它回的时候再点右边的回复键，一次性回复你刚发的这几条）
      */
      function send() {
        const text = draft.value.trim();
        if (!text || !activeId.value) return;
        store.pushMessage(activeId.value, "me", text);
        draft.value = "";
        scrollToBottom();
      }

      /* 生成过程中可以点停止 */
      function stopReply() {
        SN.api.cancel();
      }

      /*
        回复键：让 AI 一次性回复「我」刚刚连续发出的那几条消息。
        没有待回复的消息、或正在生成时，按钮是灰的（点不动）。
      */
      const canReply = computed(function () {
        return !sending.value && pendingCount.value > 0;
      });

      function reply() {
        const targetId = activeId.value;
        if (!targetId || !canReply.value) return;
        requestReply(targetId);
      }

      /* ---- 底栏左边的「更多」：重新生成 / 清空对话 ---- */
      const canRegenerate = computed(function () {
        return (
          !sending.value &&
          messages.value.some(function (m) {
            return m.role === "them";
          })
        );
      });

      function regenerate() {
        showMenu.value = false;
        const targetId = activeId.value;
        if (!targetId || sending.value) return;
        /* 先删掉最后一条对方消息，再按同样的上下文重新问一次 */
        const list = store.state.chats[targetId] || [];
        for (let i = list.length - 1; i >= 0; i -= 1) {
          if (list[i].role === "them") {
            list.splice(i, 1);
            break;
          }
        }
        requestReply(targetId);
      }

      function clearChat() {
        showMenu.value = false;
        const targetId = activeId.value;
        if (!targetId) return;
        const name = activeCharacter.value ? activeCharacter.value.name : "对方";
        SN.ui
          .confirm({
            message: "确定清空和「" + name + "」的全部聊天记录吗？清空后无法找回。",
            confirmText: "清空",
            danger: true
          })
          .then(function (ok) {
            if (ok) store.clearChat(targetId);
          });
      }

      return {
        characters: characters,
        activeCharacter: activeCharacter,
        messages: messages,
        draft: draft,
        sending: sending,
        errorText: errorText,
        showMenu: showMenu,
        pendingCount: pendingCount,
        canReply: canReply,
        reply: reply,
        canRegenerate: canRegenerate,
        regenerate: regenerate,
        clearChat: clearChat,
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
            <span class="avatar" :style="{ backgroundImage: c.avatar ? 'url(' + c.avatar + ')' : c.gradient }">{{ c.avatar ? "" : c.name.charAt(0) }}</span>
            <span class="row__main">
              <span class="row__label">{{ c.name }}</span>
              <span class="row__sub">{{ lastText(c.id) }}</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
        </div>
      </div>

      <div class="chat" v-else>
        <div class="chat__list">
          <div class="bubble-row" v-for="(m, i) in messages" :key="i" :class="{ 'bubble-row--me': m.role === 'me' }">
            <div class="bubble" :class="m.role === 'me' ? 'bubble--me' : 'bubble--them'">
              <template v-if="m.text">{{ m.text }}</template>
              <span v-else class="typing" aria-label="对方正在输入"><i></i><i></i><i></i></span>
            </div>
          </div>

          <div class="empty" v-if="!messages.length">还没有消息，说点什么吧。</div>

          <div class="api-error" v-if="errorText">{{ errorText }}</div>
        </div>

        <form class="composer" @submit.prevent="send">
          <div class="composer__bar">
            <button class="composer__btn" type="button" title="更多" aria-label="更多" @click="showMenu = true">
              <sn-glyph name="plus" :size="16"></sn-glyph>
            </button>
            <input class="input" v-model="draft" type="text" placeholder="说点什么…" />
            <button class="composer__btn" type="button" title="让 AI 回复我发的这几条" aria-label="回复"
              :disabled="!canReply" @click="reply">
              <sn-glyph name="reply-line" :size="16"></sn-glyph>
              <span class="composer__badge" v-if="pendingCount">{{ pendingCount > 9 ? "9+" : pendingCount }}</span>
            </button>
            <button v-if="sending" class="composer__btn composer__btn--stop" type="button" title="停止生成"
              aria-label="停止生成" @click="stopReply">
              <sn-glyph name="stop-line" :size="16"></sn-glyph>
            </button>
            <button v-else class="composer__btn composer__btn--send" type="submit" title="发送到聊天框"
              aria-label="发送" :disabled="!draft.trim()">
              <sn-glyph name="send-line" :size="18"></sn-glyph>
            </button>
          </div>
        </form>

        <div class="modal-mask" v-if="showMenu" @click.self="showMenu = false">
          <div class="modal">
            <div class="modal__head">
              <span class="modal__title">更多操作</span>
              <button class="modal__close" type="button" @click="showMenu = false">×</button>
            </div>
            <div class="modal__body">
              <button class="modal__item" type="button" :disabled="!canRegenerate" @click="regenerate">
                重新生成回复
              </button>
              <button class="modal__item" type="button" @click="clearChat">清空这段对话</button>
            </div>
          </div>
        </div>
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

      /* 桌面主屏的应用名称开关（Dock 的那个是上面的 dockLabels） */
      const homeLabels = computed({
        get: function () {
          return settings.homeLabels;
        },
        set: function (value) {
          settings.homeLabels = value;
        }
      });

      /* ---- 自定义应用图标：给任意应用换成自己的图片 ---- */
      /* 只有桌面和 Dock 上的应用才出现在「自定义应用图标」列表里
         （隐藏页如「角色编辑」不算应用，不列出来） */
      const allApps = SN.apps.concat(SN.dockApps);
      const iconStatus = ref("");
      let iconStatusTimer = null;

      /* settings.appIcons 里存的是 app id → 图片 dataURL */
      const appIcons = computed(function () {
        return settings.appIcons || {};
      });

      function iconName(id) {
        const found = SN.allApps.filter(function (a) {
          return a.id === id;
        })[0];
        return found ? found.name : "应用";
      }

      /* 预览小方块：有自定义图标就用图片铺满，没有就交给 CSS 的磨砂玻璃 */
      function iconStyle(id) {
        const url = appIcons.value[id];
        return url ? { backgroundImage: 'url("' + url + '")' } : {};
      }

      function flashIconStatus(text) {
        iconStatus.value = text;
        window.clearTimeout(iconStatusTimer);
        iconStatusTimer = window.setTimeout(function () {
          iconStatus.value = "";
        }, 2600);
      }

      /* 选图 → 压缩到 ICON_EDGE → 存进设置（桌面和 Dock 立刻生效） */
      function pickAppIcon(id, event) {
        const input = event.target;
        const file = input.files && input.files[0];
        input.value = ""; /* 清空 input，方便下次再选同一张图 */
        if (!file) return;
        SN.mediaStore
          .processImageFile(file, ICON_EDGE)
          .then(function (dataUrl) {
            if (!settings.appIcons) settings.appIcons = {};
            settings.appIcons[id] = dataUrl;
            flashIconStatus("「" + iconName(id) + "」的图标已更换");
          })
          .catch(function (err) {
            flashIconStatus((err && err.message) || "这张图用不了，换一张试试。");
          });
      }

      function resetAppIcon(id) {
        if (!settings.appIcons || !settings.appIcons[id]) return;
        delete settings.appIcons[id];
        flashIconStatus("「" + iconName(id) + "」的图标已恢复默认");
      }

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
        homeLabels: homeLabels,
        battery: battery,
        allApps: allApps,
        appIcons: appIcons,
        iconStatus: iconStatus,
        iconStyle: iconStyle,
        pickAppIcon: pickAppIcon,
        resetAppIcon: resetAppIcon
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
          </span>
          <sn-switch v-model="dockLabels"></sn-switch>
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">应用名称显示</span>
          </span>
          <sn-switch v-model="homeLabels"></sn-switch>
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">状态栏电量</span>
          </span>
          <input class="range" type="range" min="0" max="100" v-model.number="battery" />
        </div>
      </div>

      <p class="section-title">自定义应用图标</p>
      <div class="list">
        <div class="row" v-for="a in allApps" :key="a.id">
          <span class="icon-pick" :class="{ 'is-custom': !!appIcons[a.id] }" :style="iconStyle(a.id)">
            <sn-glyph v-if="!appIcons[a.id]" :name="a.icon" :size="18"></sn-glyph>
          </span>
          <span class="row__main">
            <span class="row__label">{{ a.name }}</span>
          </span>
          <label class="mini-btn">
            {{ appIcons[a.id] ? "换图" : "选择图片" }}
            <input type="file" accept="image/*" hidden @change="pickAppIcon(a.id, $event)" />
          </label>
          <button class="mini-btn mini-btn--plain" type="button" v-if="appIcons[a.id]"
            @click="resetAppIcon(a.id)">恢复默认</button>
        </div>
      </div>
      <p class="field__hint" v-if="iconStatus">{{ iconStatus }}</p>

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

      const showForm = ref(false);
      const draft = ref(null); /* { title, category, keywords, content, constant } */

      function openForm() {
        draft.value = { title: "", category: "", keywords: "", content: "", constant: false };
        showForm.value = true;
      }

      function closeForm() {
        showForm.value = false;
        draft.value = null;
      }

      function saveEntry() {
        const d = draft.value;
        if (!d) return;
        const title = String(d.title || "").trim();
        const content = String(d.content || "").trim();
        if (!title || !content) return;
        const category = String(d.category || "").trim() || "自定义";
        store.state.worldbook.push({
          id: "wb_" + Date.now().toString(36),
          title: title,
          category: category,
          keywords: String(d.keywords || "").trim(),
          content: content,
          constant: !!d.constant,
          enabled: true
        });
        if (store.persistNow) store.persistNow();
        filter.value = category; /* 存完切到新分类，马上能看到 */
        closeForm();
      }

      function removeEntry(item) {
        SN.ui
          .confirm({ message: "删除条目「" + (item.title || "未命名") + "」？", confirmText: "删除", danger: true })
          .then(function (ok) {
            if (!ok) return;
            store.state.worldbook = store.state.worldbook.filter(function (x) {
              return x.id !== item.id;
            });
            if (store.persistNow) store.persistNow();
          });
      }

      return {
        filter: filter,
        categories: categories,
        entries: entries,
        showForm: showForm,
        draft: draft,
        openForm: openForm,
        closeForm: closeForm,
        saveEntry: saveEntry,
        removeEntry: removeEntry
      };
    },
    template: `
      <template v-if="!showForm">
        <div class="chips">
          <button class="chip" type="button" v-for="c in categories" :key="c"
            :class="{ 'is-active': c === filter }" @click="filter = c">{{ c }}</button>
        </div>

        <div class="list">
          <div class="row" v-for="item in entries" :key="item.id">
            <span class="row__main">
              <span class="row__label">{{ item.title }}<span class="chip" v-if="item.constant">常驻</span></span>
              <span class="row__sub row__sub--wrap">{{ item.content }}</span>
              <span class="row__sub" v-if="item.keywords">关键词：{{ item.keywords }}</span>
            </span>
            <span class="chip">{{ item.category }}</span>
            <button class="mini-btn mini-btn--plain" type="button" @click="removeEntry(item)">删除</button>
          </div>
        </div>

        <div class="empty" v-if="!entries.length">这个世界书分类还是空的。</div>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" @click="openForm">新建条目</button>
        </div>
        <p class="field__hint">聊天里聊到关键词时这条会自动进提示词；勾「常驻」则每次都带。条目会随备份文件一起导出/导入。</p>
      </template>
      <template v-else>
        <label class="field">
          <span class="field__label">标题</span>
          <input class="input" v-model="draft.title" type="text" placeholder="例如：北极星观测指南" />
        </label>
        <label class="field">
          <span class="field__label">分类（留空＝「自定义」）</span>
          <input class="input" v-model="draft.category" type="text" placeholder="例如：设定资料" />
        </label>
        <label class="field">
          <span class="field__label">触发关键词（逗号分隔）</span>
          <input class="input" v-model="draft.keywords" type="text" placeholder="星空, 北极星, 星座" />
        </label>
        <label class="field">
          <span class="field__label">内容（AI 会把这段当参考资料）</span>
          <textarea class="input input--area" rows="6" v-model="draft.content" placeholder="写清楚这条设定的具体内容…"></textarea>
        </label>
        <div class="list">
          <div class="row">
            <span class="row__main">
              <span class="row__label">常驻（每次都带进提示词）</span>
              <span class="row__sub">不勾的话，聊到关键词才会带上</span>
            </span>
            <span @click.stop>
              <sn-switch :model-value="draft.constant" @update:model-value="draft.constant = !draft.constant"></sn-switch>
            </span>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" :disabled="!(draft.title || '').trim() || !(draft.content || '').trim()" @click="saveEntry">保存</button>
          <button class="btn" type="button" @click="closeForm">取消</button>
        </div>
      </template>
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

      /* 点角色卡 → 进入该角色的编辑页（查看设定；官方角色是只读的） */
      function editCharacter(character) {
        store.openApp("characterEdit", { characterId: character.id });
      }

      /* 新建自定义角色：先进角色集列表，再跳到编辑页填设定 */
      function createCharacter() {
        const gradients = [
          "linear-gradient(150deg, #5ee7c4, #2f8fd6)",
          "linear-gradient(150deg, #ffd479, #ff7a59)",
          "linear-gradient(150deg, #ff9ec4, #b06bff)",
          "linear-gradient(150deg, #7ee0ff, #4a6bff)",
          "linear-gradient(150deg, #8ea2ff, #c86bff)"
        ];
        const created = {
          id: "char_" + Date.now().toString(36),
          name: "新角色",
          persona: "",
          greeting: "你好呀，很高兴认识你。",
          gradient: gradients[store.state.characters.length % gradients.length],
          locked: false
        };
        store.state.characters.push(created);
        if (store.persistNow) store.persistNow();
        store.openApp("characterEdit", { characterId: created.id });
      }

      return {
        characters: characters,
        editCharacter: editCharacter,
        createCharacter: createCharacter
      };
    },
    template: `
      <div class="card-grid">
        <button class="tile" type="button" v-for="c in characters" :key="c.id" @click="editCharacter(c)">
          <span class="avatar avatar--lg" :style="{ backgroundImage: c.avatar ? 'url(' + c.avatar + ')' : c.gradient }">{{ c.avatar ? "" : c.name.charAt(0) }}</span>
          <span class="tile__name">{{ c.name }}</span>
          <span class="tile__desc" v-if="c.locked">官方设定 · 只能查看</span>
        </button>
      </div>

      <div class="btn-row">
        <button class="btn btn--primary" type="button" @click="createCharacter">新建角色卡</button>
      </div>
      <p class="field__hint">自定义角色会保存在本机，并随备份文件一起导出/导入；官方角色不受影响，始终排在最前面。</p>
    `
  };

  /* ============================================================
     5.5) 角色编辑：查看 / 修改角色卡
          - 官方角色（locked）只能看，输入框全部禁用并给出锁定说明
          - 用户角色可以随便改：改名、人设、开场白、头像渐变
     ============================================================ */
  SN.components["sn-character-edit-view"] = {
    name: "sn-character-edit-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const store = SN.store;

      /* 要编辑哪个角色：由「角色集」点卡片时通过 openApp 的第二个参数传进来 */
      const characterId = computed(function () {
        return (store.state.appParams || {}).characterId || "";
      });

      const character = computed(function () {
        const list = store.state.characters;
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].id === characterId.value) return list[i];
        }
        return list[0] || null;
      });

      /* 官方角色锁死设定：输入框禁用，也不会被误改 */
      const locked = computed(function () {
        return !!(character.value && character.value.locked);
      });

      /* 头像可选的渐变（点一下就换，和角色卡上的圆形头像一致） */
      const gradients = [
        "linear-gradient(150deg, #8ea2ff, #c86bff)",
        "linear-gradient(150deg, #5ee7c4, #2f8fd6)",
        "linear-gradient(150deg, #ffd479, #ff7a59)",
        "linear-gradient(150deg, #ff9ec4, #b06bff)",
        "linear-gradient(150deg, #7ee0ff, #4a6bff)"
      ];

      function setGradient(value) {
        if (locked.value || !character.value) return;
        character.value.gradient = value;
      }

      /* 开场白改了就重新出现在聊天里：清掉这个角色的聊天记录 */
      function resetChat() {
        if (!character.value) return;
        SN.ui
          .confirm({
            message: "重置后这个角色的聊天记录会清空，重新从开场白开始。确定吗？",
            confirmText: "重置",
            danger: true
          })
          .then(function (ok) {
            if (ok) store.clearChat(character.value.id);
          });
      }

      /* 删除自定义角色：官方角色（locked）不给删 */
      function removeCharacter() {
        if (!character.value || locked.value) return;
        const target = character.value;
        SN.ui
          .confirm({
            message: "删除「" + target.name + "」？这个角色的聊天记录也会一起清掉，且无法恢复。",
            confirmText: "删除",
            danger: true
          })
          .then(function (ok) {
            if (!ok) return;
            store.state.characters = store.state.characters.filter(function (c) {
              return c.id !== target.id;
            });
            if (store.state.chats[target.id]) delete store.state.chats[target.id];
            if (store.persistNow) store.persistNow();
            store.openApp("characters");
          });
      }

      /* 头像图片：压缩到 192px 存在角色数据里，随备份一起走 */
      function pickAvatar(event) {
        if (locked.value || !character.value) return;
        const input = event && event.target;
        const file = input && input.files && input.files[0];
        if (!file) return;
        SN.mediaStore
          .processImageFile(file, 192)
          .then(function (dataUrl) {
            character.value.avatar = dataUrl;
            if (store.persistNow) store.persistNow();
          })
          .catch(function (err) {
            console.warn("[StarryNight] 头像处理失败：", err);
          });
        if (input) input.value = "";
      }

      function removeAvatar() {
        if (locked.value || !character.value) return;
        character.value.avatar = "";
        if (store.persistNow) store.persistNow();
      }

      return {
        character: character,
        locked: locked,
        gradients: gradients,
        setGradient: setGradient,
        resetChat: resetChat,
        removeCharacter: removeCharacter,
        pickAvatar: pickAvatar,
        removeAvatar: removeAvatar,
        /* 页头：标题显示角色名，返回键回到「角色集」 */
        navTitle: computed(function () {
          return character.value ? character.value.name : "角色编辑";
        }),
        navIsSub: true,
        navBack: function () {
          store.openApp("characters");
        },
        navBackLabel: "角色集"
      };
    },
    template: `
      <div v-if="!character" class="empty">这个角色不存在了。</div>

      <div v-else>
        <div class="card profile">
          <span class="avatar avatar--lg" :style="{ backgroundImage: character.avatar ? 'url(' + character.avatar + ')' : character.gradient }">
            {{ character.avatar ? "" : character.name.charAt(0) }}
          </span>
          <p class="profile__name">{{ character.name }}</p>
          <p class="profile__sign">{{ locked ? "官方设定 · 不可修改" : "自定义角色" }}</p>
        </div>

        <p class="section-title">头像配色</p>
        <div class="chips">
          <button class="grad-dot" type="button" v-for="g in gradients" :key="g"
            :class="{ 'is-active': character.gradient === g, 'is-locked': locked }"
            :style="{ backgroundImage: g }" @click="setGradient(g)"></button>
        </div>

        <template v-if="!locked">
          <p class="section-title">头像图片</p>
          <div class="btn-row">
            <label class="mini-btn">
              {{ character.avatar ? "换一张图片" : "选择图片" }}
              <input type="file" accept="image/*" hidden @change="pickAvatar($event)" />
            </label>
            <button class="mini-btn mini-btn--plain" type="button" v-if="character.avatar" @click="removeAvatar">移除图片</button>
          </div>
          <p class="field__hint">会自动压缩后存在本机，并随备份文件一起导出；移除图片就回到上面的配色头像。</p>
        </template>

        <p class="section-title">角色设定</p>
        <label class="field">
          <span class="field__label">名字</span>
          <input class="input" type="text" v-model="character.name" :disabled="locked" />
        </label>
        <label class="field">
          <span class="field__label">人设</span>
          <textarea class="input input--area" rows="8" v-model="character.persona" :disabled="locked"></textarea>
        </label>
        <label class="field">
          <span class="field__label">开场白</span>
          <textarea class="input input--area" rows="3" v-model="character.greeting" :disabled="locked"></textarea>
        </label>
        <p class="field__hint" v-if="locked">
          这个角色由官方统一维护，只能查看、不能修改；每次打开都会自动同步到最新设定。
        </p>

        <div class="btn-row">
          <button class="btn" type="button" @click="resetChat">重置这个角色的聊天</button>
        </div>
        <div class="btn-row" v-if="!locked">
          <button class="btn btn--danger" type="button" @click="removeCharacter">删除这个角色</button>
        </div>
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
            // 完整响应结构（含字段名 / finish_reason / usage）都打到控制台，方便排查
            if (result._debug) {
              console.log("[StarryNight] 测试连接完整响应结构", result._debug);
            }
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
          const names = { api: "API", presets: "提示词预设", regex: "正则", memory: "记忆库", weather: "天气与位置", data: "数据管理", changelog: "更新日志" };
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
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('presets')">
            <span class="row__main">
              <span class="row__label">提示词预设</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('regex')">
            <span class="row__main">
              <span class="row__label">正则</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('memory')">
            <span class="row__main">
              <span class="row__label">记忆库</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('weather')">
            <span class="row__main">
              <span class="row__label">天气与位置</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('data')">
            <span class="row__main">
              <span class="row__label">数据管理</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
          <button class="row" type="button" @click="openSub('changelog')">
            <span class="row__main">
              <span class="row__label">更新日志</span>
            </span>
            <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
          </button>
        </div>
        <p class="field__hint">版本 {{ version }}</p>
      </div>

      <!-- 子页：AI 接口 -->
      <div v-else-if="subPage === 'api'">
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
            <span class="row__sub">{{ settings.api.temperature }}</span>
          </span>
          <input class="range" type="range" min="0" max="2" step="0.1" v-model.number="settings.api.temperature" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">回复长度上限</span>
            <span class="row__sub">max_tokens {{ settings.api.maxTokens }}</span>
          </span>
          <input class="range" type="range" min="256" max="4096" step="128" v-model.number="settings.api.maxTokens" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">携带最近聊天</span>
            <span class="row__sub">最近 {{ settings.api.contextCount }} 条</span>
          </span>
          <input class="range" type="range" min="4" max="50" step="2" v-model.number="settings.api.contextCount" />
        </div>
        <div class="row">
          <span class="row__main">
            <span class="row__label">流式输出</span>
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

      <!-- 子页：提示词预设 -->
      <div v-else-if="subPage === 'presets'">
        <sn-preset-manage-view></sn-preset-manage-view>
      </div>

      <!-- 子页：正则 -->
      <div v-else-if="subPage === 'regex'">
        <sn-regex-manage-view></sn-regex-manage-view>
      </div>

      <!-- 子页：记忆库 -->
      <div v-else-if="subPage === 'memory'">
        <sn-memory-manage-view></sn-memory-manage-view>
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
          </span>
          <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
        </button>
        <button class="row" type="button" @click="pickFile">
          <span class="row__main">
            <span class="row__label">导入备份</span>
          </span>
          <sn-glyph class="row__chev" name="chevron-right" :size="18"></sn-glyph>
        </button>
        <button class="row" type="button" @click="askReset">
          <span class="row__main">
            <span class="row__label">恢复出厂设置</span>
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