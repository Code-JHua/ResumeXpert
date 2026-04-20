# Render 部署说明

这个项目已经调整为适合单服务部署到 Render：

- `frontend` 在构建阶段执行 `vite build`
- `backend` 在生产环境直接托管 `frontend/dist`
- 前端生产环境默认请求同域 `/api`

## 在 Render 上创建服务

1. 把仓库推送到 GitHub。
2. 在 Render 选择 `New +` -> `Blueprint`。
3. 选择这个仓库，Render 会读取根目录的 `render.yaml`。
4. 创建完成后，补充 `MONGODB_URI`。
5. 重新部署。

## 必填环境变量

- `MONGODB_URI`：MongoDB Atlas 连接字符串
- `JWT_SECRET`：已经在 `render.yaml` 里自动生成，也可以手动改成自己的

## 可选环境变量

- `CLIENT_URL`：只有当前后端和前端分开部署时才需要；单服务部署可以不填

## 部署后的行为

- 应用主页、仪表盘和编辑页都走同一个 Render 域名
- API 路由继续使用 `/api/*`
- 上传文件暂存到服务本地 `uploads/`

## 当前限制

Render 免费 Web Service 会休眠，而且本地文件系统不是持久化存储。
这意味着上传的图片在重启或重部署后可能丢失。如果你后面要长期稳定保存图片，建议再接入 Cloudinary 或对象存储。
