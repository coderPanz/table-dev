import { Text, Radio, Checkbox, Link } from "./cellRender"

/**
 * 单元格渲染器配置
 * 统一管理所有可用的单元格类型
 */
export const CellRenderers = {
  text: Text,
  radio: Radio,
  checkbox: Checkbox,
  link: Link,
}

/**
 * 单元格类型
 */
export type CellType = keyof typeof CellRenderers

/**
 * 单元格配置接口
 */
export interface CellConfig {
  type: CellType // 单元格类型
  value: any // 单元格值
  options?: string[] // 选项列表（用于 radio 和 checkbox）
  onChange?: (value: any) => void // 值变化回调
}

/**
 * 单元格渲染器
 * 根据配置渲染对应类型的单元格
 */
const CellRender = (props: CellConfig) => {
  const { type, value, options, onChange } = props
  const Renderer = CellRenderers[type]

  if (!Renderer) {
    return <div>不支持的单元格类型</div>
  }

  // 根据不同类型传递不同的 props
  if (type === "text") {
    return <Renderer value={value} onChange={onChange} />
  } else if (type === "radio") {
    return <Renderer value={value} options={options} onChange={onChange} />
  } else if (type === "checkbox") {
    return <Renderer value={value} options={options} onChange={onChange} />
  } else if (type === "link") {
    return <Renderer value={value} onChange={onChange} />
  }

  return null
}

export default CellRender