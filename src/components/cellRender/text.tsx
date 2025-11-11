import { useState, useCallback } from "react"

/**
 * 单元格渲染器：文本
 * 支持点击编辑功能
 */
interface TextProps {
  value: string
  onChange?: (value: string) => void
}

const Text = (props: TextProps) => {
  const { value, onChange } = props
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  // 处理双击进入编辑模式
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setInputValue(value)
  }, [value])

  // 处理输入框值变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  // 处理失去焦点，保存修改
  const handleBlur = useCallback(() => {
    try {
      setIsEditing(false)
      if (onChange && inputValue !== value) {
        onChange(inputValue)
      }
    } catch (error) {
      console.error("保存文本时出错:", error)
    }
  }, [inputValue, value, onChange])

  // 处理按键事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      try {
        if (e.key === "Enter") {
          // 回车键保存
          e.currentTarget.blur()
        } else if (e.key === "Escape") {
          // ESC键取消编辑
          setInputValue(value)
          setIsEditing(false)
        }
      } catch (error) {
        console.error("处理按键事件时出错:", error)
      }
    },
    [value]
  )

  if (isEditing) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #1890ff",
          padding: "4px 8px",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    )
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: "100%",
        height: "100%",
        padding: "4px 8px",
        cursor: "text",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={value}
    >
      {value}
    </div>
  )
}

export default Text
