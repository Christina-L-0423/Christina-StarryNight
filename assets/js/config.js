/* ============================================================
   config.js —— 全站“可调参数”
   想加应用、换图标、加壁纸、加示例角色，基本都只改这个文件。
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  SN.VERSION = "0.0.11";
  SN.APP_NAME = "StarryNight";

  /* ------------------------------------------------------------
     1) 桌面上的应用（想加更多应用，就照格式往下加一行）
        id      ：唯一标识，同时也决定用哪个页面（见 SN.views）
        name    ：图标下面的名字
        icon    ：图标图形，对应 SN.icons 里的名字
        （所有图标统一是“无色磨砂玻璃”，外观写在 phone.css 的 .app-icon__box 里）
     ------------------------------------------------------------ */
  SN.apps = [
    {
      id: "chat",
      name: "聊天",
      icon: "chat"
    },
    {
      id: "beautify",
      name: "美化",
      icon: "paint"
    },
    {
      id: "forum",
      name: "论坛",
      icon: "topic"
    }
  ];

  /* ------------------------------------------------------------
     2) 底部 Dock 栏的应用（固定在最下方，4~5 个最合适）
     ------------------------------------------------------------ */
  SN.dockApps = [
    {
      id: "worldbook",
      name: "世界书",
      icon: "book"
    },
    {
      id: "characters",
      name: "角色集",
      icon: "users"
    },
    {
      id: "profile",
      name: "用户",
      icon: "user"
    },
    {
      id: "settings",
      name: "设置",
      icon: "sliders"
    }
  ];

  /* 全部应用的合集，方便按 id 查找（含不在桌面/Dock 上露面的隐藏页面） */
  SN.hiddenApps = [
    {
      id: "characterEdit",
      name: "角色编辑",
      icon: "users"
    }
  ];

  SN.allApps = SN.apps.concat(SN.dockApps, SN.hiddenApps);

  SN.findApp = function (id) {
    for (var i = 0; i < SN.allApps.length; i += 1) {
      if (SN.allApps[i].id === id) return SN.allApps[i];
    }
    return null;
  };

  /* ------------------------------------------------------------
     3) 图标库：每个图标就是一段 SVG
        统一 24×24 画布，用 currentColor 上色，
        想改颜色只要改对应元素的 CSS color。
     ------------------------------------------------------------ */
  SN.icons = {
    /* --- 状态栏 --- */
    signal:
      '<rect x="1" y="13" width="3" height="6.5" rx="1" fill="currentColor"/>' +
      '<rect x="6" y="10" width="3" height="9.5" rx="1" fill="currentColor"/>' +
      '<rect x="11" y="7" width="3" height="12.5" rx="1" fill="currentColor"/>' +
      '<rect x="16" y="4" width="3" height="15.5" rx="1" fill="currentColor" opacity=".45"/>',
    wifi:
      '<path d="M4.4 10.3a11.2 11.2 0 0 1 15.2 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M7.5 13.4a6.8 6.8 0 0 1 9 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<circle cx="12" cy="17.7" r="1.7" fill="currentColor"/>',

    /* --- 界面小图标 --- */
    "chevron-left":
      '<path d="M15 4.5 7.5 12l7.5 7.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    "chevron-right":
      '<path d="M9 4.5 16.5 12 9 19.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    refresh:
      '<path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M20 3.6v3.5h-3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    send:
      '<path d="M3.4 11.3 20.2 4.1c.7-.3 1.4.4 1.1 1.1l-7.1 16.8c-.3.7-1.4.7-1.6-.1l-1.5-6.1-6.1-1.5c-.8-.2-.8-1.3 0-1.6Z" fill="currentColor"/>',
    /* 线条镂空版发送键：一个纸飞机 */
    "send-line":
      '<path d="M20.8 4.2 3.1 10.6c-.7.3-.7 1.3 0 1.6l5.5 2 2 5.5c.3.7 1.3.7 1.6 0L20.8 4.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<path d="M20.8 4.2 8.6 13.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    /* 线条镂空版回复键：一个折回来的箭头 */
    "reply-line":
      '<path d="M9.4 5.4 3.6 11.2l5.8 5.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M3.6 11.2h8.7a6.5 6.5 0 0 1 6.5 6.5v.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    /* 线条镂空版停止键 */
    "stop-line":
      '<rect x="6.6" y="6.6" width="10.8" height="10.8" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    pin:
      '<path d="M12 22s7-6.2 7-11.4A7 7 0 0 0 5 10.6C5 15.8 12 22 12 22Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="10.5" r="2.4" fill="currentColor"/>',
    plus:
      '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    heart:
      '<path d="M12 20.5S3.5 15.2 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.6-8.5 10.9-8.5 10.9Z" fill="currentColor"/>',
    comment:
      '<path d="M4.6 4h14.8A2.6 2.6 0 0 1 22 6.6v8.2a2.6 2.6 0 0 1-2.6 2.6h-7.1L7.5 21.4a.6.6 0 0 1-1-.5v-3.5H4.6A2.6 2.6 0 0 1 2 14.8V6.6A2.6 2.6 0 0 1 4.6 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    trash:
      '<path d="M5 7h14M9.5 7V4.8h5V7M6.6 7l.9 12.2A1.9 1.9 0 0 0 9.4 21h5.2a1.9 1.9 0 0 0 1.9-1.8L17.4 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    /* --- 天气 --- */
    sun:
      '<circle cx="12" cy="12" r="4.7" fill="currentColor"/>' +
      '<path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    cloud:
      '<path d="M7.4 19.2h9.4a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11-1.3 4.4 4.4 0 0 0 1.1 9.7Z" fill="currentColor"/>',
    rain:
      '<path d="M7.4 15.4h9.4a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11-1.3 4.4 4.4 0 0 0 1.1 9.7Z" fill="currentColor"/>' +
      '<path d="M8.5 18.4 7.4 21.4M12.5 18.4l-1.1 3M16.5 18.4l-1.1 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    snow:
      '<path d="M7.4 15.4h9.4a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11-1.3 4.4 4.4 0 0 0 1.1 9.7Z" fill="currentColor"/>' +
      '<circle cx="8.6" cy="19.4" r="1.1" fill="currentColor"/><circle cx="12" cy="21" r="1.1" fill="currentColor"/><circle cx="15.4" cy="19.4" r="1.1" fill="currentColor"/>',
    thunder:
      '<path d="M7.4 14.6h9.4a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11-1.3 4.4 4.4 0 0 0 1.1 9.7Z" fill="currentColor"/>' +
      '<path d="M13.2 15.8 9.6 21h3.1l-1.1 3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    fog:
      '<path d="M7.4 14.6h9.4a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11-1.3 4.4 4.4 0 0 0 1.1 9.7Z" fill="currentColor"/>' +
      '<path d="M4.5 18h15M6.5 21h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',

    /* --- 应用图标 --- */
    chat:
      '<rect x="2.6" y="4.2" width="18.8" height="13.6" rx="4.8" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<circle cx="8.4" cy="11" r="1.35" fill="currentColor"/><circle cx="12" cy="11" r="1.35" fill="currentColor"/><circle cx="15.6" cy="11" r="1.35" fill="currentColor"/>',
    paint:
      '<path d="M12 2.8a9.2 9.2 0 1 0 0 18.4c.95 0 1.7-.78 1.7-1.72 0-.45-.17-.86-.45-1.17a1.66 1.66 0 0 1 1.25-2.76h1.92a4.78 4.78 0 0 0 4.78-4.75C21.2 6.4 17.1 2.8 12 2.8Z" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<circle cx="7.6" cy="11.6" r="1.25" fill="currentColor"/><circle cx="10.6" cy="7.9" r="1.25" fill="currentColor"/><circle cx="15.2" cy="8.6" r="1.25" fill="currentColor"/>',
    topic:
      '<path d="M9.4 3.4 7.3 20.6M16.7 3.4 14.6 20.6M3.8 8.6h16.4M3 15.4h16.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    book:
      '<path d="M12 6.6C10 5.2 7.2 4.4 4 4.4v13.1c3.2 0 6 .8 8 2.1 2-1.3 4.8-2.1 8-2.1V4.4c-3.2 0-6 .8-8 2.2Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>' +
      '<path d="M12 6.6v13" fill="none" stroke="currentColor" stroke-width="1.9"/>',
    users:
      '<circle cx="9" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<path d="M2.9 19.6c.6-3.4 3.1-5.3 6.1-5.3s5.5 1.9 6.1 5.3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M16.3 5.4a3.2 3.2 0 0 1 .4 6.2M17.6 14.6c2 .5 3.3 2.1 3.6 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    user:
      '<circle cx="12" cy="8.2" r="3.9" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<path d="M4.5 20.4c.9-4 3.9-6 7.5-6s6.6 2 7.5 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    sliders:
      '<path d="M4 7.4h8.6M17.4 7.4H20M4 16.6h3.6M12.4 16.6H20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<circle cx="15" cy="7.4" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<circle cx="9.9" cy="16.6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/>'
  };

  /* ------------------------------------------------------------
     4) 壁纸：全部用 CSS 渐变实现，不需要图片文件
        stars : true 会在上方叠加会闪烁的星点
        scheme: dark 用白字 / light 用黑字
     ------------------------------------------------------------ */
  SN.wallpapers = [
    {
      id: "starry",
      name: "星夜",
      scheme: "dark",
      stars: true,
      css: "linear-gradient(165deg, #070b22 0%, #131c4a 38%, #2b1352 70%, #4c1140 100%)"
    },
    {
      id: "aurora",
      name: "极光",
      scheme: "dark",
      stars: true,
      css: "linear-gradient(160deg, #03121f 0%, #0a3040 42%, #12604f 72%, #3d1c62 100%)"
    },
    {
      id: "dusk",
      name: "暮色",
      scheme: "dark",
      stars: false,
      css: "linear-gradient(170deg, #2a1140 0%, #7b2b52 44%, #c25b3f 76%, #f2a65a 100%)"
    },
    {
      id: "ocean",
      name: "深海",
      scheme: "dark",
      stars: false,
      css: "linear-gradient(165deg, #041024 0%, #0b2c53 48%, #12507f 82%, #1e7fa8 100%)"
    },
    {
      id: "mint",
      name: "薄荷",
      scheme: "light",
      stars: false,
      css: "linear-gradient(165deg, #e4faf3 0%, #a9ead9 46%, #8ed8cb 100%)"
    },
    {
      id: "sakura",
      name: "樱粉",
      scheme: "light",
      stars: false,
      css: "linear-gradient(165deg, #fff0f6 0%, #ffcde0 46%, #f6b3d2 100%)"
    }
  ];

  SN.findWallpaper = function (id) {
    for (var i = 0; i < SN.wallpapers.length; i += 1) {
      if (SN.wallpapers[i].id === id) return SN.wallpapers[i];
    }
    return SN.wallpapers[0];
  };

  /* ------------------------------------------------------------
     5) 应用 id → 页面组件（组件在 views.js 里定义）
        想加新应用：这里加一行，views.js 里加一个组件即可
     ------------------------------------------------------------ */
  SN.views = {
    chat: "sn-chat-view",
    beautify: "sn-beautify-view",
    forum: "sn-forum-view",
    worldbook: "sn-worldbook-view",
    characters: "sn-characters-view",
    characterEdit: "sn-character-edit-view",
    profile: "sn-profile-view",
    settings: "sn-settings-view"
  };

  /* ------------------------------------------------------------
     5.5) 常用服务商预设（OpenAI 兼容）
          设置页点一下就自动填好地址和模型；密钥仍需自己注册获取。
     ------------------------------------------------------------ */
  SN.apiPresets = [
    {
      id: "deepseek",
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-flash",
      hint: "platform.deepseek.com 注册并创建 Key，价格便宜"
    },
    {
      id: "siliconflow",
      name: "硅基流动",
      baseUrl: "https://api.siliconflow.cn/v1",
      model: "deepseek-ai/DeepSeek-V3",
      hint: "cloud.siliconflow.cn 注册并创建 Key，有免费额度"
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4o-mini",
      hint: "openrouter.ai 一个 Key 用多家模型"
    },
    {
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      hint: "platform.openai.com 创建 Key"
    },
    {
      id: "ollama",
      name: "本地 Ollama",
      baseUrl: "http://localhost:11434/v1",
      model: "qwen2.5:7b",
      hint: "本机运行，无需密钥，需允许跨域（OLLAMA_ORIGINS=*）"
    },
    {
      id: "custom",
      name: "自定义",
      baseUrl: "",
      model: "",
      hint: "手动填写任意 OpenAI 兼容接口的地址与模型"
    }
  ];

  /* ------------------------------------------------------------
     5.6) 更新日志（设置 → 更新日志 展示，新的在上面）
     ------------------------------------------------------------ */
  SN.changelog = [
    {
      version: "v0.0.11",
      date: "2026-09-18",
      title: "桌面与聊天打磨：翻页不闪、小组件可拖、聊天时间线、角色简介",
      items: [
        "修复：翻页时图标像「淡一下再慢慢回来」——滑动和翻页过程中不再采样背景模糊（只保留原来那层薄膜，实测亮度差 <1/255），停下立刻恢复磨砂玻璃",
        "新增：编辑模式里小组件也能拖——按住即可拖动，拖到左右边缘翻页或新建页；落在屏幕上半回到网格上方，下半移到网格下方",
        "优化：小组件不在的那几页留出同样高度的一格，翻页时各行图标不会上下错位；位置随备份保存",
        "修复：会话列表里角色名下面的预览太长会压到右边箭头上（行内元素上的省略号不生效），现在固定一行、并截短到 14 字",
        "优化：列表标题（角色名、预设名等）同样改成一行省略号，长名字不再撑破整行",
        "新增：聊天里微信式时间分割线——首条消息上方显示时间，之后间隔超过 5 分钟再显示一次；跨天自动带日期（昨天 / 星期X / M月D日）",
        "优化：会话列表左右顶格贴边（微信式通栏），去掉两侧留白、圆角和边线",
        "优化：会话列表每行右上角显示上次聊天时间（今天显示 时:分、昨天显示「昨天」、一周内显示 周X、更早显示 M月D日）",
        "优化：桌面编辑模式删掉底部的操作提示小字，只留「完成」按钮",
        "新增：角色集改为竖向居中排列（头像 → 名字 → 简介依次排列）；角色编辑新增「角色简介」字段（只用于角色集展示，不会发给 AI）"
      ]
    },
    {
      version: "v0.0.10",
      date: "2026-09-17",
      title: "桌面编辑模式 + 自由摆放 + 滑动换页 + 角色头像",
      items: [
        "新增：长按图标进入编辑模式（模仿 iOS 抖动）；图标可放在 4 × 4 的任意空位，允许图标之间留空，落到已有图标上则两者交换",
        "新增：桌面支持多页（最多 5 页）；编辑模式把图标拖到屏幕左右边缘就翻页，那一边没有页面时自动新建一页并带过去",
        "新增：主页面左右滑动换页——页面跟手移动，松手平滑翻页或回弹；点页点、拖图标跨页同样是滑动动画",
        "新增：角色编辑可换「头像图片」，选图自动压缩；聊天列表、角色卡、编辑页同步显示",
        "优化：页点固定在 Dock 栏上方，不再随桌面内容滚动",
        "优化：空页只在结束编辑时整理，拖动过程中不会突然跳页",
        "优化：设置 → 正则的列表里直接显示每条规则的用途说明",
        "修复：点进应用再退出来会误入编辑模式（长按计时器没有清理）",
        "修复：美化 → 自定义应用图标里混进了隐藏页「角色编辑」，现在只列桌面和 Dock 上的应用"
      ]
    },
    {
      version: "v0.0.9",
      date: "2026-09-17",
      title: "自定义角色与世界书：可以新建了",
      items: [
        "新增：角色集「新建角色卡」——起名、写人设与开场白、挑头像配色，建完立刻能聊",
        "新增：角色编辑页「删除这个角色」（官方角色不可删），删除时连同该角色的聊天记录一起清掉",
        "新增：世界书「新建条目」——标题、分类、触发关键词、内容、常驻开关",
        "新增：世界书条目可删除；命中逻辑不变：聊到关键词自动进提示词，勾了常驻则每次都带",
        "优化：自定义角色与世界书条目都随备份导出/导入；恢复出厂时清空，官方角色自动保留"
      ]
    },
    {
      version: "v0.0.8",
      date: "2026-09-17",
      title: "提示词管线：预设 / 正则 / 记忆库",
      items: [
        "重构：代码拆成四层——界面层（ui/）、逻辑层（logic/）、数据层（data/）、设置层，对外行为不变",
        "新增：提示词管线打通——预设 → 角色设定 → 命中的世界书 → 命中的记忆库 → 最近上下文 → 调 API → 跑正则 → 按 ||| 分气泡",
        "新增：设置 →「提示词预设」，可新建 / 编辑（支持 {{char}} {{user}} 占位符）并一键设为当前使用",
        "新增：设置 →「正则」，给 AI 回复做查找替换；可选整段跑或每个气泡单独跑，内置 4 条常用规则（默认开 3 条）",
        "新增：设置 →「记忆库」，随手记小事，按关键词命中或常驻，聊到相关话题自动带进提示词",
        "新增：AI 回复里的 ||| 自动拆成多个气泡；用户消息不受影响"
      ]
    },
    {
      version: "v0.0.7",
      date: "2026-09-17",
      title: "角色编辑、自定义图标、页头微调",
      items: [
        "新增：美化 →「自定义应用图标」，给任意应用换成自己的图片（桌面和 Dock 同时生效，可一键恢复默认）",
        "新增：美化 →「应用名称显示」开关（桌面主屏的名称开关，就在 Dock 开关下面）",
        "优化：页头箭头缩小到 20px，并与大标题同色",
        "优化：角色集点角色卡改为进入该角色的编辑页（不再直接进聊天），可以查看设定",
        "优化：默认角色改名 Christina，设定锁定——能看不能改，每次打开都用官方设定同步（不受本地存储与备份导入影响）",
        "简化：删掉全部角色「简介」，以及界面上的各种提示小字（首页、预览舞台、页头、美化与接口页的说明）"
      ]
    },
    {
      version: "v0.0.6",
      date: "2026-09-17",
      title: "页头：返回键与大标题合体",
      items: [
        "优化：每个页面的大标题移到左上角，与退出键连成一体（箭头 + 大标题是一整块按钮）",
        "简化：退出键只剩一个箭头——去掉「桌面 / 返回」文字和胶囊磨砂底",
        "优化：标题过长时自动省略号，不再换行把页头撑高"
      ]
    },
    {
      version: "v0.0.5",
      date: "2026-09-17",
      title: "测试连接不再误报",
      items: [
        "修复：测试连接改为自己发一次非流式请求，并把完整响应结构打到控制台，便于排查字段名",
        "修复：测试请求不再设极小的 max_tokens（推理型模型会把额度花在思考上，出现「花了 token 却是空回复」）",
        "优化：字段兼容所有 OpenAI 兼容服务商——content / reasoning_content / reasoning / text / 多模态数组 / 纯文本",
        "优化：判定原则改为「响应里有任何非空文本即成功」，不再出现成功显示失败、失败显示成功",
        "优化：测试提示词固定为「请只回复两个字：成功」，逼模型输出具体内容",
        "优化：DeepSeek 预设模型更新为 deepseek-flash（当前可用模型）"
      ]
    },
    {
      version: "v0.0.4",
      date: "2026-09-16",
      title: "模型拉取与自定义接口",
      items: [
        "新增：服务商预设增加「自定义」，可接任意 OpenAI 兼容接口",
        "新增：模型名旁的循环按钮——按已填地址和密钥在线拉取模型列表",
        "优化：模型选择面板按首字母排序，点选即填入"
      ]
    },
    {
      version: "v0.0.3",
      date: "2026-09-16",
      title: "满屏子页与导航",
      items: [
        "新增：设置拆成分组列表——API / 天气与位置 / 数据管理 / 更新日志",
        "优化：子页满屏显示，返回键逐层返回（API → 设置 → 桌面）",
        "优化：聊天会话详情的标题显示角色名"
      ]
    },
    {
      version: "v0.0.2",
      date: "2026-09-16",
      title: "接入 AI 与自定义壁纸",
      items: [
        "新增：聊天接入 OpenAI 兼容接口，支持流式打字输出与停止生成",
        "新增：美化页可以添加自己的图片当壁纸（自动压缩，随备份导出）",
        "新增：设置 →「测试连接」"
      ]
    },
    {
      version: "v0.0.1",
      date: "2026-09-16",
      title: "小手机框架",
      items: [
        "iOS 26 风格外壳：状态栏 / 灵动岛 / 磨砂玻璃 / Dock",
        "聊天 / 美化 / 论坛 / 世界书 / 角色集 / 用户 / 设置 七个页面",
        "数据全部保存在本机浏览器"
      ]
    }
  ];

  /* ------------------------------------------------------------
     6) 首次打开时的默认数据
        （之后都会存在浏览器本地存储里，不再使用这些默认值）
     ------------------------------------------------------------ */
  SN.defaults = {
    settings: {
      /* AI 接口（OpenAI 兼容格式）：填好后聊天页即可真实对话 */
      api: {
        baseUrl: "",
        apiKey: "",
        model: "",
        temperature: 0.8,
        maxTokens: 1024,
        contextCount: 20,
        stream: true
      },
      /* 天气与位置 */
      locationName: "锦江区",
      latitude: 30.67,
      longitude: 104.06,
      useLiveWeather: true,
      /* 外观 */
      wallpaper: "starry",
      /* Dock 栏（底部）是否显示应用名称 */
      dockLabels: true,
      /* 桌面（主屏）是否显示应用名称 */
      homeLabels: true,
      /* 自定义应用图标：app id → 图片 dataURL（在「美化 → 自定义应用图标」里设置） */
      appIcons: {},
      /* 桌面布局（由 ui/home.js 维护，随备份导出）：
         homeLayout：每一页的 4 × 4 个格子，null 表示空位
         homeWidget：小组件住在第几页 + 在图标网格上方（false）还是下方（true） */
      homeLayout: null,
      homeWidget: { page: 0, bottom: false },
      /* 状态栏电量（目前是装饰值） */
      battery: 76
    },

    user: {
      name: "夜行旅客",
      signature: "在星夜里慢慢写字的人",
      gradient: "linear-gradient(150deg, #7e8cff, #d174ff)"
    },

    /* 默认角色卡。
       locked: true 的角色是「官方设定」：改名、人设、开场白都由这个文件统一维护，
       用户只能查看、不能修改；每次打开页面都会用它覆盖本地存储里的旧版本。 */
    characters: [
      {
        id: "christina",
        name: "Christina",
        locked: true,
        persona:
          "Christina，二十多岁，喜欢熬夜看星星，是用户的老朋友。说话温柔简短，偶尔关心一句，偶尔小小地调侃一下。",
        gradient: "linear-gradient(150deg, #8ea2ff, #c86bff)",
        greeting: "又见面啦。今晚的星星很好看，想聊点什么？"
      }
    ],

    /* 世界书条目（示例已清空，等你以后自己添加） */
    worldbook: [],

    /* 论坛帖子（示例数据） */
    forumPosts: [
      {
        id: "p1",
        author: "夏夜小满",
        category: "经验分享",
        title: "怎么让 AI 的回复更像真人？",
        excerpt: "分享几个我调了两个月才摸出来的小心得……",
        likes: 128,
        comments: 32
      },
      {
        id: "p2",
        author: "阿赫",
        category: "角色讨论",
        title: "晒一下我的自定义图标",
        excerpt: "把桌面做成星空的样子，晚上看真的很舒服。",
        likes: 96,
        comments: 18
      },
      {
        id: "p3",
        author: "Lenn",
        category: "闲聊",
        title: "第一次写角色卡的踩坑记录",
        excerpt: "设定写太满反而不好聊，这是我最惨的一版。",
        likes: 74,
        comments: 25
      }
    ]
  };

  /* 初始聊天记录（本地示例，不联网） */
  SN.defaults.chats = {
    christina: [
      { role: "them", text: "又见面啦。今晚的星星很好看，想聊点什么？", time: "22:04" },
      { role: "me", text: "刚忙完，有点累。", time: "22:06" },
      { role: "them", text: "那就先别想工作的事，去阳台站一会儿吧。", time: "22:06" }
    ]
  };
})(window.SN);