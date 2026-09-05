# 雅思阅读模考助手 - 部署指南

## 项目概述

一个纯前端雅思阅读模考应用，支持：
- 上传剑雅阅读真题 PDF，自动解析为模考题目
- 用户自带 OpenAI API Key（本地存储，不上传服务器）
- 左右分栏模考界面、60 分钟倒计时、多题型作答
- 自动判分、答案对比、雅思 Band 分换算

技术栈：React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + pdf.js

---

## 一、推送到 GitHub

### 1. 在 GitHub 创建仓库

1. 登录 [github.com](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库名（如 `ielts-reading-mock`），选择 Public 或 Private
4. **不要**勾选 "Initialize this repository with README"（因为本地已有代码）
5. 点击 **Create repository**

### 2. 推送本地代码

在项目根目录下执行：

```bash
# 关联远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的用户名/ielts-reading-mock.git

# 推送代码
git branch -M main
git push -u origin main
```

如果提示输入凭据，使用 GitHub 用户名 + **Personal Access Token**（不是密码）。
Token 获取：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，勾选 `repo` 权限。

---

## 二、部署到 Vercel

### 1. 导入项目

1. 登录 [vercel.com](https://vercel.com)（可用 GitHub 账号登录）
2. 点击 **Add New** → **Project**
3. 在 **Import Git Repository** 中找到你的仓库，点击 **Import**

### 2. 配置项目

Vercel 会自动识别 Vite 项目，配置项如下（一般无需修改）：

| 配置项 | 值 |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

项目根目录已包含 `vercel.json`，会自动读取以上配置。

### 3. 部署

点击 **Deploy**，等待 1-2 分钟构建完成。

部署成功后会获得一个 `https://xxx.vercel.app` 的访问地址。

### 4. 自定义域名（可选）

在 Vercel 项目 → Settings → Domains 中添加你自己的域名，按提示配置 DNS 即可。

---

## 三、使用说明

### 1. 获取 OpenAI API Key

1. 登录 [platform.openai.com](https://platform.openai.com)
2. 进入 **API keys** 页面
3. 点击 **Create new secret key**，复制生成的 Key（以 `sk-` 开头）

> 注意：API Key 仅保存在用户浏览器的 localStorage 中，不会上传到任何服务器。

### 2. 使用应用

1. 打开部署后的网站
2. 在上传页面输入你的 OpenAI API Key
3. 上传雅思阅读真题 PDF（剑桥雅思真题格式）
4. 等待 AI 解析（约 10-30 秒）
5. 开始模考作答
6. 交卷后查看得分和答案解析

也可以点击「使用示例真题体验」，无需 API Key 即可体验完整模考流程。

---

## 四、本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

---

## 五、常见问题

### Q: OpenAI API 调用失败怎么办？

A: 检查以下几点：
1. API Key 是否正确（以 `sk-` 开头）
2. 账户是否有余额（OpenAI API 是付费服务）
3. 网络是否能访问 `api.openai.com`（国内网络可能需要代理）

### Q: PDF 解析结果不准确怎么办？

A: 
1. 确保 PDF 是文字版（非扫描件），扫描件无法提取文本
2. 尽量使用剑桥雅思官方真题 PDF
3. 可以尝试重新上传，AI 解析有一定随机性

### Q: 如何更换 AI 模型？

A: 编辑 `src/lib/openAI.ts`，修改 `MODEL` 常量即可，如改为 `gpt-4o`。

### Q: 支持国内大模型吗？

A: 当前代码使用 OpenAI 兼容接口。如果使用国内大模型（如 DeepSeek、通义千问、智谱等），只要它们提供 OpenAI 兼容的 API，修改 `src/lib/openAI.ts` 中的 `OPENAI_API_URL` 和 `MODEL` 即可。
