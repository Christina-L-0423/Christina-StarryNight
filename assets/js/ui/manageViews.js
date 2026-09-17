/* ============================================================
   manageViews.js —— 设置层：预设 / 正则 / 记忆库 三个管理页
   只负责「让用户改什么」：增删改查直接操作数据层（SN.store.state），
   不做任何拼提示词、调 API 的逻辑（那些在 logic/ 里）。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  const { computed, ref } = Vue;

  function openConfirm(message, then) {
    SN.ui
      .confirm({ message: message, confirmText: "删除", danger: true })
      .then(function (ok) {
        if (ok) then();
      });
  }

  /* ------------------------------------------------------------
     1) 提示词预设管理（数据表：state.presets + state.activePresetId）
     ------------------------------------------------------------ */
  SN.components["sn-preset-manage-view"] = {
    name: "sn-preset-manage-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const state = SN.store.state;

      const presets = computed(function () {
        return state.presets || [];
      });
      const editing = ref(false);
      const isNew = ref(false);
      const draft = ref(null); /* { name, systemPrompt, enabled, _ref } */

      function openNew() {
        isNew.value = true;
        draft.value = { name: "", systemPrompt: "", enabled: true, _ref: null };
        editing.value = true;
      }

      function openEdit(p) {
        isNew.value = false;
        draft.value = {
          name: p.name || "",
          systemPrompt: p.systemPrompt || p.content || p.text || "",
          enabled: p.enabled !== false,
          _ref: p
        };
        editing.value = true;
      }

      function saveDraft() {
        const d = draft.value;
        if (!d) return;
        const text = String(d.systemPrompt || "").trim();
        if (!text) return;
        if (isNew.value) {
          const p = {
            id: "preset_" + Date.now(),
            name: String(d.name || "").trim() || "未命名预设",
            systemPrompt: text,
            enabled: d.enabled !== false
          };
          if (!Array.isArray(state.presets)) state.presets = [];
          state.presets.push(p);
          state.activePresetId = p.id; /* 新建的预设立即投入使用 */
        } else if (d._ref) {
          const p = d._ref;
          p.name = String(d.name || "").trim() || "未命名预设";
          delete p.content;
          delete p.text;
          p.systemPrompt = text;
          p.enabled = d.enabled !== false;
        }
        editing.value = false;
        draft.value = null;
      }

      function cancel() {
        editing.value = false;
        draft.value = null;
      }

      function setActive(p) {
        state.activePresetId = p.id;
        p.enabled = true;
      }

      function toggle(p) {
        p.enabled = p.enabled === false;
      }

      function remove(p) {
        openConfirm("确定删除预设「" + (p.name || "未命名") + "」吗？", function () {
          state.presets = (state.presets || []).filter(function (x) {
            return x.id !== p.id;
          });
          if (state.activePresetId === p.id) {
            state.activePresetId = (state.presets[0] && state.presets[0].id) || "";
          }
        });
      }

      return {
        presets: presets,
        state_activePresetId: computed(function () {
          return state.activePresetId;
        }),
        editing: editing,
        draft: draft,
        isNew: isNew,
        openNew: openNew,
        openEdit: openEdit,
        saveDraft: saveDraft,
        cancel: cancel,
        setActive: setActive,
        toggle: toggle,
        remove: remove
      };
    },
    template: `
      <template v-if="!editing">
        <div class="list">
          <div class="row" v-for="p in presets" :key="p.id" @click="openEdit(p)">
            <span class="row__main">
              <span class="row__label">{{ p.name }}<span class="chip" v-if="p.id === state_activePresetId">使用中</span></span>
              <span class="row__sub row__sub--wrap">{{ (p.systemPrompt || "").slice(0, 40) }}…</span>
            </span>
            <sn-switch :model-value="p.enabled !== false" @update:model-value="toggle(p)"></sn-switch>
          </div>
        </div>
        <p class="field__hint" v-if="!presets.length">还没有预设，点下面新建一个。</p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" @click="openNew">新建预设</button>
        </div>
      </template>
      <template v-else>
        <label class="field">
          <span class="field__label">预设名称</span>
          <input class="input" v-model="draft.name" type="text" placeholder="例如：温柔短句" />
        </label>
        <label class="field">
          <span class="field__label">系统提示词（可用 &#123;&#123;char&#125;&#125; / &#123;&#123;user&#125;&#125; 占位符）</span>
          <textarea class="input" v-model="draft.systemPrompt" rows="7" placeholder="例如：你是&#123;&#123;char&#125;&#125;，说话短、温柔，想分气泡就用 ||| 隔开。"></textarea>
        </label>
        <p class="field__hint">想让回复分成多个气泡，就在提示词里写清楚「用 ||| 分隔」。</p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" :disabled="!(draft.systemPrompt || '').trim()" @click="saveDraft">保存</button>
          <button class="btn" type="button" @click="cancel">取消</button>
        </div>
      </template>
    `
  };
  /* ------------------------------------------------------------
     2) 正则管理（数据表：state.regexes）
        scope: "all" 整段回复先跑一遍；"bubble" 分完气泡每条单独跑
     ------------------------------------------------------------ */
  SN.components["sn-regex-manage-view"] = {
    name: "sn-regex-manage-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const state = SN.store.state;

      const regexes = computed(function () {
        return state.regexes || [];
      });
      const editing = ref(null); /* null=列表；对象=编辑中（_ref 指向原条目） */
      const isNew = ref(false);
      const hint = ref("");

      function openNew() {
        isNew.value = true;
        hint.value = "";
        editing.value = { name: "", pattern: "", flags: "g", replace: "", scope: "all", _ref: null };
      }

      function openEdit(r) {
        isNew.value = false;
        hint.value = "";
        editing.value = {
          name: r.name || "",
          pattern: r.pattern || r.find || "",
          flags: r.flags || "",
          replace: r.replace == null ? "" : r.replace,
          scope: r.scope === "bubble" ? "bubble" : "all",
          _ref: r
        };
      }

      function saveDraft() {
        const d = editing.value;
        if (!d) return;
        const pattern = String(d.pattern || "").trim();
        if (!pattern) return;
        try {
          new RegExp(pattern, d.flags || "g"); /* 先验证再入库 */
        } catch (err) {
          hint.value = "正则写法有误：" + err.message;
          return;
        }
        const data = {
          name: String(d.name || "").trim() || "未命名正则",
          pattern: pattern,
          flags: String(d.flags || "").trim(),
          replace: d.replace,
          scope: d.scope
        };
        if (isNew.value) {
          if (!Array.isArray(state.regexes)) state.regexes = [];
          state.regexes.push(Object.assign({ id: "regex_" + Date.now(), enabled: true }, data));
        } else if (d._ref) {
          const r = d._ref;
          r.name = data.name;
          delete r.find;
          r.pattern = data.pattern;
          r.flags = data.flags;
          r.replace = data.replace;
          r.scope = data.scope;
        }
        editing.value = null;
      }

      function cancel() {
        editing.value = null;
      }

      function toggle(r) {
        r.enabled = r.enabled === false;
      }

      function remove(r) {
        openConfirm("删除正则「" + (r.name || "未命名") + "」？", function () {
          state.regexes = (state.regexes || []).filter(function (x) {
            return x.id !== r.id;
          });
        });
      }

      function testPattern() {
        const d = editing.value;
        if (!d) return;
        try {
          const re = new RegExp(d.pattern, d.flags || "g");
          const sample = "示例：*微笑* 你在忙吗";
          hint.value = "试跑结果：" + (sample.replace(re, d.replace == null ? "" : d.replace) || "（结果为空）");
        } catch (err) {
          hint.value = "正则写法有误：" + err.message;
        }
      }

      return {
        regexes: regexes,
        editing: editing,
        isNew: isNew,
        hint: hint,
        openNew: openNew,
        openEdit: openEdit,
        saveDraft: saveDraft,
        cancel: cancel,
        toggle: toggle,
        remove: remove,
        testPattern: testPattern
      };
    },
    template: `
      <template v-if="!editing">
        <div class="list">
          <div class="row" v-for="r in regexes" :key="r.id" @click="openEdit(r)">
            <span class="row__main">
              <span class="row__label">{{ r.name || "未命名正则" }}</span>
              <span class="row__sub row__sub--wrap">{{ r.pattern || r.find }}</span>
              <span class="row__sub row__sub--wrap" v-if="r.note">{{ r.note }}</span>
            </span>
            <span class="chip" v-if="r.scope === 'bubble'">气泡</span>
            <sn-switch :model-value="r.enabled !== false" @update:model-value="toggle(r)"></sn-switch>
          </div>
        </div>
        <p class="field__hint" v-if="!regexes.length">还没有正则。点下面新建一条。</p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" @click="openNew">新建正则</button>
        </div>
      </template>
      <template v-else>
        <label class="field">
          <span class="field__label">名称</span>
          <input class="input" v-model="editing.name" type="text" placeholder="例如：去掉星号动作" />
        </label>
        <label class="field">
          <span class="field__label">查找（正则表达式）</span>
          <input class="input" v-model="editing.pattern" type="text" placeholder="\\*(.+?)\\*" />
        </label>
        <label class="field">
          <span class="field__label">标志（g 全局 / m 多行 / i 忽略大小写，可组合）</span>
          <input class="input" v-model="editing.flags" type="text" placeholder="g" />
        </label>
        <label class="field">
          <span class="field__label">替换为（$1 表示第一个分组；留空＝删除匹配内容）</span>
          <input class="input" v-model="editing.replace" type="text" placeholder="$1" />
        </label>
        <div class="list">
          <div class="row" @click="editing.scope = editing.scope === 'bubble' ? 'all' : 'bubble'">
            <span class="row__main">
              <span class="row__label">作用位置</span>
              <span class="row__sub">{{ editing.scope === "bubble" ? "每个气泡单独跑（分完气泡后）" : "整段回复先跑一遍（分气泡前）" }}</span>
            </span>
            <span class="chip" :class="{ 'is-active': editing.scope === 'bubble' }">{{ editing.scope === "bubble" ? "气泡" : "整段" }}</span>
          </div>
        </div>
        <p class="field__hint" v-if="hint">{{ hint }}</p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" :disabled="!(editing.pattern || '').trim()" @click="saveDraft">保存</button>
          <button class="btn" type="button" @click="testPattern">试一下</button>
          <button class="btn" type="button" @click="cancel">取消</button>
        </div>
      </template>
    `
  };
  /* ------------------------------------------------------------
     3) 记忆库管理（数据表：state.memoryBank，增删走逻辑层 SN.logic.memory）
     ------------------------------------------------------------ */
  SN.components["sn-memory-manage-view"] = {
    name: "sn-memory-manage-view",
    props: { app: { type: Object, default: null } },
    setup: function () {
      const state = SN.store.state;

      const memories = computed(function () {
        return state.memoryBank || [];
      });
      const text = ref("");
      const keywords = ref("");
      const pinned = ref(false);

      function add() {
        const t = String(text.value || "").trim();
        if (!t) return;
        if (SN.logic.memory && SN.logic.memory.add) {
          SN.logic.memory.add(t, keywords.value, pinned.value);
        } else {
          /* 兜底：逻辑层不在时直接写数据层 */
          if (!Array.isArray(state.memoryBank)) state.memoryBank = [];
          state.memoryBank.push({
            id: "mem_" + Date.now(),
            text: t,
            keywords: keywords.value,
            pinned: pinned.value,
            enabled: true
          });
          if (SN.store.persistNow) SN.store.persistNow();
        }
        text.value = "";
        keywords.value = "";
        pinned.value = false;
      }

      function remove(m) {
        if (SN.logic.memory && SN.logic.memory.remove) {
          SN.logic.memory.remove(m.id);
          return;
        }
        state.memoryBank = (state.memoryBank || []).filter(function (x) {
          return x.id !== m.id;
        });
        if (SN.store.persistNow) SN.store.persistNow();
      }

      function toggle(m) {
        if (SN.logic.memory && SN.logic.memory.toggle) {
          SN.logic.memory.toggle(m.id);
          return;
        }
        m.enabled = m.enabled === false;
        if (SN.store.persistNow) SN.store.persistNow();
      }

      function togglePin(m) {
        m.pinned = !m.pinned;
        if (SN.store.persistNow) SN.store.persistNow();
      }

      function keywordsText(m) {
        if (!m) return "";
        return Array.isArray(m.keywords) ? m.keywords.join("、") : m.keywords || "";
      }

      function clearAll() {
        openConfirm("清空全部记忆？删了就找不回来了。", function () {
          if (SN.logic.memory && SN.logic.memory.clear) {
            SN.logic.memory.clear();
            return;
          }
          state.memoryBank = [];
          if (SN.store.persistNow) SN.store.persistNow();
        });
      }

      return {
        memories: memories,
        text: text,
        keywords: keywords,
        pinned: pinned,
        add: add,
        remove: remove,
        toggle: toggle,
        togglePin: togglePin,
        keywordsText: keywordsText,
        clearAll: clearAll
      };
    },
    template: `
      <label class="field">
        <span class="field__label">记住一件事</span>
        <input class="input" v-model="text" type="text" placeholder="例如：用户喜欢喝冰美式" @keyup.enter="add" />
      </label>
      <label class="field">
        <span class="field__label">触发关键词（逗号分隔；聊到才会带上）</span>
        <input class="input" v-model="keywords" type="text" placeholder="咖啡, 美式, 点单" @keyup.enter="add" />
      </label>
      <div class="list">
        <div class="row">
          <span class="row__main">
            <span class="row__label">常驻记忆（每次都带进提示词）</span>
            <span class="row__sub">比如用户的名字、固定称呼</span>
          </span>
          <span @click.stop>
            <sn-switch :model-value="pinned" @update:model-value="pinned = !pinned"></sn-switch>
          </span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn--primary" type="button" :disabled="!text.trim()" @click="add">添加</button>
      </div>

      <p class="section-title">已记住了 {{ memories.length }} 条</p>
      <div class="list">
        <div class="row" v-for="m in memories" :key="m.id">
          <span class="row__main" @click="togglePin(m)">
            <span class="row__label">{{ m.text || m.content || m.summary }}<span class="chip" v-if="m.pinned">常驻</span></span>
            <span class="row__sub row__sub--wrap" v-if="keywordsText(m)">{{ keywordsText(m) }}</span>
          </span>
          <span @click.stop>
            <sn-switch :model-value="m.enabled !== false" @update:model-value="toggle(m)"></sn-switch>
          </span>
          <button class="mini-btn mini-btn--plain" type="button" @click="remove(m)">删除</button>
        </div>
      </div>
      <p class="field__hint" v-if="!memories.length">还没有记忆。上面随便记一条试试。</p>
      <div class="btn-row" v-if="memories.length">
        <button class="btn btn--danger" type="button" @click="clearAll">清空全部</button>
      </div>
    `
  };
})(window.SN);
