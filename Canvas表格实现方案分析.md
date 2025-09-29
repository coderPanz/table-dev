# Canvas 表格实现方案分析

## 概述

本方案实现了一个基于 Canvas 的高性能表格组件，通过虚拟滚动技术处理大数据量表格渲染问题。该方案能够流畅渲染 10000 行 × 50 列的表格数据，相比传统 DOM 渲染方式具有显著的性能优势。

## 核心技术特点

- **Canvas 渲染**: 使用 HTML5 Canvas API 进行表格绘制，避免大量 DOM 元素创建
- **虚拟滚动**: 只渲染可视区域内的数据行，大幅减少渲染开销
- **React Hooks**: 采用函数式组件和 Hooks 进行状态管理
- **性能优化**: 多项优化策略确保流畅的用户体验

## 整体实现流程

### 1. 组件初始化阶段

#### 1.1 配置定义

```typescript
interface TableConfig {
  rows: number // 行数: 10000
  columns: number // 列数: 50
  cellWidth: number // 单元格宽度: 150px
  cellHeight: number // 单元格高度: 40px
  headerHeight: number // 表头高度: 50px
}
```

#### 1.2 数据生成

- 使用 `generateTableData` 函数创建模拟数据
- 通过 `useMemo` 缓存数据，避免重复生成
- 数据格式: `{column1: "数据 1-1", column2: "数据 1-2", ...}`

#### 1.3 状态初始化

```typescript
interface ViewportInfo {
  startRow: number // 开始渲染的行索引
  endRow: number // 结束渲染的行索引
  scrollTop: number // 垂直滚动位置
  scrollLeft: number // 水平滚动位置
}
```

### 2. Canvas 设置阶段

#### 2.1 尺寸计算

- **总宽度**: `columns × cellWidth = 50 × 150 = 7500px`
- **总高度**: `rows × cellHeight + headerHeight = 10000 × 40 + 50 = 400050px`

#### 2.2 Canvas 初始化

- 设置 Canvas 物理尺寸为容器大小
- 考虑设备像素比（DPR）确保高清显示
- 使用 ResizeObserver 监听容器尺寸变化

### 3. 可视区域计算

#### 3.1 核心算法

```typescript
const calculateVisibleRows = (scrollTop: number, clientHeight: number) => {
  // 计算开始行（减去表头高度）
  const startRow = Math.floor((scrollTop - headerHeight) / cellHeight)

  // 计算可见行数并添加缓冲区
  const visibleRows = Math.ceil(clientHeight / cellHeight)
  const endRow = Math.min(startRow + visibleRows + 5, rows - 1)

  return { startRow: Math.max(0, startRow), endRow }
}
```

#### 3.2 优化策略

- **缓冲区**: 额外渲染 5 行，优化滚动体验
- **边界处理**: 确保行索引不超出数据范围
- **记忆化**: 使用 useCallback 避免重复计算

### 4. Canvas 渲染流程

#### 4.1 渲染步骤

1. **清除画布**: `ctx.clearRect(0, 0, canvas.width, canvas.height)`
2. **绘制表头**:
   - 背景色: `#f5f5f5`
   - 列标题: "列 1", "列 2", ...
   - 分割线: 垂直和水平线条
3. **绘制数据行**:
   - 只渲染可视区域内的行
   - 跳过可视区域外的列以优化性能
   - 绘制单元格内容和边框

#### 4.2 坐标计算

- **X 坐标**: `col × cellWidth - scrollLeft`
- **Y 坐标**: `headerHeight + row × cellHeight - scrollTop`
- **可见性判断**: 检查是否在 Canvas 可视范围内

### 5. 滚动处理机制

#### 5.1 事件处理

```typescript
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const container = e.currentTarget
  const { startRow, endRow } = calculateVisibleRows(
    container.scrollTop,
    container.clientHeight
  )

  setViewport({
    startRow,
    endRow,
    scrollTop: container.scrollTop,
    scrollLeft: container.scrollLeft,
  })
}
```

#### 5.2 渲染触发

- 监听滚动位置变化
- 使用 useEffect 在滚动后重新渲染
- 避免在渲染函数中更新状态，防止无限循环

### 6. 布局结构

#### 6.1 DOM 层级

```
<div> (滚动容器)
  ├── <div> (占位元素 - 提供滚动区域)
  └── <canvas> (渲染层 - sticky定位)
```

#### 6.2 样式设计

- **容器**: 100%宽度，100vh 高度，overflow: auto
- **占位元素**: 绝对定位，设置完整的表格尺寸
- **Canvas**: sticky 定位，覆盖整个可视区域

## 性能优化策略

### 1. 内存优化

- **useMemo**: 缓存配置对象、表格数据、计算结果
- **useCallback**: 缓存事件处理函数，避免重复创建
- **数据结构**: 使用简单的对象数组，减少内存占用

### 2. 渲染优化

- **虚拟滚动**: 只渲染可视区域，最多渲染约 20-30 行
- **列裁剪**: 跳过可视区域外的列渲染
- **Canvas 复用**: 避免频繁创建销毁 Canvas 元素

### 3. 滚动优化

- **缓冲区**: 预渲染额外行数，减少滚动时的白屏
- **节流**: React 的批量更新机制自然提供节流效果
- **增量更新**: 只更新变化的滚动位置

### 4. 显示优化

- **高 DPI 支持**: 处理设备像素比，确保高清显示
- **自适应缩放**: Canvas 自动适配容器尺寸变化
- **字体优化**: 设置合适的字体和基线对齐

## 技术优势

### 1. 性能表现

- **内存占用**: 始终保持较低水平，不随数据量线性增长
- **渲染速度**: Canvas 直接操作像素，渲染效率高
- **滚动流畅**: 虚拟滚动确保大数据量下的流畅体验

### 2. 扩展性

- **数据量**: 可轻松处理百万级数据
- **定制化**: Canvas 渲染提供完全的样式控制
- **功能扩展**: 易于添加单元格编辑、选择等交互功能

### 3. 兼容性

- **浏览器支持**: 现代浏览器广泛支持 Canvas API
- **响应式**: 自动适配不同屏幕尺寸和像素密度
- **React 集成**: 与 React 生态系统无缝集成

## 适用场景

1. **大数据表格**: 万行以上数据的展示和操作
2. **实时数据**: 需要频繁更新的数据面板
3. **性能要求高**: 对渲染性能有严格要求的场景
4. **定制化需求**: 需要特殊样式或交互的表格组件

## 潜在改进方向

1. **交互功能**: 添加单元格编辑、选择、排序等功能
2. **数据管理**: 集成虚拟化的数据加载和缓存机制
3. **样式系统**: 支持主题和样式定制
4. **无障碍支持**: 添加键盘导航和屏幕阅读器支持

## 总结

该 Canvas 表格方案通过虚拟滚动和 Canvas 渲染技术，成功解决了大数据量表格的性能问题。核心思想是"按需渲染"，只绘制用户当前可见的部分，从而实现了常数级的性能表现。整个方案设计合理，代码结构清晰，是处理大型表格数据的优秀解决方案。
