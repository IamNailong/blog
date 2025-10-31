---
title: Hexo 博客搭建与 GitHub Pages 自动部署
date: 2024-10-31 12:00:00
categories: 
  - 技术学习
tags:
  - Hexo
  - GitHub Pages
  - 博客
  - CI/CD
---

记录一下使用 Hexo 搭建博客并配置 GitHub Pages 自动部署的完整过程。

## 环境准备

首先需要安装 Node.js 和 npm，然后全局安装 Hexo CLI：

```bash
npm install -g hexo-cli
```

## 初始化项目

```bash
hexo init my-blog
cd my-blog
npm install
```

## 配置 GitHub Pages 部署

1. 安装部署插件：
```bash
npm install hexo-deployer-git --save
```

2. 配置 GitHub Actions 工作流
3. 更新 `_config.yml` 配置文件

<!-- more -->

## 自动部署流程

通过 GitHub Actions，每次推送代码到 main 分支时会自动：
1. 检出代码
2. 安装依赖
3. 构建静态文件
4. 部署到 GitHub Pages

## 写作工作流

```bash
# 创建新文章
hexo new post "文章标题"

# 本地预览
hexo server

# 生成静态文件
hexo generate

# 推送到 GitHub（自动部署）
git add .
git commit -m "新增文章"
git push origin main
```

这样就完成了一个自动化的博客发布流程！