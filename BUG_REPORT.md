# 🐛 投药量计算工具 — Bug 审查报告

**审查日期**：2026-07-02  
**审查范围**：全量前端代码（React 18 + Vite + Immer + ExcelJS）  
**代码行数**：~3000+ 行（含 CSS）

---

## 一、严重程度定义

| 级别 | 含义 |
|------|------|
| 🔴 P0 | 安全漏洞 / 数据丢失 / 功能完全不可用 |
| 🟠 P1 | 功能缺陷 / UI 显示异常 / 用户体验受损 |
| 🟡 P2 | 代码质量 / 防御性编程 / 潜在风险 |
| 🟢 P3 | 优化建议 / 死代码 / 微改进 |

---

## 二、已发现的 Bug

### 🔴 P0-1：Vite 开发服务器暴露到局域网（安全回归）

**文件**：`vite.config.js`  
**当前代码**：`server: { host: '0.0.0.0' }`  
**问题**：历史提交 (b254d88) 曾将 `host` 改为 `localhost` 以关闭局域网暴露，但当前代码中该修复被回退，开发服务器重新暴露到 `0.0.0.0`，局域网内任意设备可访问。  
**影响**：开发环境下任何人可通过局域网 IP 访问应用，可能泄露数据。  
**修复**：将 `host` 改回 `localhost`。

---

### 🔴 P0-2：缺失 `--color-input-bg` CSS 变量导致输入框背景透明

**文件**：`src/styles/tokens.css`  
**问题**：`App.css` 中多处使用 `var(--color-input-bg)`（ImportPreviewModal 的 `.import-name-input`、Gate 面板的 `.gate-input`），但 `tokens.css` 中未定义该变量。在暗色主题下，输入框背景将回退为 `transparent`，导致输入框完全不可见。  
**影响**：导入预览弹窗和文件选择界面的输入框无背景色，用户体验严重受损。  
**修复**：在 `tokens.css` 的 `:root` 中添加 `--color-input-bg: #2a2a2a;`。

---

### 🟠 P1-1：StackItem 空垛位显示 "0×0×0 = 0.00 m³"

**文件**：`src/components/StackItem.jsx`  
**问题**：当垛位尚未录入任何分段尺寸时，`segSummary` 显示为 "0×0×0 = 0.00 m³"，视觉上不友好且无意义。  
**修复**：未录入尺寸时显示 "未录入尺寸" 或 "点击录入"。

---

### 🟠 P1-2：GlobalSettings dosePerPoint 死代码警告

**文件**：`src/components/GlobalSettings.jsx`  
**问题**：`{settings.dosePerPoint <= 0 && <span>须大于 0</span>}` 永远无法触发，因为 `onChange` 中强制 `Math.max(1, ...)`。但旧数据可能在 sanitize 之前为 0，此时警告理应显示。当前 `sanitizeSettings` 在 `migrateData` 中已将值 clamp 到 ≥1，所以该警告在 UI 层是死代码。  
**修复**：保留警告逻辑作为防御，但改为检查初始值（在 sanitize 之前的值），或移除此死代码。

---

### 🟠 P1-3：importData.js JSON 导入缺少深层结构校验

**文件**：`src/utils/importData.js`  
**问题**：`validateProjectData` 仅检查 `warehouses` 是否为数组、`settings` 是否为对象，未校验 `warehouses[].zones`、`zones[].stacks` 等深层结构。恶意的 JSON 文件可能注入畸形数据导致运行时崩溃。  
**影响**：导入畸形 JSON 后，`warehouse.zones.reduce()` 可能在 zones 为 null/undefined 时崩溃。  
**修复**：在 `validateProjectData` 中添加深层结构校验和自动修复。

---

### 🟠 P1-4：useProjects.js migrateData 中 `_v` 字段可能丢失

**文件**：`src/store/useProjects.js`  
**问题**：当数据版本 `v === 0` 时，`migrateData` 创建新对象 `{ _v: 1, ... }`，但如果原始 `data` 有额外字段（如未来扩展字段），这些字段会在迁移中丢失。因为 `data = { _v: 1, settings: {...}, warehouses: ... }` 没有做 `...data` 保留其余字段。  
**修复**：改为 `data = { ...data, _v: 1, settings: {...}, warehouses: ... }` 保留额外字段。

---

### 🟡 P2-1：useStore.js makeActions 接收未使用的 data 参数

**文件**：`src/store/useStore.js`  
**问题**：`export function makeActions(data, updateData)` 中 `data` 参数从未被使用（immer 重构后不再需要外部数据引用）。这是遗留死代码。  
**修复**：移除 `data` 参数。

---

### 🟡 P2-2：ProjectSwitcher 空名称重命名不恢复原值

**文件**：`src/components/ProjectSwitcher.jsx`  
**问题**：`commitRename` 中当 `trimmed` 为空时，仅注释 "do nothing to state"，但输入框仍显示空值，用户看到的是空输入框而非恢复原名。  
**修复**：在取消重命名时显式恢复 `editName` 为原始名称。

---

### 🟡 P2-3：exportExcel.js 合并单元格边界情况

**文件**：`src/utils/exportExcel.js`  
**问题**：当仓库只有一个垛位时，`whTotalRows > 1` 条件阻止合并。但如果仓库有 2 个垛位但只有 1 个区（单区模式），且 `zone.stacks.length > 1` 合并条件，row 索引计算正确但 `whEndRow` 对应的行可能不在数据中（因为 zone merge 跳过了某些行）。经追踪确认无实际 bug，但逻辑较脆弱，建议添加注释。  
**修复**：添加行号计算的防御性注释和断言。

---

### 🟡 P2-4：localStorage.js migrateData 永远不会升级版本

**文件**：`src/lib/localStorage.js`  
**问题**：`migrateData` 检查 `raw._lsv ?? 0`，但 `writeLocal` 在写入时总是设置 `_lsv: LS_DATA_VERSION`（当前为 1）。而 `readLocal` 返回的数据已经通过 `migrateData`，但迁移后 `writeLocal` 再次调用时又设置 `_lsv: 1`。这形成了一个循环——数据一直被标记为 v1，迁移函数 v0→v1 永远不会运行第二次。虽然当前只有一个版本，但结构不清晰。  
**修复**：在 `migrateData` 返回值中不覆盖 `_lsv`，由 `writeLocal` 统一管理版本号。

---

### 🟢 P3-1：缺少 ErrorBoundary 全局错误兜底

**问题**：整个应用没有 React ErrorBoundary，任何组件渲染异常都会导致白屏。  
**建议**：在 App 外层包裹 ErrorBoundary。

---

### 🟢 P3-2：index.html CSP 限制了 worker 脚本

**文件**：`index.html`  
**问题**：CSP 中 `script-src 'self' 'unsafe-inline'` 不允许 `worker-src`。ExcelJS 内部可能使用 Web Worker，在严格 CSP 环境下可能无法正常工作。  
**建议**：添加 `worker-src 'self' blob:`。

---

## 三、修复总结

| 级别 | 数量 | 已修复 |
|------|------|--------|
| 🔴 P0 | 2 | ✅ 2 |
| 🟠 P1 | 4 | ✅ 4 |
| 🟡 P2 | 4 | ✅ 4 |
| 🟢 P3 | 2 | ✅ 2 |
| **合计** | **12** | **12** |

所有修复已应用到 `snake-fixed/` 目录下的对应文件中。
