# ResumeXpert

<div align="center">

![ResumeXpert Logo](https://img.shields.io/badge/ResumeXpert-v1.0-violet?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=for-the-badge&logo=mongodb)

**一款功能完善的简历生成器 | 多语言支持 | 专业模板 | 一键导出PDF**

[在线体验](#) · [快速开始](#快速开始) · [功能特性](#功能特性) · [贡献指南](#贡献指南)

</div>

---

## 📖 项目简介

ResumeXpert 是一个现代化的在线简历生成器，帮助用户快速创建专业精美的简历。支持中英文界面切换，提供多套专业模板，并可一键导出为PDF格式。

### ✨ 主要特点

- 🌍 **多语言支持** - 内置中英文界面切换
- 🎨 **多套模板** - 3种精心设计的简历模板
- 📄 **PDF导出** - 一键生成高质量PDF简历
- 💾 **云端保存** - 登录后自动保存简历数据
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **实时预览** - 编辑即时查看效果

---

## 🎯 功能特性

### 用户功能
- ✅ 用户注册/登录
- ✅ 简历管理（创建、编辑、删除）
- ✅ 多简历管理
- ✅ 简历完成度追踪

### 简历编辑
- ✅ 个人信息（姓名、职位、简介）
- ✅ 联系方式（邮箱、电话、社交媒体）
- ✅ 工作经历
- ✅ 教育背景
- ✅ 专业技能
- ✅ 项目经验
- ✅ 证书认证
- ✅ 语言能力
- ✅ 兴趣爱好

### 模板与导出
- ✅ 3种专业模板
- ✅ 主题颜色自定义
- ✅ PDF格式导出
- ✅ 缩略图预览

---

## 🛠️ 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| React 19 | UI框架 |
| React Router | 路由管理 |
| Tailwind CSS | 样式框架 |
| i18next | 国际化 |
| html2pdf.js | PDF生成 |
| Axios | HTTP客户端 |

### 后端
| 技术 | 说明 |
|------|------|
| Node.js | 运行环境 |
| Express | Web框架 |
| MongoDB | 数据库 |
| JWT | 身份认证 |
| Multer | 文件上传 |

---

## 📦 安装部署

### 环境要求

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

### 1. 克隆项目

```bash
git clone https://github.com/Code-JHua/ResumeXpert.git
cd ResumeXpert
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 环境配置

**后端配置 (`backend/.env`)**
```env
MONGODB_URI=mongodb://localhost:27017/resumexpert
JWT_SECRET=your_jwt_secret_key
PORT=4000
```

**前端配置 (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:4000
```

### 4. 启动项目

```bash
# 启动后端 (终端1)
cd backend
npm run dev

# 启动前端 (终端2)
cd frontend
npm run dev
```

访问 http://localhost:5173 查看应用

---

## 🚀 生产部署

### Zeabur 部署

1. Fork 本项目到你的 GitHub
2. 在 [Zeabur](https://zeabur.com) 导入项目
3. 配置环境变量
4. 部署完成

### Vercel 部署 (前端)

```bash
cd frontend
npm run build
vercel --prod
```

详细部署文档请查看 [部署指南](文档/部署文档/DEPLOYMENT.md)

---

## 🧪 测试

```bash
# 后端测试
cd backend
npm run test

# 前端测试
cd frontend
npm run test

# E2E测试
cd frontend
npm run test:e2e
```

测试覆盖率：**91%** (61/67 通过)

---

## 📸 项目截图

<div align="center">
  <img src="screenshots/homepage.png" alt="首页" width="800">
  <p>首页</p>
</div>

<div align="center">
  <img src="screenshots/dashboard.png" alt="仪表板" width="800">
  <p>仪表板</p>
</div>

<div align="center">
  <img src="screenshots/editor.png" alt="编辑器" width="800">
  <p>简历编辑</p>
</div>

---

## 📁 项目结构

```
ResumeXpert/
├── backend/                 # 后端目录
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── tests/              # 测试文件
│   └── server.js           # 入口文件
├── frontend/               # 前端目录
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── utils/          # 工具函数
│   │   ├── i18n/           # 国际化
│   │   └── __tests__/      # 测试文件
│   ├── e2e/                # E2E测试
│   └── public/             # 静态资源
├── 文档/                   # 文档目录
└── README.md
```

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 📧 联系方式

- 作者：Code-JHua
- 邮箱：your-email@example.com
- 项目链接：[https://github.com/Code-JHua/ResumeXpert](https://github.com/Code-JHua/ResumeXpert)

---

## ⭐ Star History

如果这个项目对你有帮助，请给一个 Star ⭐

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Code-JHua">Code-JHua</a></sub>
</div>
