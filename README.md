# 雅思阅读模考系统

一个纯前端的雅思阅读在线模考工具，支持 PDF 真题上传、AI 题目结构化、60 分钟限时模考、自动判分复盘。

## 功能特性

- 📄 **PDF 上传**：上传剑桥雅思阅读真题 PDF，本地解析文本（pdf.js）
- 🤖 **AI 结构化**：调用 OpenAI API 将阅读文本结构化为可交互题目（gpt-4o-mini）
- ⏱️ **60 分钟模考**：左右分栏（文章/题目），倒计时，暂停，交卷确认
- 🎯 **8 大题型支持**：判断题、单选、多选、摘要填空、句子填空、标题匹配、段落信息匹配、人名匹配
- 📊 **自动判分**：正确/错误/未答三色标记，band 分换算，逐题对比
- 💾 **本地持久化**：作答进度保存在浏览器 localStorage，刷新可恢复
- 🎮 **示例真题**：内置 1 套 mock 题目，无需 API Key 也能体验完整流程

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4.0
- shadcn/ui (Radix UI)
- pdf.js (PDF 文本提取)
- OpenAI Chat Completions API (题目结构化)
- react-router-dom
- sonner (toast)
- lucide-react (图标)
- framer-motion (动画)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build:vercel
```

构建产物输出到 `dist/` 目录，可直接部署到任何静态文件服务器。

## 部署到 Vercel

1. 将代码推送到 GitHub/GitLab 仓库
2. 在 Vercel 中 import 该仓库
3. Framework 选择 Vite，Build Command 和 Output Directory 使用 `vercel.json` 中配置的值
4. 点击 Deploy 即可

项目已包含 `vercel.json` 配置文件，支持 SPA 路由重写。

## OpenAI API Key 配置

在应用首页的上传页面，输入你的 OpenAI API Key 即可使用 AI 解析功能。

- API Key 仅保存在本地浏览器 localStorage 中，不会上传到任何服务器
- 使用 `gpt-4o-mini` 模型进行题目结构化，成本低廉
- 可以随时清除保存的 Key

> **注意**：由于浏览器 CORS 限制，直接调用 `api.openai.com` 可能需要通过代理。如果遇到 CORS 错误，建议配置自己的反向代理或使用 Cloudflare Workers 转发。

## 项目结构

```
├── src/
│   ├── components/          # UI 组件
│   │   ├── ui/              # shadcn 基础组件
│   │   ├── UploadSection.tsx    # 上传区
│   │   ├── ExamHeader.tsx       # 顶部操作栏
│   │   ├── PassageReader.tsx    # 文章阅读区
│   │   ├── QuestionPanel.tsx    # 题目作答区
│   │   ├── QuestionNav.tsx      # 题号导航
│   │   └── ResultPanel.tsx      # 结果判分区
│   ├── pages/
│   │   └── IeltsReadingPage/    # 主页面
│   ├── data/
│   │   └── mockReading.ts       # Mock 数据 + 类型定义
│   ├── lib/
│   │   ├── utils.ts             # 工具函数
│   │   ├── storage.ts           # localStorage 封装
│   │   ├── pdfParser.ts         # PDF 文本解析（pdf.js）
│   │   └── openAI.ts            # OpenAI API 封装
│   ├── app.tsx              # 路由入口
│   ├── index.tsx            # 应用入口
│   └── tailwind-theme.css   # Tailwind 主题
├── public/                  # 静态资源
├── vite.config.vercel.ts    # Vercel 构建配置
├── vercel.json              # Vercel 部署配置
└── package.json
```

## 不依赖的平台特性

本项目完全脱离妙搭平台运行，已移除：

- `@lark-apaas/client-toolkit-lite`（capabilityClient / scopedStorage / logger 等）
- 插件实例机制
- 平台图片 CDN 服务
- 平台构建脚本

所有功能均使用通用开源库实现，可自由部署到任何支持静态文件托管的平台。

## License

MIT
