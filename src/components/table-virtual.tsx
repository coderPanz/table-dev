import React, { useState, useEffect, useRef, useCallback, memo } from "react"

interface TableConfig {
  rows: number
  columns: number
  rowHeight: number // 行高固定
  columnWidth: number // 列宽固定
  visibleRows: number // 可视区域显示的行数
  bufferRows: number // 缓冲区行数
}

interface TableData {
  [key: string]: string | number
}

// 生成表格数据
const generateTableData = (config: TableConfig): TableData[] => {
  const data = []
  // 生成大量数据，用于测试虚拟列表
  for (let i = 0; i < config.rows; i++) {
    const row: Record<string, string | number> = {}
    for (let j = 0; j < config.columns; j++) {
      row[`column${j + 1}`] = `数据 ${i + 1}-${j + 1}`
    }
    data.push(row)
  }
  return data
}

// 虚拟列表实现的表格组件
const TableVirtual = (): React.ReactNode => {
  // 表格配置，可以根据需要调整
  const config: TableConfig = {
    rows: 10000, // 总行数（大数据量）
    columns: 10, // 总列数
    rowHeight: 50, // 每行高度（固定）
    columnWidth: 150, // 每列宽度（固定）
    visibleRows: 10, // 可视区域显示的行数
    bufferRows: 5, // 上下缓冲区行数
  }

  // 生成表格数据
  const tableData = generateTableData(config)

  // 滚动容器的引用
  const scrollRef = useRef<HTMLDivElement>(null)

  // 可见范围状态
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(
    config.visibleRows + config.bufferRows
  )

  // 计算表格总高度
  const totalHeight = config.rows * config.rowHeight
  // 计算表格总宽度
  const totalWidth = config.columns * config.columnWidth

  // 用于节流的上一次滚动处理时间
  const lastScrollTimeRef = useRef<number>(0)
  // 节流时间间隔（毫秒）
  const throttleInterval = 16 // 约等于60fps

  // 处理滚动事件，更新可视区域（使用节流优化）
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      // 获取当前时间
      const now = performance.now()

      // 如果距离上次处理的时间小于节流间隔，则跳过本次处理
      if (now - lastScrollTimeRef.current < throttleInterval) {
        return
      }

      // 更新上次处理时间
      lastScrollTimeRef.current = now

      // 获取当前滚动位置
      const currentScrollTop = scrollRef.current.scrollTop

      // 计算当前应该渲染的起始行索引
      const newStartIndex = Math.max(
        0,
        Math.floor(currentScrollTop / config.rowHeight) - config.bufferRows
      )

      // 计算当前应该渲染的结束行索引
      const newEndIndex = Math.min(
        config.rows - 1,
        Math.floor(currentScrollTop / config.rowHeight) +
          config.visibleRows +
          config.bufferRows
      )

      // 只有当索引发生变化时才更新状态，避免不必要的渲染
      if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
        setStartIndex(newStartIndex)
        setEndIndex(newEndIndex)
      }
    }
  }, [
    config.rowHeight,
    config.visibleRows,
    config.bufferRows,
    config.rows,
    startIndex,
    endIndex,
  ])

  // 使用 requestAnimationFrame 优化滚动事件处理
  const rafIdRef = useRef<number | null>(null)

  // 滚动事件处理函数
  const onScroll = useCallback(() => {
    // 如果已经有一个动画帧请求，则取消它
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // 在下一个动画帧中处理滚动
    rafIdRef.current = requestAnimationFrame(() => {
      handleScroll()
      rafIdRef.current = null
    })
  }, [handleScroll])

  // 监听滚动事件
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", onScroll)
      return () => {
        // 清理事件监听和可能的动画帧请求
        scrollContainer.removeEventListener("scroll", onScroll)
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
        }
      }
    }
  }, [onScroll])

  // 计算可视区域内需要渲染的行
  const visibleRows = tableData.slice(startIndex, endIndex + 1)

  // 计算每行的偏移量
  const getRowOffset = (index: number) => {
    return (index + startIndex) * config.rowHeight
  }

  // 使用 memo 优化表格行组件，避免不必要的重渲染
  const TableRow = memo(
    ({
      row,
      rowIndex,
      columns,
      columnWidth,
      rowHeight,
      top,
    }: {
      row: TableData
      rowIndex: number
      columns: number
      columnWidth: number
      rowHeight: number
      top: string
    }) => {
      return (
        <div
          key={`row-${rowIndex}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, ${columnWidth}px)`,
            borderBottom: "1px solid #ddd",
            position: "absolute",
            top,
            left: 0,
            right: 0,
            height: `${rowHeight}px`,
          }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              style={{
                padding: "12px",
                borderRight: colIndex < columns - 1 ? "1px solid #ddd" : "none",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row[`column${colIndex + 1}`]}
            </div>
          ))}
        </div>
      )
    },
    (prevProps, nextProps) => {
      // 自定义比较函数，只有当行索引发生变化时才重新渲染
      return (
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.top === nextProps.top
      )
    }
  )

  return (
    <div style={{ width: "100%" }}>
      {/* 表头（固定在顶部） */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${config.columns}, ${config.columnWidth}px)`,
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
              height: `${config.rowHeight}px`,
              borderRight:
                index < config.columns - 1 ? "1px solid #ddd" : "none",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
            }}
          >
            列 {index + 1}
          </div>
        ))}
      </div>

      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        style={{
          height: `${config.visibleRows * config.rowHeight}px`, // 可视区域高度
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* 用于撑开滚动区域的容器 */}
        <div
          style={{
            height: `${totalHeight}px`,
            width: `${totalWidth}px`,
            position: "relative",
          }}
        >
          {/* 只渲染可视区域的行（使用优化的 TableRow 组件） */}
          {visibleRows.map((row, index) => (
            <TableRow
              key={`row-${index + startIndex}`}
              row={row}
              rowIndex={index + startIndex}
              columns={config.columns}
              columnWidth={config.columnWidth}
              rowHeight={config.rowHeight}
              top={`${getRowOffset(index)}px`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TableVirtual
