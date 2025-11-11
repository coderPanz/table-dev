import { useState, useCallback } from "react"

/**
 * 单元格渲染器：超链接
 * 支持编辑链接文本和URL
 */
interface LinkProps {
  value: {
    text: string // 链接显示文本
    url: string // 链接地址
  }
  onChange?: (value: { text: string; url: string }) => void
}

const Link = (props: LinkProps) => {
  const { value = { text: "", url: "" }, onChange } = props
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(value.text)
  const [editUrl, setEditUrl] = useState(value.url)

  // 处理双击进入编辑模式
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsEditing(true)
      setEditText(value.text)
      setEditUrl(value.url)
    },
    [value]
  )

  // 处理文本输入变化
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditText(e.target.value)
    },
    []
  )

  // 处理URL输入变化
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditUrl(e.target.value)
    },
    []
  )

  // 处理保存
  const handleSave = useCallback(() => {
    try {
      setIsEditing(false)
      if (onChange && (editText !== value.text || editUrl !== value.url)) {
        onChange({ text: editText, url: editUrl })
      }
    } catch (error) {
      console.error("保存超链接时出错:", error)
    }
  }, [editText, editUrl, value, onChange])

  // 处理取消
  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditText(value.text)
    setEditUrl(value.url)
  }, [value])

  // 处理链接点击
  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      try {
        if (value.url) {
          e.preventDefault()
          // 确保URL有协议
          const url =
            value.url.startsWith("http://") || value.url.startsWith("https://")
              ? value.url
              : `https://${value.url}`
          window.open(url, "_blank", "noopener,noreferrer")
        }
      } catch (error) {
        console.error("打开链接时出错:", error)
      }
    },
    [value.url]
  )

  if (isEditing) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "4px",
          backgroundColor: "#fff",
          border: "1px solid #1890ff",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* 文本输入 */}
        <input
          type="text"
          value={editText}
          onChange={handleTextChange}
          placeholder="链接文本"
          autoFocus
          style={{
            flex: 1,
            border: "1px solid #d9d9d9",
            padding: "2px 4px",
            fontSize: "12px",
            outline: "none",
            borderRadius: "2px",
          }}
        />
        {/* URL输入 */}
        <input
          type="text"
          value={editUrl}
          onChange={handleUrlChange}
          placeholder="链接地址"
          style={{
            flex: 1,
            border: "1px solid #d9d9d9",
            padding: "2px 4px",
            fontSize: "12px",
            outline: "none",
            borderRadius: "2px",
          }}
        />
        {/* 操作按钮 */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "2px",
              fontSize: "12px",
              backgroundColor: "#1890ff",
              color: "#fff",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: "2px",
              fontSize: "12px",
              backgroundColor: "#f0f0f0",
              color: "#333",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  // 显示模式
  if (value.text && value.url) {
    return (
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          width: "100%",
          height: "100%",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <a
          href={value.url}
          onClick={handleLinkClick}
          style={{
            color: "#1890ff",
            textDecoration: "underline",
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={`${value.text}\n${value.url}`}
        >
          {value.text}
        </a>
      </div>
    )
  }

  // 空状态
  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: "100%",
        height: "100%",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        color: "#999",
        cursor: "pointer",
      }}
    >
      双击添加链接
    </div>
  )
}

export default Link
