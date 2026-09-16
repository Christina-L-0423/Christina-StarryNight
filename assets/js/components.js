/* ============================================================
   components.js —— 界面组件
   这里都是“积木块”，拼装方式写在 index.html 里。
   每个组件的 template 就是它长什么样的 HTML，
   setup() 里是它会用到的数据。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  SN.components = SN.components || {};

  /* ------------------------------------------------------------
     1) 通用图标：把 config.js 里的 SVG 代码画出来
        用法：<sn-glyph name="chat" :size="24"></sn-glyph>
     ------------------------------------------------------------ */
  SN.components["sn-glyph"] = {
    name: "sn-glyph",
    props: {
      name: { type: String, required: true },
      size: { type: [Number, String], default: 22 }
    },
    computed: {
      inner: function () {
        return SN.icons[this.name] || "";
      },
      px: function () {
        return typeof this.size === "number" ? this.size + "px" : this.size;
      }
    },
    template:
      '<svg class="glyph" :width="px" :height="px" viewBox="0 0 24 24" aria-hidden="true" v-html="inner"></svg>'
  };

  /* ------------------------------------------------------------
     2) 电量图标（外框 + 按百分比填充）
     ------------------------------------------------------------ */
  SN.components["sn-battery"] = {
    name: "sn-battery",
    props: {
      level: { type: Number, default: 76 }
    },
    computed: {
      fillWidth: function () {
        const w = (12.8 * Math.max(0, Math.min(100, this.level))) / 100;
        return Math.max(2.2, w);
      }
    },
    template:
      '<svg class="glyph" width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">' +
      '<rect x="1" y="1.6" width="21" height="10.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45"/>' +
      '<rect x="3" y="3.6" :width="fillWidth" height="6.8" rx="2" fill="currentColor"/>' +
      '<path d="M23.6 5.1v3.8c1-.3 1.6-1 1.6-1.9s-.6-1.6-1.6-1.9Z" fill="currentColor" opacity=".45"/>' +
      "</svg>"
  };

  /* ------------------------------------------------------------
     3) 顶部状态栏：时间 + 信号 + WiFi + 电量
     ------------------------------------------------------------ */
  SN.components["sn-status-bar"] = {
    name: "sn-status-bar",
    setup: function () {
      const store = SN.store;
      return {
        clock: store.clock,
        settings: store.state.settings
      };
    },
    template:
      '<div class="status-bar">' +
      '<div class="status-bar__left">{{ clock.hm }}</div>' +
      '<div class="status-bar__right">' +
      '<sn-glyph name="signal" :size="17"></sn-glyph>' +
      '<sn-glyph name="wifi" :size="17"></sn-glyph>' +
      '<sn-battery :level="settings.battery"></sn-battery>' +
      "</div>" +
      "</div>"
  };

  /* ------------------------------------------------------------
     4) 时间 / 天气小组件
        左边：大号时间 + 下面小字日期星期
        右边：小字位置 + 天气
     ------------------------------------------------------------ */
  SN.components["sn-widget"] = {
    name: "sn-widget",
    setup: function () {
      const store = SN.store;
      return {
        clock: store.clock,
        weather: store.weather,
        locationName: Vue.computed(function () {
          return store.state.settings.locationName || "未设置位置";
        })
      };
    },
    template:
      '<div class="widget">' +
      '<div class="widget__main">' +
      '<div class="widget__time">{{ clock.hm }}</div>' +
      '<div class="widget__date">{{ clock.date }}</div>' +
      "</div>" +
      '<div class="widget__side">' +
      '<div class="widget__city"><sn-glyph name="pin" :size="12"></sn-glyph><span>{{ locationName }}</span></div>' +
      '<div class="widget__weather">' +
      '<sn-glyph :name="weather.icon" :size="14"></sn-glyph>' +
      "<span>{{ weather.temp }}° {{ weather.text }}</span>" +
      "</div>" +
      "</div>" +
      "</div>"
  };

  /* ------------------------------------------------------------
     5) 应用图标（圆角方块 + 图形 + 名字）
     ------------------------------------------------------------ */
  SN.components["sn-app-icon"] = {
    name: "sn-app-icon",
    props: {
      app: { type: Object, required: true },
      showLabel: { type: Boolean, default: true },
      size: { type: Number, default: 60 }
    },
    emits: ["open"],
    computed: {
      /* 这里只负责“大小和圆角”。
         玻璃的样子（无色薄膜、细亮边、模糊）全部写在 phone.css 里，
         所以所有图标长得一模一样，不做任何单独配色。 */
      boxStyle: function () {
        return {
          width: this.size + "px",
          height: this.size + "px",
          borderRadius: Math.round(this.size * 0.28) + "px"
        };
      },
      glyphSize: function () {
        return Math.round(this.size * 0.52);
      }
    },
    template:
      '<button class="app-icon" type="button" @click="$emit(\'open\', app)">' +
      '<span class="app-icon__box" :style="boxStyle">' +
      '<sn-glyph :name="app.icon" :size="glyphSize"></sn-glyph>' +
      "</span>" +
      '<span class="app-icon__label" v-if="showLabel">{{ app.name }}</span>' +
      "</button>"
  };

  /* ------------------------------------------------------------
     6) iOS 风格开关（配合 v-model 使用）
     ------------------------------------------------------------ */
  SN.components["sn-switch"] = {
    name: "sn-switch",
    props: {
      modelValue: { type: Boolean, default: false }
    },
    emits: ["update:modelValue"],
    template:
      '<button class="switch" type="button" role="switch" :class="{ \'is-on\': modelValue }" ' +
      ':aria-checked="modelValue" @click="$emit(\'update:modelValue\', !modelValue)">' +
      '<span class="switch__dot"></span>' +
      "</button>"
  };

  /* ------------------------------------------------------------
     7) 桌面：小组件 + 应用网格
     ------------------------------------------------------------ */
  SN.components["sn-home"] = {
    name: "sn-home",
    setup: function () {
      return {
        apps: SN.apps,
        openApp: SN.store.openApp
      };
    },
    template:
      '<div class="home">' +
      "<sn-widget></sn-widget>" +
      '<div class="home__grid">' +
      '<sn-app-icon v-for="app in apps" :key="app.id" :app="app" @open="openApp"></sn-app-icon>' +
      "</div>" +
      '<p class="home__hint">点图标进入应用 · 所有设置都在底部 Dock 的「设置」里</p>' +
      "</div>"
  };

  /* ------------------------------------------------------------
     8) 底部 Dock 栏
     ------------------------------------------------------------ */
  SN.components["sn-dock"] = {
    name: "sn-dock",
    setup: function () {
      const store = SN.store;
      return {
        dockApps: SN.dockApps,
        showLabel: Vue.computed(function () {
          return store.state.settings.dockLabels;
        }),
        openApp: store.openApp
      };
    },
    template:
      '<div class="dock">' +
      '<div class="dock__inner">' +
      '<sn-app-icon v-for="app in dockApps" :key="app.id" :app="app" :size="54" ' +
      ':show-label="showLabel" @open="openApp"></sn-app-icon>' +
      "</div>" +
      "</div>"
  };

  /* ------------------------------------------------------------
     9) 应用面板：全屏的“App 界面”
        上半部分是标题栏（含返回按钮），下面是具体页面。
        :is="viewName" 的意思是“这里放哪个页面组件由数据决定”。
     ------------------------------------------------------------ */
  SN.components["sn-app-screen"] = {
    name: "sn-app-screen",
    props: {
      appId: { type: String, required: true }
    },
    emits: ["close"],
    /* viewRef 指向当前页面组件；页面通过 navTitle / navIsSub / navBack / navBackLabel
       上报自己的导航状态，头部据此显示正确的标题和返回行为。 */
    setup: function () {
      return { viewRef: Vue.ref(null) };
    },
    computed: {
      meta: function () {
        return SN.findApp(this.appId) || { id: this.appId, name: "应用", intro: "" };
      },
      viewName: function () {
        return SN.views[this.appId] || "";
      },
      navIsSub: function () {
        const v = this.viewRef;
        return Boolean(v && v.navIsSub);
      },
      title: function () {
        const v = this.viewRef;
        return (v && v.navTitle) || this.meta.name;
      },
      backLabel: function () {
        if (!this.navIsSub) return "桌面";
        const v = this.viewRef;
        return (v && v.navBackLabel) || "返回";
      }
    },
    methods: {
      onBack: function () {
        const v = this.viewRef;
        if (this.navIsSub && v && typeof v.navBack === "function") {
          v.navBack(); /* 子页：返回应用内的上一层 */
        } else {
          this.$emit("close"); /* 主页：返回桌面 */
        }
      }
    },
    template:
      '<section class="app-screen">' +
      '<header class="app-header">' +
      '<div class="app-header__bar">' +
      '<button class="back-btn" type="button" @click="onBack">' +
      '<sn-glyph name="chevron-left" :size="18"></sn-glyph><span>{{ backLabel }}</span>' +
      "</button>" +
      "</div>" +
      '<h1 class="app-header__title">{{ title }}</h1>' +
      '<p class="app-header__sub" v-if="!navIsSub">{{ meta.intro }}</p>' +
      "</header>" +
      '<div class="app-body">' +
      '<component :is="viewName" :app="meta" ref="viewRef"></component>' +
      "</div>" +
      "</section>"
  };
})(window.SN);