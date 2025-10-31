# 我的 Hexo 博客

这是一个基于 Hexo 框架的个人技术博客，配置了 GitHub Pages 自动部署。

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
npm run server

# 清理缓存
npm run clean

# 生成静态文件
npm run build
```

### 创建新文章

```bash
# 创建新文章
hexo new post "文章标题"

# 创建草稿
hexo new draft "草稿标题"

# 发布草稿
hexo publish "草稿标题"
```

## 📁 博客结构

```
├── source/
│   ├── _posts/           # 文章目录
│   │   ├── code-sharing/ # 代码分享
│   │   ├── tech-learning/# 技术学习
│   │   └── life/         # 生活感悟
│   ├── about/            # 关于页面
│   ├── categories/       # 分类页面
│   └── tags/             # 标签页面
├── themes/               # 主题目录
├── _config.yml          # 站点配置
└── package.json         # 依赖配置
```

## 🏷️ 分类说明

- **代码分享**：实用代码片段、工具函数、开源项目
- **技术学习**：新技术学习笔记、框架使用心得
- **生活**：程序员日常思考、成长感悟

## 🔄 自动部署

项目配置了 GitHub Actions，推送到 main 分支会自动：
1. 构建 Hexo 静态文件
2. 部署到 GitHub Pages

## 📝 写作规范

### Front Matter 模板

```yaml
---
title: 文章标题
date: YYYY-MM-DD HH:mm:ss
categories: 
  - 分类名称
tags:
  - 标签1
  - 标签2
---
```

### 分类规范
- 代码分享
- 技术学习  
- 生活

## 🛠️ 自定义配置

1. 修改 `_config.yml` 中的个人信息
2. 替换 GitHub Actions 中的仓库信息
3. 更新 `source/about/index.md` 个人介绍

## 📄 许可证

MIT License