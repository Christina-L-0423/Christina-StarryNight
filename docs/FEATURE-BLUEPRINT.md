# StarryNight · 旧前端功能档案（重做实现地图）

> 供从零重做时对照：**每个功能大致怎么做的**——入口、数据、核心流程、依赖、旧代码位置。
> 旧源码完整保留在 `archive-legacy/`（含 v235 原始 index.html 与其机械拆分档 9b4e371 + 0da4709）。
> 本档案不追求逐行复刻，而是描述"做法"，使新实现不必重读 3MB 旧文件。

---

## 0. 白屏事故记录（删掉旧版的原因之一）

- 拆分后 `file://` 直接双击白屏（http server 下用户未确认）。根因未逐行定位。
- 保护性结论，重做必须做到：
  1. 首屏最小渲染不依赖 JS：HTML 里先有静态骨架，JS 只填数据（旧版大量界面由 JS 全部生成，JS 一错就整页空白）。
  2. 启动序列分段 try/catch：主题 + 顶栏 + 抽屉各自独立异常域，一个失败不拖垮全页。
  3. `file://` 与 http 都作为日常验收（旧版 catalog.json fetch 失败回退 catalog.js 的模式要保留）。
  4. 不要用 `<noscript>` 关键结构（旧版 noscript 里藏了早期 CSS，拆分时被移动过位置）。

---

## 1. 全局架构（旧版"大致是怎么做的"）

- 单页应用：一个 index.html，页面互斥显示（`.page.active`），全屏层浮在上面（对话 #conv、子页 .sub、弹层 #sheet-scrim、开屏 #ib-splash）。
- 导航三级：`navTo(page)` 切页面；页内 `#dock` 分区坞切 `.psec`；抽屉 `#drawer` 里 `div.dw-item[data-page]` 直达各页。
- 数据三层：
  - **localStorage**：设置与用户数据，键前缀 `ib_`（不全是 ib_m_）。特殊：`mobilePrefs`（手机偏好）、`apiSettings`（电脑端共用的设置表）、`ib_user`、`ib_ncm`/`ib_qqm`（音乐 Cookie）、`ib_bl_*`（Bubble Lab 方案）、`ib_bublab`、`ib_helper_hist`、`IB_LibCache`。
  - **IndexedDB**：聊天消息、图片/音频大对象。电脑端同名 DB，手机端 `openDB` 后经 `dbGet/dbPut/dbDelete/dbEach/dbPageByFriend/dbGetRange` 等封装读写；聊天按「好友」分页加载。
  - **OPFS**：ICode 工作区真实文件系统。
- 启动顺序（旧版）：splash-precheck（读主题防闪白）→ firstpaint 最小 CSS → Splash 动画 → 主逻辑（读目录 → 装载已安装 App → 桌面图标注册 → 各分区渲染登记 → 首页）。
- 版本注释体系：每段逻辑前有 `/* ═══ 模块名 ═══ */` 或 `-- vNNN-m 迭代记录 --`，是需求历史——重做时某个神秘规则先查注释。

---

## 2. 主题与视觉（决定"皮肤"怎么做）

- 双主题：Ice Blue（亮，`#dfe9f6` 系）与 Infernal（暗，`#141a2e` 系）；键 `ib_m_theme`，body 加类切换；切换动画 `html.theme-anim`。
- 全站色调：`_vzToneWall/_vzToneAcc/_vzApply`（legacy-06 §02/§03）：从壁纸取色或手动选择 hue，生成 CSS 变量整套换色；`_uvThemesDraw` 画色板。
- 玻璃材质：`.glass` = backdrop-filter blur+saturate+半透明底+描边；`ib_reduce`（减动效）、`mobilePrefs.ui.fx`（特效三档：高/中/低）控制复杂度。
- 壁纸：`loadBgs/saveBgs/_pickBg/_uiApplyBg`；背景图 base64 存 localStorage（`ib_bgpf_*`/`ib_blpf`），四槽位 `_ddImgs`；锁屏 `ib_lockOn` + 模糊 `_uiApply`。
- Profile 名片（Home 头像卡）：封面压头像、`pf-card`；AI 名片卡 `_meetWidgetDraw/_heroMeetDraw`（相遇卡挂件）。
- 里程碑：皮肤层 = tokens.css（变量+双主题）+ 组件类；重做时先定 tokens 再写页面。

## 3. 桌面 / Desk（Home 的地面）

- 两种布局：分页桌面（默认，左右滑翻页 `_dkOsPager/_dkOsGoto`，底部圆点 `_dkDots`）与经典滚动。
- 桌面元素：图标 `.sb-app`（attach App 的 `register`），位置存 `ib_m_dskpos`（每图标一格），装饰小组件 `_deskDecoDraw`（8 款、上限 12，`ib_m_deco*`）。
- 图标款式：液态玻璃 / 白砖浮雕（brick）；尺寸可调。挂件：相遇卡、音乐播放器长条（player-w）、便签（notes-wgt）、独立时钟。
- 天气挂件：`.hc-wx`，高德 API（restapi.amap.com）逆地理+天气，`_wxRefresh/_wxCityName`。
- 做法要点：桌面是「容器+注册表」——App 声明图标挂到桌面，不写死；拖位/换页引擎独立。

## 4. Chat 对话（核心脑）

- 好友列表：`chatPref` 存 AI 列表；消息按好友分页存 IndexedDB，`dbPageByFriend` 拉页。
- 对话层 #conv：头部 #cv-head，消息区 #cv-msgs，输入条 / 附件条 #cv-attach-strip / 引用条 #cv-quote-bar / 选择条 #cv-selbar；话题频道 #cv-threads（后移入右侧抽屉 #cv-drawer）。
- **请求管道**（重做必须忠实）：
  1. `sendMsg`（用户发送：文本/语音/附图/选项卡/引用）→ 消息入库（附图走 `compressImg` 压缩入 m.images）→
  2. `genReply`（组一条补全请求：系统提示 + 记忆注入 + Auto Memory 注入块 + 摘要 + 聊天历史 + 工具定义）→ fetch 中转/base → SSE 流式（`drawConv` 逐字渲染）→
  3. `saveAi`（收尾入库：Token 统计、缓存、历史修剪、触发工具/标签/续答判断）。
- 工具调用：`execToolOp/procToolOps/_mToolLoop/feedToolResults`——循环执行工具（上限轮数），工具结果回注入；工具注册 `ibToolFetch`；MCP 走 `apiSettings` 工具表。
- 续答：回复超长或请求 continuation 时自动续写（`_chatMaxTokensM` 上限）。
- 摘要（对话摘要）：`getChatSummaryM/saveChatSummaryM/generateSummaryM/maybeSummarizeM`——旧消息压缩成摘要注入上下文。
- Markdown 渲染：自研渲染器（sanitize，支持代码块/表格/列表）。
- 语音消息：`sendVoiceMsg` + `_vtChatAudioM`，WAV 封装入库，气泡内播放。
- 群聊：`_sameSender/genReplyGroup` 多 AI 群聊规则；`@` 提及选择器。
- 放行模型（AI 主动行为）：全局开关 ib_on + 各 AI 独立配置 `#ib-percfg` + 限额三层。

## 5. Memory 记忆库 + Auto Memory

- 手动记忆：记忆库页 #page-memory，`drawMemList`；标签（记忆/遗忘/检索）在回复里执行。
- Auto Memory：`drawAmAll` 名片卡列表——给每位 AI 维护「自动名片」（偏好/陈述抽取）；标签注入对话。
- 与电脑端共用一篇记忆系统；分页点 + 归档区切换。
- 做法：记忆 = 可检索的文本块库；每次请求管道按贴合度注入若干块。

## 6. Beyond 社交圈 + 日志 Blog + 纸条 Letters

- 动态流：`page-beyond`：用户与 AI 发布动态、评论、点赞；可见范围四档；多图 ≤3、正文上限 1000/2000 字；定位（高德预检）。
- 发布器 `#ibfc-*` 组件（文本/图片/定位/可见度/发布）；身份切换 `#ib-ai`。
- AI 自动发布：`autopost` 每回复上限 1 条；开站/对话收尾/心跳到点触发，一次最多一位 AI。
- 回复标签执行：AI 回复中的指令标签（Beyond/播放器/天气）→ 副作用。
- **Blog 日志**：`page-blog`；`_mioRunExport/_mioRunImport` 导入导出；日志=一本书，卡片左日期方块+衬线标题+摘要；密码日记本独立分类。
- **Letters 纸条**：`page-letters` 信封/邮票/火漆；纸条区直接读频道聊天记录（legacy-12、共读）。

---

## 7. 音乐 Music（网易云 + QQ 音乐双源）

- 播放内核：`legacy-08.js` 迷你（`Music Together` 移动适配）：`parseLyrics`（LRC）、`readMeta`（ID3）、音频文件解析。
- 网易云 `legacy-13.js`：`ib_ncm` 键；weapi 加密（AES-CBC 两轮 + RSA 无填充，与网页端同算法）；走自己部署的跨域中转；扫码登录 → Cookie 存 `ib_ncm`。
- QQ 音乐 `legacy-14.js`：`ib_qqm` 键；模式切换与网易云共用 `ib_ncm.mode`；`hash33` 签名。
- 全屏界面 `#music-app`（黑胶+唱臂）、迷你播放器 `legacy-15.js`、一起听配对 `.chat-music-card`。
- 做法要点：两源通过「传输层 + 数据整形 + 播放内核挂钩」分层，模式开关切换源，本地文件路径不变。
- AI 控制播放：走 Presence 放行 + 回复标签。

## 8. 语音通话 Call（legacy-11.js）

- `ib_user` 键；设置存 `apiSettings/callSettings`（随备份往返）。
- 纯函数区可脱离 DOM：重采样 / WAV 封装 / 朗读净化（`_ibSayStrip`）/ 分句 / VAD 推进。
- 发送管线三处回调（genReply/saveAi 各一行挂钩）；试听独立于通话。
- 顶栏/页签坞/详情页：与全站同规格玻璃胶囊组件。
- 心跳 `ib_hb_rmday/ib_hb_lastconv`（Presence 心跳）；视频通话入口在聊天右上角菜单。

## 9. API 页 / DIY / MCP / ICode / Data

- **API 页**：`apiSettings` 表（电脑端共用；`id=app_<appId>_<key>` 是 App SDK 的设置记录方式）；`mobilePrefs` 里 AI 列表；API 类型：OpenAI 兼容 base URL（中转站 base 可能已含 /v1，**拼接去重**）、语音 ASR/TTS、图像生成；`cfgList/cfgOf/cfgLabel` 自动遍历设置（密钥/图片/长串不进表）。
- **工具节流**：每回复上限（防刷屏）、连续调用轮数上限；写类工具额外确认。
- **Presence**（定时推送）：`pres-on` + 固定间隔 + 勿扰时段 + 后台模式；`_ibPresenceWake` 心跳唤醒。
- **MCP**：`renderDiyMcp/drawMcpPresets/openMcpEdit`；官方预设 `#mcp-presets`；浏览器侧 stdmcp（`@modelcontextprotocol/sdk` 浏览器不可直接用，需打包）；工具注册进 AI 工具集。
- **ICode**：`#page-icode`，手机端真实读写**电脑端同一 IndexedDB**；`ib_ghTok/ib_ghOn`（GitHub PAT，勾 repo 权限）导入「GH·仓库名」项目、推回；扩展名铭牌色相体系。
- **Data 页**：Token 统计 `ibTokenStats`、用量仪表、CSV 明细导出（W3 → SheetJS 真 XLSX）、记忆库清空、**备份导入导出**、W2B（html2canvas+jsPDF 导出 PDF）、版本说明。
- **备份格式**（重做必须兼容）：JSON，含 version / exportedAt / data；导入按命名空间合并（同名覆盖、未知保留），不整库替换。

## 10. Visual 页 / 设置（三区滑动）

- `sub-set`：三区（Calendar / Auto Memory / Profile 卡）滑动切换。
- 滑入面板 `sub-aset` / 日志编辑器 `sub-blog-editor`。
- `mobilePrefs` 是手机偏好的**唯一容器**：方向锁、触控放大、字号、fx 三档、reduce——全部即点即存。

## 11. App 插件体系（SDK）

- `apps/catalog.json`（fetch）+ `apps/catalog.js`（`<script>` 兜底，file:// 用）双份必须同步。
- SDK 接口（legacy-06 §12）：DB 封装、设置读写（apiSettings 命名空间 `app_<id>_<key>`）、抽屉面板 `ib-ov2`、发送/转发、UI 组件、音乐内核挂钩等。
- 生命周期：`register`（图标落桌面）→ `open/close`；商店（伪）= 已安装/可安装，开关即安装/卸载，**卸载不删数据**。
- 现有 App：
  - **coread 共读间**（legacy-12.js）：inline；频道=「共读·书名」话题；纸条区直读频道聊天；设置存 `cfg` 随备份；进度 `savePos/saveS`。
  - **cinema 观影室**（apps/ib-app-cinema.js）：视频+字幕同屏，通栏播放器/留影/看画面/弹幕/全屏；媒体不入库（IndexedDB 只存指针）。
- 做 App 的模板在 archive-legacy/apps/*（catalog.js 有 icon 的 SVG path 内嵌格式）。

## 12. 启动与全局工具

- legacy-00：splash-precheck（读主题防闪白）；01：垃圾清理；02：锁屏状态；03：Splash 动画早期脚本；04：Splash 过渡完成；05：空。
- legacy-22：`mp9/cur/apply/boot` —— AI 名片初始化/启动收尾。
- `#ib-native-bridge`：与电脑端的互操作绑定（iOS 剪贴板/分享等）。

## 13. 第三方与域名（重做时保持同款接入）

- AI 直连：`base_url /v1/chat/completions`（OpenAI 兼容）；支持中转站聚合站。
- 网易云：自己部署的跨域中转 + weapi 加密。QQ 音乐：签名 hash33。
- 高德（restapi.amap.com）：天气、逆地理、定位预检。腾讯（lbs.qq.com）：位置服务。
- 字体：Noto Serif SC（标题）/ Noto Sans SC；CDN + 本地兜底。
- PWA：manifest（独立窗口 portrait）+ ib-sw.js（同源 GET 动态缓存 + CDN 失败兜底域名表）。
- html2canvas、jsPDF、SheetJS 走 CDN（pre-connect fonts）。

## 14. 重做验收锚点（做完全部功能后的核对清单）

- Design tokens 双主题完整，`ib_reduce`/fx 三档生效。
- 首页桌面：图标注册、分页/经典双布局、位置记忆、装饰件。
- Chat：文本/语音/图/选项卡、工具循环、续答、摘要、群聊、引用/封档。
- 记忆/Auto Memory 注入与检索、标签执行。
- Beyond 发布+AI 自动发布+可见范围。
- Music 双源切换、LRC、迷你+全屏、一起听。
- Call 全链路（纯函数可单测）。
- API/DIY/MCP/ICode/Data + 备份**导入旧版导出的 JSON 不丢数据**。
- catalog.json 与 catalog.js 同步；cinema/coread 可安装可卸载不删数据。
- `file://` 双击可用（除 SW）；`python -m http.server` 可用；PWA 离线可用。