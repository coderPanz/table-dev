# 单元格渲染器

为表格提供多种可输入的字段类型，包括文本、单选框、多选框和超链接。

## 可用的单元格类型

### 1. 文本（Text）

可编辑的文本输入框，支持双击编辑。

**特性：**

- 双击进入编辑模式
- 按 Enter 保存修改
- 按 ESC 取消编辑
- 失去焦点时自动保存

**Props：**

- `value: string` - 文本值
- `onChange?: (value: string) => void` - 值变化回调

**使用示例：**

```tsx
import { Text } from "./components/cellRender"
;<Text value="这是一段文本" onChange={newValue => console.log(newValue)} />
```

---

### 2. 单选框（Radio）

单选框组件，支持从预定义选项中选择一个。

**特性：**

- 点击展开选项列表
- 单选模式，只能选择一个选项
- 支持自定义选项列表
- 显示已选中的选项

**Props：**

- `value: string` - 当前选中的值
- `options?: string[]` - 可选项列表（默认：`["选项1", "选项2", "选项3"]`）
- `onChange?: (value: string) => void` - 选择变化回调

**使用示例：**

```tsx
import { Radio } from "./components/cellRender"
;<Radio
  value="选项2"
  options={["选项1", "选项2", "选项3"]}
  onChange={newValue => console.log(newValue)}
/>
```

---

### 3. 多选框（Checkbox）

多选框组件，支持从预定义选项中选择多个。

**特性：**

- 点击展开选项列表
- 多选模式，可以选择多个选项
- 支持自定义选项列表
- 显示所有已选中的选项

**Props：**

- `value: string[]` - 已选中的值数组
- `options?: string[]` - 可选项列表（默认：`["选项1", "选项2", "选项3"]`）
- `onChange?: (value: string[]) => void` - 选择变化回调

**使用示例：**

```tsx
import { Checkbox } from "./components/cellRender"
;<Checkbox
  value={["选项1", "选项3"]}
  options={["选项1", "选项2", "选项3", "选项4"]}
  onChange={newValue => console.log(newValue)}
/>
```

---

### 4. 超链接（Link）

超链接组件，支持编辑链接文本和 URL。

**特性：**

- 单击链接在新标签页中打开
- 双击进入编辑模式
- 可分别编辑链接文本和地址
- 提供保存和取消按钮

**Props：**

- `value: { text: string, url: string }` - 链接对象
  - `text` - 链接显示文本
  - `url` - 链接地址
- `onChange?: (value: { text: string, url: string }) => void` - 值变化回调

**使用示例：**

```tsx
import { Link } from "./components/cellRender"
;<Link
  value={{ text: "访问 React 官网", url: "https://react.dev" }}
  onChange={newValue => console.log(newValue)}
/>
```

---

## 统一渲染器使用

使用 `CellRender` 组件可以根据类型动态渲染不同的单元格：

```tsx
import CellRender from './components/cell-render'

// 文本类型
<CellRender
  type="text"
  value="文本内容"
  onChange={(value) => console.log(value)}
/>

// 单选框类型
<CellRender
  type="radio"
  value="选项2"
  options={["选项1", "选项2", "选项3"]}
  onChange={(value) => console.log(value)}
/>

// 多选框类型
<CellRender
  type="checkbox"
  value={["选项1", "选项3"]}
  options={["选项1", "选项2", "选项3"]}
  onChange={(value) => console.log(value)}
/>

// 超链接类型
<CellRender
  type="link"
  value={{ text: "React 官网", url: "https://react.dev" }}
  onChange={(value) => console.log(value)}
/>
```

---

## 完整示例

查看 `example.tsx` 文件获取完整的使用示例。

---

## 异常处理

所有组件都包含了 try-catch 异常处理，确保在出现错误时不会影响整个应用：

- 文本编辑保存异常
- 单选/多选项切换异常
- 超链接保存和打开异常

异常会在控制台输出错误信息，方便调试。

---

## 样式说明

所有组件都使用内联样式，无需额外的 CSS 文件。样式基于蓝色主题（#1890ff），与 Ant Design 风格一致。

---

## TypeScript 支持

所有组件都提供了完整的 TypeScript 类型定义，包括 Props 接口和类型提示。
