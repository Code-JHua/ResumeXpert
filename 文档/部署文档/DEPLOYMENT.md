# 简历生成器 - 部署指南

## 部署架构

```
前端 (Vite + React) → Vercel
后端 (Express + MongoDB) → Zeabur
```

---

## 第一步：部署后端到 Zeabur

### 1. 注册 Zeabur
- 访问 [zeabur.com](https://zeabur.com)
- 使用 GitHub 账号登录

### 2. 创建新项目
1. 点击 **Create New Project**
2. 选择区域（推荐选择 Hong Kong 或 Singapore，国内访问更快）

### 3. 部署后端
#### 方式一：从 GitHub 部署（推荐）
1. 点击 **Deploy Service** → **Git**
2. 选择你的仓库
3. **重要：只选择 `backend` 文件夹**
   - 在 Root Directory 设置为 `backend`
4. Zeabur 会自动检测 Node.js 项目

#### 方式二：手动配置
如果自动检测失败，手动设置：
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### 4. 添加 MongoDB 数据库
1. 在项目中点击 **Add Service** → **Prebuilt** → **MongoDB**
2. Zeabur 会自动创建并连接 MongoDB

### 5. 设置环境变量
在后端服务的 **Environment Variables** 中添加：

| 变量名 | 值 |
|--------|-----|
| `MONGODB_URI` | 自动填充（Zeabur 会自动连接 MongoDB） |
| `JWT_SECRET` | 设置一个强密码（如：`your-super-secret-jwt-key-2024`） |

### 6. 获取后端域名
部署完成后，Zeabur 会给你一个域名：
```
https://xxxxx.zeabur.app
```
**记下这个域名，部署前端时需要用到！**

---

## 第二步：部署前端到 Vercel

### 1. 注册 Vercel
- 访问 [vercel.com](https://vercel.com)
- 使用 GitHub 账号登录

### 2. 导入项目
1. 点击 **Add New** → **Project**
2. 选择你的仓库
3. **Root Directory** 设置为 `frontend`

### 3. 配置环境变量
在 **Environment Variables** 中添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | 你的 Zeabur 后端域名（如：`https://xxxxx.zeabur.app`） |

### 4. 部署
点击 **Deploy**，等待几分钟即可完成。

---

## 部署检查清单

- [ ] 后端已部署到 Zeabur
- [ ] MongoDB 已添加并连接
- [ ] 后端环境变量已设置（JWT_SECRET）
- [ ] 获取到后端域名
- [ ] 前端已部署到 Vercel
- [ ] 前端环境变量 VITE_API_URL 已设置为后端域名
- [ ] 测试前后端连接正常

---

## 测试部署

1. 访问你的 Vercel 前端域名
2. 尝试注册/登录
3. 创建简历测试功能

---

## 常见问题

### Q: 后端部署失败
A: 检查 `backend/package.json` 是否有 `start` 脚本

### Q: 前端无法连接后端
A: 检查 `VITE_API_URL` 是否正确设置为 Zeabur 域名

### Q: MongoDB 连接失败
A: 确保在 Zeabur 中添加了 MongoDB 服务，且环境变量正确

### Q: CORS 错误
A: 检查后端 `server.js` 中的 CORS 配置

---

## 更新现有代码

如果你已经部署过，需要更新：

```bash
git add .
git commit -m "chore: 添加部署配置"
git push
```

Vercel 和 Zeabur 会自动重新部署。

---

## 域名（可选）

### 绑定自定义域名

**Vercel**:
1. 在项目设置中 → Domains
2. 添加你的域名

**Zeabur**:
1. 在服务设置中 → Networking
2. 添加自定义域名或设置自定义域名前缀

---

**文档版本:** 1.0
**最后更新:** 2026-04-19
