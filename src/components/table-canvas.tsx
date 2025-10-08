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
 * 选中单元格信息接口
 */
interface SelectedCell {
  row: number // 选中的行索引
  col: number // 选中的列索引
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

  // 计算表格总宽度和总高度
  const totalWidth = useMemo(() => {
    return config.columns * config.cellWidth
  }, [config])
  const totalHeight = useMemo(
    () => config.rows * config.cellHeight + config.headerHeight,
    [config]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 生成表格数据
  const tableData = useMemo(() => generateTableData(config), [config])

  // 视口状态
  const [viewport, setViewport] = useState<ViewportInfo>({
    startRow: 0,
    endRow: 0,
    scrollTop: 0,
    scrollLeft: 0,
  })

  // 选中单元格状态
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  console.log("selectedCell", selectedCell)

  // 渲染时间测量
  const [renderTime, setRenderTime] = useState<number | null>(null)
  const startTimeRef = useRef<number>(performance.now())

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

    // 获取容器的可视区域尺寸（CSS像素）
    const viewWidth = container.clientWidth
    const viewHeight = container.clientHeight

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
      if (x + config.cellWidth < 0 || x > viewWidth) continue

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
        if (x + config.cellWidth < 0 || x > viewWidth) continue

        // 绘制选中单元格的背景浮层
        if (
          selectedCell &&
          selectedCell.row === row &&
          selectedCell.col === col
        ) {
          ctx.fillStyle = "rgba(24, 144, 255, 0.1)" // 浅蓝色半透明背景
          ctx.fillRect(x, y, config.cellWidth, config.cellHeight)
        }

        // 绘制单元格内容
        ctx.fillStyle = "#000"
        const cellValue = tableData[row][`column${col + 1}`]
        ctx.fillText(String(cellValue), x + 10, y + config.cellHeight / 2)
      }
    }

    // 绘制选中单元格的边框（在所有内容之后绘制，确保在最上层）
    if (selectedCell) {
      const selectedX =
        selectedCell.col * config.cellWidth - viewport.scrollLeft
      const selectedY =
        config.headerHeight +
        selectedCell.row * config.cellHeight -
        viewport.scrollTop

      // 只有当选中单元格在可视区域内时才绘制边框
      if (
        selectedX + config.cellWidth >= 0 &&
        selectedX <= viewWidth &&
        selectedY + config.cellHeight >= config.headerHeight &&
        selectedY <= viewHeight
      ) {
        ctx.strokeStyle = "#1890ff" // 蓝色边框
        ctx.lineWidth = 2
        ctx.strokeRect(
          selectedX,
          selectedY,
          config.cellWidth,
          config.cellHeight
        )
        ctx.lineWidth = 1 // 恢复默认线宽
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
    selectedCell,
  ])

  /**
   * 处理Canvas点击事件
   * @param e 鼠标事件
   */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return

        // 获取Canvas的边界矩形
        const rect = canvas.getBoundingClientRect()

        // 计算点击位置相对于Canvas的坐标（CSS像素）
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top

        // 计算实际坐标（考虑滚动偏移）
        const actualX = clickX + viewport.scrollLeft
        const actualY = clickY + viewport.scrollTop

        // 检查是否点击在表头区域
        if (actualY < config.headerHeight) {
          // 点击在表头，取消选中
          setSelectedCell(null)
          return
        }

        // 计算点击的行列索引
        const col = Math.floor(actualX / config.cellWidth)
        const row = Math.floor(
          (actualY - config.headerHeight) / config.cellHeight
        )

        // 检查是否在有效范围内
        if (col >= 0 && col < config.columns && row >= 0 && row < config.rows) {
          setSelectedCell({ row, col })
        } else {
          // 点击在表格外，取消选中
          setSelectedCell(null)
        }
      } catch (error) {
        console.error("处理单元格点击事件时出错:", error)
      }
    },
    [viewport, config]
  )

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
   * 滚动位置或选中状态变化时重新渲染
   */
  useEffect(() => {
    renderTable()
    // 依赖滚动位置和选中单元格状态，不依赖renderTable本身
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.scrollTop, viewport.scrollLeft, selectedCell])

  /**
   * 测量初始渲染时间
   */
  useEffect(() => {
    try {
      // 等待首次渲染完成后测量
      requestAnimationFrame(() => {
        const endTime = performance.now()
        const duration = endTime - startTimeRef.current
        setRenderTime(duration)
        console.log(`Canvas渲染方案 - 渲染时间: ${duration.toFixed(2)}ms`)
      })
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
        <span style={{ color: "#1890ff" }}>Canvas渲染方案</span>
        {renderTime !== null && (
          <span style={{ marginLeft: "20px", color: "#52c41a" }}>
            渲染时间: {renderTime.toFixed(2)}ms
          </span>
        )}
        <span style={{ marginLeft: "20px", color: "#666", fontSize: "14px" }}>
          (数据量: {config.rows} 行 × {config.columns} 列)
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          flex: 1,
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
          onClick={handleCanvasClick}
          style={{
            position: "sticky",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  )
}

export default TableCanvas
