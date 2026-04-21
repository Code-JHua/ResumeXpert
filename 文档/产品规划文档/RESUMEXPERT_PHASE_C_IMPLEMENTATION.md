# ResumeXpert Phase C 实施文档

## 1. 阶段定位
Phase C 聚焦“Markdown 双编辑模式真正落地”。

如果说：
- Phase A 解决的是平台化底座
- Phase B 解决的是导入链路

那么 Phase C 解决的是：

- 结构化表单和 Markdown 不再只是并存
- 两种模式开始围绕同一份职业资产协同工作
- 复杂内容不会因为结构化字段不够而丢失
- 用户在同步前后能感知差异、风险与状态

---

## 2. Phase C 目标

### 产品目标
让用户可以在“表单模式”和“Markdown 模式”之间来回切换，并持续维护同一份简历资产，而不是维护两套彼此脱节的内容。

### 阶段目标
本阶段优先完成：

- Markdown 文档容器正式可用
- 表单内容可一键生成 Markdown
- Markdown 内容可解析回结构化简历
- 无法稳定映射的内容进入 `freeBlocks`
- 模板预览与导出能渲染 `freeBlocks`
- 用户能看到同步状态、漂移摘要和覆盖预览

本阶段不做：

- 真正的双向实时同步
- 字段级自动冲突合并
- 富文本 / 可视化布局编辑器
- 社区模板编辑器

---

## 3. 已实现能力

## 3.1 Markdown 文档资产化
- 每份简历可关联一份 `ResumeMarkdownDocument`
- Markdown 页支持加载、创建、更新、导出
- 导入来源为 Markdown 时会自动保留原始 Markdown 文档

相关实现：
- `backend/models/resumeMarkdownDocumentModel.js`
- `backend/controllers/resumeMarkdownController.js`
- `frontend/src/pages/ResumeMarkdownPage.jsx`

## 3.2 表单 -> Markdown
- 在 Markdown 页支持“从表单重新生成”
- 在表单编辑页支持“同步 Markdown”
- 同步后会写入：
  - `content`
  - `parsedStructuredSnapshot`
  - `syncStatus = synced`
  - `lastSyncedAt`

相关实现：
- `backend/services/resumeMarkdownSyncService.js`
- `backend/controllers/resumeMarkdownController.js`
- `frontend/src/components/EditResume.jsx`
- `frontend/src/components/resume-editor/ResumeEditorHeader.jsx`

## 3.3 Markdown -> 结构化简历
- 支持把当前 Markdown 解析并回写到 `Resume`
- 可回写：
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

相关实现：
- `POST /api/resume/:id/markdown/apply-to-resume`
- `backend/services/markdownImportService.js`
- `frontend/src/pages/ResumeMarkdownPage.jsx`

## 3.4 freeBlocks 复杂内容承接
- Markdown / 导入流程里无法稳定结构化的内容写入 `freeBlocks`
- 表单模式可查看、编辑、删除、新增 `freeBlocks`
- 模板预览与导出可渲染 `freeBlocks`

相关实现：
- `frontend/src/components/Forms.jsx`
- `frontend/src/components/EditResume.jsx`
- `frontend/src/components/ResumeSection.jsx`
- `frontend/src/components/TemplateOne.jsx`
- `frontend/src/components/TemplateTwo.jsx`
- `frontend/src/components/TemplateThree.jsx`

## 3.5 同步状态感知
- 结构化简历更新后，若存在关联 Markdown 文档，会自动把 Markdown 标记为 `outdated`
- 表单编辑页显示 Markdown 同步提醒
- 表单编辑页头部 Markdown 入口显示状态徽标
- Markdown 页展示：
  - 文档状态
  - 漂移摘要
  - 应用前覆盖摘要
  - 回写后的同步结果

相关实现：
- `backend/controllers/resumeController.js`
- `frontend/src/components/EditResume.jsx`
- `frontend/src/components/resume-editor/ResumeEditorHeader.jsx`
- `frontend/src/pages/ResumeMarkdownPage.jsx`

## 3.6 应用前风险提示
- 在真正把 Markdown 应用回简历前，可先点击“预览应用影响”
- 系统返回：
  - `overwriteSummary`
  - `unresolvedFields`
  - `confidenceSummary`
  - `parsedSections`

相关实现：
- `POST /api/resume/:id/markdown/preview-apply`
- `backend/controllers/resumeMarkdownController.js`
- `frontend/src/pages/ResumeMarkdownPage.jsx`

---

## 4. Phase C 新增接口

- `POST /api/resume/:id/markdown/sync-from-resume`
- `POST /api/resume/:id/markdown/preview-apply`
- `POST /api/resume/:id/markdown/apply-to-resume`

---

## 5. Phase C 完成定义
当满足以下条件时，可视为 Phase C 完成：

- Markdown 页不再是占位编辑器，而是可真正维护 Markdown 文档
- 表单内容可以生成 Markdown
- Markdown 可以回写到结构化简历
- 无法映射内容不会丢失，而是进入 `freeBlocks`
- `freeBlocks` 可以在表单编辑、模板预览与导出中继续存在
- 用户能看到 Markdown 是否过期
- 用户在真正覆盖结构化简历前能看到关键差异摘要

当前状态：以上条件已满足。

---

## 6. 测试与验证

### 后端
- `backend/tests/careerTools.test.js`
  - Markdown CRUD
  - Markdown 导入确认
  - Markdown 同步到结构化简历
  - 结构化更新后 Markdown 自动标记 `outdated`
  - Markdown 应用前差异预览

### 前端
- `frontend/src/__tests__/components/ResumeMarkdownPage.test.jsx`
- `frontend/src/__tests__/components/RenderResume.test.jsx`
- `frontend/src/__tests__/components/ImportsPage.test.jsx`

### 当前验证结果
- 前端测试通过
- 后端测试通过
- 前端构建通过

---

## 7. 对后续阶段的意义
Phase C 完成后，ResumeXpert 已经具备：

- 输入层：Markdown / PDF 导入
- 内容层：结构化简历 + Markdown 文档并存
- 渲染层：模板注册化 + `freeBlocks` 渲染
- 同步层：表单与 Markdown 的可控同步

这意味着产品已经从“简历表单工具”进入“多形态职业内容资产平台”的过渡阶段。

---

## 8. 下一步建议

最适合进入 Phase D / 下一阶段的方向有两条：

### 方向一：模板平台深化
- `freeBlocks` 不只基础渲染，而是做成模板片段能力
- 模板定义可声明：
  - 默认显示哪些自由块
  - 自由块在左栏 / 主栏 / 页尾的落位
  - 自由块标题样式

### 方向二：求职闭环深化
- 岗位定制版简历与 Markdown 文档联动
- ATS 分析结果直接映射到 Markdown / 表单优化提示
- 求职信与简历版本绑定更紧

如果继续延展产品势能，建议优先做：

`模板平台深化`

因为 Phase C 已经把内容层和同步层打通，下一阶段最能释放用户感知价值的是“不同模板真正消费这些内容资产”。
