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
      /* 用户自定义的图标图片（「美化 → 自定义应用图标」设置）；没有就返回空串 */
      customIcon: function () {
        const icons = SN.store.state.settings.appIcons || {};
        return icons[this.app.id] || "";
      },
      /* 这里只负责“大小、圆角、自定义图片”。
         玻璃的样子（无色薄膜、细亮边、模糊）全部写在 phone.css 里，
         所以所有默认图标长得一模一样，不做任何单独配色。 */
      boxStyle: function () {
        const style = {
          width: this.size + "px",
          height: this.size + "px",
          borderRadius: Math.round(this.size * 0.28) + "px"
        };
        if (this.customIcon) {
          style.backgroundImage = 'url("' + this.customIcon + '")';
          style.backgroundSize = "cover";
          style.backgroundPosition = "center";
        }
        return style;
      },
      glyphSize: function () {
        return Math.round(this.size * 0.52);
      }
    },
    template:
      '<button class="app-icon" type="button" @click="$emit(\'open\', app)">' +
      '<span class="app-icon__box" :class="{ \'is-custom\': !!customIcon }" :style="boxStyle">' +
      '<sn-glyph v-if="!customIcon" :name="app.icon" :size="glyphSize"></sn-glyph>' +
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
      const store = SN.store;
      return {
        apps: SN.apps,
        openApp: store.openApp,
        /* 桌面主屏是否显示应用名称（在「美化 → 应用名称显示」里开关） */
        showLabel: Vue.computed(function () {
          return store.state.settings.homeLabels;
        })
      };
    },
    template:
      '<div class="home">' +
      "<sn-widget></sn-widget>" +
      '<div class="home__grid">' +
      '<sn-app-icon v-for="app in apps" :key="app.id" :app="app" :show-label="showLabel" @open="openApp"></sn-app-icon>' +
      "</div>" +
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
        return SN.findApp(this.appId) || { id: this.appId, name: "应用" };
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
      /* 返回键上不再显示「桌面 / 返回」这种文字（只剩箭头 + 大标题），
         这个标签只留给读屏软件，界面上看不见。 */
      backAriaLabel: function () {
        if (!this.navIsSub) return "返回桌面";
        const v = this.viewRef;
        return "返回" + ((v && v.navBackLabel) || "");
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
      /* 左上角是连在一起的一整块：[箭头 + 大标题]，整块可点返回。
         没有第二个文字标签，也没有磨砂底 —— 箭头就是唯一的“退出”标记。 */
      '<button class="back-btn" type="button" :aria-label="backAriaLabel" @click="onBack">' +
      '<sn-glyph class="back-btn__arrow" name="chevron-left" :size="20"></sn-glyph>' +
      '<span class="app-header__title">{{ title }}</span>' +
      "</button>" +
      "</header>" +
      '<div class="app-body">' +
      '<component :is="viewName" :app="meta" ref="viewRef"></component>' +
      "</div>" +
      "</section>"
  };
  /* ------------------------------------------------------------
     10) 全局确认弹窗：替代浏览器原生 confirm。
         原生弹窗的标题是网址（改不了），这个的标题固定为 StarryNight。
     ------------------------------------------------------------ */
  SN.ui = {
    confirm: function (options) {
      const opts = typeof options === "string" ? { message: options } : options || {};
      return new Promise(function (resolve) {
        const primaryClass = opts.danger ? "ui-dialog__btn--danger" : "ui-dialog__btn--primary";
        const mask = document.createElement("div");
        mask.className = "ui-dialog-mask";
        mask.innerHTML =
          '<div class="ui-dialog" role="dialog" aria-modal="true">' +
          '<div class="ui-dialog__title">' + SN.APP_NAME + "</div>" +
          '<div class="ui-dialog__msg"></div>' +
          '<div class="ui-dialog__btns">' +
          '<button type="button" class="ui-dialog__btn" data-act="cancel">' + (opts.cancelText || "取消") + "</button>" +
          '<button type="button" class="ui-dialog__btn ' + primaryClass + '" data-act="ok">' + (opts.confirmText || "确定") + "</button>" +
          "</div>" +
          "</div>";
        mask.querySelector(".ui-dialog__msg").textContent = opts.message || "";
        function close(result) {
          if (mask.parentNode) mask.parentNode.removeChild(mask);
          resolve(result);
        }
        mask.addEventListener("click", function (event) {
          const act = event.target.getAttribute && event.target.getAttribute("data-act");
          if (act === "ok") close(true);
          else if (act === "cancel") close(false);
          else if (event.target === mask) close(false);
        });
        document.body.appendChild(mask);
      });
    }
  };
})(window.SN);