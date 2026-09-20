/* 桌面：固定空槽、跟手滑动、长按拖动与边缘翻页。 */
(function () {
  "use strict";
  const SN = window.SN;
  SN.components["sn-home"] = {
    name: "sn-home",
    setup: function () {
      const { ref, computed, watch, onBeforeUnmount, nextTick } = Vue;
      const store = SN.store;
      const COLS = 4;
      const ROWS = 6; /* 每页 4×6 = 24 个槽位，行高更矮、图标上下更紧凑 */
      const WSPAN = 2; /* 小组件占 2 行（整行宽） */
      const SLOTS = COLS * ROWS;
      const MAX_ROW = ROWS - WSPAN; /* 小组件最高能停的行号 */
      const MAX_PAGES = 5;
      let serial = 0;
      function makePage(slots) {
        return { key: ++serial, slots: slots || Array(SLOTS).fill(null) };
      }
      /* null 是真实空位：不 filter 图标，不因移动而压缩行列。兼容旧数组备份（旧的是 4×4=16 格）。 */
      function normalize(saved) {
        const ids = SN.apps.map(function (app) { return app.id; });
        const seen = new Set();
        const pages = (Array.isArray(saved) ? saved : []).slice(0, MAX_PAGES).map(function (slots) {
          const p = makePage();
          if (Array.isArray(slots)) slots.slice(0, SLOTS).forEach(function (id, i) {
            if (ids.indexOf(id) !== -1 && !seen.has(id)) {
              p.slots[i] = id;
              seen.add(id);
            }
          });
          return p;
        });
        if (!pages.length) pages.push(makePage());
        ids.forEach(function (id) {
          if (seen.has(id)) return;
          let p = pages.find(function (item) { return item.slots.indexOf(null) !== -1; });
          if (!p) { p = makePage(); pages.push(p); }
          p.slots[p.slots.indexOf(null)] = id;
        });
        return pages;
      }
      const layout = ref(normalize(store.state.settings.homeLayout));
      /* 小组件位置：住在哪一页 + 从第几行开始（占 2 行，跟图标一样住在网格里，任意位置） */
      function readWidget(saved) {
        const s = saved && typeof saved === "object" ? saved : {};
        const page = Math.max(0, Number(s.page) || 0);
        /* 旧数据只有 {page, bottom}：迁到第 0 行 / 网格末尾 */
        let row = 0;
        if (typeof s.row === "number" && isFinite(s.row)) row = Math.max(0, Math.min(MAX_ROW, Math.floor(s.row)));
        else if (s.bottom) row = MAX_ROW;
        return { page: page, row: row };
      }
      const widget = ref(readWidget(store.state.settings.homeWidget));
      /* 备份里的小组件行可能不合法（旧版越界值 / 页数被删减），拉回有效范围 */
      function clampWidget() {
        const last = Math.max(0, layout.value.length - 1);
        if (widget.value.page > last) widget.value.page = last;
        if (widget.value.page < 0) widget.value.page = 0;
        if (widget.value.row > MAX_ROW) widget.value.row = MAX_ROW;
        if (widget.value.row < 0) widget.value.row = 0;
      }
      clampWidget(); /* 备份里的小组件页号可能超过现在的页数，先夹到有效范围 */
      /* 小组件占住的槽位号列表：从 row 开始跨 WSPAN 行、占整行宽 */
      function widgetSlots(w) {
        const cells = [];
        for (let r = w.row; r < w.row + WSPAN; r += 1) {
          for (let c = 0; c < COLS; c += 1) cells.push(r * COLS + c);
        }
        return cells;
      }
      /* 这个槽位是否被该页上的小组件占着 */
      function isWidgetSlot(slotIndex, pageIndex) {
        return widget.value.page === pageIndex && widgetSlots(widget.value).indexOf(slotIndex) !== -1;
      }
      /* 把被小组件压住的图标搬到最近空位（先扫自己这一页 → 再顺着往后 → 最后回头 → 满了就新开一页） */
      function relocateIcon(id, pageIndex, avoid) {
        const total = layout.value.length;
        for (let n = 0; n < total; n += 1) {
          const pi = (pageIndex + n) % total;
          const slots = layout.value[pi].slots;
          for (let i = 0; i < SLOTS; i += 1) {
            if (isWidgetSlot(i, pi)) continue;
            if (slots[i]) continue;
            if (avoid && avoid(pi, i)) continue;
            slots[i] = id;
            return true;
          }
        }
        const np = makePage();
        np.slots[0] = id;
        layout.value.push(np);
        return true;
      }
      function relocateCovered() {
        layout.value.forEach(function (pg, pi) {
          pg.slots.forEach(function (id, i) {
            if (!id || !isWidgetSlot(i, pi)) return;
            /* 先把被压住的那格腾空：否则搬走后原位还留着同一个 id，布局里会出现重复图标 */
            pg.slots[i] = null;
            relocateIcon(id, pi, function (fp, fi) { return fp === pi && fi === i; });
          });
        });
      }
      relocateCovered(); /* 旧数据迁移：如果小组件恰好压在图标上，把图标挪开 */
      function persistLayout() {
        store.state.settings.homeLayout = layout.value.map(function (p) { return p.slots.slice(); });
      }
      function persistWidget() {
        store.state.settings.homeWidget = { page: widget.value.page, row: widget.value.row };
      }
      const page = ref(0);
      const editing = ref(false);
      const dragging = ref(null);
      const hover = ref(null);
      const pagerEl = ref(null);
      const offset = ref(0);
      const following = ref(false);
      const rebasing = ref(false);
      const animating = ref(false);
      let moveTimer = null;
      let writing = false;
      let pointer = null;
      let lpTimer = null;
      let edgeTimer = null;
      let edgeSide = 0;
      let edgeBlocked = false;
      let suppressUntil = 0;
      let disposed = false;
      let rebaseToken = 0;
      function persist() {
        writing = true;
        persistLayout();
        persistWidget();
        writing = false;
        if (store.persistNow) store.persistNow();
      }
      function clearLongPress() {
        window.clearTimeout(lpTimer);
        lpTimer = null;
      }
      function clearEdge() {
        window.clearTimeout(edgeTimer);
        edgeTimer = null;
        edgeSide = 0;
      }
      function cancelGesture() {
        clearLongPress();
        clearEdge();
        pointer = null;
        dragging.value = null;
        hover.value = null;
        following.value = false;
        offset.value = 0;
        edgeBlocked = false;
      }
      /* 翻页过渡期间给磨砂膜降级（见 phone.css 的 is-moving 说明） */
      function startMove(duration) {
        animating.value = true;
        window.clearTimeout(moveTimer);
        moveTimer = window.setTimeout(function () {
          animating.value = false;
        }, duration || 360);
      }
      function goPage(i) {
        const next = Math.max(0, Math.min(layout.value.length - 1, i));
        const changed = next !== page.value;
        page.value = next;
        offset.value = 0;
        following.value = false;
        hover.value = null;
        if (changed) startMove();
      }
      function finishEdit() {
        cancelGesture();
        editing.value = false;
        const current = layout.value[page.value];
        const wPage = layout.value[widget.value.page];
        const kept = layout.value.filter(function (p) {
          return p === current || p === wPage || p.slots.some(Boolean);
        });
        /* 保留当前页及其稳定 key，同步调整轨道坐标，不做跨多页的视觉跳动。 */
        rebasing.value = true;
        layout.value = kept;
        page.value = Math.max(0, kept.indexOf(current));
        widget.value.page = Math.max(0, kept.indexOf(wPage));
        relocateCovered(); /* 小组件换页/换行后可能压到图标，统一把被压的挪开 */
        persist();
        releaseRebase();
      }
      function releaseRebase(after) {
        const token = ++rebaseToken;
        nextTick(function () {
          if (disposed || token !== rebaseToken) return;
          /* 提交无动画的基准帧，再启动位移，左侧插页不会闪出空白。 */
          if (pagerEl.value) void pagerEl.value.offsetWidth;
          window.requestAnimationFrame(function () {
            if (disposed || token !== rebaseToken) return;
            rebasing.value = false;
            if (after) after();
          });
        });
      }
      function openApp(app) {
        clearLongPress();
        if (editing.value || dragging.value || Date.now() < suppressUntil) return;
        cancelGesture();
        store.openApp(app.id);
      }
      function appById(id) {
        return SN.apps.find(function (app) { return app.id === id; });
      }
      const trackStyle = computed(function () {
        return {
          transform: "translate3d(calc(" + (-page.value * 100) + "% + " + offset.value + "px), 0, 0)",
          transition: following.value || rebasing.value ? "none" : ""
        };
      });
      const moving = computed(function () {
        return following.value || rebasing.value || animating.value;
      });
      /* 拖动时跟着手指的「幽灵」：图标小、小组件是整行宽，偏移量不一样 */
      const ghostStyle = computed(function () {
        const d = dragging.value;
        if (!d) return {};
        return d.kind === "widget"
          ? { left: d.x - 150 + "px", top: d.y - 52 + "px" }
          : { left: d.x - 30 + "px", top: d.y - 30 + "px" };
      });
      /* 图标、小组件和空白区域都可以开始横向手势。 */
      function pagerDown(e) {
        if (store.state.activeApp || pointer || e.isPrimary === false || (e.button && e.button !== 0)) return;
        clearLongPress();
        pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, time: Date.now(), axis: null };
        function hold(start) {
          if (!pointer || store.state.activeApp) return;
          editing.value = true;
          dragging.value = start;
          suppressUntil = Date.now() + 500;
        }
        /* 小组件：跟图标一样住在网格里，只有它所在的那一页能抓起 */
        const band = e.target.closest && e.target.closest("[data-widget-slot]");
        if (band) {
          const bpi = Number(band.dataset.page);
          if (bpi !== page.value || widget.value.page !== bpi) return;
          const start = { kind: "widget", id: "", page: bpi, row: widget.value.row, index: -1, x: e.clientX, y: e.clientY };
          if (editing.value) hold(start);
          else lpTimer = window.setTimeout(function () { hold(start); }, 420);
          return;
        }
        const cell = e.target.closest && e.target.closest("[data-slot]");
        if (!cell) return;
        const pi = Number(cell.dataset.page);
        const index = Number(cell.dataset.index);
        const id = layout.value[pi].slots[index];
        if (!id || pi !== page.value) return;
        const start = { kind: "app", id: id, page: pi, index: index, x: e.clientX, y: e.clientY };
        if (editing.value) hold(start);
        else lpTimer = window.setTimeout(function () { hold(start); }, 420);
      }
      function slotAt(x, y) {
        if (!pagerEl.value) return null;
        const grid = pagerEl.value.querySelectorAll(".home__grid")[page.value];
        if (!grid) return null;
        const r = grid.getBoundingClientRect();
        const viewport = pagerEl.value.getBoundingClientRect();
        /* 横向必须落在这一页里；纵向只要还在桌面区域内就按「最近的一行」算，
           这样把图标丢到小组件那一格（网格上方）也不会变成丢不进去的死区 */
        if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) return null;
        const col = Math.max(0, Math.min(3, Math.floor((x - viewport.left) / (viewport.width / 4))));
        const cy = Math.max(r.top + 1, Math.min(r.bottom - 1, y));
        const row = Math.max(0, Math.min(ROWS - 1, Math.floor((cy - r.top) / (r.height / ROWS))));
        return { page: page.value, index: row * COLS + col, row: row };
      }
      function flipEdge(side) {
        if (!dragging.value || rebasing.value) return;
        const target = page.value + side;
        if (target >= 0 && target < layout.value.length) { goPage(target); return; }
        if (layout.value.length >= MAX_PAGES) return;
        if (side > 0) {
          layout.value.push(makePage());
          goPage(target);
        } else {
          rebasing.value = true;
          layout.value.unshift(makePage());
          dragging.value.page += 1;
          /* 所有原有页的序号都往后挪了一位，小组件也要跟着挪，否则会「跳到新页上」 */
          widget.value.page += 1;
          page.value += 1;
          releaseRebase(function () { goPage(0); });
        }
        /* 一次贴边只新建一页；离开边缘后可继续新建。 */
        edgeBlocked = true;
      }
      function updateEdge(x, y) {
        if (!pagerEl.value) return;
        const r = pagerEl.value.getBoundingClientRect();
        const side = y < r.top || y > r.bottom ? 0 : x < r.left + 30 ? -1 : x > r.right - 30 ? 1 : 0;
        if (!side) { clearEdge(); edgeBlocked = false; return; }
        if (side === edgeSide || edgeBlocked) return;
        clearEdge();
        edgeSide = side;
        function tick() {
          edgeTimer = null;
          if (!dragging.value || edgeSide !== side || edgeBlocked) return;
          flipEdge(side);
          hover.value = null;
          if (!edgeBlocked) edgeTimer = window.setTimeout(tick, 650);
        }
        edgeTimer = window.setTimeout(tick, 500);
      }
      function onMove(e) {
        if (!pointer || e.pointerId !== pointer.id) return;
        const dx = e.clientX - pointer.x;
        const dy = e.clientY - pointer.y;
        if (dragging.value) {
          if (e.cancelable) e.preventDefault();
          dragging.value.x = e.clientX;
          dragging.value.y = e.clientY;
          hover.value = slotAt(e.clientX, e.clientY);
          updateEdge(e.clientX, e.clientY);
          return;
        }
        if (!pointer.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
          pointer.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          clearLongPress();
          suppressUntil = Date.now() + 500;
        }
        if (pointer.axis !== "x") return;
        if (e.cancelable) e.preventDefault();
        following.value = true;
        const width = pagerEl.value ? pagerEl.value.clientWidth : 350;
        const atEnd = (page.value === 0 && dx > 0) || (page.value === layout.value.length - 1 && dx < 0);
        offset.value = Math.max(-width, Math.min(width, dx * (atEnd ? 0.25 : 1)));
      }
      function onUp(e) {
        if (!pointer || e.pointerId !== pointer.id) return;
        clearLongPress();
        clearEdge();
        const d = dragging.value;
        if (d && d.kind === "widget") {
          /* 跟图标同款落点：落在哪一页就住哪一页；行号按手指位置吸附，压到图标就把它们搬开 */
          const target = slotAt(e.clientX, e.clientY);
          if (target) {
            const w = widget.value;
            /* 放回自己占的那两行 = 原地不动；其余按手指位置吸附（最后一行上移一格） */
            const row =
              target.page === w.page && (target.row === w.row || target.row === w.row + 1)
                ? w.row
                : Math.max(0, Math.min(MAX_ROW, target.row > MAX_ROW - 1 ? target.row - 1 : target.row));
            const moved = row !== widget.value.row || target.page !== widget.value.page;
            widget.value.page = target.page;
            widget.value.row = row;
            if (moved) relocateCovered();
          }
          hover.value = null;
          persist();
        } else if (d) {
          const target = slotAt(e.clientX, e.clientY);
          /* 小组件占的那几格不放图标（松手在上面就当放回原处） */
          if (target && !isWidgetSlot(target.index, target.page)) {
            const source = layout.value[d.page].slots;
            const dest = layout.value[target.page].slots;
            source[d.index] = dest[target.index];
            dest[target.index] = d.id;
          }
          persist();
        } else if (pointer.axis === "x") {
          const dx = e.clientX - pointer.x;
          const width = pagerEl.value ? pagerEl.value.clientWidth : 350;
          const elapsed = Math.max(1, Date.now() - pointer.time);
          const turn = Math.abs(dx) > width * 0.2 || (Math.abs(dx) > 30 && Math.abs(dx) / elapsed > 0.45);
          goPage(page.value + (turn ? (dx < 0 ? 1 : -1) : 0));
          startMove();
        }
        /* 手势结束后紧跟的合成 click 会落在手指抬起处的图标上，短暂拦掉以防误开应用 */
        if (d || pointer.axis) suppressUntil = Date.now() + 180;
        cancelGesture();
      }
      function onCancel(e) {
        if (pointer && e.pointerId === pointer.id) cancelGesture();
      }
      function onBlur() { cancelGesture(); }
      watch(function () { return store.state.activeApp; }, function (id) {
        if (id) { cancelGesture(); editing.value = false; }
      }, { flush: "sync" });
      watch(function () { return store.state.settings.homeLayout; }, function (saved) {
        if (writing) return;
        cancelGesture();
        editing.value = false;
        layout.value = normalize(saved);
        widget.value = readWidget(store.state.settings.homeWidget);
        clampWidget();
        goPage(0);
      }, { deep: true, flush: "sync" });
      /* 恢复出厂 / 导入备份后，小组件位置也要跟着回到设置里的值 */
      watch(function () { return store.state.settings.homeWidget; }, function (saved) {
        if (writing) return;
        widget.value = readWidget(saved);
        clampWidget();
      }, { deep: true, flush: "sync" });
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("blur", onBlur);
      onBeforeUnmount(function () {
        disposed = true;
        cancelGesture();
        window.clearTimeout(moveTimer);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("blur", onBlur);
      });
      /* ---- 模板用的落点高亮辅助：图标格 / 小组件两条预览带 ---- */
      const wrow = computed(function () {
        const h = hover.value;
        if (!h || !dragging.value || dragging.value.kind !== "widget") return -1;
        /* 手指落回小组件自己占的那两行 = 原地不动（预览和落点共用这条规则） */
        const w = widget.value;
        if (h.page === w.page && (h.row === w.row || h.row === w.row + 1)) return w.row;
        return Math.max(0, Math.min(MAX_ROW, h.row > MAX_ROW - 1 ? h.row - 1 : h.row));
      });
      function isHoverCell(i, pi) {
        const h = hover.value;
        return !!(h && h.page === pi && h.index === i && !(dragging.value && dragging.value.kind === "widget"));
      }
      function isWidgetHover(r, pi) {
        const h = hover.value;
        if (!h || h.page !== pi) return false;
        if (!dragging.value || dragging.value.kind !== "widget") return false;
        return r === wrow.value || r === wrow.value + 1;
      }
      function isSourceCell(i, pi) {
        const d = dragging.value;
        return !!(d && d.kind === "app" && d.page === pi && d.index === i);
      }
      function isWidgetSource(pi) {
        const d = dragging.value;
        return !!(d && d.kind === "widget" && d.page === pi);
      }
      function isWidgetDrop(r, pi) {
        if (!dragging.value || dragging.value.kind !== "widget" || hover.value) return false;
        return dragging.value.page === pi && (r === dragging.value.row || r === dragging.value.row + 1);
      }
      return {
        SLOTS: SLOTS, layout: layout, page: page, editing: editing,
        dragging: dragging, hover: hover, pagerEl: pagerEl, trackStyle: trackStyle,
        widget: widget, moving: moving, ghostStyle: ghostStyle, wrow: wrow,
        isHoverCell: isHoverCell, isWidgetHover: isWidgetHover,
        isSourceCell: isSourceCell, isWidgetSource: isWidgetSource,
        isWidgetDrop: isWidgetDrop,
        showLabel: computed(function () { return store.state.settings.homeLabels; }),
        appById: appById, openApp: openApp, goPage: goPage,
        finishEdit: finishEdit, pagerDown: pagerDown
      };
    },
    template: `
      <div class="home" @contextmenu.prevent @dragstart.prevent @pointerdown="pagerDown">
        <div class="home__pager" ref="pagerEl" :class="{ 'is-editing': editing, 'is-moving': moving }">
          <div class="home__track" :style="trackStyle">
            <div class="home__page" v-for="(p, pi) in layout" :key="p.key" :inert="pi !== page">
              <!-- 小组件跟图标一样住在网格里：占 4×2（整行宽、跨 2 行），可以在任意页的任意行。
                   用 grid-row: span 2 一次占住两行，不再需要额外的占位格子，翻页时行列自然对齐。 -->
              <div class="home__grid">
                <template v-for="r in 6" :key="'r' + r">
                  <div v-if="widget.page === pi && r - 1 === widget.row" class="home__cell home__cell--widget"
                       data-widget-slot :data-page="pi" :data-row="widget.row"
                       :class="{ 'is-holding': isWidgetSource(pi), 'is-drop': isWidgetDrop(r - 1, pi), 'is-whover': isWidgetHover(r - 1, pi) }">
                    <sn-widget></sn-widget>
                  </div>
                  <template v-else-if="widget.page === pi && r - 1 === widget.row + 1"></template>
                  <template v-else>
                    <div v-for="c in 4" :key="'c' + c" class="home__cell" data-slot
                         :data-page="pi" :data-index="(r - 1) * 4 + (c - 1)"
                         :class="{ 'is-hover': isHoverCell((r - 1) * 4 + (c - 1), pi), 'is-source': isSourceCell((r - 1) * 4 + (c - 1), pi) }">
                      <sn-app-icon v-if="p.slots[(r - 1) * 4 + (c - 1)]" :app="appById(p.slots[(r - 1) * 4 + (c - 1)])"
                                   :show-label="showLabel" @open="openApp"></sn-app-icon>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="home__dots" aria-label="桌面页面">
        <button class="home__dot" type="button" v-for="(p, pi) in layout" :key="p.key"
                :aria-label="'第 ' + (pi + 1) + ' 页'" :aria-current="pi === page ? 'page' : null"
                :class="{ 'is-active': pi === page }" @click="goPage(pi)"></button>
      </div>
      <div class="home__editbar" v-if="editing">
        <button class="home__done" type="button" @click="finishEdit">完成</button>
      </div>
      <teleport to="body">
        <div class="home__ghost" :class="{ 'home__ghost--widget': dragging && dragging.kind === 'widget' }"
             v-if="dragging" :style="ghostStyle">
          <sn-widget v-if="dragging.kind === 'widget'"></sn-widget>
          <sn-app-icon v-else :app="appById(dragging.id)" :show-label="false"></sn-app-icon>
        </div>
      </teleport>
    `
  };
})();

