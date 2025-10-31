const fs = require('fs');
const path = require('path');
const matter = require('front-matter');
const { execSync } = require('child_process');

// 获取 GitHub 仓库信息
function getGitHubRepoInfo() {
  try {
    // 从环境变量获取（GitHub Actions 提供）
    const githubRepository = process.env.GITHUB_REPOSITORY;
    if (githubRepository) {
      const [owner, repo] = githubRepository.split('/');
      console.log(`从环境变量获取仓库信息: ${owner}/${repo}`);
      return { owner, repo };
    }

    // 从 git remote 获取
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    console.log(`Git remote URL: ${remoteUrl}`);

    // 解析不同格式的 Git URL
    let match;

    // HTTPS 格式: https://github.com/user/repo.git
    match = remoteUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    // SSH 格式: git@github.com:user/repo.git
    match = remoteUrl.match(/git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    throw new Error('无法解析 GitHub 仓库信息');
  } catch (error) {
    console.error('获取仓库信息失败:', error.message);
    // 回退到默认值
    return { owner: 'username', repo: 'blog' };
  }
}

// 生成博客文章 URL
function generatePostUrl(postDate, filePath, repoInfo) {
  const date = new Date(postDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // 使用完整的文件路径而不是只有文件名
  // 例如：life/hello 而不是 hello
  return `https://${repoInfo.owner.toLowerCase()}.github.io/${repoInfo.repo}/${year}/${month}/${day}/${filePath}/`;
}

// 获取本次提交中变更的文章文件
function getChangedPosts() {
  const repoInfo = getGitHubRepoInfo();

  try {
    // 获取本次提交中所有变更的 .md 文件（包括删除的）
    const allChangedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.startsWith('source/_posts/') && file.endsWith('.md'));

    // 获取删除的文件
    const deletedFiles = execSync('git diff --name-only --diff-filter=D HEAD~1 HEAD', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.startsWith('source/_posts/') && file.endsWith('.md'));

    // 获取新增或修改的文件（排除删除的文件）
    const changedFiles = allChangedFiles.filter(file => fs.existsSync(file));

    console.log('本次变更的文章文件:', changedFiles);
    console.log('本次删除的文章文件:', deletedFiles);

    const posts = changedFiles.map(file => {
      const content = fs.readFileSync(file, 'utf8');
      const parsed = matter(content);
      const fileName = path.basename(file, '.md');
      const postDate = parsed.attributes.date || new Date();
      const filePath = file.replace('source/_posts/', '').replace('.md', '');

      return {
        title: parsed.attributes.title || fileName,
        date: postDate,
        categories: parsed.attributes.categories || [],
        tags: parsed.attributes.tags || [],
        path: filePath,
        file: file,
        url: generatePostUrl(postDate, filePath, repoInfo)
      };
    });

    return {
      changedPosts: posts.sort((a, b) => new Date(b.date) - new Date(a.date)),
      deletedFiles: deletedFiles
    };
  } catch (error) {
    console.log('获取变更文件失败，可能是首次提交，读取所有文章');
    // 如果是首次提交，读取所有文章
    return {
      changedPosts: getAllPosts(),
      deletedFiles: []
    };
  }
}

// 读取所有文章（用于首次提交）
function getAllPosts() {
  const glob = require('glob');
  const repoInfo = getGitHubRepoInfo();
  const postsPattern = 'source/_posts/**/*.md';
  const postFiles = glob.sync(postsPattern);

  const posts = postFiles.map(file => {
    const content = fs.readFileSync(file, 'utf8');
    const parsed = matter(content);
    const fileName = path.basename(file, '.md');
    const postDate = parsed.attributes.date || new Date();
    const filePath = file.replace('source/_posts/', '').replace('.md', '');

    return {
      title: parsed.attributes.title || fileName,
      date: postDate,
      categories: parsed.attributes.categories || [],
      tags: parsed.attributes.tags || [],
      path: filePath,
      file: file,
      url: generatePostUrl(postDate, filePath, repoInfo)
    };
  });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 更新 README 中的文章列表
function updateReadmeWithChanges(changedPosts, deletedFiles) {
  let readme = fs.readFileSync('README.md', 'utf8');

  const startMarker = '<!-- BLOG-POST-LIST:START -->';
  const endMarker = '<!-- BLOG-POST-LIST:END -->';

  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    // 如果没有标记，添加到文件末尾
    if (changedPosts.length > 0) {
      readme += `\n\n# 博客目录\n\n${startMarker}\n\n${generateFullPostsList(changedPosts)}\n\n${endMarker}\n`;
    }
  } else {
    // 解析现有内容
    let existingContent = readme.substring(startIndex + startMarker.length, endIndex).trim();

    // 先处理删除的文章
    if (deletedFiles.length > 0) {
      existingContent = removeDeletedPosts(existingContent, deletedFiles);
    }

    // 再添加新文章
    if (changedPosts.length > 0) {
      existingContent = mergePostsIntoExisting(existingContent, changedPosts);
    }

    const before = readme.substring(0, startIndex + startMarker.length);
    const after = readme.substring(endIndex);
    readme = before + '\n\n' + existingContent + '\n\n' + after;
  }

  fs.writeFileSync('README.md', readme);
  console.log(`✅ README 已更新，新增 ${changedPosts.length} 篇文章，删除 ${deletedFiles.length} 篇文章`);
}

// 从现有内容中删除已删除的文章
function removeDeletedPosts(existingContent, deletedFiles) {
  let result = existingContent;

  deletedFiles.forEach(deletedFile => {
    const filePath = deletedFile.replace('source/_posts/', '').replace('.md', '');
    console.log(`正在删除文章: ${filePath}`);

    // 使用完整路径匹配，而不是只用文件名
    // 例如：匹配 /life/hello/ 而不是只匹配 /hello/
    const escapedPath = filePath.replace(/\//g, '\\/');
    const lineRegex = new RegExp(`^- \\[\\*\\*.*?\\*\\*\\]\\(.*?\\/${escapedPath}\\/\\).*$`, 'gm');
    result = result.replace(lineRegex, '');
  });

  // 清理空行和空分类
  result = cleanupEmptyCategories(result);

  return result;
}

// 清理空分类标题
function cleanupEmptyCategories(content) {
  const lines = content.split('\n');
  const cleanedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 如果是分类标题
    if (line.startsWith('### ')) {
      // 检查后面是否有文章
      let hasArticles = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('### ')) {
          // 遇到下一个分类，停止检查
          break;
        }
        if (nextLine.startsWith('- [')) {
          // 找到文章
          hasArticles = true;
          break;
        }
      }

      // 只有当分类下有文章时才保留分类标题
      if (hasArticles) {
        cleanedLines.push(line);
      }
    } else if (line.trim() !== '' || !line.startsWith('- [')) {
      // 保留非空行和文章行
      cleanedLines.push(line);
    }
  }

  // 清理多余的空行
  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 将新文章合并到现有列表中
function mergePostsIntoExisting(existingContent, newPosts) {
  // 提取现有文章的路径，用于去重
  const existingPaths = new Set();
  const urlRegex = /\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = urlRegex.exec(existingContent)) !== null) {
    const url = match[1];
    // 从URL中提取文章路径，保持完整路径结构
    const pathMatch = url.match(/\/blog\/\d{4}\/\d{2}\/\d{2}\/(.+)\//);
    if (pathMatch) {
      const urlPath = pathMatch[1];
      existingPaths.add(urlPath);
      console.log(`现有文章路径: ${urlPath}`);
    }
  }

  // 过滤掉已存在的文章（使用完整路径而不是只比较文件名）
  const uniqueNewPosts = newPosts.filter(post => {
    const fullPath = post.path; // 使用完整路径，如 "life/hello" 而不是只有 "hello"
    const isExisting = existingPaths.has(fullPath);
    if (isExisting) {
      console.log(`文章已存在，跳过: ${post.title} (${fullPath})`);
    } else {
      console.log(`新文章将被添加: ${post.title} (${fullPath})`);
    }
    return !isExisting;
  });

  if (uniqueNewPosts.length === 0) {
    console.log('所有文章都已存在，无需更新');
    return existingContent;
  }

  console.log(`过滤后需要添加的新文章: ${uniqueNewPosts.map(p => p.title).join(', ')}`);

  // 按分类组织新文章
  const newPostsByCategory = {};
  uniqueNewPosts.forEach(post => {
    const category = Array.isArray(post.categories) && post.categories.length > 0
      ? post.categories[0]
      : '未分类';

    if (!newPostsByCategory[category]) {
      newPostsByCategory[category] = [];
    }
    newPostsByCategory[category].push(post);
  });

  let result = existingContent;

  // 为每个分类添加新文章
  Object.keys(newPostsByCategory).forEach(category => {
    const categoryHeader = `### ${category}`;
    const posts = newPostsByCategory[category];

    const postLines = posts.map(post => {
      const date = new Date(post.date).toLocaleDateString('zh-CN');
      const tags = Array.isArray(post.tags) && post.tags.length > 0
        ? post.tags.map(tag => `\`${tag}\``).join(' ')
        : '';

      return `- [**${post.title}**](${post.url}) - ${date}${tags ? ' ' + tags : ''}`;
    }).join('\n');

    if (result.includes(categoryHeader)) {
      // 分类已存在，在该分类下添加新文章
      const categoryIndex = result.indexOf(categoryHeader);
      const nextCategoryIndex = result.indexOf('### ', categoryIndex + categoryHeader.length);
      const insertPosition = nextCategoryIndex === -1 ? result.length : nextCategoryIndex;

      const before = result.substring(0, insertPosition).trimEnd();
      const after = nextCategoryIndex === -1 ? '' : result.substring(nextCategoryIndex);

      result = before + '\n' + postLines + '\n\n' + after;
    } else {
      // 新分类，添加到末尾
      result += `\n### ${category}\n\n${postLines}\n`;
    }
  });

  return result.trim();
}

// 生成完整文章列表（用于首次创建）
function generateFullPostsList(posts) {
  if (posts.length === 0) {
    return '暂无文章';
  }

  let list = '';
  let currentCategory = '';

  posts.forEach(post => {
    const category = Array.isArray(post.categories) && post.categories.length > 0
      ? post.categories[0]
      : '未分类';

    if (category !== currentCategory) {
      if (currentCategory !== '') list += '\n';
      list += `### ${category}\n\n`;
      currentCategory = category;
    }

    const date = new Date(post.date).toLocaleDateString('zh-CN');
    const tags = Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags.map(tag => `\`${tag}\``).join(' ')
      : '';

    list += `- [**${post.title}**](${post.url}) - ${date}`;
    if (tags) list += ` ${tags}`;
    list += '\n';
  });

  return list;
}

// 主函数
function updateReadme() {
  const { changedPosts, deletedFiles } = getChangedPosts();

  if (changedPosts.length === 0 && deletedFiles.length === 0) {
    console.log('本次提交没有文章变更');
    return;
  }

  updateReadmeWithChanges(changedPosts, deletedFiles);
}

updateReadme();