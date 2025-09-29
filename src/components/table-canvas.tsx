import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"

/**
 * 表格配置接口
 */
interface TableConfig {
  rows: number // 行数
  columns: number // 列数
  cellWidth: number // 单元格宽度
  cellHeight: number // 单元格高度
  headerHeight: number // 表头高度
}

/**
 * 可视区域信息接口
 */
interface ViewportInfo {
  startRow: number // 开始渲染的行索引
  endRow: number // 结束渲染的行索引
  scrollTop: number // 垂直滚动位置
  scrollLeft: number // 水平滚动位置
}

/**
 * 生成表格数据
 * @param config 表格配置
 * @returns 表格数据数组
 */
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

/**
 * Canvas表格组件 - 使用Canvas结合可视区域渲染提高大数据量表格性能
 */
const TableCanvas = (): React.ReactNode => {
  // 表格配置，使用useMemo避免重复创建对象
  const config = useMemo<TableConfig>(
    () => ({
      rows: 10000, 
      columns: 50,
      cellWidth: 150, // 单元格宽度
      cellHeight: 40, // 单元格高度
      headerHeight: 50, // 表头高度
    }),
    []
  )

  // 计算表格总宽度和总高度（使用useMemo避免重复计算）
  const totalWidth = useMemo(() => config.columns * config.cellWidth, [config])
  const totalHeight = useMemo(
    () => config.rows * config.cellHeight + config.headerHeight,
    [config]
  )
  console.log('表格总宽度', totalWidth)
  console.log('表格总高度', totalHeight)


  // 引用DOM元素
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 生成表格数据（使用useMemo缓存数据，避免重复生成）
  const tableData = useMemo(() => generateTableData(config), [config])

  // 视口状态
  const [viewport, setViewport] = useState<ViewportInfo>({
    startRow: 0,
    endRow: 0,
    scrollTop: 0,
    scrollLeft: 0,
  })

  /**
   * 计算当前可视区域应该渲染的行范围
   * @param scrollTop 垂直滚动位置
   * @param clientHeight 容器可视高度
   * @returns 开始行和结束行
   */
  const calculateVisibleRows = useCallback(
    (scrollTop: number, clientHeight: number) => {
      // 计算开始行（考虑表头高度）
      const startRow = Math.floor(
        (scrollTop - config.headerHeight) / config.cellHeight
      )
      // 计算结束行（多渲染几行以优化滚动体验）
      const visibleRows = Math.ceil(clientHeight / config.cellHeight)
      const endRow = Math.min(startRow + visibleRows + 5, config.rows - 1)

      return {
        startRow: Math.max(0, startRow),
        endRow,
      }
    },
    [config]
  )

  /**
   * 渲染表格内容到Canvas
   */
  const renderTable = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 设置字体
    ctx.font = "14px Arial"
    ctx.textBaseline = "middle"

    // 计算可视区域
    const { startRow, endRow } = calculateVisibleRows(
      viewport.scrollTop,
      container.clientHeight
    )

    // 绘制表头背景
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, totalWidth, config.headerHeight)

    // 绘制表头分割线
    ctx.strokeStyle = "#ddd"
    ctx.beginPath()
    ctx.moveTo(0, config.headerHeight)
    ctx.lineTo(totalWidth, config.headerHeight)
    ctx.stroke()

    // 绘制表头内容
    ctx.fillStyle = "#000"
    ctx.font = "bold 14px Arial"
    for (let col = 0; col < config.columns; col++) {
      const x = col * config.cellWidth - viewport.scrollLeft

      // 如果列在可视区域外，跳过渲染
      if (x + config.cellWidth < 0 || x > canvas.width) continue

      // 绘制列标题
      ctx.fillText(`列 ${col + 1}`, x + 10, config.headerHeight / 2)

      // 绘制列分割线
      if (col < config.columns - 1) {
        ctx.beginPath()
        ctx.moveTo(x + config.cellWidth, 0)
        ctx.lineTo(x + config.cellWidth, totalHeight)
        ctx.stroke()
      }
    }

    // 绘制表格内容
    ctx.font = "14px Arial"
    for (let row = startRow; row <= endRow; row++) {
      const y =
        config.headerHeight + row * config.cellHeight - viewport.scrollTop

      // 绘制行分割线
      ctx.beginPath()
      ctx.moveTo(0, y + config.cellHeight)
      ctx.lineTo(totalWidth, y + config.cellHeight)
      ctx.stroke()

      // 绘制单元格内容
      for (let col = 0; col < config.columns; col++) {
        const x = col * config.cellWidth - viewport.scrollLeft

        // 如果列在可视区域外，跳过渲染
        if (x + config.cellWidth < 0 || x > canvas.width) continue

        // 绘制单元格内容
        const cellValue = tableData[row][`column${col + 1}`]
        ctx.fillText(String(cellValue), x + 10, y + config.cellHeight / 2)
      }
    }

    // 不在renderTable中更新视口信息，避免无限循环
    // 视口信息的startRow和endRow现在只在滚动处理函数中更新
  }, [
    viewport,
    config,
    tableData,
    totalWidth,
    totalHeight,
    calculateVisibleRows,
  ])

  /**
   * 处理滚动事件
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget
      const { startRow, endRow } = calculateVisibleRows(
        container.scrollTop,
        container.clientHeight
      )

      setViewport(prev => ({
        ...prev,
        startRow,
        endRow,
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      }))
    },
    [calculateVisibleRows]
  )

  /**
   * 初始化和更新Canvas
   */
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    // 设置Canvas尺寸为容器大小（考虑设备像素比以保证清晰度）
    const dpr = window.devicePixelRatio || 1
    canvas.width = container.clientWidth * dpr
    canvas.height = container.clientHeight * dpr

    // 缩放Canvas以匹配设备像素比
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    // 调整Canvas样式尺寸
    canvas.style.width = `${container.clientWidth}px`
    canvas.style.height = `${container.clientHeight}px`

    // 初始渲染
    renderTable()

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      if (container && canvas) {
        canvas.width = container.clientWidth * dpr
        canvas.height = container.clientHeight * dpr

        if (ctx) {
          ctx.scale(dpr, dpr)
        }

        canvas.style.width = `${container.clientWidth}px`
        canvas.style.height = `${container.clientHeight}px`

        renderTable()
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
    // 注意：这里不要把renderTable作为依赖，否则会导致无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 滚动位置变化时重新渲染
   */
  useEffect(() => {
    renderTable()
    // 只依赖滚动位置，不依赖renderTable本身
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.scrollTop, viewport.scrollLeft])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "auto",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      {/* 创建一个占位div来提供滚动区域 */}
      <div
        style={{
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* Canvas层 */}
      <canvas
        ref={canvasRef}
        style={{
          position: "sticky",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
    </div>
  )
}

export default TableCanvas
