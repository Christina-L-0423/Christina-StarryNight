/* ============================================================
   app.js —— 最后一步：启动整台小手机
   做的事很简单：把上面写好的组件都注册进去，然后挂载到 #app
   ============================================================ */

(function () {
  "use strict";

  /* 出错时给一句人话提示，而不是让人对着白屏发呆 */
  function showError(title, detail) {
    const boot = document.getElementById("boot");
    const target = boot || document.getElementById("app") || document.body;
    target.className = "boot boot--error";
    target.innerHTML =
      '<div class="boot__inner">' +
      "<h2>" +
      title +
      "</h2>" +
      "<p>" +
      detail +
      "</p>" +
      "</div>";
  }

  /* 1) Vue 本身有没有加载成功？（它来自网络 CDN） */
  if (typeof Vue === "undefined") {
    showError(
      "Vue 没有加载成功",
      "小手机需要联网加载 Vue（来自 cdn.jsdelivr.net）。请检查网络后刷新页面；" +
        "如果是长期离线使用，可以把 Vue 下载到本地，再改 index.html 里的引入地址。"
    );
    return;
  }

  /* 2) 我们自己写的脚本有没有全部加载成功？
        四层结构：数据层 data/ → 逻辑层 logic/ → 界面层 ui/ → 启动 app.js */
  const REQUIRED = [
    ["SN.store", window.SN && window.SN.store, "data/store.js（数据层：状态与本地存储）"],
    ["SN.defaults", window.SN && window.SN.defaults, "data/defaults.js（数据层：出厂默认值）"],
    ["SN.mediaStore", window.SN && window.SN.mediaStore, "data/mediaStore.js（数据层：图片库）"],
    ["SN.prompt", window.SN && window.SN.prompt, "logic/prompt.js（逻辑层：拼提示词 / 正则 / 分气泡）"],
    ["SN.memory", window.SN && window.SN.memory, "logic/memory.js（逻辑层：记忆库）"],
    ["SN.api", window.SN && window.SN.api, "logic/apiClient.js（逻辑层：调 API）"],
    ["SN.components", window.SN && window.SN.components, "ui/components.js（界面层：组件）"]
  ];
  if (!window.SN || !window.SN.VERSION || !window.SN.components || !window.SN.views) {
    const missing = REQUIRED.filter(function (row) {
      return !row[1];
    }).map(function (row) {
      return row[2];
    });
    showError(
      "脚本没能完整加载",
      "请确认 assets/js 下的四层文件都在，并且 index.html 底部的引入顺序没有被改动。" +
        (missing.length ? "缺失：" + missing.join("、") : "")
    );
    return;
  }

  const SN = window.SN;

  /* ---------- 3) 根组件：整台手机 ---------- */
  const RootApp = {
    setup: function () {
      const store = SN.store;
      return {
        state: store.state,
        wallpaper: store.wallpaper,
        wallpaperStyle: store.wallpaperStyle,
        schemeClass: store.schemeClass,
        closeApp: store.closeApp
      };
    }
  };

  const app = Vue.createApp(RootApp);

  /* ---------- 4) 把所有组件注册成全局组件 ---------- */
  Object.keys(SN.components).forEach(function (name) {
    app.component(name, SN.components[name]);
  });

  /* ---------- 5) 先打开本地图片库（自定义壁纸用），再挂载界面 ---------- */
  Promise.resolve(SN.mediaStore.init ? SN.mediaStore.init() : null)
    .then(function () {
      SN.store.hydrateWallpaperImages();
      app.mount("#app");

      /* 挂载完成后移除启动占位 */
      window.setTimeout(function () {
        const boot = document.getElementById("boot");
        if (boot) boot.remove();
      }, 80);

      console.log(
        "%c StarryNight " +
          SN.VERSION +
          " 已启动（Vue " +
          Vue.version +
          "）",
        "color:#8ea2ff"
      );
    })
    .catch(function (err) {
      showError("图片库初始化失败", String((err && err.message) || err));
    });

  /* ---------- 6) 小体验：按 Esc 返回桌面 ---------- */
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && SN.store.state.activeApp) {
      SN.store.closeApp();
    }
  });
})();