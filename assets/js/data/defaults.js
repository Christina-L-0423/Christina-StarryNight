/* ============================================================
   data/defaults.js —— 【数据层】六张表的出厂默认值
   这是「小手机第一次打开时」应该长什么样。
   之后所有修改都存进浏览器本地存储，本文件不再参与
   （只有「恢复出厂设置」和「locked 官方角色」会回到这里）。

   六张表（数据层「存什么」）：
     characters  角色设定
     worldbook   世界书
     presets     系统提示词 / 预设
     regexes     正则
     chats       上下文记忆（聊天记录）
     memories    记忆库
   另外还有 forumPosts（论坛示例帖子，属于同级的展示数据）
   ============================================================ */

window.SN = window.SN || {};

(function (SN) {
  "use strict";

  SN.defaults = SN.defaults || {};

  /* ------------------------------------------------------------
     1) 角色设定
        locked: true 的角色是「官方设定」：名字 / 人设 / 开场白
        由代码统一维护，用户只能看不能改，每次打开都强制同步。
     ------------------------------------------------------------ */
  SN.defaults.characters = [
    {
      id: "christina",
      name: "Christina",
      locked: true,
      persona:
        "Christina，二十多岁，喜欢熬夜看星星，是用户的老朋友。说话温柔简短，偶尔关心一句，偶尔小小地调侃一下。",
      gradient: "linear-gradient(150deg, #8ea2ff, #c86bff)",
      greeting: "又见面啦。今晚的星星很好看，想聊点什么？"
    }
  ];

  /* ------------------------------------------------------------
     2) 世界书（给 AI 的设定资料库）
        keywords：命中关键词（逗号分隔或数组）；聊天最近 N 条里出现任意一个 → 这条会被塞进提示词
        constant：常驻条目，不管有没有命中都会带上
        enabled ：关掉后彻底不参与拼装
     ------------------------------------------------------------ */
  SN.defaults.worldbook = [];

  /* ------------------------------------------------------------
     3) 系统提示词 / 预设
        systemPrompt：这段会作为提示词的【系统提示词 / 预设】段
        可用占位符：{{char}} 角色名、{{user}} 用户名、{{persona}} 角色人设
        用 ||| 分隔气泡（想让回复分成多个气泡，就自己在预设里写清楚）
     ------------------------------------------------------------ */
  SN.defaults.presets = [
    {
      id: "preset_default",
      name: "默认陪伴预设",
      locked: false,
      systemPrompt:
        "你是「{{char}}」，在一个叫 StarryNight 的小手机里陪 {{user}} 聊天。\n" +
        "说话温柔、自然、口语化，像在微信上和熟人聊天。\n" +
        "回复要短：每次 1~3 句，不要长篇大论，不要写小作文。\n" +
        "想让回复分成几个气泡时，用 ||| 分隔（例如：嗯，我在呢。|||今天还好吗？）。\n" +
        "始终保持角色，不要说自己是一个 AI 或语言模型。"
    }
  ];

  /* 当前启用的预设 id（空 = 用列表里第一个） */
  SN.defaults.activePresetId = "preset_default";

  /* ------------------------------------------------------------
     4) 正则（拿到 AI 回复后先过一遍这些规则）
        pattern / flags：JavaScript 正则
        replace：替换成什么（$1 $2 可以用捕获组）
        scope  ：all = 整段回复；bubble = 每个气泡单独跑
     ------------------------------------------------------------ */
  SN.defaults.regexes = [
    {
      id: "regex_strip_quotes",
      name: "去掉整段首尾引号",
      pattern: "^[\"“「『]+([\\s\\S]*?)[\"”」』]+$",
      flags: "",
      replace: "$1",
      scope: "all",
      enabled: true,
      note: "模型有时会把整段回复用引号包起来，这里统一去掉"
    },
    {
      id: "regex_trail_space",
      name: "去掉每行行尾空格",
      pattern: "[ \\t]+$",
      flags: "gm",
      replace: "",
      scope: "all",
      enabled: true
    },
    {
      id: "regex_blank_lines",
      name: "压缩连续空行",
      pattern: "\\n{3,}",
      flags: "g",
      replace: "\n\n",
      scope: "all",
      enabled: true
    },
    {
      id: "regex_stage_only",
      name: "删掉整行只有括号动作的描写",
      pattern: "^[（(][^\\n）)]*[）)]\\s*$\\n?",
      flags: "gm",
      replace: "",
      scope: "all",
      enabled: false,
      note: "默认关闭：想只留台词就打开它"
    }
  ];

  /* ------------------------------------------------------------
     5) 上下文记忆（聊天记录）
        每条消息：{ role: "me" | "them", text, time, quote? }
     ------------------------------------------------------------ */
  SN.defaults.chats = {
    christina: [
      { role: "them", text: "又见面啦。今晚的星星很好看，想聊点什么？", time: "22:04" },
      { role: "me", text: "刚忙完，有点累。", time: "22:06" },
      { role: "them", text: "那就先别想工作的事，去阳台站一会儿吧。|||今晚的风应该挺舒服的。", time: "22:06" }
    ]
  };

  /* ------------------------------------------------------------
     6) 记忆库（AI 应该长期记住的事）
        pinned：常驻记忆，每次都带上（例如「用户的名字」）
        keywords：命中关键词，聊天里提到就带上
     ------------------------------------------------------------ */
  SN.defaults.memoryBank = [];

  /* ------------------------------------------------------------
     7) 论坛示例帖子（展示数据）
     ------------------------------------------------------------ */
  SN.defaults.forumPosts = [
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
  ];

  /* ---------- 设置出厂值（原 config.js 迁入数据层） ---------- */
  SN.defaults.settings = {
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
    /* 状态栏电量（目前是装饰值） */
    battery: 76
  };

  SN.defaults.user = {
    name: "夜行旅客",
    signature: "在星夜里慢慢写字的人",
    gradient: "linear-gradient(150deg, #7e8cff, #d174ff)"
  };
})(window.SN);
