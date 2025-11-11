import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Text, Radio, Checkbox, Link } from "./cellRender"

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
 * 悬停单元格信息接口
 */
interface HoverCell {
  row: number // 悬停的行索引（-1 表示表头）
  col: number // 悬停的列索引
}

/**
 * 列类型枚举
 */
type ColumnType = "text" | "radio" | "checkbox" | "link"

/**
 * 列类型配置接口
 */
interface ColumnTypeConfig {
  [colIndex: number]: ColumnType
}

/**
 * 编辑单元格信息接口
 */
interface EditingCell {
  row: number // 正在编辑的行索引
  col: number // 正在编辑的列索引
}

/**
 * 单元格数据类型
 */
type CellValue = string | string[] | { text: string; url: string }

/**
 * 生成表格数据
 * @param config 表格配置
 * @returns 表格数据数组
 */
const generateTableData = (config: TableConfig) => {
  const data = []
  for (let i = 0; i < config.rows; i++) {
    const row: Record<string, CellValue> = {}
    for (let j = 0; j < config.columns; j++) {
      // 默认所有单元格都是文本类型
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

  // 表格数据状态（改为useState使其可编辑）
  const [tableData, setTableData] = useState<Array<Record<string, CellValue>>>(
    () => generateTableData(config)
  )

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

  // 悬停单元格状态
  const [hoverCell, setHoverCell] = useState<HoverCell | null>(null)

  // 列类型配置状态（默认所有列都是文本类型）
  const [columnTypes, setColumnTypes] = useState<ColumnTypeConfig>(() => {
    const types: ColumnTypeConfig = {}
    for (let i = 0; i < config.columns; i++) {
      types[i] = "text"
    }
    return types
  })

  // 控制列类型下拉菜单显示
  const [showColumnMenu, setShowColumnMenu] = useState<number | null>(null)

  // 编辑单元格状态
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  // 编辑器位置状态（用于实时跟随滚动）
  const [editorPosition, setEditorPosition] = useState<{
    top: number
    left: number
  } | null>(null)

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
   * 获取列类型的显示名称
   * @param type 列类型
   * @returns 显示名称
   */
  const getColumnTypeName = (type: ColumnType): string => {
    const typeNameMap: Record<ColumnType, string> = {
      text: "文本",
      radio: "单选框",
      checkbox: "多选框",
      link: "超链接",
    }
    return typeNameMap[type]
  }

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

    // 获取当前实时的滚动位置
    const currentScrollTop = container.scrollTop
    const currentScrollLeft = container.scrollLeft

    // 计算可视区域
    const { startRow, endRow } = calculateVisibleRows(
      currentScrollTop,
      container.clientHeight
    )

    // 绘制表格内容
    ctx.font = "14px Arial"
    for (let row = startRow; row <= endRow; row++) {
      const y = config.headerHeight + row * config.cellHeight - currentScrollTop

      // 绘制整行背景（hover 和 selected）
      // 选中行：淡天蓝色背景
      if (selectedCell && selectedCell.row === row && selectedCell.row >= 0) {
        ctx.fillStyle = "#e6f7ff"
        ctx.fillRect(0, y, totalWidth, config.cellHeight)
      }
      // 悬停行：淡灰色背景（未被选中时）
      else if (hoverCell && hoverCell.row === row && hoverCell.row >= 0) {
        ctx.fillStyle = "#f5f5f5"
        ctx.fillRect(0, y, totalWidth, config.cellHeight)
      }

      // 绘制行分割线
      ctx.strokeStyle = "#ddd"
      ctx.beginPath()
      ctx.moveTo(0, y + config.cellHeight)
      ctx.lineTo(totalWidth, y + config.cellHeight)
      ctx.stroke()

      // 绘制单元格内容
      for (let col = 0; col < config.columns; col++) {
        const x = col * config.cellWidth - currentScrollLeft

        // 如果列在可视区域外，跳过渲染
        if (x + config.cellWidth < 0 || x > viewWidth) continue

        // 绘制单元格内容
        ctx.fillStyle = "#000"
        const cellValue = tableData[row][`column${col + 1}`]
        const colType = columnTypes[col] || "text"

        // 根据列类型显示不同的内容
        let displayText = ""
        switch (colType) {
          case "text":
            displayText = String(cellValue || "")
            break
          case "radio":
            displayText = String(cellValue || "")
            break
          case "checkbox":
            if (Array.isArray(cellValue)) {
              displayText = cellValue.join(", ")
            }
            break
          case "link":
            if (
              typeof cellValue === "object" &&
              cellValue !== null &&
              "text" in cellValue
            ) {
              const linkValue = cellValue as { text: string; url: string }
              displayText = linkValue.text || ""
              // 链接文本显示为蓝色
              ctx.fillStyle = "#1890ff"
            }
            break
          default:
            displayText = String(cellValue || "")
        }

        ctx.fillText(displayText, x + 10, y + config.cellHeight / 2)
      }
    }

    // 绘制选中单元格的边框（在所有内容之后绘制，确保在最上层）
    // 只绘制普通单元格的边框，不绘制表头单元格的边框
    if (selectedCell && selectedCell.row >= 0) {
      const selectedX = selectedCell.col * config.cellWidth - currentScrollLeft
      const selectedY =
        config.headerHeight +
        selectedCell.row * config.cellHeight -
        currentScrollTop

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
      }
    }

    // 最后绘制表头（确保表头在最上层，遮挡滚动的内容）
    // 绘制表头背景（完全不透明）
    ctx.globalAlpha = 1.0
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, viewWidth, config.headerHeight)

    // 绘制表头分割线
    ctx.strokeStyle = "#ddd"
    ctx.beginPath()
    ctx.moveTo(0, config.headerHeight)
    ctx.lineTo(viewWidth, config.headerHeight)
    ctx.stroke()

    // 绘制表头内容
    ctx.font = "bold 14px Arial"
    for (let col = 0; col < config.columns; col++) {
      const x = col * config.cellWidth - currentScrollLeft

      // 如果列在可视区域外，跳过渲染
      if (x + config.cellWidth < 0 || x > viewWidth) continue

      // 如果表头单元格被选中，高亮背景
      if (selectedCell && selectedCell.row === -1 && selectedCell.col === col) {
        ctx.fillStyle = "#e6f7ff"
        ctx.fillRect(x, 0, config.cellWidth, config.headerHeight)
      }

      // 绘制列类型名称（居中显示）
      ctx.fillStyle = "#000"
      const typeName = getColumnTypeName(columnTypes[col] || "text")
      const typeNameWidth = ctx.measureText(typeName).width
      ctx.fillText(
        typeName,
        x + (config.cellWidth - typeNameWidth) / 2,
        config.headerHeight / 2
      )

      // 如果表头单元格被选中，绘制下拉图标
      if (selectedCell && selectedCell.row === -1 && selectedCell.col === col) {
        // 绘制下拉箭头图标（▼）
        ctx.fillStyle = "#1890ff"
        ctx.font = "12px Arial"
        ctx.fillText("▼", x + config.cellWidth - 25, config.headerHeight / 2)
        ctx.font = "bold 14px Arial" // 恢复字体
      }

      // 绘制列分割线（只在表头区域）
      ctx.strokeStyle = "#ddd"
      if (col < config.columns - 1) {
        ctx.beginPath()
        ctx.moveTo(x + config.cellWidth, 0)
        ctx.lineTo(x + config.cellWidth, config.headerHeight)
        ctx.stroke()
      }
    }

    // 绘制完整的列分割线（从表头延伸到可视区域底部）
    ctx.strokeStyle = "#ddd"
    for (let col = 0; col < config.columns - 1; col++) {
      const x = col * config.cellWidth - currentScrollLeft + config.cellWidth

      // 如果列在可视区域外，跳过渲染
      if (x < 0 || x > viewWidth) continue

      ctx.beginPath()
      ctx.moveTo(x, config.headerHeight)
      ctx.lineTo(x, viewHeight)
      ctx.stroke()
    }

    // 不在renderTable中更新视口信息，避免无限循环
    // 视口信息的startRow和endRow现在只在滚动处理函数中更新
  }, [
    config,
    tableData,
    totalWidth,
    calculateVisibleRows,
    selectedCell,
    hoverCell,
    columnTypes,
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

        // 计算点击的列索引
        const col = Math.floor(actualX / config.cellWidth)

        // 检查是否点击在表头区域
        if (actualY < config.headerHeight) {
          // 点击在表头
          if (col >= 0 && col < config.columns) {
            // 选中表头单元格（row 设为 -1 表示表头）
            setSelectedCell({ row: -1, col })
            // 切换列类型菜单显示状态
            setShowColumnMenu(prev => (prev === col ? null : col))
          } else {
            setSelectedCell(null)
            setShowColumnMenu(null)
          }
          return
        }

        // 点击在普通单元格区域
        // 计算点击的行索引
        const row = Math.floor(
          (actualY - config.headerHeight) / config.cellHeight
        )

        // 检查是否在有效范围内
        if (col >= 0 && col < config.columns && row >= 0 && row < config.rows) {
          // 如果点击的是当前正在编辑的单元格，不做任何操作
          if (
            editingCell &&
            editingCell.row === row &&
            editingCell.col === col
          ) {
            return
          }

          // 单击即进入编辑模式
          setSelectedCell({ row, col })
          setEditingCell({ row, col })
          setShowColumnMenu(null) // 关闭列类型菜单
        } else {
          // 点击在表格外，取消选中
          setSelectedCell(null)
          setShowColumnMenu(null)
          setEditingCell(null) // 退出编辑模式
        }
      } catch (error) {
        console.error("处理单元格点击事件时出错:", error)
      }
    },
    [viewport, config, editingCell]
  )

  /**
   * 处理Canvas鼠标移动事件（用于悬停效果）
   * @param e 鼠标事件
   */
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return

        // 获取Canvas的边界矩形
        const rect = canvas.getBoundingClientRect()

        // 计算鼠标位置相对于Canvas的坐标（CSS像素）
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        // 计算实际坐标（考虑滚动偏移）
        const actualX = mouseX + viewport.scrollLeft
        const actualY = mouseY + viewport.scrollTop

        // 计算悬停的列索引
        const col = Math.floor(actualX / config.cellWidth)

        // 检查是否悬停在表头区域
        if (actualY < config.headerHeight) {
          // 悬停在表头
          if (col >= 0 && col < config.columns) {
            setHoverCell({ row: -1, col })
          } else {
            setHoverCell(null)
          }
          return
        }

        // 悬停在普通单元格区域
        // 计算悬停的行索引
        const row = Math.floor(
          (actualY - config.headerHeight) / config.cellHeight
        )

        // 检查是否在有效范围内
        if (col >= 0 && col < config.columns && row >= 0 && row < config.rows) {
          setHoverCell({ row, col })
        } else {
          setHoverCell(null)
        }
      } catch (error) {
        console.error("处理鼠标移动事件时出错:", error)
      }
    },
    [viewport, config]
  )

  /**
   * 处理Canvas鼠标离开事件
   */
  const handleCanvasMouseLeave = useCallback(() => {
    try {
      setHoverCell(null)
    } catch (error) {
      console.error("处理鼠标离开事件时出错:", error)
    }
  }, [])

  /**
   * 更新编辑器位置（使用 useEffect 确保实时同步）
   */
  useEffect(() => {
    const container = containerRef.current
    if (!container || !editingCell) {
      setEditorPosition(null)
      return
    }

    const updatePosition = () => {
      const scrollTop = container.scrollTop
      const scrollLeft = container.scrollLeft

      // 获取容器相对于视口的位置
      const containerRect = container.getBoundingClientRect()

      // 计算单元格在视口中的位置
      const cellAbsoluteTop =
        config.headerHeight + editingCell.row * config.cellHeight
      const cellAbsoluteLeft = editingCell.col * config.cellWidth

      // 减去滚动偏移，加上容器在视口中的位置
      const top = containerRect.top + cellAbsoluteTop - scrollTop
      const left = containerRect.left + cellAbsoluteLeft - scrollLeft

      // 检查编辑器是否在可视区域内（是否被表头遮挡或超出视口）
      const headerBottom = containerRect.top + config.headerHeight
      const cellBottom = top + config.cellHeight
      const isVisible = top >= headerBottom && top < containerRect.bottom

      // 如果不可见，清除位置；否则更新位置
      if (!isVisible) {
        setEditorPosition(null)
      } else {
        setEditorPosition({ top, left })
      }
    }

    // 立即更新一次
    updatePosition()

    // 监听滚动事件，实时更新位置
    const handleScrollUpdate = () => {
      updatePosition()
    }

    container.addEventListener("scroll", handleScrollUpdate, { passive: true })

    return () => {
      container.removeEventListener("scroll", handleScrollUpdate)
    }
  }, [editingCell, config])

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

      // 滚动时立即重新渲染
      renderTable()
    },
    [calculateVisibleRows, renderTable]
  )

  /**
   * 处理单元格值变化
   * @param row 行索引
   * @param col 列索引
   * @param value 新值
   */
  const handleCellValueChange = useCallback(
    (row: number, col: number, value: CellValue) => {
      try {
        setTableData(prev => {
          const newData = [...prev]
          newData[row] = {
            ...newData[row],
            [`column${col + 1}`]: value,
          }
          return newData
        })
        // 退出编辑模式
        setEditingCell(null)
      } catch (error) {
        console.error("处理单元格值变化时出错:", error)
      }
    },
    []
  )

  /**
   * 获取单元格的默认值（根据列类型）
   * @param type 列类型
   * @returns 默认值
   */
  const getDefaultCellValue = (type: ColumnType): CellValue => {
    switch (type) {
      case "text":
        return ""
      case "radio":
        return ""
      case "checkbox":
        return []
      case "link":
        return { text: "", url: "" }
      default:
        return ""
    }
  }

  /**
   * 处理列类型切换
   * @param colIndex 列索引
   * @param newType 新的列类型
   */
  const handleColumnTypeChange = useCallback(
    (colIndex: number, newType: ColumnType) => {
      try {
        // 更新列类型
        setColumnTypes(prev => ({
          ...prev,
          [colIndex]: newType,
        }))

        // 清空该列的数据
        setTableData(prev => {
          const newData = prev.map(row => ({
            ...row,
            [`column${colIndex + 1}`]: getDefaultCellValue(newType),
          }))
          return newData
        })

        // 关闭菜单
        setShowColumnMenu(null)
      } catch (error) {
        console.error("处理列类型切换时出错:", error)
      }
    },
    []
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
    // 依赖选中单元格状态、悬停状态和列类型，不依赖renderTable本身
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, hoverCell, columnTypes, tableData])

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
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          style={{
            position: "sticky",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            cursor: "pointer",
          }}
        />

        {/* 编辑器层 - 在Canvas上方渲染编辑器组件 */}
        {editingCell && editorPosition && (
          <div
            style={{
              position: "fixed",
              top: `${editorPosition.top}px`,
              left: `${editorPosition.left}px`,
              width: `${config.cellWidth}px`,
              height: `${config.cellHeight}px`,
              zIndex: 999,
              backgroundColor: "#fff",
              border: "2px solid #1890ff",
              boxSizing: "border-box",
              pointerEvents: "auto",
            }}
          >
            {(() => {
              const colType = columnTypes[editingCell.col] || "text"
              const cellValue =
                tableData[editingCell.row][`column${editingCell.col + 1}`]

              // 根据列类型渲染不同的编辑器
              switch (colType) {
                case "text":
                  return (
                    <Text
                      value={String(cellValue || "")}
                      onChange={value =>
                        handleCellValueChange(
                          editingCell.row,
                          editingCell.col,
                          value
                        )
                      }
                    />
                  )
                case "radio":
                  return (
                    <Radio
                      value={String(cellValue || "")}
                      options={["选项1", "选项2", "选项3"]}
                      onChange={value =>
                        handleCellValueChange(
                          editingCell.row,
                          editingCell.col,
                          value
                        )
                      }
                    />
                  )
                case "checkbox":
                  return (
                    <Checkbox
                      value={Array.isArray(cellValue) ? cellValue : []}
                      options={["选项1", "选项2", "选项3", "选项4"]}
                      onChange={value =>
                        handleCellValueChange(
                          editingCell.row,
                          editingCell.col,
                          value
                        )
                      }
                    />
                  )
                case "link":
                  return (
                    <Link
                      value={
                        typeof cellValue === "object" &&
                        cellValue !== null &&
                        "text" in cellValue
                          ? (cellValue as { text: string; url: string })
                          : { text: "", url: "" }
                      }
                      onChange={value =>
                        handleCellValueChange(
                          editingCell.row,
                          editingCell.col,
                          value
                        )
                      }
                    />
                  )
                default:
                  return null
              }
            })()}
          </div>
        )}

        {/* 列类型下拉菜单 */}
        {showColumnMenu !== null && selectedCell && selectedCell.row === -1 && (
          <div
            style={{
              position: "absolute",
              top: `${config.headerHeight + 5}px`,
              left: `${
                showColumnMenu * config.cellWidth - viewport.scrollLeft + 10
              }px`,
              backgroundColor: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              minWidth: "120px",
            }}
          >
            {(["text", "radio", "checkbox", "link"] as ColumnType[]).map(
              type => (
                <div
                  key={type}
                  onClick={() => handleColumnTypeChange(showColumnMenu, type)}
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    backgroundColor:
                      columnTypes[showColumnMenu] === type
                        ? "#e6f7ff"
                        : "transparent",
                    color:
                      columnTypes[showColumnMenu] === type ? "#1890ff" : "#000",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={e => {
                    if (columnTypes[showColumnMenu] !== type) {
                      ;(e.target as HTMLDivElement).style.backgroundColor =
                        "#f5f5f5"
                    }
                  }}
                  onMouseLeave={e => {
                    if (columnTypes[showColumnMenu] !== type) {
                      ;(e.target as HTMLDivElement).style.backgroundColor =
                        "transparent"
                    }
                  }}
                >
                  {getColumnTypeName(type)}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TableCanvas
