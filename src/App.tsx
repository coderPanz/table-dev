import { useState } from "react"
import TableCanvas from "./components/table-canvas"
import TableVirtual from "./components/table-virtual"
import TableDom from "./components/table-dom"

function App() {
  const [activeTab, setActiveTab] = useState<"canvas" | "virtual" | "dom">(
    "canvas"
  )

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 标签切换栏 */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#001529",
          padding: "0",
        }}
      >
        <button
          onClick={() => setActiveTab("canvas")}
          style={{
            padding: "16px 32px",
            backgroundColor: activeTab === "canvas" ? "#1890ff" : "transparent",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activeTab === "canvas" ? "bold" : "normal",
            transition: "all 0.3s",
          }}
        >
          Canvas渲染
        </button>
        <button
          onClick={() => setActiveTab("virtual")}
          style={{
            padding: "16px 32px",
            backgroundColor:
              activeTab === "virtual" ? "#1890ff" : "transparent",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activeTab === "virtual" ? "bold" : "normal",
            transition: "all 0.3s",
          }}
        >
          虚拟滚动
        </button>
        <button
          onClick={() => setActiveTab("dom")}
          style={{
            padding: "16px 32px",
            backgroundColor: activeTab === "dom" ? "#1890ff" : "transparent",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activeTab === "dom" ? "bold" : "normal",
            transition: "all 0.3s",
          }}
        >
          DOM直接渲染
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "canvas" && <TableCanvas />}
        {activeTab === "virtual" && <TableVirtual />}
        {activeTab === "dom" && <TableDom />}
      </div>
    </div>
  )
}

export default App
