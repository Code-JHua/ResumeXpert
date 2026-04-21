# ResumeXpert Phase B 细化文档

## 1. 文档定位
本文件用于承接 Phase A 已完成的平台化底座，细化 Phase B“输入层落地”的具体目标、范围、任务拆解、接口设计与验收标准。

Phase B 的核心目标不是一次做完所有导入能力，而是先让用户能够：

- 带着已有材料进入系统
- 得到一份可确认的简历草稿
- 在确认后进入现有编辑器继续修改

---

## 2. Phase B 目标

### 产品目标
把 ResumeXpert 从“只能空白创建简历”升级为“支持从已有材料开始整理简历”的产品。

### 阶段目标
本阶段聚焦两条输入链路：

1. Markdown 导入
2. 文本型 PDF 导入

不在本阶段实现：

- 扫描 PDF OCR 正式能力
- Word 导入
- 自动高精度字段识别优化
- Markdown 与结构化数据完整双向同步

### 完成后的用户价值
- 用户不需要从空白模板重建简历
- 技术用户可直接导入 Markdown 简历
- 有旧 PDF 简历的用户可将文本提取为草稿继续编辑
- 所有导入都经过“确认环节”，降低识别错误风险

---

## 3. 当前基础与约束

### 已具备基础
Phase A 已经完成：

- `resume_imports` 模型与基础接口
- `resume_markdown_documents` 模型与基础接口
- `Resume` 扩展字段：
  - `contentSource`
  - `sourceDocumentId`
  - `sourceImportId`
  - `freeBlocks`
  - `status`
- 占位路由：
  - `/imports`
  - `/resume/:id/markdown`

### 当前缺口
- 没有导入中心正式页面
- 没有文件上传导入流程
- 没有 Markdown 解析器
- 没有 PDF 文本抽取服务
- 没有导入确认页
- 没有“导入记录 -> Resume -> Markdown 文档”联动逻辑

### 技术约束
- 后端当前依赖较轻，尚未接入 PDF 解析或 OCR 库
- 前端当前编辑器仍以结构化表单为主
- 必须兼容现有 `EditResume` 流程，不能破坏已有简历 CRUD

---

## 4. Phase B 范围定义

## 4.1 In Scope
- 导入中心页面
- Markdown 文件上传与导入
- 文本型 PDF 上传与文本抽取
- 导入记录状态流转
- 导入结果预览与确认页
- 将确认结果转换为：
  - `Resume`
  - 可选 `ResumeMarkdownDocument`
- 导入失败与待确认提示

## 4.2 Out of Scope
- 扫描 PDF OCR
- Word 导入
- 批量导入
- AI 语义纠错
- 自动字段高置信合并
- 分享页联动

---

## 5. Phase B 核心用户流

## 5.1 流程一：Markdown 导入
1. 用户进入 `/imports`
2. 选择“Markdown 导入”
3. 上传 `.md` 文件或粘贴 Markdown 内容
4. 系统创建 `resume_imports`
5. 系统解析 Markdown：
   - 提取标题、个人信息、段落、经历、教育、技能等
   - 无法映射内容进入 `freeBlocks`
6. 系统展示导入确认页
7. 用户确认或修改关键字段
8. 系统创建：
   - `Resume`
   - `ResumeMarkdownDocument`
9. 跳转到：
   - 表单编辑页 `/resume/:id`
   - 或 Markdown 页 `/resume/:id/markdown`

## 5.2 流程二：文本型 PDF 导入
1. 用户进入 `/imports`
2. 选择“PDF 导入”
3. 上传文本型 PDF
4. 后端抽取纯文本
5. 系统创建 `resume_imports`
6. 通过规则映射生成 `mappedResumeDraft`
7. 展示导入确认页
8. 用户确认字段
9. 系统创建 `Resume`
10. 跳转到 `/resume/:id`

## 5.3 流程三：导入失败
1. 系统无法抽取文本或文件格式不支持
2. `resume_imports.status = failed`
3. 页面展示失败原因与建议
4. 用户可重新上传

---

## 6. 数据与状态设计

## 6.1 `resume_imports` 状态定义
沿用 Phase A 模型，Phase B 采用如下状态流：

- `uploaded`
- `extracting`
- `parsed`
- `needs_confirmation`
- `confirmed`
- `failed`

状态含义：

- `uploaded`: 文件已接收，尚未开始处理
- `extracting`: 正在读取文本
- `parsed`: 文本已提取，结构初步解析完成
- `needs_confirmation`: 已生成草稿，等待用户确认
- `confirmed`: 用户确认并已生成正式 Resume
- `failed`: 导入失败

## 6.2 导入结果最小结构
`mappedResumeDraft` 建议统一输出为接近 `Resume` 的结构：

- `title`
- `profileInfo`
- `contactInfo`
- `workExperience`
- `education`
- `skills`
- `projects`
- `certifications`
- `languages`
- `interests`
- `freeBlocks`

## 6.3 `freeBlocks` 使用规则
以下内容进入 `freeBlocks`：

- 解析器无法确定所属模块的内容
- Markdown 中的自定义章节
- PDF 提取出的散段文本
- 无法稳定映射的列表项

建议结构：

- `type`
- `title`
- `content`
- `source`

## 6.4 `Resume` 写入规则
导入确认后创建 Resume 时：

- `contentSource = imported` 或 `markdown`
- `sourceImportId = 当前 import 记录`
- 若为 Markdown 导入且保存原文：
  - `sourceDocumentId = ResumeMarkdownDocument._id`
- `status = active`

---

## 7. Phase B 详细开发任务表

## Epic B1：导入中心前后端打通

### B1-1 新增导入中心正式页面
- 目标：替换当前 `/imports` 占位页
- 前端实现：
  - 上传入口卡片
  - 导入类型切换：Markdown / PDF
  - 文件拖拽与选择
  - 文本粘贴区（Markdown）
  - 导入记录状态展示
- 验收：
  - 页面可完成 Markdown 文本输入或文件上传
  - 可上传 PDF 文件
  - 可展示处理状态和错误信息

### B1-2 新增导入接口组
- 目标：把现有 `resume_imports` 基础 CRUD 扩展为业务接口
- 后端新增接口建议：
  - `POST /api/imports/markdown`
  - `POST /api/imports/pdf`
  - `GET /api/imports/:id`
  - `PUT /api/imports/:id/confirm`
- 说明：
  - 不再只用通用 `POST /api/imports`
  - 应增加按业务语义区分的入口
- 验收：
  - Markdown 与 PDF 导入各有明确入口
  - 确认接口可将导入结果转成 Resume

### B1-3 导入中心列表能力
- 目标：让用户能看到最近导入记录
- 前端/后端实现：
  - `GET /api/imports`
  - 支持返回最近导入记录摘要
  - 页面展示状态、文件名、创建时间、失败原因
- 验收：
  - 用户能看到最近导入历史
  - 可点击进入确认页或查看失败信息

---

## Epic B2：Markdown 导入链路

### B2-1 Markdown 文本解析服务
- 目标：把 Markdown 转为统一导入草稿结构
- 后端实现：
  - 新增 `services/markdownImportService.js`
  - 至少支持：
    - 标题识别
    - 一级/二级标题识别
    - 段落与列表提取
    - 常见字段映射：
      - 姓名
      - 职位
      - 联系方式
      - 工作经历
      - 教育经历
      - 技能
  - 不可识别部分写入 `freeBlocks`
- 验收：
  - 对规范 Markdown 简历能产出稳定结构
  - 未映射内容不会丢失

### B2-2 Markdown 导入接口
- 目标：完成 Markdown 输入到 `resume_imports` 的闭环
- 输入方式：
  - 上传 `.md`
  - 直接粘贴 Markdown
- 接口行为：
  - 创建 `resume_imports`
  - 保存原始 Markdown 文本到 `rawText`
  - 解析并写入 `mappedResumeDraft`
  - `status = needs_confirmation`
- 验收：
  - 成功返回 importId
  - 导入记录中能看到原文和解析结果

### B2-3 确认后生成 Markdown 文档
- 目标：导入确认后同时保留 Markdown 原文资产
- 后端实现：
  - `PUT /api/imports/:id/confirm`
  - 若来源为 Markdown：
    - 创建 `Resume`
    - 创建 `ResumeMarkdownDocument`
    - 回填 `Resume.sourceDocumentId`
- 验收：
  - 确认后能生成正式 Resume
  - 原始 Markdown 文本可继续读取

---

## Epic B3：PDF 文本导入链路

### B3-1 接入文本 PDF 解析库
- 目标：先支持“可复制文本的 PDF”，不支持扫描件
- 后端实现：
  - 新增 PDF 文本提取依赖
  - 新增 `services/pdfImportService.js`
  - 输出：
    - `rawText`
    - 解析错误
    - 页数等可选元数据
- 依赖建议：
  - 选择轻量、稳定、Node 兼容的 PDF 文本抽取库
- 验收：
  - 对文本型 PDF 可提取主要文本
  - 提取失败时返回明确错误

### B3-2 PDF 文本映射服务
- 目标：将 PDF 提取纯文本映射为统一草稿结构
- 后端实现：
  - 新增规则映射逻辑：
    - 联系方式正则提取
    - 标题区块分段
    - 常见关键字章节识别
  - 将高不确定内容写入 `freeBlocks`
  - 写入 `confidenceSummary`
- 验收：
  - 能输出结构化草稿
  - 关键字段缺失时不报错
  - 不确定字段可标记

### B3-3 PDF 导入接口
- 目标：完成 PDF 上传到导入记录的业务链路
- 接口：
  - `POST /api/imports/pdf`
- 行为：
  - 上传文件
  - 创建 `resume_imports`
  - 调用文本抽取
  - 调用映射服务
  - 成功后 `status = needs_confirmation`
  - 失败则 `status = failed`
- 验收：
  - 上传文本 PDF 后可返回 importId
  - 页面能看到待确认草稿
  - 解析失败有清晰提示

---

## Epic B4：导入确认页

### B4-1 新增导入确认页面
- 目标：让用户在正式生成 Resume 前检查关键字段
- 前端路由建议：
  - `/imports/:id/confirm`
- 页面内容：
  - 基本信息预览
  - 工作经历预览
  - 教育与技能预览
  - `freeBlocks` 显示区
  - 缺失项与低置信项提示
- 验收：
  - 用户能看到完整草稿
  - 页面能区分“已识别 / 待确认 / 未识别”

### B4-2 导入确认编辑能力
- 目标：允许用户在确认前修正最关键字段
- 前端实现：
  - 支持直接编辑：
    - 标题
    - 姓名
    - 职位
    - 联系方式
    - 经历列表中的核心字段
  - 将修改写入 `manualCorrections`
- 后端实现：
  - 更新 import 记录中的确认结果
- 验收：
  - 用户确认前可修正关键字段
  - 修正不会覆盖原始 `rawText`

### B4-3 确认生成 Resume
- 目标：把导入草稿转成正式简历
- 后端实现：
  - `PUT /api/imports/:id/confirm`
  - 创建 `Resume`
  - 需要时创建 `ResumeMarkdownDocument`
  - 更新 `resume_imports.status = confirmed`
  - 返回新建 `resumeId`
- 验收：
  - 点击确认后能进入正式编辑页
  - `Resume.sourceImportId` 正确回填

---

## Epic B5：与现有编辑器和资产体系联动

### B5-1 导入完成后的跳转策略
- 目标：导入完成后让用户顺利进入现有编辑器
- 规则：
  - Markdown 来源默认跳到 `/resume/:id`
  - 若后续 Markdown 编辑页成熟，可再改成二次选择
- 验收：
  - 导入完成后页面跳转稳定

### B5-2 Dashboard 增加“从导入开始”入口
- 目标：强化“导入优先”的产品心智
- 前端实现：
  - Dashboard 增加导入入口卡片或按钮
  - 新建简历与导入入口并列
- 验收：
  - 用户从首页/工作台能进入导入中心

### B5-3 导入来源标识
- 目标：在简历列表或详情中体现资产来源
- 前端实现：
  - 对 `contentSource = imported | markdown` 的简历显示标签
- 验收：
  - 用户可区分空白创建和导入创建的简历

---

## 8. 建议接口设计

## 8.1 导入接口
- `POST /api/imports/markdown`
- `POST /api/imports/pdf`
- `GET /api/imports`
- `GET /api/imports/:id`
- `PUT /api/imports/:id`
- `PUT /api/imports/:id/confirm`

## 8.2 返回结构建议
导入详情返回：

- `id`
- `sourceType`
- `originalFileName`
- `rawText`
- `mappedResumeDraft`
- `confidenceSummary`
- `unresolvedFields`
- `manualCorrections`
- `status`
- `failureReason`

确认接口返回：

- `importId`
- `resumeId`
- `markdownDocumentId`
- `status`

---

## 9. 测试计划

## 9.1 后端测试
- Markdown 导入接口测试
- Markdown 解析结果结构测试
- PDF 文本提取成功测试
- PDF 提取失败测试
- 导入确认接口测试
- 确认后 `Resume` 创建测试
- Markdown 来源下 `ResumeMarkdownDocument` 创建测试
- 导入状态流转测试

## 9.2 前端测试
- `/imports` 页面渲染测试
- Markdown 粘贴导入测试
- 文件上传状态测试
- 导入确认页字段展示测试
- 确认按钮跳转测试
- 导入失败提示测试

## 9.3 集成验收场景
- 用户粘贴 Markdown 后生成草稿并确认成功
- 用户上传 Markdown 文件后生成正式 Resume
- 用户上传文本型 PDF 后成功生成草稿
- 用户修正关键字段后确认生成 Resume
- 导入失败时看到明确原因且可重试

---

## 10. 风险与应对

### 风险一：Markdown 格式差异极大
应对：
- 首期只保证常见结构稳定识别
- 无法识别内容全部进入 `freeBlocks`

### 风险二：PDF 文本顺序混乱
应对：
- 首期仅支持文本型 PDF
- 以“可确认草稿”为目标，不追求全自动精确映射

### 风险三：导入确认页过重
应对：
- 首期只开放关键字段编辑
- 详细修订留给正式编辑页

### 风险四：现有编辑器字段不完全覆盖导入结果
应对：
- 用 `freeBlocks` 保底
- 后续在 Phase C 再通过 Markdown 模式承接复杂内容

---

## 11. Phase B 完成定义
当满足以下条件时，可视为 Phase B 完成：

- `/imports` 不再是占位页，而是可实际导入
- 支持 Markdown 导入
- 支持文本型 PDF 导入
- 所有导入都经过确认页
- 确认后能生成正式 Resume
- Markdown 来源能保留原始 Markdown 文档
- 导入失败有明确提示

---

## 12. 推荐开发顺序

### 第一批
1. `B1-1 导入中心页面`
2. `B2-1 Markdown 解析服务`
3. `B2-2 Markdown 导入接口`
4. `B4-1 导入确认页`
5. `B4-3 确认生成 Resume`

原因：
先做 Markdown 导入，能最快打通第一条完整输入链路。

### 第二批
1. `B3-1 PDF 文本抽取`
2. `B3-2 PDF 文本映射`
3. `B3-3 PDF 导入接口`
4. `B4-2 确认前修正能力`

原因：
PDF 导入复杂度更高，适合在 Markdown 链路跑通后再接入。

### 第三批
1. `B1-3 导入历史`
2. `B5-2 Dashboard 导入入口`
3. `B5-3 导入来源标识`

原因：
这些是增强体验，但不阻塞主链路。

---

## 13. 下一步建议
Phase B 最适合继续输出两份配套文档：

1. `Phase B API 详细设计`
内容包括：
- 请求体
- 响应体
- 错误码
- 状态机

2. `Phase B 页面交互稿/页面结构文档`
内容包括：
- `/imports`
- `/imports/:id/confirm`
- Dashboard 导入入口

如果继续推进，最合适的下一步是：

`把 Phase B 再拆成“第一批可开发 issue 清单”，优先打通 Markdown 导入闭环。`
