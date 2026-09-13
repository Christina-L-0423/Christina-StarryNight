# StarryNight · 星夜

私人 AI 聊天 App · 第一阶段：项目骨架 + 静态聊天界面（不接模型 / 不接数据库 / 不做长期记忆）。

- **手机 & 电脑都适配**：窄屏（手机）加宽气泡、放大按钮；宽屏（电脑 ≥900px）聊天卡片居中、限宽 620px、玻璃悬浮感。
- **两种运行方式**：本地开发（前后端）与 GitHub 静态部署（手机随时打开）。

## 环境要求

- **Node.js ≥ 18**（开发用 v24.19.0）
- 本机是 Windows + PowerShell：如果 `npm` 报「禁止运行脚本」，是系统安全策略挡住了 `npm.ps1`——**不用改系统设置**，把所有 npm 命令换成 `npm.cmd` 即可（如 `npm.cmd install`）。

## 目录结构

```
StarryNight/
├─ frontend/   React (Vite) 前端 —— 聊天界面（可独立静态部署）
├─ backend/    Express 后端 —— 占位接口（本地开发用，部署版不使用）
├─ docs/       前端打包产物 —— GitHub Pages 从这里读取（自动生成，勿手改）
└─ README.md
```

## 方式一 · 本地开发（两个终端）

**终端 1 · 后端（占位接口，端口 3001）**
```bash
cd backend
npm.cmd install        # 第一次装依赖
npm.cmd start
# 看到 StaryNight backend on http://127.0.0.1:3001 即成功
```

**终端 2 · 前端（聊天界面，端口 5173）**
```bash
cd frontend
npm.cmd install
npm.cmd run dev
# 看到 http://127.0.0.1:5173/ 即成功
```

打开 **http://127.0.0.1:5173**。前端自动把 `/api/*` 转发给后端。

> 前端内置了同款占位回复：即使后端没启动，聊天界面也能应答（会稍慢一点并走本地文案）。

## 方式二 · 部署到 GitHub Pages（手机随时打开）

本项目用 **Deploy from a branch** 方式部署：打包结果提交在仓库的 `docs/` 目录，GitHub 直接托管它，**不需要 Actions、不需要云端构建**。

页面 **不依赖后端也能用**（占位回复内置在前端），所以纯静态托管就能聊天。

### 第一次开启（手机上用浏览器也能做完）

1. **本地打包**（在你电脑上，仓库根目录）：
   ```bash
   cd frontend
   npm.cmd run build      # 产物自动输出到仓库根的 docs/
   ```
2. **提交并推送 `docs/`**：
   ```bash
   cd ..
   git add -A
   git commit -m "Build static site for GitHub Pages"
   git push origin main
   ```
3. **网页上开启 Pages**：打开仓库 → **Settings** → 左侧 **Pages** →
   - **Source** 选 **Deploy from a branch**
   - **Branch** 选 `main`，文件夹选 **`/docs`** → **Save**
4. 等约半分钟，页面顶部会出现你的正式地址：
   **`https://Christina-L-0423.github.io/Christina-StarryNight/`**
5. 手机浏览器打开它，或用「添加到主屏幕」当 App 全屏用。

### 以后改了界面怎么更新

改完代码后重复上面第 1～2 步（重新 build + push），Pages 会自动发布新版本。**`docs/` 必须跟着一起提交**，否则线上还是旧的。

> 说明：GitHub Pages 只托管静态文件，所以部署版没有 Express 后端——聊天回复走**前端内置的占位文案**（阶段一本来就没接模型，体验一致）。等接入真实模型时，部署方案要相应升级（把推理交给模型服务或换成支持后端的托管平台）。

## 验收（这一阶段）

1. 打开 http://127.0.0.1:5173（或部署后的 Pages 地址）——深蓝夜空 + 星星闪烁 + 金色月亮。
2. 顶部显示 AI 名字「星回」。
3. **电脑窗口**：聊天卡片居中、上下留白、玻璃质感；**手机窄窗口**：卡片贴近边缘、按钮变大好点。
4. 输入 → 发送（按钮或 Enter）→ 约半秒后「星回」返回一句温柔的占位回应。
5. 刷新页面消息清空（阶段一约定）。

接口自检：`http://127.0.0.1:3001/api/health` 返回 `{"ok":true,...}`。

## 备注

- 阶段一**没有**：模型接入、数据库、记忆、会话侧边栏、登录。都是后续阶段的事。
- 想换 AI 名字 / 文案：改 `frontend/src/App.jsx`（`AI_NAME`、`FALLBACK_REPLIES`）与 `backend/server.js` 即可。
- 想换色调：改 `frontend/src/app.css` 顶部 `:root` 变量。