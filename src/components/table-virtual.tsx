import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react"

// 虚拟列表模式枚举
const VirtualListMode = {
  FIXED_SIZE: "fixed_size", // 定高定宽
  FIXED_HEIGHT: "fixed_height", // 定高不定宽
  FIXED_WIDTH: "fixed_width", // 定宽不定高
  VARIABLE_SIZE: "variable_size", // 不定宽不定高
} as const

// 虚拟列表模式类型
type VirtualListModeType =
  (typeof VirtualListMode)[keyof typeof VirtualListMode]

// 基础表格配置接口
interface BaseTableConfig {
  rows: number
  columns: number
  visibleRows: number // 可视区域显示的行数
  bufferRows: number // 缓冲区行数
  mode: VirtualListModeType // 虚拟列表模式
}

// 定高定宽模式配置
interface FixedSizeConfig extends BaseTableConfig {
  mode: typeof VirtualListMode.FIXED_SIZE
  rowHeight: number // 固定行高
  columnWidth: number // 固定列宽
}

// 定高不定宽模式配置
interface FixedHeightConfig extends BaseTableConfig {
  mode: typeof VirtualListMode.FIXED_HEIGHT
  rowHeight: number // 固定行高
  columnWidths?: number[] // 每列的宽度
  getColumnWidth?: (columnIndex: number) => number // 动态计算列宽的函数
}

// 定宽不定高模式配置
interface FixedWidthConfig extends BaseTableConfig {
  mode: typeof VirtualListMode.FIXED_WIDTH
  columnWidth: number // 固定列宽
  rowHeights?: number[] // 每行的高度
  getRowHeight?: (rowIndex: number) => number // 动态计算行高的函数
}

// 不定宽不定高模式配置
interface VariableSizeConfig extends BaseTableConfig {
  mode: typeof VirtualListMode.VARIABLE_SIZE
  rowHeights?: number[] // 每行的高度
  columnWidths?: number[] // 每列的宽度
  getRowHeight?: (rowIndex: number) => number // 动态计算行高的函数
  getColumnWidth?: (columnIndex: number) => number // 动态计算列宽的函数
}

// 联合类型，表示所有可能的表格配置
type TableConfig =
  | FixedSizeConfig
  | FixedHeightConfig
  | FixedWidthConfig
  | VariableSizeConfig

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
interface TableVirtualProps {
  config?: Partial<TableConfig>
}

const TableVirtual = ({
  config: propConfig,
}: TableVirtualProps = {}): React.ReactNode => {
  // 默认表格配置
  const defaultConfig: FixedSizeConfig = {
    mode: VirtualListMode.FIXED_SIZE,
    rows: 10000, // 总行数（大数据量）
    columns: 10, // 总列数
    rowHeight: 50, // 每行高度（固定）
    columnWidth: 150, // 每列宽度（固定）
    visibleRows: 10, // 可视区域显示的行数
    bufferRows: 5, // 上下缓冲区行数
  }

  // 合并默认配置和传入的配置
  const config = useMemo(() => {
    return { ...defaultConfig, ...propConfig } as TableConfig
  }, [propConfig])

  // 生成表格数据
  const tableData = generateTableData(config)

  // 滚动容器的引用
  const scrollRef = useRef<HTMLDivElement>(null)

  // 可见范围状态
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(
    config.visibleRows + config.bufferRows
  )

  // 获取行高的函数
  const getRowHeight = useCallback(
    (rowIndex: number): number => {
      switch (config.mode) {
        case VirtualListMode.FIXED_SIZE:
        case VirtualListMode.FIXED_HEIGHT:
          return (config as FixedSizeConfig | FixedHeightConfig).rowHeight

        case VirtualListMode.FIXED_WIDTH:
          if (
            (config as FixedWidthConfig).rowHeights &&
            (config as FixedWidthConfig).rowHeights![rowIndex] !== undefined
          ) {
            return (config as FixedWidthConfig).rowHeights![rowIndex]
          }
          return (config as FixedWidthConfig).getRowHeight?.(rowIndex) || 50 // 默认高度

        case VirtualListMode.VARIABLE_SIZE:
          if (
            (config as VariableSizeConfig).rowHeights &&
            (config as VariableSizeConfig).rowHeights![rowIndex] !== undefined
          ) {
            return (config as VariableSizeConfig).rowHeights![rowIndex]
          }
          return (config as VariableSizeConfig).getRowHeight?.(rowIndex) || 50 // 默认高度
      }
    },
    [config]
  )

  // 获取列宽的函数
  const getColumnWidth = useCallback(
    (columnIndex: number): number => {
      switch (config.mode) {
        case VirtualListMode.FIXED_SIZE:
        case VirtualListMode.FIXED_WIDTH:
          return (config as FixedSizeConfig | FixedWidthConfig).columnWidth

        case VirtualListMode.FIXED_HEIGHT:
          if (
            (config as FixedHeightConfig).columnWidths &&
            (config as FixedHeightConfig).columnWidths![columnIndex] !==
              undefined
          ) {
            return (config as FixedHeightConfig).columnWidths![columnIndex]
          }
          return (
            (config as FixedHeightConfig).getColumnWidth?.(columnIndex) || 150
          ) // 默认宽度

        case VirtualListMode.VARIABLE_SIZE:
          if (
            (config as VariableSizeConfig).columnWidths &&
            (config as VariableSizeConfig).columnWidths![columnIndex] !==
              undefined
          ) {
            return (config as VariableSizeConfig).columnWidths![columnIndex]
          }
          return (
            (config as VariableSizeConfig).getColumnWidth?.(columnIndex) || 150
          ) // 默认宽度
      }
    },
    [config]
  )

  // 计算所有行高的总和
  const totalHeight = useMemo(() => {
    if (
      config.mode === VirtualListMode.FIXED_SIZE ||
      config.mode === VirtualListMode.FIXED_HEIGHT
    ) {
      return (
        config.rows * (config as FixedSizeConfig | FixedHeightConfig).rowHeight
      )
    } else {
      // 对于不定高的情况，需要累加每一行的高度
      let height = 0
      for (let i = 0; i < config.rows; i++) {
        height += getRowHeight(i)
      }
      return height
    }
  }, [config, getRowHeight])

  // 计算所有列宽的总和
  const totalWidth = useMemo(() => {
    if (
      config.mode === VirtualListMode.FIXED_SIZE ||
      config.mode === VirtualListMode.FIXED_WIDTH
    ) {
      return (
        config.columns *
        (config as FixedSizeConfig | FixedWidthConfig).columnWidth
      )
    } else {
      // 对于不定宽的情况，需要累加每一列的宽度
      let width = 0
      for (let i = 0; i < config.columns; i++) {
        width += getColumnWidth(i)
      }
      return width
    }
  }, [config, getColumnWidth])

  // 用于节流的上一次滚动处理时间
  const lastScrollTimeRef = useRef<number>(0)
  // 节流时间间隔（毫秒）
  const throttleInterval = 16 // 约等于60fps

  // 计算行的累积高度（用于不定高模式）
  const rowOffsets = useMemo(() => {
    if (
      config.mode === VirtualListMode.FIXED_SIZE ||
      config.mode === VirtualListMode.FIXED_HEIGHT
    ) {
      return null // 定高模式不需要计算累积高度
    }

    // 计算每行的起始位置
    const offsets: number[] = [0]
    for (let i = 0; i < config.rows; i++) {
      offsets.push(offsets[i] + getRowHeight(i))
    }
    return offsets
  }, [config, getRowHeight])

  // 根据滚动位置找到对应的行索引（二分查找，适用于不定高模式）
  const findRowIndex = useCallback(
    (scrollTop: number): number => {
      if (
        !rowOffsets ||
        config.mode === VirtualListMode.FIXED_SIZE ||
        config.mode === VirtualListMode.FIXED_HEIGHT
      ) {
        // 定高模式可以直接计算
        return Math.floor(
          scrollTop / (config as FixedSizeConfig | FixedHeightConfig).rowHeight
        )
      }

      // 二分查找找到第一个累积高度大于滚动位置的行
      let low = 0
      let high = config.rows

      while (low < high) {
        const mid = Math.floor((low + high) / 2)
        if (rowOffsets[mid] <= scrollTop) {
          low = mid + 1
        } else {
          high = mid
        }
      }

      return Math.max(0, low - 1)
    },
    [config, rowOffsets]
  )

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
      let newStartIndex: number
      let newEndIndex: number

      if (
        config.mode === VirtualListMode.FIXED_SIZE ||
        config.mode === VirtualListMode.FIXED_HEIGHT
      ) {
        // 定高模式：直接计算
        const rowHeight = (config as FixedSizeConfig | FixedHeightConfig)
          .rowHeight
        newStartIndex = Math.max(
          0,
          Math.floor(currentScrollTop / rowHeight) - config.bufferRows
        )
        newEndIndex = Math.min(
          config.rows - 1,
          Math.floor(currentScrollTop / rowHeight) +
            config.visibleRows +
            config.bufferRows
        )
      } else {
        // 不定高模式：使用二分查找
        newStartIndex = Math.max(
          0,
          findRowIndex(currentScrollTop) - config.bufferRows
        )

        // 估计结束索引（这是一个近似值，可能需要进一步优化）
        let visibleHeight = 0
        let endIdx = newStartIndex

        while (
          endIdx < config.rows &&
          visibleHeight < scrollRef.current.clientHeight
        ) {
          visibleHeight += getRowHeight(endIdx)
          endIdx++
        }

        newEndIndex = Math.min(config.rows - 1, endIdx + config.bufferRows)
      }

      // 只有当索引发生变化时才更新状态，避免不必要的渲染
      if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
        setStartIndex(newStartIndex)
        setEndIndex(newEndIndex)
      }
    }
  }, [config, findRowIndex, getRowHeight, startIndex, endIndex])

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
  const getRowOffset = useCallback(
    (index: number): number => {
      const rowIndex = index + startIndex

      if (
        config.mode === VirtualListMode.FIXED_SIZE ||
        config.mode === VirtualListMode.FIXED_HEIGHT
      ) {
        // 定高模式：直接计算
        return (
          rowIndex * (config as FixedSizeConfig | FixedHeightConfig).rowHeight
        )
      } else {
        // 不定高模式：使用累积高度
        return rowOffsets ? rowOffsets[rowIndex] : 0
      }
    },
    [config, startIndex, rowOffsets]
  )

  // 使用 memo 优化表格行组件，避免不必要的重渲染
  const TableRow = memo(
    ({
      row,
      rowIndex,
      columns,
      top,
      mode,
    }: {
      row: TableData
      rowIndex: number
      columns: number
      top: string
      mode: VirtualListMode
    }) => {
      // 根据模式生成不同的网格模板
      const getGridTemplateColumns = () => {
        switch (mode) {
          case VirtualListMode.FIXED_SIZE:
          case VirtualListMode.FIXED_WIDTH:
            // 定宽模式：使用相同的宽度
            return `repeat(${columns}, ${
              (config as FixedSizeConfig | FixedWidthConfig).columnWidth
            }px)`

          case VirtualListMode.FIXED_HEIGHT:
          case VirtualListMode.VARIABLE_SIZE:
            // 不定宽模式：使用自定义宽度
            return Array.from(
              { length: columns },
              (_, i) => `${getColumnWidth(i)}px`
            ).join(" ")
        }
      }

      // 获取行高
      const rowHeight =
        mode === VirtualListMode.FIXED_SIZE ||
        mode === VirtualListMode.FIXED_HEIGHT
          ? (config as FixedSizeConfig | FixedHeightConfig).rowHeight
          : getRowHeight(rowIndex)

      return (
        <div
          key={`row-${rowIndex}`}
          style={{
            display: "grid",
            gridTemplateColumns: getGridTemplateColumns(),
            borderBottom: "1px solid #ddd",
            position: "absolute",
            top,
            left: 0,
            right: 0,
            height: `${rowHeight}px`,
          }}
        >
          {Array.from({ length: columns }, (_, colIndex) => {
            // 获取列宽
            const columnWidth =
              mode === VirtualListMode.FIXED_SIZE ||
              mode === VirtualListMode.FIXED_WIDTH
                ? (config as FixedSizeConfig | FixedWidthConfig).columnWidth
                : getColumnWidth(colIndex)

            return (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                style={{
                  padding: "12px",
                  borderRight:
                    colIndex < columns - 1 ? "1px solid #ddd" : "none",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: `${columnWidth}px`,
                }}
              >
                {row[`column${colIndex + 1}`]}
              </div>
            )
          })}
        </div>
      )
    },
    (prevProps, nextProps) => {
      // 自定义比较函数，只有当行索引或模式发生变化时才重新渲染
      return (
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.top === nextProps.top &&
        prevProps.mode === nextProps.mode
      )
    }
  )

  // 根据模式生成表头的网格模板
  const getHeaderGridTemplateColumns = () => {
    switch (config.mode) {
      case VirtualListMode.FIXED_SIZE:
      case VirtualListMode.FIXED_WIDTH:
        // 定宽模式：使用相同的宽度
        return `repeat(${config.columns}, ${
          (config as FixedSizeConfig | FixedWidthConfig).columnWidth
        }px)`

      case VirtualListMode.FIXED_HEIGHT:
      case VirtualListMode.VARIABLE_SIZE:
        // 不定宽模式：使用自定义宽度
        return Array.from(
          { length: config.columns },
          (_, i) => `${getColumnWidth(i)}px`
        ).join(" ")
    }
  }

  // 计算表头行高
  const headerHeight =
    config.mode === VirtualListMode.FIXED_SIZE ||
    config.mode === VirtualListMode.FIXED_HEIGHT
      ? (config as FixedSizeConfig | FixedHeightConfig).rowHeight
      : 50 // 默认表头高度

  // 计算可视区域高度
  const visibleAreaHeight =
    config.mode === VirtualListMode.FIXED_SIZE ||
    config.mode === VirtualListMode.FIXED_HEIGHT
      ? config.visibleRows *
        (config as FixedSizeConfig | FixedHeightConfig).rowHeight
      : 500 // 默认可视区域高度

  return (
    <div style={{ width: "100%" }}>
      {/* 表头（固定在顶部） */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: getHeaderGridTemplateColumns(),
          backgroundColor: "#f5f5f5",
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        {Array.from({ length: config.columns }, (_, index) => {
          // 获取列宽
          const columnWidth =
            config.mode === VirtualListMode.FIXED_SIZE ||
            config.mode === VirtualListMode.FIXED_WIDTH
              ? (config as FixedSizeConfig | FixedWidthConfig).columnWidth
              : getColumnWidth(index)

          return (
            <div
              key={`header-${index}`}
              style={{
                padding: "12px",
                height: `${headerHeight}px`,
                width: `${columnWidth}px`,
                borderRight:
                  index < config.columns - 1 ? "1px solid #ddd" : "none",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
              }}
            >
              列 {index + 1}
            </div>
          )
        })}
      </div>

      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        style={{
          height: `${visibleAreaHeight}px`, // 可视区域高度
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
              top={`${getRowOffset(index)}px`}
              mode={config.mode}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TableVirtual
