# ResumeXpert Phase F 细化文档

## 1. 文档定位
本文件用于承接 Phase E 已完成的“岗位求职闭环深化”，细化 Phase F“模板平台化”的目标、范围、任务拆解、接口设计与验收标准。

Phase F 的核心目标不是继续往编辑器里塞更多模板，而是把模板从“前端写死的几个展示组件”，升级为可管理、可收藏、可复制、可配置、可扩展的产品平台能力。

---

## 2. Phase F 目标

### 产品目标
把 ResumeXpert 的模板系统从“内置主题切换器”，升级为“模板中心 + 模板元数据层 + 主题参数协议”的平台模块。

### 阶段目标
本阶段优先完成：

1. 官方模板中心页面
2. 模板收藏与复制能力
3. 模板元数据管理接口与前端管理区
4. 主题参数系统
5. 社区模板预留字段与流转占位

本阶段不做：

- 可视化拖拽模板编辑器
- 模板区块拼装系统
- 社区模板发布审核后台
- 用户上传 React/Vue 模板代码
- 模板收益分成与商业市场

### 完成后的用户价值
- 用户可以像浏览“模板库”一样筛选和选择模板，而不是只在弹窗里切几个固定主题
- 用户可以收藏模板、复制官方模板为自己的模板副本
- 同一个模板支持颜色、字体、密度等主题参数调整
- 模板元数据有独立资产形态，后续社区模板和模板审核无需推翻重来

---

## 3. 当前基础与缺口

### 已具备基础
- 前端已有模板渲染器：
  - `TemplateOne`
  - `TemplateTwo`
  - `TemplateThree`
- 前端已有统一渲染入口：
  - `frontend/src/components/RenderResume.jsx`
- 编辑器已有模板切换弹窗：
  - `frontend/src/components/ThemeSelector.jsx`
- 后端已有模板接口入口：
  - `GET /api/templates`
  - `GET /api/templates/:id/preview`

### 当前缺口
- 模板元数据仍然是前后端双写硬编码
- 没有模板持久化模型，无法收藏、复制、统计、管理
- 简历模板配置只有 `theme`，没有可扩展的主题参数对象
- 模板中心没有独立页面，用户无法管理“我的模板”
- 没有社区模板预留字段，后续要做发布/审核会缺数据层基础

### 技术约束
- 现阶段模板渲染器仍然是前端本地组件，不能直接动态下发任意模板代码
- 必须兼容现有简历渲染链路与 PDF / 分享 / Markdown 等既有能力
- 需要保证旧简历仍然能正常通过 `theme` 字段回放

---

## 4. Phase F 范围定义

## 4.1 In Scope
- 模板持久化模型
- 官方模板中心页面
- 模板收藏与复制
- 模板套用到简历
- 模板元数据创建/更新
- 主题参数配置与预览
- 社区模板预留字段

## 4.2 Out of Scope
- 真正的模板源码编辑器
- 模板上传执行沙箱
- 模板审核工作台
- 模板收入系统
- 多端模板同步与 CDN 分发

---

## 5. Phase F 核心用户流

## 5.1 流程一：浏览官方模板并套用
1. 用户进入 `/templates`
2. 查看官方模板列表与预览
3. 选择要应用的简历
4. 调整强调色、标题色、标签底色、字体和密度
5. 点击“套用到当前简历”
6. 系统把模板元数据 ID、渲染器 Key、主题参数写回 `Resume.template`

## 5.2 流程二：收藏模板
1. 用户在模板中心或编辑器模板弹窗中点击“收藏”
2. 系统记录当前用户对该模板的收藏关系
3. 用户可通过“仅看收藏”快速筛选常用模板

## 5.3 流程三：复制官方模板为个人模板
1. 用户在模板卡片上点击“复制模板”
2. 系统基于官方模板创建一份个人模板副本
3. 用户可在元数据管理区继续修改名称、描述、分类与状态

## 5.4 流程四：模板元数据管理
1. 用户在模板中心进入“模板元数据管理”
2. 创建新的个人模板或社区预留模板
3. 填写模板名称、描述、渲染器 Key、来源类型
4. 系统生成模板资产并纳入模板列表

---

## 6. 数据与状态设计

## 6.1 `Template` 模型
建议新增实体：

- `templates`

建议核心字段：

- `templateId`
- `rendererKey`
- `sourceTemplateId`
- `ownerId`
- `name`
- `slug`
- `description`
- `thumbnail`
- `sourceType`
- `category`
- `status`
- `authorName`
- `supportedContentTypes`
- `tags`
- `sortOrder`
- `favoriteUserIds`
- `usageCount`
- `duplicateCount`
- `themeSchema`
- `communityMeta`

### 设计意图
- `rendererKey` 负责映射前端本地渲染器
- `templateId` 负责模板资产身份
- `sourceTemplateId` 支撑“复制自哪个模板”
- `favoriteUserIds` 解决收藏关系
- `themeSchema` 统一主题参数协议
- `communityMeta` 为社区模板发布机制预留

## 6.2 `Resume.template` 扩展
当前 `Resume` 中模板配置只有：

- `theme`
- `colorPalette`

Phase F 建议扩展为：

- `templateId`
- `theme`
- `colorPalette`
- `settings`

其中：
- `templateId` 记录具体模板资产
- `theme` 保持渲染器 Key 兼容旧逻辑
- `settings` 存放主题参数，例如：
  - `accentColor`
  - `headingColor`
  - `tagBackground`
  - `fontFamily`
  - `density`

## 6.3 主题参数协议
`themeSchema` 建议结构：

- `defaultConfig`
- `presets`
- `supportedOptions`

首期支持的参数：

- `accentColor`
- `headingColor`
- `tagBackground`
- `fontFamily`
- `density`

### 设计意图
- 编辑器和模板中心共享同一套参数协议
- 官方模板、个人模板、后续社区模板都复用同一参数定义
- 渲染器实现只需要消费统一 `theme` 对象

## 6.4 社区模板预留机制
`communityMeta` 建议预留：

- `canPublishToCommunity`
- `reviewStatus`
- `reservedFields`
- `coverImage`
- `license`
- `reviewNotes`

首期不开放完整社区流，但数据层先占位，避免后续返工。

---

## 7. Phase F 详细开发任务表

## Epic F1：模板资产持久化

### F1-1 新增 Template 模型
- 目标：把模板元数据从硬编码数组升级为可持久化资产
- 后端实现：
  - 新增 `templateModel.js`
  - 定义主题参数协议和社区占位字段
- 验收：
  - 模板可通过数据库查询与更新

### F1-2 官方模板种子同步
- 目标：保留现有三套官方模板并迁移到统一数据层
- 后端实现：
  - 新增默认模板种子数据
  - `GET /api/templates` 时自动兜底同步
- 验收：
  - 没有手工插库也能稳定获取官方模板

### F1-3 模板列表和详情接口升级
- 目标：支持筛选、详情、预览与后续管理
- 后端实现：
  - `GET /api/templates`
  - `GET /api/templates/:id`
  - `GET /api/templates/:id/preview`
- 验收：
  - 模板中心和编辑器弹窗都能消费统一接口

## Epic F2：模板中心与用户动作

### F2-1 新增模板中心页面
- 目标：提供独立模板浏览与管理入口
- 前端实现：
  - 新增 `/templates`
  - 增加导航与 Dashboard 快捷入口
- 验收：
  - 用户可在独立页面浏览模板而非仅在弹窗中切换

### F2-2 模板收藏能力
- 目标：支持保存常用模板
- 后端实现：
  - `POST /api/templates/:id/favorite`
- 前端实现：
  - 模板卡片收藏按钮
  - 收藏筛选
- 验收：
  - 用户可对模板进行收藏和取消收藏

### F2-3 模板复制能力
- 目标：让用户基于官方模板沉淀个人模板资产
- 后端实现：
  - `POST /api/templates/:id/duplicate`
- 前端实现：
  - “复制模板”按钮
  - 复制后自动进入我的模板列表
- 验收：
  - 复制后的模板保留渲染器能力并拥有独立元数据

### F2-4 模板套用到简历
- 目标：把模板中心真正接入编辑链路
- 后端实现：
  - `POST /api/templates/:id/apply`
- 前端实现：
  - 在模板中心选择简历并点击套用
- 验收：
  - 套用后简历编辑器可正确回放所选模板和参数

## Epic F3：主题参数系统

### F3-1 模板主题参数配置器
- 目标：让模板不只是“换布局”，还能“换风格”
- 前端实现：
  - 新增 `TemplateThemeConfigurator`
  - 支持颜色、字体、密度配置
- 验收：
  - 用户可以在预览前实时调整参数

### F3-2 统一主题解析逻辑
- 目标：让模板中心、编辑器预览和最终渲染用同一套主题数据
- 前端实现：
  - 新增 `templateTheme.js`
  - `RenderResume` 统一解析 `themeSchema.defaultConfig + resume.template.settings`
- 验收：
  - 同一份参数在不同入口下渲染效果一致

### F3-3 官方模板适配主题参数
- 目标：让现有三套模板真正消费新参数
- 前端实现：
  - 更新 `TemplateOne/Two/Three`
- 验收：
  - 标题色、强调色、标签底色、字体等配置可见生效

## Epic F4：模板元数据管理与社区预留

### F4-1 元数据创建接口
- 目标：支持创建个人模板和社区预留模板
- 后端实现：
  - `POST /api/templates`
- 前端实现：
  - 模板中心内的“模板元数据管理”表单
- 验收：
  - 用户可新增模板元数据资产

### F4-2 元数据更新接口
- 目标：支持模板名称、描述、状态、分类维护
- 后端实现：
  - `PUT /api/templates/:id`
- 前端实现：
  - 模板详情编辑表单
- 验收：
  - 模板元数据修改后可立即反映在模板中心

### F4-3 社区模板预留字段接入
- 目标：为 Phase G 社区模板发布审核留接口
- 实现：
  - `communityMeta.reviewStatus`
  - `communityMeta.license`
  - `communityMeta.coverImage`
  - `communityMeta.reviewNotes`
- 验收：
  - 模板资产结构已具备社区发布扩展位

---

## 8. 建议接口设计

## 8.1 模板查询
- `GET /api/templates`
- `GET /api/templates/:id`
- `GET /api/templates/:id/preview`

支持筛选参数建议：
- `scope`
- `sourceType`
- `category`
- `status`

## 8.2 模板用户动作
- `POST /api/templates/:id/favorite`
- `POST /api/templates/:id/duplicate`
- `POST /api/templates/:id/apply`

## 8.3 模板管理
- `POST /api/templates`
- `PUT /api/templates/:id`

## 8.4 返回结构建议
模板列表项建议包含：

- `id`
- `templateId`
- `rendererKey`
- `name`
- `description`
- `thumbnail`
- `sourceType`
- `category`
- `tags`
- `themeSchema`
- `isFavorite`
- `favoriteCount`
- `isOwned`

---

## 9. 页面与交互建议

## 9.1 模板中心页面
建议包含：

- 模板列表区
- 筛选区
- 当前简历选择器
- 元数据管理区
- 主题参数配置区
- 实时预览区

## 9.2 编辑器模板弹窗
建议升级为：

- 读取统一模板列表
- 支持收藏和复制
- 允许直接调整主题参数
- 确认后写回当前编辑中的简历

## 9.3 Dashboard 与导航
建议增加：

- “模板中心”导航入口
- Dashboard 快捷卡片入口

---

## 10. 测试计划

## 10.1 后端测试
- 默认模板种子同步测试
- 模板列表与详情接口测试
- 收藏/取消收藏测试
- 模板复制测试
- 模板套用到简历测试
- 模板元数据创建与更新测试

## 10.2 前端测试
- 模板中心列表加载测试
- 收藏和复制交互测试
- 套用模板后跳转与数据回写测试
- 主题参数预览生效测试
- 编辑器模板弹窗参数保存测试

## 10.3 集成验收场景
- 用户在模板中心套用官方模板到指定简历
- 用户收藏模板并通过筛选只看收藏
- 用户复制官方模板后形成个人模板
- 用户在编辑器中切换模板后保留主题参数
- 用户创建社区预留模板元数据并完成保存

---

## 11. 风险与应对

### 风险一：模板资产化后，前端渲染器仍需本地映射
应对：
- Phase F 明确采用 `rendererKey -> 本地渲染器` 的过渡方案
- 先解耦“元数据平台层”，Phase G 再考虑模板源码层

### 风险二：复制模板后与官方模板边界不清
应对：
- 明确 `sourceType`
- 明确 `sourceTemplateId`
- UI 上区分“官方 / 我的模板 / 社区预留”

### 风险三：主题参数不统一，导致预览和导出不一致
应对：
- 统一走 `RenderResume + resolveTemplateTheme`
- 不在页面内各自实现参数解析

### 风险四：社区模板过早开放导致审核与安全问题
应对：
- Phase F 只做预留机制，不开放动态模板代码执行

---

## 12. Phase F 完成定义
当满足以下条件时，可视为 Phase F 完成：

- 模板元数据已有持久化模型
- 官方模板可通过模板中心统一浏览
- 用户可以收藏模板和复制模板
- 模板可套用到指定简历并带上主题参数
- 主题参数可在预览中实时生效
- 模板元数据可创建与更新
- 社区模板预留字段已进入模板模型

---

## 13. 推荐开发顺序

### 第一批
1. `F1-1 新增 Template 模型`
2. `F1-2 官方模板种子同步`
3. `F1-3 模板列表和详情接口升级`

原因：
先让模板从硬编码 UI 变成真正的数据资产。

### 第二批
1. `F2-1 新增模板中心页面`
2. `F2-2 模板收藏能力`
3. `F2-3 模板复制能力`
4. `F2-4 模板套用到简历`

原因：
这批任务把模板平台真正接入用户主流程。

### 第三批
1. `F3-1 模板主题参数配置器`
2. `F3-2 统一主题解析逻辑`
3. `F3-3 官方模板适配主题参数`
4. `F4-1/F4-2 模板元数据管理`
5. `F4-3 社区模板预留字段接入`

原因：
这一批决定模板平台是否具备后续扩展能力，而不是只做一个好看的模板列表。

---

## 14. 下一步建议
Phase F 完成后，最适合进入 Phase G 的两条线是：

1. 模板区块化与片段系统
2. 社区模板发布/审核工作流

如果继续推进，最合适的下一步是：

`先把模板渲染器进一步区块化，再逐步开放社区模板提交与审核流程。`
