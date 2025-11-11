import { useState, useCallback } from "react"

/**
 * 单元格渲染器：单选框
 * 支持点击选择选项
 */
interface RadioProps {
  value: string
  options?: string[] // 可选项列表
  onChange?: (value: string) => void
}

const Radio = (props: RadioProps) => {
  const { value, options = ["选项1", "选项2", "选项3"], onChange } = props
  const [isExpanded, setIsExpanded] = useState(false)

  // 处理点击展开选项
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // 处理选择选项
  const handleSelect = useCallback(
    (option: string) => {
      try {
        setIsExpanded(false)
        if (onChange && option !== value) {
          onChange(option)
        }
      } catch (error) {
        console.error("选择单选项时出错:", error)
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
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "2px solid #1890ff",
            marginRight: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {value && (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#1890ff",
              }}
            />
          )}
        </span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || "请选择"}
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
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                backgroundColor: option === value ? "#e6f7ff" : "transparent",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={e => {
                if (option !== value) {
                  e.currentTarget.style.backgroundColor = "#f5f5f5"
                }
              }}
              onMouseLeave={e => {
                if (option !== value) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid #1890ff",
                  marginRight: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {option === value && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#1890ff",
                    }}
                  />
                )}
              </span>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Radio
