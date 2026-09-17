/* ============================================================
   weather.js —— 天气
   使用 Open-Meteo 免费接口（不需要注册、不需要 API Key）。
   取不到数据时（没网 / 被墙 / 坐标为空）会自动退回示例数据，
   所以小手机在离线状态下也能正常显示。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  if (!SN.store) return; // 理论上不会发生，保险起见

  /* 示例数据：离线时显示这个 */
  const FALLBACK = { temp: 24, text: "晴", icon: "sun" };

  /* WMO 天气代码 → 中文描述 + 图标名 */
  const CODE_TABLE = [
    { codes: [0], text: "晴", icon: "sun" },
    { codes: [1, 2], text: "多云", icon: "cloud" },
    { codes: [3], text: "阴", icon: "cloud" },
    { codes: [45, 48], text: "雾", icon: "fog" },
    { codes: [51, 53, 55, 56, 57], text: "毛毛雨", icon: "rain" },
    { codes: [61, 63, 65, 66, 67, 80, 81, 82], text: "雨", icon: "rain" },
    { codes: [71, 73, 75, 77, 85, 86], text: "雪", icon: "snow" },
    { codes: [95, 96, 99], text: "雷雨", icon: "thunder" }
  ];

  function describe(code) {
    for (let i = 0; i < CODE_TABLE.length; i += 1) {
      if (CODE_TABLE[i].codes.indexOf(code) > -1) {
        return { text: CODE_TABLE[i].text, icon: CODE_TABLE[i].icon };
      }
    }
    return { text: "未知", icon: "cloud" };
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  /* ---------- 真正去请求天气 ---------- */
  async function fetchWeather(lat, lon) {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(lat) +
      "&longitude=" +
      encodeURIComponent(lon) +
      "&current=temperature_2m,weather_code&timezone=auto";

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("天气接口返回 " + res.status);

    const data = await res.json();
    const current = data && data.current;
    if (!current) throw new Error("天气数据格式不正确");

    const info = describe(current.weather_code);
    return {
      temp: Math.round(current.temperature_2m),
      text: info.text,
      icon: info.icon
    };
  }

  /* ---------- 刷新天气（会被定时调用） ---------- */
  let running = false;

  async function refresh() {
    const settings = SN.store.state.settings;
    const target = SN.store.weather;

    /* 关闭了实时天气 → 直接用示例数据 */
    if (!settings.useLiveWeather) {
      target.value = Object.assign({}, FALLBACK, { live: false, loading: false, updatedAt: SN.store.timeStamp() });
      return;
    }

    if (running) return;
    running = true;
    target.value = Object.assign({}, target.value, { loading: true });

    try {
      const result = await fetchWeather(settings.latitude, settings.longitude);
      target.value = {
        temp: result.temp,
        text: result.text,
        icon: result.icon,
        live: true,
        loading: false,
        updatedAt: SN.store.timeStamp()
      };
    } catch (err) {
      console.warn("[StarryNight] 实时天气获取失败，改用示例数据：", err);
      target.value = Object.assign({}, FALLBACK, {
        live: false,
        loading: false,
        updatedAt: SN.store.timeStamp()
      });
    } finally {
      running = false;
    }
  }

  /* 启动时取一次，之后每 20 分钟自动更新 */
  refresh();
  window.setInterval(refresh, 20 * 60 * 1000);

  /* 坐标或开关一变，立刻重新获取 */
  Vue.watch(
    function () {
      const s = SN.store.state.settings;
      return [s.useLiveWeather, s.latitude, s.longitude];
    },
    refresh
  );

  SN.weather = { refresh: refresh, describe: describe };
})(window.SN);