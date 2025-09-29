import React from "react"

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
    rows: 100,
    columns: 10,
  }

  const tableData = generateTableData(config)

  return (
    <div style={{ width: "100%" }}>
      {/* 表头 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
          backgroundColor: "#f5f5f5",
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
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
  )
}

export default TableDom
