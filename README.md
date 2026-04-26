# ResumeXpert

ResumeXpert 是一个围绕“简历编辑 + Markdown 双编辑 + 分享管理 + 模板中心”构建的在线简历平台。

## 当前能力

- 用户注册、登录与简历管理
- 结构化简历编辑与实时预览
- Markdown 文档创建、同步、预览回写
- PDF、Markdown、DOCX 导出
- 公开分享链接管理与访问统计
- 模板中心、模板套用、收藏、复制与社区审核流

## 当前产品边界

仓库当前只保留以下新增功能线：

- `分享管理`
- `模板中心`

以下历史规划能力已从当前产品线移除，不再提供运行时代码：

- 导入中心
- 岗位 / ATS
- 求职信
- 投递管理
- 资产图谱

相关历史讨论仍保留在 `文档/产品规划文档` 中，并会以“已移除/历史规划”注记方式存在。

## 技术栈

### 前端

- React 19
- React Router
- Tailwind CSS
- i18next
- Axios
- html2pdf.js

### 后端

- Node.js
- Express
- MongoDB
- JWT
- Multer
- docx

## 本地开发

### 环境要求

- Node.js >= 18
- MongoDB >= 5
- npm >= 9

### 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 环境变量

`backend/.env`

```env
MONGODB_URI=mongodb://localhost:27017/resumexpert
JWT_SECRET=your_jwt_secret_key
PORT=4000
```

`frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

### 启动

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

默认访问地址：`http://localhost:5173`

## 测试

```bash
cd backend
npm run test
```

```bash
cd frontend
npm run test
```

```bash
cd frontend
npm run build
```

## 目录结构

```text
ResumeXpert/
├── backend/
├── frontend/
├── 文档/
└── README.md
```
