/* ============================================================
   mediaStore.js —— 自定义壁纸图片的“本地图片库”
   图片比文字大得多，所以不放进 localStorage，而是：
   1) 优先用 IndexedDB（浏览器的大容量数据库，适合存图片）
   2) IndexedDB 不可用时退回 localStorage（容量小些，但兼容性好）
   3) 都不行就只放在内存里（刷新后会丢失，属于极端情况）
   所有图片都会先压缩（最长边 1600px、JPEG 85%），避免原图太大。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  const LS_KEY = "starrynight.images.v1";
  const DB_NAME = "starrynight";
  const DB_STORE = "images";
  const MAX_EDGE = 1600; /* 图片最长边压到 1600px，够手机壁纸用 */
  const JPEG_QUALITY = 0.85;

  let db = null; /* IndexedDB 的句柄；null 表示当前走降级方案 */
  let mode = "memory"; /* indexeddb | local | memory */
  const memory = new Map(); /* id -> dataUrl。读写都先走内存，所以界面取图是同步的 */

  function lsRead() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function lsWrite() {
    try {
      const obj = {};
      memory.forEach(function (dataUrl, id) {
        obj[id] = dataUrl;
      });
      localStorage.setItem(LS_KEY, JSON.stringify(obj));
      return true;
    } catch (err) {
      console.warn("[StarryNight] 图片写入 localStorage 失败（可能空间不足）：", err);
      return false;
    }
  }

  /* ---- IndexedDB 的几个小封装（都是 Promise 写法） ---- */

  function openDB() {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        request.result.createObjectStore(DB_STORE, { keyPath: "id" });
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error || new Error("IndexedDB 打开失败"));
      };
    });
  }

  function dbAll() {
    return new Promise(function (resolve, reject) {
      const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).getAll();
      request.onsuccess = function () {
        resolve(request.result || []);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function dbPut(record) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(record);
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
      tx.onabort = function () {
        reject(tx.error || new Error("写入被中断"));
      };
    });
  }

  function dbDelete(id) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  function dbClear() {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  /* 降级方案：localStorage */
  function initLocal() {
    const obj = lsRead();
    Object.keys(obj).forEach(function (id) {
      if (typeof obj[id] === "string") memory.set(id, obj[id]);
    });
    mode = "local";
    return mode;
  }

  const mediaStore = {
    /* 当前使用的存储方式（调试 / 测试用） */
    get mode() {
      return mode;
    },

    /* 启动时调用一次：把已保存的图片全部读进内存 */
    init: function () {
      memory.clear();
      db = null;
      if (window.indexedDB) {
        return openDB()
          .then(function (handle) {
            db = handle;
            return dbAll();
          })
          .then(function (rows) {
            rows.forEach(function (row) {
              if (row && row.id && typeof row.dataUrl === "string") memory.set(row.id, row.dataUrl);
            });
            mode = "indexeddb";
            return mode;
          })
          .catch(function (err) {
            console.warn("[StarryNight] IndexedDB 不可用，改用 localStorage 存图片：", err);
            db = null;
            return initLocal();
          });
      }
      return Promise.resolve(initLocal());
    },

    /* 同步取图（界面渲染用） */
    get: function (id) {
      return memory.get(id) || null;
    },

    /* 存图：先写内存（立即生效），再慢慢落到磁盘 */
    put: function (id, dataUrl) {
      memory.set(id, dataUrl);
      if (db) {
        return dbPut({ id: id, dataUrl: dataUrl }).catch(function (err) {
          console.warn("[StarryNight] 图片写入 IndexedDB 失败，改用 localStorage：", err);
          db = null;
          mode = "local";
          return lsWrite();
        });
      }
      return Promise.resolve(lsWrite());
    },

    remove: function (id) {
      memory.delete(id);
      if (db) {
        return dbDelete(id).catch(function (err) {
          console.warn("[StarryNight] 图片删除失败：", err);
          return false;
        });
      }
      return Promise.resolve(lsWrite());
    },

    clear: function () {
      memory.clear();
      if (db) {
        return dbClear().catch(function () {
          return false;
        });
      }
      try {
        localStorage.removeItem(LS_KEY);
      } catch (err) {
        /* 忽略 */
      }
      return Promise.resolve(true);
    },

    /* 全部图片（导出备份用） */
    entries: function () {
      const list = [];
      memory.forEach(function (dataUrl, id) {
        list.push({ id: id, dataUrl: dataUrl });
      });
      return list;
    }
  };

  /* ------------------------------------------------------------
     把用户选的图片文件压成 dataURL：
     最长边超过 1600px 就等比缩小，统一转成 JPEG。
     （透明 PNG 会先垫一层深色底，避免转 JPEG 后变黑块）
     ------------------------------------------------------------ */
  mediaStore.processImageFile = function (file) {
    return new Promise(function (resolve, reject) {
      if (!file || String(file.type || "").indexOf("image/") !== 0) {
        reject(new Error("请选择图片文件"));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("文件读取失败"));
      };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () {
          reject(new Error("图片解析失败，换一张试试"));
        };
        img.onload = function () {
          try {
            const width = img.naturalWidth || img.width || 1;
            const height = img.naturalHeight || img.height || 1;
            const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
            const wpx = Math.max(1, Math.round(width * scale));
            const hpx = Math.max(1, Math.round(height * scale));
            const canvas = document.createElement("canvas");
            canvas.width = wpx;
            canvas.height = hpx;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("当前浏览器不支持图片压缩"));
              return;
            }
            ctx.fillStyle = "#10121c";
            ctx.fillRect(0, 0, wpx, hpx);
            ctx.drawImage(img, 0, 0, wpx, hpx);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
          } catch (err) {
            reject(err);
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  SN.mediaStore = mediaStore;
})(window.SN);
