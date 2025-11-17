# 部署到 GitHub 和 Vercel 指南

## 当前状态

你的代码已经准备好部署，包含以下新功能：
- ✅ 上传功能（UploadModal 组件）
- ✅ 删除功能（带二次确认）
- ✅ 修复了所有硬编码的 localhost URLs
- ✅ 所有更改已提交到 Git（commit: b68df6e）

## 步骤 1: 在 Windows 上推送到 GitHub

由于 WSL 环境的网络限制，请在 Windows 命令行中执行以下步骤：

### 1.1 在 Windows PowerShell 中打开项目目录
```powershell
cd "C:\Users\84736\Downloads\下载\咸鱼x6副本\灵感1116"
```

### 1.2 查看当前 git 状态
```powershell
git status
```

应该看到 `working tree clean`（没有未提交的更改）

### 1.3 配置 Git 凭证（仅需一次）

#### 方法 A: 使用个人访问令牌（PAT）- 推荐

1. 访问 GitHub: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写信息：
   - Note: "Local development"
   - Expiration: 90 days
   - Scope: 选择 `repo` (完整的仓库访问权限)
4. 复制生成的 token（形如 `ghp_xxxxx...`）
5. 在 PowerShell 中保存凭证：

```powershell
# 设置凭证助手
git config --global credential.helper wincred

# 首次推送时会弹出凭证框，输入：
# Username: 你的 GitHub 用户名（847361092）
# Password: 刚才复制的 Personal Access Token
```

#### 方法 B: 使用 SSH 密钥

如果你已经设置了 SSH 密钥，可以使用：

```powershell
# 验证 SSH 连接
ssh -T git@github.com

# 如果成功会显示: Hi 847361092! You've successfully authenticated...
```

### 1.4 推送代码到 GitHub

```powershell
# 添加远程仓库（如果还没有）
git remote add origin https://github.com/847361092/inspire-field.git

# 或者如果已经存在，更新远程 URL
git remote set-url origin https://github.com/847361092/inspire-field.git

# 推送到 main 分支
git push -u origin main

# 或者如果你的默认分支是 master
git push -u origin master
```

推送时会提示输入 GitHub 用户名和密码/token。

## 步骤 2: 验证 GitHub 仓库

推送成功后，访问仓库验证：
```
https://github.com/847361092/inspire-field
```

检查以下内容：
- ✅ 所有文件都已上传
- ✅ 最新 commit: "完成前端 UI 改造 - 添加上传和删除功能"
- ✅ 提交历史正确

## 步骤 3: 部署到 Vercel

### 3.1 在 Vercel 中连接 GitHub 仓库

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 点击 "Add New Project"
3. 选择 "Import Git Repository"
4. 授权 GitHub 访问权限
5. 选择仓库 `847361092/inspire-field`
6. 点击 "Import"

### 3.2 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

**For Production:**
```
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app
VITE_API_URL=/api
VITE_USE_STATIC_DATA=false
MONGODB_URI=mongodb+srv://bajiaojun_db_user:6xY9ZOhxLpfuxqPX@cluster0.yqj4j1q.mongodb.net/?appName=Cluster0
```

**For Preview:**
```
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app
```

### 3.3 自动部署

设置完成后，Vercel 会：
1. ✅ 自动监听 GitHub main 分支
2. ✅ 任何 push 都会触发自动部署
3. ✅ 部署完成后会生成预览链接

## 步骤 4: 测试部署

部署完成后，按照以下步骤测试：

### 4.1 访问生产环境
访问你的 Vercel 项目 URL（形如 `https://inspire-field.vercel.app`）

### 4.2 测试上传功能
1. 点击右下角 FAB 菜单
2. 点击 "📤 上传" 按钮
3. 选择图片并填写信息
4. 上传成功后应该看到新作品

### 4.3 测试删除功能
1. 打开任何作品详情页
2. 点击下方 "删除" 按钮
3. 再次点击确认删除
4. 作品应该被删除，重定向到首页

### 4.4 检查浏览器控制台
- 打开 DevTools (F12)
- 检查 Console 和 Network 标签
- 确保没有 404 错误或红色错误信息
- 检查 API 调用是否成功

## 故障排查

### 推送失败：Username for 'https://github.com'

**原因**: 凭证未正确配置

**解决方案**:
```powershell
# 清除之前的凭证
git credential reject

# 删除保存的凭证（Windows）
cmdkey /delete:git:https://github.com

# 重新尝试推送，会提示输入凭证
git push -u origin main
```

### Vercel 部署失败：env 变量错误

检查 Vercel 项目设置中的环境变量是否正确配置。

### 上传/删除功能在生产环境不工作

1. 检查浏览器 DevTools 的 Network 标签，看是否有请求失败
2. 检查 Vercel 函数日志：
   - 访问 Vercel Dashboard
   - 选择项目
   - 点击 "Functions" 标签
   - 查看最近的请求日志

3. 确保 API 路由正确配置（`/api/upload`, `/api/delete` 等）

## 常用 Git 命令参考

```powershell
# 查看提交历史
git log --oneline

# 查看当前分支和远程
git branch -a

# 重新推送（如果有冲突）
git push origin main --force  # 谨慎使用！

# 检查远程配置
git remote -v

# 更新本地代码（如果在其他地方有改动）
git pull origin main
```

## 项目完成清单

- [x] 添加上传功能 UI
- [x] 添加删除功能 UI
- [x] 修复 API URLs
- [x] 提交更改到 Git
- [ ] 推送到 GitHub **← 当前步骤**
- [ ] 部署到 Vercel
- [ ] 测试上传功能
- [ ] 测试删除功能
- [ ] 验证生产环境

## 技术支持

如果遇到问题，可以参考：
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [Vercel 部署指南](https://vercel.com/docs)
- [Git 官方文档](https://git-scm.com/doc)
