# 投药量计算工具 — 需求分析、实现与测试报告

**项目名称**：dose-calculator  
**技术栈**：React 18 + Vite + XLSX  
**报告日期**：2026-05-18

---

## 一、需求分析

### 1.1 背景与目标

仓储粮食熏蒸作业需要根据垛位体积、投药密度和每点投药量三个参数，精确计算各垛位所需的药剂量和投药点数。人工计算易出错、效率低，且难以在多仓多区场景下汇总统计。本工具旨在提供一套结构化的录入-计算-导出流程，覆盖从单垛位分段尺寸录入到全仓汇总导出的完整场景。

### 1.2 核心业务规则

| 计算项 | 公式 |
|--------|------|
| 分段体积 | `V_seg = 长 × 宽 × 高` (m³) |
| 垛位体积 | `V_stack = Σ V_seg` |
| 垛位投药量 | `Dose = V_stack × density` (g) |
| 垛位投药点数 | `Points = ⌈Dose / dosePerPoint⌉` |
| 区 / 库 / 全局汇总 | 向上逐级累加 |

### 1.3 数据层级

```
项目 (Project)
 └─ 仓库 (Warehouse)  [1..n]
     └─ 区 (Zone)      [1..n]
         └─ 垛位 (Stack) [1..n]
             └─ 分段 (Segment) [1..n]
```

每个实体具有唯一 `id`（随机 7 位 base-36 字符串）。

### 1.4 功能需求

**F1 全局参数**
- 投药密度（g/m³，默认 5）
- 每点投药量（g，默认 200）
- 投药量单位（g / kg 切换）
- 仓库列自定义名称（用于 Excel 列头）

**F2 数据录入**
- 仓库：增删改名
- 区：归属于仓库，增删改名
- 垛位：归属于区，增删改编号；点击进入详情页
- 分段：归属于垛位，录入长/宽/高，支持多段（不规则形状）

**F3 计算与展示**
- 各级实时汇总（体积、投药量、投药点数）
- 底部固定 SummaryBar，展示全局总计
- SummaryModal 树形总览弹窗（库 → 区 → 垛）

**F4 多项目管理**
- 新建 / 切换 / 重命名 / 删除项目
- localStorage 持久化（键：`dose-calculator-projects`、`dose-calculator-active-project`）

**F5 导入 / 导出**
- 导出 Excel（.xlsx）：带合并单元格、加粗表头，含总计行
- 备份导出 JSON：完整项目结构（`{ name, data }`）
- 导入 JSON：支持全量备份格式和裸数据格式
- 导入 Excel：从本工具导出的 .xlsx 还原仓库/垛位列表（分段尺寸无法还原）

**F6 非功能需求**
- 纯前端离线运行，无后端依赖
- 支持移动端（手机端录入），字段使用 `inputMode="decimal"`
- 数据不可变更新（所有状态变更返回新对象）

### 1.5 用户角色

主要用户为仓库熏蒸作业人员，在移动端或 PC 端录入尺寸数据，最终导出 Excel 交付管理层存档。

---

## 二、实现说明

### 2.1 项目结构

```
src/
├── App.jsx                  # 根组件，路由主视图与详情视图
├── store/
│   ├── useProjects.js       # 多项目 CRUD + localStorage 持久化
│   └── useStore.js          # 不可变 actions 工厂（makeActions）
├── utils/
│   ├── calc.js              # 纯函数计算层
│   ├── importData.js        # JSON / Excel 导入 + JSON 导出
│   └── exportExcel.js       # Excel 导出（xlsx 库）
├── components/
│   ├── GlobalSettings.jsx   # 折叠式全局参数面板
│   ├── ProjectSwitcher.jsx  # 项目下拉切换器
│   ├── WarehouseList.jsx    # 仓库列表容器
│   ├── WarehouseItem.jsx    # 单仓库（含区列表）
│   ├── ZoneItem.jsx         # 单区（含垛列表）
│   ├── StackItem.jsx        # 垛位行（点击进入详情）
│   ├── StackDetail.jsx      # 垛位详情页（分段编辑）
│   ├── SegmentRow.jsx       # 单分段输入卡片
│   ├── SummaryBar.jsx       # 底部固定汇总条
│   ├── SummaryModal.jsx     # 汇总弹窗（树形）
│   └── ImportButton.jsx     # 文件选择器封装
└── styles/
    ├── tokens.css           # 设计 token（颜色/间距/字体）
    └── global.css           # 全局样式
```

### 2.2 状态管理

```
useProjects (useState + localStorage)
  ├── projects[]             ← 完整项目数组，写入 localStorage
  └── activeId               ← 当前项目 ID，写入 localStorage

makeActions(data, updateActiveData)
  └── 返回所有 CRUD 操作的闭包
      每个操作均通过 spread/map 产生新对象（不可变）
```

`App.jsx` 通过 `activeProject.data` 拿到当前项目数据，调用 `makeActions` 得到操作集，向下透传给各组件。组件不持有数据状态，仅接收 props 并调用 actions，符合单向数据流原则。

### 2.3 计算层设计（`calc.js`）

全部为纯函数，无副作用，逐级向上组合：

```
segmentVolume → stackVolume → zoneVolume → warehouseVolume → totalVolume
                stackDose   → zoneDose   → warehouseDose   → totalDose
                stackPoints → zonePoints → warehousePoints → totalPoints
```

单位转换通过 `formatDose(grams, unit)` 统一处理：
- `'g'`：保留 1 位小数
- `'kg'`：除以 1000，保留 3 位小数

### 2.4 导入 / 导出

**Excel 导出** — `exportExcel.js`
- 列：仓库名 / 垛位编号 / 投药点 / 投药量 / 体积 / 总计投药量
- 同一仓库的"仓库名"列和"总计投药量"列做行合并（`!merges`）
- 表头行和总计行加粗（`ws[key].s.font`）

**JSON 导入** — 兼容两种格式：
1. 完整项目备份：`{ name, data: { settings, warehouses } }`
2. 裸数据：`{ settings, warehouses }`

**Excel 导入** — 从导出的 xlsx 还原仓库/垛位结构：
- 识别"总计"行并跳过
- Col A 有值 → 新建仓库（同时新建默认区"1区"）
- Col B 有值 → 新建垛位（附加到当前仓库的默认区）
- 分段尺寸无法从 Excel 还原，留空段占位

### 2.5 关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 状态持久化 | localStorage | 纯前端离线，无需后端 |
| 不可变更新 | spread + map | 防止隐式副作用，便于调试 |
| 计算层独立 | 纯函数 `calc.js` | 与 UI 解耦，易于单元测试 |
| 视图切换 | 条件渲染（非路由） | 单 HTML 文件部署，无需 URL 路由 |
| Excel 库 | `xlsx@0.18.5` | 轻量、无原生依赖，支持 AOA → sheet |

---

## 三、测试报告

### 3.1 测试范围

当前版本**无自动化测试**，以下为人工验证结果，并附单元测试用例设计。

### 3.2 计算逻辑验证（纯函数单元测试设计）

以下用例针对 `src/utils/calc.js`，可用 Vitest / Jest 直接运行。

#### 3.2.1 `segmentVolume`

| 输入 | 期望输出 | 描述 |
|------|----------|------|
| `{ length: 10, width: 5, height: 2 }` | `100` | 正常计算 |
| `{ length: '', width: 5, height: 2 }` | `0` | 空字符串当 0 |
| `{ length: 'abc', width: 5, height: 2 }` | `0` | NaN 输入当 0 |
| `{ length: 0, width: 5, height: 2 }` | `0` | 零维度 |

#### 3.2.2 `stackPoints`

| 输入 | 期望输出 | 描述 |
|------|----------|------|
| `stack(200m³), density=5, dosePerPoint=200` | `5` | 恰好整除 |
| `stack(201m³), density=5, dosePerPoint=200` | `6` | 向上取整 |
| `stack(100m³), density=5, dosePerPoint=0` | `0` | dosePerPoint 为 0 时不除 |

#### 3.2.3 `formatDose`

| 输入 | 期望输出 |
|------|----------|
| `(1500, 'g')` | `'1500.0'` |
| `(1500, 'kg')` | `'1.500'` |
| `(0, 'g')` | `'0.0'` |

### 3.3 导入功能验证

#### JSON 导入

| 场景 | 测试输入 | 期望行为 |
|------|----------|----------|
| 完整备份格式 | `{ name: "X", data: { settings:{}, warehouses:[] } }` | 正常导入，项目名为 "X" |
| 裸数据格式 | `{ settings:{}, warehouses:[] }` | 正常导入，项目名为 "导入项目" |
| 无效 JSON | `"{ broken"` | 抛出"文件不是有效的 JSON 格式" |
| 缺少 warehouses | `{ settings:{} }` | 抛出"JSON 结构不匹配" |
| 缺少 settings | `{ warehouses:[] }` | 抛出"数据缺少 settings 字段" |

#### Excel 导入

| 场景 | 期望行为 |
|------|----------|
| 标准导出文件 | 正确解析仓库名和垛位编号 |
| 多仓库多垛位 | 每仓库独立，垛位归属正确 |
| 包含"总计"行 | 跳过总计行，不新建仓库 |
| 空工作表 | 抛出"Excel 数据为空" |
| 无法识别格式 | 抛出"Excel 格式不匹配" |

### 3.4 持久化验证

| 场景 | 期望行为 |
|------|----------|
| 首次访问 | 自动创建"项目 1"并持久化 |
| 录入数据后刷新页面 | 数据完整保留 |
| 切换项目后刷新 | 保持上次活跃项目 |
| 删除所有项目 | 自动创建"项目 1" |
| localStorage 被清空 | 退化到默认空项目 |

### 3.5 边界情况验证

| 场景 | 结果 |
|------|------|
| 所有分段尺寸为空 | 体积=0，投药量=0，点数=0，不报错 |
| density=0 | 投药量=0，点数=0 |
| dosePerPoint=0 | 点数=0（有防零除保护） |
| 单垛位包含 10 个分段 | 正确累加 |
| 仓库名为空 | Excel 导出显示"(未命名)" |
| 垛位编号为空 | 列表显示"未编号"，Excel 显示"(未编号)" |

### 3.6 已知限制

1. **Excel 导入不还原分段尺寸** — Excel 格式仅存储汇总数值，无法反推各分段尺寸；导入后垛位含一个空分段占位，需手动补录。

2. **无输入防抖** — 每次按键均触发重新计算和 localStorage 写入；数据量较大时在低端设备上可能感知延迟。

3. **无数据迁移机制** — localStorage 数据结构变更时无版本升级逻辑，旧数据可能读取异常。

4. **无自动化测试** — 当前无 Vitest/Jest 配置；计算逻辑已充分解耦，可低成本补入。

### 3.7 推荐后续改进

| 优先级 | 改进项 |
|--------|--------|
| 高 | 为 `calc.js` 和 `importData.js` 补充 Vitest 单元测试 |
| 高 | localStorage 写入防抖（200ms），避免频繁 IO |
| 中 | 数据结构版本号 + 迁移函数 |
| 中 | 导入前数据预览/确认弹窗 |
| 低 | 支持从 Excel 导入时手动补录分段尺寸 |

---

## 四、总结

投药量计算工具以纯函数计算层 + 不可变状态管理为核心，实现了从分段尺寸录入到多级汇总、Excel 导出的完整流程。代码结构层次清晰（数据 → 计算 → 状态 → UI），计算层与 UI 解耦良好，具备较好的可测试性。当前主要缺口为自动化测试覆盖，建议优先补入 `calc.js` 和导入工具的单元测试，以保障核心业务逻辑的正确性。
