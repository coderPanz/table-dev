import { useState } from "react"
import CellRender from "../cell-render"

/**
 * 单元格渲染器使用示例
 * 展示如何使用不同类型的单元格渲染器
 */
const CellRendererExample = () => {
  // 文本类型示例
  const [textValue, setTextValue] = useState("这是一段文本")

  // 单选框类型示例
  const [radioValue, setRadioValue] = useState("选项2")
  const radioOptions = ["选项1", "选项2", "选项3"]

  // 多选框类型示例
  const [checkboxValue, setCheckboxValue] = useState(["选项1", "选项3"])
  const checkboxOptions = ["选项1", "选项2", "选项3", "选项4"]

  // 超链接类型示例
  const [linkValue, setLinkValue] = useState({
    text: "访问 React 官网",
    url: "https://react.dev",
  })

  return (
    <div style={{ padding: "20px" }}>
      <h1>单元格渲染器使用示例</h1>

      {/* 文本类型 */}
      <div style={{ marginBottom: "30px" }}>
        <h3>1. 文本类型</h3>
        <div
          style={{
            width: "300px",
            height: "40px",
            border: "1px solid #d9d9d9",
          }}
        >
          <CellRender
            type="text"
            value={textValue}
            onChange={value => {
              setTextValue(value)
              console.log("文本值变化:", value)
            }}
          />
        </div>
        <p style={{ color: "#666", fontSize: "12px" }}>
          双击单元格进入编辑模式，按 Enter 保存，按 ESC 取消
        </p>
        <p style={{ fontSize: "14px" }}>当前值: {textValue}</p>
      </div>

      {/* 单选框类型 */}
      <div style={{ marginBottom: "30px" }}>
        <h3>2. 单选框类型</h3>
        <div
          style={{
            width: "300px",
            height: "40px",
            border: "1px solid #d9d9d9",
          }}
        >
          <CellRender
            type="radio"
            value={radioValue}
            options={radioOptions}
            onChange={value => {
              setRadioValue(value)
              console.log("单选值变化:", value)
            }}
          />
        </div>
        <p style={{ color: "#666", fontSize: "12px" }}>
          点击单元格展开选项列表，选择一个选项
        </p>
        <p style={{ fontSize: "14px" }}>当前值: {radioValue}</p>
      </div>

      {/* 多选框类型 */}
      <div style={{ marginBottom: "30px" }}>
        <h3>3. 多选框类型</h3>
        <div
          style={{
            width: "300px",
            height: "40px",
            border: "1px solid #d9d9d9",
          }}
        >
          <CellRender
            type="checkbox"
            value={checkboxValue}
            options={checkboxOptions}
            onChange={value => {
              setCheckboxValue(value)
              console.log("多选值变化:", value)
            }}
          />
        </div>
        <p style={{ color: "#666", fontSize: "12px" }}>
          点击单元格展开选项列表，可以选择多个选项
        </p>
        <p style={{ fontSize: "14px" }}>当前值: {checkboxValue.join(", ")}</p>
      </div>

      {/* 超链接类型 */}
      <div style={{ marginBottom: "30px" }}>
        <h3>4. 超链接类型</h3>
        <div
          style={{
            width: "300px",
            height: "40px",
            border: "1px solid #d9d9d9",
          }}
        >
          <CellRender
            type="link"
            value={linkValue}
            onChange={value => {
              setLinkValue(value)
              console.log("链接值变化:", value)
            }}
          />
        </div>
        <p style={{ color: "#666", fontSize: "12px" }}>
          单击链接打开，双击编辑链接文本和地址
        </p>
        <p style={{ fontSize: "14px" }}>
          当前值: {linkValue.text} ({linkValue.url})
        </p>
      </div>
    </div>
  )
}

export default CellRendererExample
