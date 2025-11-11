import { useState, useCallback } from "react"

/**
 * 单元格渲染器：多选框
 * 支持点击选择多个选项
 */
interface CheckboxProps {
  value: string[] // 已选中的值数组
  options?: string[] // 可选项列表
  onChange?: (value: string[]) => void
}

const Checkbox = (props: CheckboxProps) => {
  const { value = [], options = ["选项1", "选项2", "选项3"], onChange } = props
  const [isExpanded, setIsExpanded] = useState(false)

  // 处理点击展开选项
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // 处理选择/取消选择选项
  const handleToggle_option = useCallback(
    (option: string) => {
      try {
        if (onChange) {
          const newValue = value.includes(option)
            ? value.filter(v => v !== option) // 取消选择
            : [...value, option] // 选择
          onChange(newValue)
        }
      } catch (error) {
        console.error("切换多选项时出错:", error)
      }
    },
    [value, onChange]
  )

  // 处理失去焦点
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsExpanded(false)
    }, 200)
  }, [])

  // 显示的文本
  const displayText = value.length > 0 ? value.join(", ") : "请选择"

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
      onBlur={handleBlur}
      tabIndex={0}
    >
      {/* 显示区域 */}
      <div
        onClick={handleToggle}
        style={{
          width: "100%",
          height: "100%",
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          backgroundColor: isExpanded ? "#f0f0f0" : "transparent",
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={displayText}
        >
          {displayText}
        </span>
        <span style={{ marginLeft: "4px", color: "#999" }}>▼</span>
      </div>

      {/* 选项列表 */}
      {isExpanded && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {options.map((option, index) => {
            const isChecked = value.includes(option)
            return (
              <div
                key={index}
                onClick={() => handleToggle_option(option)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: isChecked ? "#e6f7ff" : "transparent",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={e => {
                  if (!isChecked) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }
                }}
                onMouseLeave={e => {
                  if (!isChecked) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                {/* 多选框图标 */}
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #1890ff",
                    borderRadius: "2px",
                    marginRight: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: isChecked ? "#1890ff" : "transparent",
                  }}
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                    >
                      <polyline points="3,8 6,11 13,4" />
                    </svg>
                  )}
                </span>
                {option}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Checkbox
