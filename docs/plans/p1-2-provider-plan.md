---
name: 霍克AI助手 Phase 1 实施计划
overview: 基于 fork 的 Cherry Studio App 改造为个人专用「霍克のAI助手」。P1-1 已全部交付并验收通过。当前推进 P1-2 Provider 层（执行中）：双独立 Provider（Ashawk + Hawkren），各自在设置页填 API Key，不内置测试 key；实测模型清单以 hawkren 域名为准（Auto 大写 + 5 对话 + agnes-image + agnes-video×2 + tts + asr）。**执行中关键技术变更**：侦察实锤 models.json/provider-models.json 在 mobile runtime 不被静态 import，模型数据只从远端快照读取——改动集从 5 文件扩展为 6 文件，新增 mobile-loader.ts bundled fallback（requireSnapshot 无远端快照时返回 bundled hawk 数据 + isReady 恒 true），且 ProviderRegistryUpdaterService 需同时禁用远端下载与本地缓存快照恢复，防止 Cherry 全量数据覆盖 hawk 清单。构建策略：EAS Build + EAS Update 混合模式，P1-2 触发 EAS Build 出基线 APK，后续纯 JS 改动走热更新。
todos:
  - id: p1-1
    content: P1-1 全部交付并验收通过
    status: pending
  - id: p1-2-1
    content: P1-2-1 替换 providers.json：双 Provider 文件已本地生成（1315B），待 git tree 一次性提交
    status: in_progress
  - id: p1-2-2
    content: P1-2-2 替换 models.json：11 模型已本地生成（4589B，合法 capabilities 枚举+hex version），待提交
    status: pending
  - id: p1-2-3
    content: P1-2-3 替换 provider-models.json：22 条挂载已本地生成（2739B），待提交
    status: pending
  - id: p1-2-4
    content: P1-2-4 生成 presetProviders.ts 修改版：预设列表改 ['hawk-ashawk','hawk-hawkren']，待生成待提交
    status: pending
  - id: p1-2-5
    content: P1-2-5 生成 ProviderRegistryUpdaterService.ts no-op 版：runApplyUpdate 返回 current + restoreSnapshot 禁用缓存恢复，待生成待提交
    status: pending
  - id: p1-2-5b
    content: P1-2-5b 生成 mobile-loader.ts bundled fallback 版（新增关键改动）：import hawk 数据文件 + requireSnapshot fallback + isReady 恒 true
    status: pending
  - id: p1-2-6
    content: P1-2-6 git tree API 一次性提交 6 文件 + 验证 hawk 分支 head + 确认 Actions 构建触发
    status: cancelled
  - id: p1-2-7
    content: P1-2-7 验收清单：卸载旧版重装→设置→模型服务→只现两个霍克 Provider→填 Key→Auto 对话流式回复
    status: pending
  - id: p1-2-8
    content: P1-2-8 Responses 端点评估（架构枚举确认原生支持 OPENAI_RESPONSES，编译验证后尝试声明端点）
    status: pending
  - id: p1-3
    content: P1-3 多媒体：生图/视频/TTS/ASR对话内触发+视频任务轮询+作品库Tab（纯JS，走EAS Update热更新）
    status: pending
  - id: p1-4
    content: P1-4 搜索与MCP：Tavily key内置默认值+google_search工具挂载+MCP入口保留（纯JS，走EAS Update）
    status: pending
  - id: p1-5
    content: P1-5 UI焕新：Hawk主题token+组件重写+三Tab+品牌文案（纯JS走EAS Update；品牌图标触发EAS Build）
    status: pending
  - id: p1-6
    content: P1-6 交付：hawk分支完整性验证+构建说明+验收清单+token处置提醒
    status: pending
---

# 霍克のAI助手（Hawk AI Assistant）Phase 1 实施计划

## 一、项目总览

| 项 | 值 |
|---|---|
| 基线 | CherryHQ/cherry-studio-app（main @ 154ef89d） |
| 仓库 | `github.com/h382110229/cherry-studio-app` |
| 分支 | `hawk`（唯一开发分支） |
| 包名 | `com.hawk.assistant` |
| 应用名 | 霍克のAI助手 / Hawk AI Assistant |
| 开发模式 | 路径B：云端通过 GitHub API 在远端 hawk 分支逐文件提交；GitHub Actions + EAS 云端构建 APK（Artifacts 下载） |
| 状态 | P1-1 已交付验收通过（APK 66.6MB）；P1-2 执行中（3/6 文件已本地生成，待 TS 修改版生成后一次性提交） |

## 二、执行环境约束

1. 云端 I/O 瓶颈：不解压仓库，分析用 API 只读
2. 云端无法 `pnpm install`：package.json 依赖清单不动
3. GitHub API：fine-grained token（额度 5000/h）；`.github/workflows/` 写入被安全策略拦截（用户网页手动操作），其余 contents API 直接提交
4. GitHub Actions + EAS 云端构建已跑通（EXPO_TOKEN 已配、APK 产出成功）
5. EAS 额度：Free 计划 30 次/月构建，已消耗 2 次；构建策略为 EAS Build + EAS Update 混合模式——P1-2 触发 Build（第 3 次），后续纯 JS 改动（P1-3/P1-4/部分 P1-5）走 EAS Update 热更新零 Build 消耗，仅 app.json/原生模块/品牌图标改动才触发 Build

## 三、P1-1 已交付（验收通过）

包名/应用名改造、Sentry no-op stub、桌面配对入口隐藏、i18n 精简中英双语、GitHub Actions 构建流水线（APK 66.6MB 验收通过）

## 四、P1-2 Provider 层（当前阶段）

### 4.0 实测侦察数据

| 项 | 结论 |
|---|---|
| 域名 | `llmapi.ashawk.online`（可达，401 需自备 key）、`llmapi.hawkren.online`（可达，测试 key 有效，仅本会话使用不写入记忆系统） |
| 接口 | `/v1/chat/completions` SSE 流式已验证，`reasoning_content` 字段存在（reasoningFormat: openai-chat 匹配） |
| hawkren 模型清单 | Auto（大写，Auto 路由）+ mimo-v2.5-pro / mimo-v2.5 / mimo-x-pro-preview / mimo-x-flash-preview / agnes-2.5-flash（对话）+ agnes-image-2.1-flash（生图）+ agnes-video-2.5 / agnes-video-2.5-flash（视频）+ mimo-v2.5-tts（TTS）+ mimo-v2.5-asr（ASR） |
| schema 枚举 | capabilities 合法值已核实（image-generation/video-generation/audio-generation/audio-recognition/audio-transcript 等均合法）；version 为 16 位 hex 字符串；ProviderModelOverride 必填 providerId+modelId |
| Responses 端点 | 架构 ENDPOINT_TYPE 枚举原生包含 OPENAI_RESPONSES，官方设计支持该端点，P1-2-8 可直接尝试声明 |
| **数据源关键事实** | **models.json/provider-models.json 在 mobile runtime 不被静态 import**：`loadModels()` 只从 remote snapshot 读取（requireSnapshot 无快照时抛错），`isReady()` = remoteSnapshot !== null；providers.json 才是静态 import + zod 校验 |

### 4.1 改动集（6 个文件，git tree API 一次性提交）

| # | 文件 | 操作 | 状态 |
|---|---|---|---|
| 1 | `packages/provider-registry/data/providers.json` | 替换：双 Provider（hawk-ashawk→ashawk 域名、hawk-hawkren→hawkren 域名，openai-compatible + api-key + reasoningFormat openai-chat），version=a1hex格式 | 已本地生成 1315B |
| 2 | `packages/provider-registry/data/models.json` | 替换：11 模型（Auto 大写 + 5 对话 + 生图 + 视频×2 + tts + asr），capabilities 全部用合法枚举，ownedBy=llmapi | 已本地生成 4589B |
| 3 | `packages/provider-registry/data/provider-models.json` | 替换：双 Provider × 11 模型共 22 条挂载（apiModelId=modelId 一一对应） | 已本地生成 2739B |
| 4 | `src/backend/data/services/presetProviders.ts` | 编辑：`RECOMMENDED_PRESET_PROVIDER_IDS = ['hawk-ashawk','hawk-hawkren']`，其他函数逻辑保留（死分支无害，最小 diff） | 待生成 |
| 5 | `src/backend/services/providers/ProviderRegistryUpdaterService.ts` | 编辑双处：`runApplyUpdate()` no-op 返回 `{status:'current'}`（禁远端下载）；`restoreSnapshot()` 改为空实现（禁本地缓存快照恢复，防止 Cherry 全量数据覆盖 hawk 清单） | 待生成 |
| 6 | `packages/provider-registry/src/mobile-loader.ts` | **新增编辑（关键）**：import models.json/provider-models.json；新增 `getBundledSnapshot()`（zod parse bundled 数据，懒加载）；`requireSnapshot()` 改为 `remoteSnapshot ?? bundledSnapshot`；`isReady()` 恒 true | 待生成 |

### 4.2 数据流闭环说明（为什么 6 个文件缺一不可）

- providers.json 替换 → Provider 列表只剩 hawk×2（zod 校验通过的合法结构）
- models.json/provider-models.json 替换 + mobile-loader bundled fallback → 模型选择器从 bundled hawk 数据读取（不依赖远端、不依赖缓存）
- presetProviders 替换 → 首次安装只预置两个 hawk Provider 入数据库
- UpdaterService 双 no-op → 远端下载禁用 + 本地缓存快照恢复禁用，bundled 数据永为唯一真相

### 4.3 设计决策

- **双独立 Provider**：设置→模型服务出现两个条目，各自填 Key；**Auto 大写**（实测确认）；**不内置 key**（key 已在对话明文出现，写 APK 不安全）
- **capabilities 保守策略**：只用枚举实锤值，避免 zod parse 失败导致运行时崩溃
- **一次性提交**：git tree API（GET ref→GET commit tree→POST tree→POST commit→PATCH ref），一次 push 只触发一次构建，不浪费 EAS 额度

### 4.4 验收清单（构建后用户执行）

1. 卸载手机旧版「霍克のAI助手」（必须，清数据库避免旧 Provider 残留）
2. Actions 构建完成下载 hawk-apk 安装
3. 设置 → 模型服务：应只出现「霍克 LLMAPI (Ashawk)」和「霍克 LLMAPI (Hawkren)」
4. 选 Hawkren → 粘贴 API Key 保存；Ashawk 同理（如有 key）
5. 新建对话 → 模型选择器列出 11 个 hawk 模型，**默认 Auto**
6. 发消息 → 流式逐字回复（reasoning 正常）

## 五、后续阶段

- **P1-3 多媒体**（EAS Update 热更新）：生图/视频/TTS/ASR 对话内触发 + 视频任务轮询 + 作品库 Tab（改造 paintings 页）
- **P1-4 搜索与 MCP**（EAS Update）：Tavily key 硬编码默认值 + google_search 工具挂载 + MCP 入口保留
- **P1-5 UI 焕新**（JS 部分走 EAS Update；品牌图标触发 EAS Build）：Hawk 主题 token（Obsidian 黑/香槟金/青绿）、组件重写、对话/作品库/设置三 Tab、品牌文案、几何 H 图标替换
- **P1-6 交付**：hawk 分支完整性验证 + 构建说明 + 验收清单 + token 处置提醒（交付后撤销 fine-grained token）

## 六、风险与注意事项

1. **bundled fallback 是本阶段成败关键**：若 mobile-loader 修改有误，模型选择器将报错——验收时若出现"registry not downloaded"类报错，优先检查该文件
2. **zod parse 失败风险**：bundled 数据字段若与 schema 不符会 throw——已按实锤枚举生成，若验收报 parse 错误，把报错文本发我即可定位
3. **数据库残留**：验收前必须卸载旧版 APK
4. **Tavily key 编译进 APK**（P1-4）：自用可接受，勿公开分发
5. **GitHub token**：仅本会话使用未写入记忆系统；交付后建议撤销
6. **AGPL-3.0**：个人使用无合规问题；未来公开分发需开源衍生代码
