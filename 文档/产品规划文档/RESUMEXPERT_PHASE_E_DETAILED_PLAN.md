# ResumeXpert Phase E 细化文档

## 1. 文档定位
本文件用于承接 Phase D 已完成的“输出与分享中心”，细化 Phase E“求职闭环深化”的具体目标、范围、任务拆解、接口设计与验收标准。

Phase E 的核心目标不是再新增几个并列页面，而是把当前已经存在的：

- 岗位描述
- ATS 分析
- 简历版本
- 求职信
- 投递记录

从“功能并排存在”升级为“同一条求职链路上的连续资产”。

---

## 2. Phase E 目标

### 产品目标
把 ResumeXpert 从“简历工具 + 求职辅助模块集合”，升级为“围绕单个岗位驱动完整求职动作闭环”的产品。

### 阶段目标
本阶段优先完成：

1. ATS 分析后可一键派生岗位定制版简历
2. 派生简历自动进入版本链路与岗位上下文
3. 求职信默认绑定岗位与派生版本上下文
4. 投递记录自动带出岗位、版本、求职信
5. 时间线中展示关键版本演进和关联资产

本阶段不做：

- 真正的大模型智能改写工作流
- 自动生成多轮面试策略
- Offer 对比和薪资谈判模块
- 企业侧协同与团队招聘看板
- 日历双向同步到外部日历服务

### 完成后的用户价值
- 用户围绕一个岗位，可以连续完成分析、定制、生成求职信和创建投递记录
- 用户不再手动在多个页面重复选择同一份简历、同一条 JD
- 派生出来的岗位版简历有明确来源和用途，不再混在普通版本中
- 投递后可回看“我当时投的是哪份版本、哪封求职信、基于哪个岗位”

---

## 3. 当前基础与缺口

### 已具备基础
结合当前文档与代码，Phase E 已经具备较强底座：

- ATS 分析接口已存在：
  - `POST /api/ats/analyze`
  - `backend/controllers/atsController.js`
- `Resume` 已支持派生与岗位上下文字段：
  - `derivedFromResumeId`
  - `derivedFromVersionId`
  - `targetJobDescriptionId`
- `ResumeVersion` 已支持派生来源和岗位绑定：
  - `sourceType`
  - `derivedFromVersionId`
  - `targetJobDescriptionId`
- 求职信模型已支持：
  - `resumeId`
  - `jobDescriptionId`
- 投递记录模型已支持：
  - `resumeId`
  - `resumeVersionId`
  - `jobDescriptionId`
  - `coverLetterId`
  - `timeline`
- 前端已具备岗位 / ATS 页面、求职信页面、投递页面

### 当前缺口
- ATS 分析完成后还不能“一键派生岗位版简历”
- ATS 结果没有保存为可追踪资产，只是页面内分析结果
- 求职信虽然支持绑定简历和岗位，但默认上下文仍较浅
- 投递记录创建时需要用户自己手动再关联简历版本和求职信
- 时间线里还没有“版本派生 / 求职信生成 / 投递创建”的资产事件
- 用户仍然要自己在多个页面中重复传递上下文

### 技术约束
- 当前 ATS 分析结果是即时计算，没有独立持久化模型
- 当前简历版本系统是通用快照系统，尚未区分“岗位派生版本”和普通手动版本
- 当前求职信内容仍主要来自规则式生成，不是上下文增强的多轮流程
- 必须兼容现有 Resume / ResumeVersion / CoverLetter / Application，不宜推翻重建

---

## 4. Phase E 范围定义

## 4.1 In Scope
- ATS 结果页新增“一键派生岗位版简历”
- 岗位派生简历和版本链路打通
- 求职信默认使用岗位版简历 / 岗位上下文
- 投递记录自动预填关键资产
- 时间线展示关键求职资产关系
- 岗位闭环的主跳转链路优化

## 4.2 Out of Scope
- 外部招聘平台抓取投递状态
- 邮件自动投递与自动跟进
- AI 自动改写整份简历
- 企业组织协作
- 多岗位批量投递流水线

---

## 5. Phase E 核心用户流

## 5.1 流程一：岗位分析到派生简历
1. 用户进入 `/jobs`
2. 选择一份基础简历和一条岗位描述
3. 点击“运行 ATS 分析”
4. 系统返回匹配度、缺失关键词、建议优化模块
5. 用户点击“一键派生岗位版简历”
6. 系统基于当前简历创建：
   - 一份新的 `Resume`
   - 一条 `ResumeVersion`
7. 新简历自动写入：
   - `derivedFromResumeId`
   - `derivedFromVersionId`
   - `targetJobDescriptionId`
8. 页面跳转到新简历编辑页，进入针对岗位的优化

## 5.2 流程二：岗位版简历到求职信
1. 用户在 ATS 结果页或岗位版简历页点击“生成求职信”
2. 系统默认带入：
   - `resumeId = 岗位版简历`
   - `jobDescriptionId = 当前岗位`
3. 求职信生成后自动保存
4. 页面跳转到求职信页并定位到新生成内容

## 5.3 流程三：岗位闭环到投递记录
1. 用户在 ATS 结果页、岗位版简历页或求职信页点击“创建投递记录”
2. 系统自动预填：
   - 公司
   - 岗位
   - `resumeId`
   - `resumeVersionId`
   - `jobDescriptionId`
   - `coverLetterId`
3. 用户补充投递时间和备注
4. 系统保存投递记录
5. 时间线自动写入关键资产事件

## 5.4 流程四：投递后回看资产链路
1. 用户进入 `/applications`
2. 打开一条投递记录
3. 系统展示：
   - 投递使用的简历
   - 使用的版本
   - 对应岗位描述
   - 对应求职信
4. 用户可以回跳到每个资产页面继续修改或复盘

---

## 6. 数据与状态设计

## 6.1 `Resume` 派生简历规则
当前 `Resume` 已有以下字段：

- `derivedFromResumeId`
- `derivedFromVersionId`
- `targetJobDescriptionId`

Phase E 中建议把它们真正用于“岗位版简历”识别。

建议新增或约定：

- `title` 命名规范：
  - 例如：`前端工程师 - 字节跳动定制版`
- `status` 延续使用：
  - `draft`
  - `active`
  - `archived`
- `contentSource` 保持原来源，不因派生而丢失：
  - `structured`
  - `markdown`
  - `imported`

## 6.2 `ResumeVersion` 岗位链路规则
当前 `ResumeVersion` 已有：

- `sourceType`
- `derivedFromVersionId`
- `targetJobDescriptionId`
- `snapshotMeta`

Phase E 建议约定：

- 派生版本 `sourceType = derived`
- `snapshotMeta` 补充：
  - `analysisSummary`
  - `matchedKeywords`
  - `missingKeywords`
  - `recommendedSections`

这样后续可以直接知道：

- 这条版本为什么产生
- 它面向哪个岗位
- 当时的 ATS 结果大概是什么

## 6.3 建议新增 `ats_analysis_records`
当前 ATS 结果是即时接口返回，建议在 Phase E 中新增：

- `ats_analysis_records`

建议字段：

- `userId`
- `resumeId`
- `resumeVersionId`
- `jobDescriptionId`
- `overallScore`
- `matchedKeywords`
- `missingKeywords`
- `recommendations`
- `recommendedSections`
- `aiEnhancement`
- `createdDerivedResumeId`
- `createdDerivedVersionId`

作用：

- 保存 ATS 结果，避免结果只留在前端内存中
- 为派生简历、求职信、投递记录提供统一分析来源

## 6.4 `CoverLetter` 联动规则
当前 `CoverLetter` 已有：

- `resumeId`
- `jobDescriptionId`
- `generationMode`

Phase E 建议新增：

- `resumeVersionId`
- `sourceAnalysisId`

若暂时不想扩模型，也至少在生成时保证：

- `resumeId` 优先绑定岗位版简历
- `jobDescriptionId` 必须回填

## 6.5 `Application` 自动关联规则
当前 `Application` 已有：

- `resumeId`
- `resumeVersionId`
- `jobDescriptionId`
- `coverLetterId`
- `timeline`

Phase E 建议新增或约定：

- 创建投递记录时，若由岗位闭环进入：
  - 自动带出上述四个关联字段
- `timeline` 自动增加初始化事件：
  - `ats_completed`
  - `derived_resume_created`
  - `cover_letter_generated`
  - `application_created`

---

## 7. Phase E 详细开发任务表

## Epic E1：ATS 结果资产化

### E1-1 新增 ATS 分析记录模型
- 目标：让 ATS 结果从“页面即时结果”升级为可追踪资产
- 后端实现：
  - 新增 `atsAnalysisRecordModel.js`
  - 新增分析结果保存逻辑
- 验收：
  - 每次 ATS 分析后，系统都能生成可查询记录

### E1-2 ATS 接口回传分析记录 ID
- 目标：为后续派生简历、生成求职信提供统一来源
- 后端实现：
  - `POST /api/ats/analyze`
  - 返回 `analysisRecordId`
- 验收：
  - 前端可根据返回结果定位当前 ATS 记录

### E1-3 ATS 页面展示“下一步动作”
- 目标：让分析页成为闭环起点，而不是终点
- 前端实现：
  - 在分析结果区域加入按钮：
    - `一键派生岗位版简历`
    - `生成求职信`
    - `创建投递记录`
- 验收：
  - ATS 结果页具备明确下一步动作入口

---

## Epic E2：岗位版简历派生

### E2-1 新增“派生岗位版简历”接口
- 目标：基于已有简历和岗位快速生成一份新简历
- 后端建议新增接口：
  - `POST /api/ats/derive-resume`
  - 或 `POST /api/resume/:id/derive-for-job`
- 行为：
  - 复制当前 `Resume`
  - 生成新的 `Resume`
  - 自动回填派生字段
  - 自动创建一条 `ResumeVersion`
- 验收：
  - 用户可从 ATS 结果页一键创建岗位版简历

### E2-2 岗位版命名与元数据规范
- 目标：让用户可以区分基础简历和岗位定制版
- 实现建议：
  - 标题自动带岗位或公司信息
  - `targetJobDescriptionId` 必须写入
  - `derivedFromResumeId` 必须写入
- 验收：
  - Dashboard 中可识别该简历为派生版本

### E2-3 派生后跳转与提醒
- 目标：让用户知道当前正在编辑“岗位定制版”
- 前端实现：
  - 跳转到新简历编辑页
  - 显示岗位来源说明
- 验收：
  - 派生后用户不会误以为在修改原始基础简历

---

## Epic E3：求职信上下文联动

### E3-1 求职信生成默认绑定岗位版简历
- 目标：让求职信内容与岗位版简历保持一致
- 后端/前端实现：
  - 从 ATS 或派生简历页进入时，默认使用派生简历 `resumeId`
  - 默认写入 `jobDescriptionId`
- 验收：
  - 生成后的求职信能准确关联目标岗位和简历

### E3-2 求职信模型补充版本上下文
- 目标：让后续投递记录能明确知道求职信用的是哪一版简历
- 后端建议：
  - 给 `CoverLetter` 增加 `resumeVersionId`
  - 可选增加 `sourceAnalysisId`
- 验收：
  - 求职信可追踪来源版本

### E3-3 ATS 页面快捷生成求职信
- 目标：减少用户切换页面成本
- 前端实现：
  - ATS 结果页加入“基于当前分析生成求职信”
- 验收：
  - 用户无需手动去求职信页重新选择上下文

---

## Epic E4：投递记录自动关联

### E4-1 投递记录预填能力增强
- 目标：让投递创建不再重复填同样信息
- 前端实现：
  - 从 ATS / 求职信 / 派生简历进入 `/applications` 时，自动带 query 参数
  - 页面初始化自动预填：
    - 公司
    - 岗位
    - 简历
    - 版本
    - 求职信
- 验收：
  - 用户创建投递记录时只需补充少量信息

### E4-2 创建投递时自动写入时间线事件
- 目标：把投递行为纳入统一资产时间线
- 后端实现：
  - 创建 `Application` 时可自动追加时间线初始化事件
- 验收：
  - 新建投递记录后，详情页能看到起始闭环事件

### E4-3 投递详情支持回跳资产
- 目标：让投递记录成为回看求职过程的入口
- 前端实现：
  - 详情页提供跳转：
    - 查看简历
    - 查看版本
    - 查看岗位
    - 查看求职信
- 验收：
  - 用户可从一条投递记录回看完整资产链路

---

## Epic E5：版本关系与时间线增强

### E5-1 版本列表展示“岗位派生来源”
- 目标：在版本系统中区分普通手动快照和岗位派生快照
- 前端/后端实现：
  - 显示：
    - `sourceType`
    - `targetJobDescriptionId`
    - `derivedFromVersionId`
- 验收：
  - 用户能清晰识别版本谱系

### E5-2 时间线事件标准化
- 目标：统一表达闭环中的关键动作
- 建议事件类型：
  - `ats_completed`
  - `derived_resume_created`
  - `cover_letter_generated`
  - `application_created`
  - `interview_scheduled`
  - `offer_received`
- 验收：
  - 时间线可稳定表达从岗位分析到投递的关键节点

### E5-3 岗位闭环概览区
- 目标：让用户快速知道闭环是否已经完整
- 前端建议：
  - 在 ATS 页面或投递详情增加闭环状态卡：
    - 岗位已分析
    - 派生简历已创建
    - 求职信已生成
    - 投递记录已创建
- 验收：
  - 用户能一眼看出还差哪一步

---

## 8. 建议接口设计

## 8.1 ATS 与派生接口
- `POST /api/ats/analyze`
- `POST /api/ats/derive-resume`
- `GET /api/ats/records/:id`

## 8.2 求职信联动接口
- `POST /api/cover-letters/generate`
- `POST /api/cover-letters/generate-from-analysis`

## 8.3 投递联动接口
- `POST /api/applications`
- `POST /api/applications/:id/timeline`

## 8.4 返回结构建议

ATS 分析返回建议增加：

- `analysisRecordId`
- `resumeId`
- `jobDescriptionId`
- `overallScore`
- `matchedKeywords`
- `missingKeywords`
- `recommendations`

派生简历返回建议包括：

- `resumeId`
- `versionId`
- `derivedFromResumeId`
- `derivedFromVersionId`
- `targetJobDescriptionId`

---

## 9. 页面与交互建议

## 9.1 岗位 / ATS 页面
建议新增三个连续动作按钮：

- `一键派生岗位版简历`
- `生成求职信`
- `创建投递记录`

## 9.2 求职信页面
建议增强上下文展示：

- 当前绑定简历
- 当前绑定岗位
- 当前来源分析

## 9.3 投递详情页
建议新增“关联资产”区域：

- 简历
- 版本
- 岗位
- 求职信

## 9.4 Dashboard 或简历列表
建议对岗位派生简历增加标签：

- `岗位定制版`
- `来源岗位：XXX`

---

## 10. 测试计划

## 10.1 后端测试
- ATS 分析记录保存测试
- 派生岗位版简历接口测试
- 派生后 `Resume` 字段回填测试
- 派生后 `ResumeVersion` 创建测试
- 求职信生成绑定岗位 / 简历测试
- 投递记录自动带出资产测试
- 时间线自动事件写入测试

## 10.2 前端测试
- ATS 结果页操作按钮展示测试
- 派生成功后跳转测试
- 求职信自动带上下文测试
- 投递页自动预填测试
- 投递详情关联资产展示测试

## 10.3 集成验收场景
- 用户分析岗位后成功派生一份岗位版简历
- 基于岗位版简历成功生成求职信
- 创建投递记录时自动带出岗位、版本、求职信
- 投递详情中可回看所有关联资产
- 时间线中可看到关键闭环事件

---

## 11. 风险与应对

### 风险一：ATS 结果只靠关键词，派生价值感不强
应对：
- 首期不承诺自动高质量改写
- 先把“派生关系 + 上下文串联”做扎实

### 风险二：岗位版简历过多导致简历列表混乱
应对：
- 明确打标签
- 后续增加筛选或归档能力

### 风险三：投递记录自动关联不准确
应对：
- 自动预填后仍允许用户手动确认和修改

### 风险四：时间线事件类型过散
应对：
- 先定义标准事件枚举
- 优先覆盖核心闭环动作

---

## 12. Phase E 完成定义
当满足以下条件时，可视为 Phase E 完成：

- ATS 结果页可一键派生岗位版简历
- 派生简历能回填岗位来源与版本来源
- 求职信默认使用岗位和派生简历上下文
- 投递记录创建时可自动带出岗位、版本、求职信
- 投递详情可回看完整资产链路
- 时间线中可展示关键闭环动作

---

## 13. 推荐开发顺序

### 第一批
1. `E1-1 新增 ATS 分析记录模型`
2. `E2-1 新增派生岗位版简历接口`
3. `E2-2 派生命名与元数据规范`
4. `E1-3 ATS 页面展示下一步动作`

原因：
先把 ATS 页从“分析终点”变成“闭环起点”。

### 第二批
1. `E3-1 求职信生成默认绑定岗位版简历`
2. `E3-2 求职信模型补充版本上下文`
3. `E4-1 投递记录预填能力增强`
4. `E4-2 创建投递时自动写入时间线事件`

原因：
这批任务会把派生简历真正接入到后续动作中。

### 第三批
1. `E4-3 投递详情支持回跳资产`
2. `E5-1 版本列表展示岗位派生来源`
3. `E5-2 时间线事件标准化`
4. `E5-3 岗位闭环概览区`

原因：
这批任务主要提升可追踪性、可复盘性和整体产品完成度。

---

## 14. 下一步建议
Phase E 最适合继续拆成两份配套文档：

1. `Phase E API 详细设计`
内容包括：
- ATS 记录模型
- 派生简历接口请求 / 响应
- 时间线事件枚举
- 求职信与投递的联动字段

2. `Phase E 页面交互文档`
内容包括：
- ATS 页面闭环操作区
- 投递详情关联资产区
- 岗位版简历标识规则

如果继续推进，最合适的下一步是：

`先把 Phase E 拆成“第一批可开发 issue 清单”，优先落 ATS 分析记录 + 一键派生岗位版简历。`
