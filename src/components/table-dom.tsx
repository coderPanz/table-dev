import React, { useState, useEffect, useRef } from "react"

interface TableConfig {
  rows: number
  columns: number
}

const generateTableData = (config: TableConfig) => {
  const data = []
  for (let i = 0; i < config.rows; i++) {
    const row: Record<string, string | number> = {}
    for (let j = 0; j < config.columns; j++) {
      row[`column${j + 1}`] = `数据 ${i + 1}-${j + 1}`
    }
    data.push(row)
  }
  return data
}

// 直接操作 DOM 的方式去渲染表格数据，巨量数据场景性能表现拉跨。
const TableDom = (): React.ReactNode => {
  const config: TableConfig = {
    rows: 10000,
    columns: 10,
  }

  const tableData = generateTableData(config)

  // 渲染时间测量
  const [renderTime, setRenderTime] = useState<number | null>(null)
  const startTimeRef = useRef<number>(performance.now())

  /**
   * 测量初始渲染时间
   */
  useEffect(() => {
    try {
      const endTime = performance.now()
      const duration = endTime - startTimeRef.current
      setRenderTime(duration)
      console.log(`DOM渲染方案 - 渲染时间: ${duration.toFixed(2)}ms`)
    } catch (error) {
      console.error("测量渲染时间时出错:", error)
    }
  }, [])

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 渲染时间显示 */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f0f2f5",
          borderBottom: "2px solid #1890ff",
          fontWeight: "bold",
          fontSize: "16px",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#1890ff" }}>DOM直接渲染方案</span>
        {renderTime !== null && (
          <span style={{ marginLeft: "20px", color: "#52c41a" }}>
            渲染时间: {renderTime.toFixed(2)}ms
          </span>
        )}
        <span style={{ marginLeft: "20px", color: "#666", fontSize: "14px" }}>
          (数据量: {config.rows} 行 × {config.columns} 列)
        </span>
      </div>

      {/* 滚动容器 */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          width: "100%",
        }}
      >
        {/* 表头 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
            backgroundColor: "#f5f5f5",
            fontWeight: "bold",
            borderBottom: "1px solid #ddd",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          {Array.from({ length: config.columns }, (_, index) => (
            <div
              key={`header-${index}`}
              style={{
                padding: "12px",
                borderRight:
                  index < config.columns - 1 ? "1px solid #ddd" : "none",
              }}
            >
              列 {index + 1}
            </div>
          ))}
        </div>

        {/* 表格内容 */}
        {tableData.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
              borderBottom: "1px solid #ddd",
            }}
          >
            {Array.from({ length: config.columns }, (_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                style={{
                  padding: "12px",
                  borderRight:
                    colIndex < config.columns - 1 ? "1px solid #ddd" : "none",
                }}
              >
                {row[`column${colIndex + 1}`]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableDom
