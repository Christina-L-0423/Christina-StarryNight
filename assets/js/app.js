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

  /* 2) 我们自己写的脚本有没有全部加载成功？ */
  if (!window.SN || !window.SN.store || !window.SN.components) {
    showError(
      "脚本没能完整加载",
      "请确认 assets/js 目录下 config.js / store.js / weather.js / components.js / views.js 都在，" +
        "并且 index.html 底部的引入顺序没有被改动。"
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

  /* ---------- 5) 挂载到 index.html 里的 #app ---------- */
  app.mount("#app");

  /* 挂载完成后移除启动占位 */
  window.setTimeout(function () {
    const boot = document.getElementById("boot");
    if (boot) boot.remove();
  }, 80);

  /* ---------- 6) 小体验：按 Esc 返回桌面 ---------- */
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && SN.store.state.activeApp) {
      SN.store.closeApp();
    }
  });

  console.log(
    "%c StarryNight " +
      SN.VERSION +
      " 已启动（Vue " +
      Vue.version +
      "）",
    "color:#8ea2ff"
  );
})();