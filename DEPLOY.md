# 部署指南

## 部署到 Vercel

### 1. 准备代码

将整个项目（不含 node_modules）推送到 GitHub/GitLab 仓库。

### 2. 修改 package.json（首次部署前）

原项目的 `package.json` 中的 build 脚本是妙搭平台专用的，部署 Vercel 前需修改：

```bash
# 修改 build 脚本为标准 vite build
npm pkg set scripts.build="vite build --config vite.config.vercel.ts"
npm pkg set scripts.dev="vite --config vite.config.vercel.ts"
npm pkg delete scripts.prepare
```

或者手动编辑 `package.json` 的 `scripts` 部分：

```json
{
  "scripts": {
    "dev": "vite --config vite.config.vercel.ts",
    "build": "vite build --config vite.config.vercel.ts",
    "preview": "vite preview"
  }
}
```

### 3. 移除平台依赖（可选，但推荐）

```bash
npm uninstall @lark-apaas/client-toolkit-lite @lark-apaas/coding-presets-react @lark-apaas/coding-preset-vite-react
```

### 4. 在 Vercel 中部署

1. 登录 [vercel.com](https://vercel.com)
2. 点击 "Add New" → "Project"
3. 选择你的 GitHub 仓库
4. Framework Preset 选择 **Vite**
5. Build Command 和 Output Directory 会自动从 `vercel.json` 读取
6. 点击 "Deploy"

## 本地开发

```bash
npm install
vite --config vite.config.vercel.ts
```

## 本地构建

```bash
vite build --config vite.config.vercel.ts
```

构建产物在 `dist/` 目录，可以直接上传到任何静态文件托管服务。

## OpenAI API 说明

由于浏览器 CORS 限制，前端直接调用 `api.openai.com` 可能被浏览器拦截。
如果遇到 CORS 问题，可以使用以下方案：

1. **Cloudflare Workers 反向代理**（推荐，免费额度足够个人使用）
2. **Vercel Functions / Edge Functions** 代理
3. **自建 Node.js 后端代理**

将代理后的 API 地址填入 `src/lib/openAI.ts` 中的 `OPENAI_API_URL` 即可。
