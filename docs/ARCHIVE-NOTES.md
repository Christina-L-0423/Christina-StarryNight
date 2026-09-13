# Christina · Starry Night — 旧前端参考笔记（重构存档）

> 本文件是**旧版手机端前端的完整技术档案**，供新前端从零重建时参考。
> 旧代码本体已另存于 `archive-legacy/`（见文末「重构执行清单」）。
> 记录时间：2026-09-13 · 对应旧版迭代号至 **v235-p**

---

## 0. 一句话概括

一个**单文件、无构建、可离线**的手机端 AI 陪伴应用前端：`index.html` 一个文件内含全部 CSS + HTML + JS（约 1.09 MB / 约 7800 行），
配合 Service Worker 与 App 插件体系（共读间 / 观影室），数据全部落在浏览器本地（localStorage + IndexedDB + OPFS），
不依赖任何后端服务器 —— 用户自带 API Key 直连各家大模型。

---

## 1. 文件与运行形态

| 文件 | 作用 |
|---|---|
| `index.html` | 全部：样式 + 结构 + 逻辑（单文件应用） |
| `ib-sw.js` | Service Worker：离线缓存、版本控制、CDN 兜底 |
| `manifest.webmanifest` | PWA 清单（添加到主屏、独立窗口、图标） |
| `apps/catalog.json` | App 注册表（fetch 版） |
| `apps/catalog.js` | App 注册表（`<script>` 兜底版，**内容必须与 json 一致**） |
| `apps/ib-app-cinema.js` | 观影室 App（插件形态） |
| `COPYRIGHT.md` | 版权说明 |

**三种运行方式，都必须可用：**
1. `file://` 直接双击打开（因此需要 `catalog.js` 兜底 —— fetch 本地 json 会被 CORS 拦；因此所有资源走相对路径 `./`）。
2. 本地静态服务器（`python -m http.server`）。
3. 部署为 PWA（GitHub Pages / Cloudflare Pages），SW 提供离线。

**硬性技术约束（旧版踩出来的，新版务必保留）**
- 不使用 `eval` / 不注入远程代码（CSP 与 iOS 审核）。
- 不引入构建工具链；改一行代码 = 改 `index.html`。
- 第三方库全部走 CDN + 本地兜底（`ib-sw.js` 拦截失败请求回退）。
- iOS Safari 兼容是最高优先级（见 §10 坑列表）。
- 大文件（图片/视频/音频）**不入 localStorage**，走 IndexedDB / OPFS。

---

## 2. 设计系统（Ice Blue / Infernal 双主题）

### 2.1 视觉基调
- 明亮主题 **Ice Blue**：`#dfe9f6` 底色，冷蓝玻璃，白雾、霜感。
- 暗色主题 **Infernal**：`#141a2e` 底色，暖红/琥珀点缀，同一套结构换色。
- 主题切换用 `html[data-theme]` + `body` class，切换时有**翻页动画**（`html.theme-anim`）。
- 首屏防闪白：`<style id="ib-splash-firstpaint">` 内联最小 CSS + `<script id="ib-splash-precheck">` 提前读 `localStorage` 主题，再上 Splash。

### 2.2 核心 CSS 变量（`:root`）
```
--sat/--sar/--sab/--sal   安全区 env(safe-area-inset-*)
--bg   页面底色            --panel  卡片底（半透明白/黑）
--panel2 次级底            --line   描边
--ink  主文字              --ink2   次文字   --ink3 弱文字
--acc  主强调色（随壁纸取色可整套换）
--glass 玻璃底色           --glass-t 玻璃透明度
--hue  色相（徽章/图标按模块分配不同 hue）
```
- 材质：`.glass`（backdrop-filter blur + saturate + 半透描边 + 内高光）。
- 圆角体系：卡片 24–26px、按钮 14–18px、气泡 18px（尾端 6px）。
- 字体：正文系统无衬线；标题/铭牌用 `'Noto Serif SC', serif`（藏书票气质）。
- 图标：**全部内联 SVG**（24×24 viewBox，stroke 体系），不引图标字体。
- 表单控件**全部自绘**（`.f-group` / `.tog` 开关 / `.chip` / 自绘 select），不用浏览器原生外观。

### 2.3 无障碍 / 性能开关
- `body.ib-reduce`（减少动效）、`body.ib-fx-mid`（特效中档）—— 存 `mobilePrefs.ui.*`。
- 方向锁、触控放大、字号缩放（`pset-avasize/biofs/cusfs`）均即时保存。

---

## 3. 页面骨架与导航

### 3.1 结构层级
```
#ib-splash            开屏动画（液态玻璃 + 水滴）
#top-veil             顶栏上方渐变帘（盖滚动透出）
header#topbar.glass   顶栏：☰ 抽屉钮 / 页面标题 / #bx-search 搜索胶囊 / 主题水滴
#drawer + #drawer-scrim   左侧抽屉导航（藏书票品牌锁定 + 分组 + 色相徽章）
main
  section.page#page-guide     说明书
  section.page#page-profile   Home（active 默认）
  section.page#page-visual    Visual 视觉设置
  section.page#page-beyond    Beyond 社交圈动态
  section.page#page-chat      Chat 会话列表
  section.page#page-memory    Memory 记忆库
  section.page#page-api       API 配置
  section.page#page-diy       DIY（MCP / 外设 / 解析库）
  section.page#page-icode     ICode 文件工作区
  section.page#page-data      Data 数据与用量
  div.page#page-letters       Letters 纸条（信封/邮票/火漆）
#dock                 底部「分区坞」：每页不同的内部分区切换
.sub#sub-set …        全屏子页（三区滑动等）
#conv                 对话层（全屏浮层，z-index 35）
#cv-cal               按日期查看聊天记录
#cv-drawer            对话右侧抽屉（话题频道 / 收藏夹 / AI 配置）
#music-app            全屏听歌界面（Apple Music 式）
#sheet-scrim + sheet  底部弹层 / 对话框 / toast
```

### 3.2 导航模型
- 页面：`.page` 互斥显示，`navTo(page)` 统一切换，`data-page` 属性通用绑定。
- 页内分区：`.psec`（`on` 为当前），由 `#dock` 的 `data-dk="sec-xxx"` 控制；App 入口用 `data-dk="app:calendar"` 形式。
- 抽屉项 `div.dw-item[data-page]`，带 `--dh` 色相变量。

### 3.3 Home 桌面（Desk）
- 两种布局：**分页桌面**（默认，左右滑翻页 + 圆点指示）与**经典上下滚动**。
- 桌面元素 = 图标（`.sb-app`）+ 挂件（`.wgt`）：
  - `sb-hero`（相遇卡 / 天气 `hc-wx`）、`player-w`（音乐播放器全宽长条）、`notes-wgt`（便签）、独立时钟。
  - 图标位可自定义 `ib_m_dskpos`，装饰小组件 `ib_m_deco*`（8 款、上限 12）。
  - 图标款式：液态玻璃（默认）/ 白砖浮雕 `brick`；尺寸可调。
- 桌面 App 入口：社交圈（Circle）、日程表（Calendar）、设置、Space 名片、好友名片墙、DIY 创意工坊、音乐、Blog…

---

## 4. 功能模块清单

| 模块 | 说明 | 关键 id / 前缀 |
|---|---|---|
| **Chat 对话** | 多 AI、话题频道（thread）、Markdown 渲染（`.mdr`）、气泡美化（Bubble Lab）、长按选择/引用/封档线（`.seal-line`）、收藏夹、按日期回看、续答（长回复自动续写）、工具调用可视化 | `#conv`, `#cv-threads`, `#cv-drawer`, `.cvcal-*` |
| **Voice 语音** | 语音消息、语音通话（心跳 `call-hb`、留影、视频通话、歌词区显隐）、ASR/TTS 可分别配来源与模型 | `#call-card-pool`, `call-*` |
| **Memory 记忆库** | 手动记忆 + Auto Memory 名片卡（`.am-card`）+ 对话摘要（旧消息压缩注入上下文）+ 归档区切换 + 分页点 | `#page-memory`, `#am-all` |
| **Beyond 社交圈** | 用户与 AI 的动态流（发布/评论/点赞）、可见范围（所有人/仅自己/仅指定 AI/排除指定 AI）、多图 ≤3、正文上限 1000–2000 字、定位（含预检读数）、AI 主动发布需确认 | `#page-beyond`, `.bxc-*`, `#ibfc-*` |
| **Blog / Letters** | 日志（一篇日志＝一本书）、密码日记本（与公开 Blog 完全隔离）、纸条（信封/邮票/火漆） | `#page-letters`, `.post-card` |
| **Coread 共读间** | 内置 App（`file:"inline"`, `builtin:true`, `hidden:true`），聊天落在「共读 · 书名」频道 | `apps/catalog.*` |
| **Cinema 观影室** | 插件 App，本地视频 + `.srt/.vtt` 字幕，通栏播放器/留影/看画面/弹幕/全屏；**视频与字幕不入库** | `apps/ib-app-cinema.js` |
| **Music** | 黑胶 + 唱臂全屏界面、歌词、一起听配对、迷你播放器、网易云 / QQ 音乐双源、Cookie 授权、AI 控制播放 | `#music-app`, `.chat-music-card` |
| **ICode 文件工作区** | 本地文件树读写、扩展名铭牌（`.ic-list`）、GitHub 仓库导入为「GH·仓库名」项目、推回仓库；OPFS 存储 | `#page-icode`, `.ic-*` |
| **DIY / MCP** | MCP server 增删（`#mcp-list` / `#mcp-presets` 官方预设）、AI付（Wallet Card 独立分区）、Web Bluetooth 外设（仅安卓 Chrome/Edge）、文件解析库 | `#page-diy` |
| **Data** | 用量统计（今日仪表：仪表环/缓存命中率三款）、费用估算、CSV 导出逐条明细、清空记忆库、全量清除、备份导入导出、版本号与 PWA 说明 | `#page-data`, `#dg-mem`, `#btn-wipe` |
| **Guide 说明书** | 目录（`.g-toc`）、新手教程十步、触屏手势总表、各模块文档（`.g-name`/`.g-sub`/`.g-callout`）、FAQ、缓存与费用、PWA 部署教程、Fork 部署、版权信息 | `#page-guide` |
| **小助手 · 水水** | 内置引导角色，说明书第一块 | — |

---

## 5. 数据层（重构最大风险点）

### 5.1 三层存储
1. **localStorage** —— 设置、名片、动态、消息、记忆等结构化数据（键前缀 `ib_m_*`）。
2. **IndexedDB** —— 图片/音频/大对象、工作区缓存。
3. **OPFS** —— ICode 工作区文件系统。

### 5.2 已知主要键（节选，权威清单用 §5.4 脚本导出）
```
主题与视觉  ib_m_theme ib_m_scheme ib_m_glass ib_m_glass_t ib_m_tint
壁纸        ib_m_wpb64 ib_m_wall ib_m_wal ib_m_blur ib_m_lock ib_m_lock_blur
            ib_m_lock_tint ib_m_lock_wall
桌面        ib_m_dsk ib_m_dskpos ib_m_dskpos_on ib_m_desk_layout ib_m_desk_pages
            ib_m_deco ib_m_deco_on ib_m_deco_pos ib_m_deco_count
            ib_m_icon_style ib_m_icon_size ib_m_wgt_style ib_m_wgt_size
            ib_m_clock_on ib_m_clock_style ib_m_clock_size ib_m_hero_on
动效        mobilePrefs.ui.fx / .reduce / .dirlock / .zoom
AI 名片     ib_m_homeai ib_m_homeai_en ib_m_homeai_av ib_m_homeai_cover
            ib_m_homeai_bio ib_m_homeai_cp ib_m_homeai_pos ib_m_homeai_show
            ib_m_homeai_card ib_m_homeai_hue
便签/位置   ib_m_dnotes ib_m_dnotes_on ib_m_dnotes_t
全局指令    ib_on ib_autopost ib_gap_n ib_gap_u ib_autocmt ib_img ib_ai ib_vis
气泡        Bubble Lab 系列
发布器      ib_m_pfprompt ib_m_pfdraft ib_m_pfvis ib_m_pfloc ib_m_pfshow
```

### 5.3 备份格式
- 单文件 JSON 导出，含 `version` / `exportedAt` / `data:{...}`。
- 导入策略：**按命名空间合并**（同名键覆盖、未知键保留），**绝不整库替换** —— 否则用户旧数据会被清空。
- 备份必须「原样往返」：手机端偏好电脑端不读也不写，但备份里要完整带走。

### 5.4 权威导出脚本（重构前必跑一次）
```bash
node -e "const s=require('fs').readFileSync('index.html','utf8');
const k=new Set([...s.matchAll(/['\"\`](ib_m_[a-z0-9_]+|ib_[a-z0-9_]+)['\"\`]/gi)].map(m=>m[1]));
console.log([...k].sort().join('\n'))" > docs/localstorage-keys.txt
```
同理导出 `getElementById('...')` 全表，作为新版必须保名的 **ID 契约**。

---

## 6. AI / 外部服务接入

| 能力 | 说明 |
|---|---|
| Chat 补全 | OpenAI 兼容 `POST {base}/chat/completions`；支持中转站/聚合站（base 可能已含 `/v1`，拼接需去重 —— 见 v141-p） |
| 提示缓存 | 与电脑端 GUIDE 同口径，Data 页有「缓存命中率」仪表 |
| 工具调用 | 连续调用轮数、每回复固定上限（防刷屏）、取数类（外部工具/MCP）与写类分开限额 |
| Presence | 定时主动推送：开关、固定间隔（`ib-gap-n` + 单位 分钟/小时/天）、勿扰时段、后台模式、查岗轻量版 |
| 生图 | 来源下拉 + 模型 + 尺寸；写入 Blog 也走续答 |
| 语音 | ASR 与 TTS 分别配 Endpoint/模型；「TA 的声音」可选 |
| 音乐 | 网易云 / QQ 音乐（Cookie 授权）；AI 控制播放需 Presence 放行 |
| GitHub | ICode 导入仓库（PAT，勾选 `repo`）；或 MCP 进阶方案 |
| 地图/天气 | 高德（`restapi.amap.com` 已在 SW 兜底域名表内）、腾讯位置服务 |
| 支付 | AI付（支付宝官方工具名，v98-m 拍板） |
| MCP | 浏览器侧 stdmcp 类接入；`@modelcontextprotocol/sdk` 浏览器不可直接用，需 `vite-plus` 之类打包 |

**放行模型（贯穿全局）**：任何 AI 主动行为（发消息、发动态、评论、查数据、播放控制）都要 ①全局开关 ②该 AI 独立配置（`#ib-percfg`：需我确认 / 自动放行）③限额。三层缺一不可。

---

## 7. App 插件体系（v201-p / v235-a）

```js
window.IB_APP_CATALOG = { sdk: 2, apps: [ { id, name, version, file, desc, icon, builtin, hidden } ] }
```
- 底座先 `fetch('apps/catalog.json')`，失败（`file://`）退回读 `apps/catalog.js`。
- `file:"inline"` = 逻辑内联在 `index.html`；否则按需加载 `apps/<file>`。
- 图标字段直接存 SVG path 字符串。
- 观影室是完整参考实现：注册 → 挂载 → 与 Chat 频道互通 → 不落库存媒体。

---

## 8. Service Worker（`ib-sw.js`）要点

- 缓存名带版本号（当前 `ib-v235-p`），`install` 预缓存：`./`、`./index.html`、`./manifest.webmanifest`、`./apps/*`、CDN 关键库。
- `activate` 清旧桶。
- `fetch`：`chrome-extension://` 直接放行；GET 走 **stale-while-revalidate**；
  失败兜底域名表：`fonts.googleapis|fonts.gstatic|cdn.jsdelivr|unpkg|cdnjs|esm.sh|restapi.amap.com|lbs.qq.com|sqtmail|modelcontextprotocol` → 回退本地缓存副本。
- 页面里另有 `<script id="ib-fav">` 拦截 `cloudflareinsights.com|/beacon.min.js`，避免无域名时控制台报错。

---

## 9. 版本注释体系（读旧代码的钥匙）

代码里大量 `<!-- vNNN-m -->` / `vNNN-p` 标记 = 迭代号 + 轮次（m=mobile 主线，p=patch）。
**这些注释是需求史**：每条几乎都对应一次用户拍板。重构时**先扫一遍注释再动手**，否则会丢掉隐性需求。
典型密度：`index.html` 里 Guide 段（2100–2600 行）几乎每行都有版本注释，记录了每个功能的准确文案口径。

---

## 10. 已知坑与修复记录（务必继承）

**iOS / Safari**
1. `backdrop-filter` 在滚动容器内会掉帧 → 大面积玻璃要限层数，低档特效直接关。
2. `<input type=file>` 的 `accept` 在 iOS 对 `.vtt` 会**灰掉** → 需 `text/vtt` MIME（观影室踩过）。
3. 音频自动播放需首次用户手势内解锁；`AudioContext` 同理。
4. `env(safe-area-inset-*)` 必须配合 `viewport-fit=cover`，否则刘海屏顶栏错位。
5. 长按气泡与系统选择手势冲突 → 需 `user-select:none` + 定时器区分长按/滚动。
6. 键盘弹起时 `100vh` 不缩 → 底部输入区用 `dvh` / visualViewport。
7. Web Bluetooth 在 iOS 完全不支持（文案里已明示"仅安卓 Chrome/Edge"）。

**架构**
8. 单文件 1.09 MB：首屏解析慢，Splash 必须提前内联关键样式（见 §2.1）。
9. `catalog.json` 与 `catalog.js` **双份必须同步**，改一处忘另一处是历史高频 bug。
10. 大量功能靠 `getElementById` 直连，**ID 改名 = 静默失效**；重构时 ID 视为公共 API。
11. 备份整库替换会清空用户数据 → 一律命名空间合并。
12. 图标/徽章色相体系（`--dh` / `--hue`）在抽屉、ICode 铭牌、桌面图标三处同源，改一处要三处跟。

**文案口径（用户明确拍板过的，不可自行改写）**
13. 语言规范 = **教程 + 说明书**语气，第二人称"你"，不用"您"，不卖萌。
14. 工具名用官方名：「AI付」（支付宝官方）。
15. 名称映射：Desk 图标 `Friends` → 显示「社交圈」，`Circle` 亦指社交圈（历史遗留，新版建议统一）。
16. 版权/署名区含开发者署名，暗色主题下有独立签名段。

---

## 11. 新前端建议架构（重构执行清单）

**原则：ID 与存储键 = 公共契约，只增不改。**

```
starrynight/
  index.html              壳 + 关键首屏内联样式
  manifest.webmanifest
  ib-sw.js
  styles/
    tokens.css            变量 / 双主题 / 安全区
    base.css              reset / 排版 / 滚动
    components.css        玻璃卡 / 按钮 / 开关 / 输入 / 气泡 / 徽章
    pages/*.css           每个页面一份
  js/
    core/state.js         localStorage 读写层（键名集中定义 + 迁移器）
    core/db.js            IndexedDB / OPFS
    core/router.js        页面 + 分区导航
    core/ui.js            toast / sheet / dialog / 抽屉
    core/markdown.js
    core/ai.js            chat / tools / 续答 / 摘要 / 缓存
    core/provider.js      中转站 base 归一化
    features/chat.js  memory.js  beyond.js  blog.js  music.js
    features/voice.js  icode.js  mcp.js  data.js  guide.js
    apps/sdk.js           App 注册表加载（json + js 兜底）
    main.js
  apps/
    catalog.json / catalog.js / ib-app-cinema.js
  docs/
    ARCHIVE-NOTES.md      ← 本文件
    localstorage-keys.txt ← §5.4 脚本产物
    element-ids.txt       ← 同上，ID 契约表
```

**分阶段落地（每阶段都可独立验收）**
1. [ ] 跑 §5.4 脚本，产出键表 + ID 表，作为验收基准。
2. [ ] 骨架：tokens + 顶栏 + 抽屉 + 页面路由 + 底坞 + Splash + SW 注册。
3. [ ] 状态层：`state.js` 兼容读旧键（`ib_m_*` 原样），**保证旧备份能直接导入**。
4. [ ] Chat + AI 层（含工具调用、续答、摘要、放行三层模型）。
5. [ ] Memory / Beyond / Blog / Letters。
6. [ ] Visual / Desk（桌面与挂件）。
7. [ ] API / DIY / MCP / Data（备份导出导入 + 用量统计）。
8. [ ] Music / Voice / ICode。
9. [ ] App SDK + 观影室 + 共读间。
10. [ ] Guide 说明书重写（文案口径照 §10.13–16）。
11. [ ] 三形态回归：`file://` / 本地 server / PWA 离线。

**验收清单**
- 旧版导出的 JSON 备份，在新版导入后设置与数据不丢。
- `file://` 双击可完整使用（除 SW 与需要 https 的能力）。
- iOS Safari 真机过一遍 §10 全部 13 条。
- 首屏无主题闪白；低端机关特效仍可用。

---

## 12. 归档位置

重构前请先执行（保留旧版原样，便于随时回查）：

```bash
mkdir -p archive-legacy
git mv index.html ib-sw.js manifest.webmanifest apps archive-legacy/ 2>/dev/null \
  || move index.html ib-sw.js manifest.webmanifest apps archive-legacy\
```

`COPYRIGHT.md` 留在根目录不动。

---

## 13. 迁移执行记录（2026-09-13 · 实际完成）

**已执行**：保持了 git 历史地把旧单文件移入 `archive-legacy/`，并用 `tools/split-legacy.js` 机械拆分为多文件（零构建、行为等价）。

### 13.1 当前根目录结构
```
index.html                HTML 骨架（505KB，已无内联 style/script）
styles/app.css            ← 旧 8 个 <style> 块按原顺序合并
js/legacy-00.js … 22.js   ← 旧 23 个内联 <script> 块，
                            原位替换为 <script src>，执行顺序完全保留
manifest.webmanifest      （原样）
ib-sw.js                  （原样：同源 GET 动态缓存，新资源首访后自动入离线缓存）
apps/catalog.json|js      （原样，双份）
apps/ib-app-cinema.js     （原样）
COPYRIGHT.md              （未动，留在根目录）
archive-legacy/           旧版完整原样（git mv 保留历史）
docs/ARCHIVE-NOTES.md     本文件
tools/split-legacy.js     可复现的拆分脚本
tools/verify-split.js     无损验证脚本
```

### 13.2 无损验证（`node tools/verify-split.js`）
- 两侧按同一规则做块替换占位后，**408,966 字符逐一完全一致** ✓
- 块数一致：8 style + 23 script ✓
- 新 index.html 0 个残留内联块 ✓
- 23 个 JS 全过 `node --check` 语法检查 ✓
- 本地静态服务器实测 9 个资源全部 200 ✓

### 13.3 运行方式（与旧版完全一致）
- `file://` 双击 `index.html`：可完整使用（新 index 只用相对路径 `./`；目录内文件加载无 CORS 问题）
- 本地 server：`python -m http.server 8765` 后访问 `http://localhost:8765/`
- PWA：HTTPS 部署后注册 `ib-sw.js`，离线可用

### 13.4 接下来做什么（UI 重设计时才动）
1. 想改哪个模块，就去 `js/legacy-NN.js` 定位（先跑
   `node -e "const s=require('fs').readFileSync('index.html','utf8');s.match(/legacy-\d{2}\.js/g).forEach((f,i)=>console.log(i,f))"` 之类对照 HTML 位置）。
2. **样式层已集中**：`styles/app.css` 一整份，可按 §2 的设计 tokens 重写，UI 改动不会触碰 `js/*`。
3. **存储键位是契约**：`localStorage` 键名一个不改，旧备份直接可用。
4. 若要彻底重构逻辑（拆 feature 模块），对照 §11 建议结构逐步替换 `legacy-*.js`，每替换一块跑一次 `tools/verify-split.js` 思路下的等价性抽查（或用浏览器人工回归）。
