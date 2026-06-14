#!/bin/bash

# =========================================
# 多语种在线教育平台 - 一键启动脚本
# =========================================

echo "========================================"
echo "  多语种在线教育平台"
echo "========================================"

# 1. 安装依赖（首次运行需要）
echo ""
echo "[1/3] 检查并安装依赖..."
cd /workspace/server && npm install --silent 2>/dev/null
cd /workspace/client && npm install --silent 2>/dev/null

# 2. 初始化数据库（种子数据）
echo "[2/3] 初始化数据库..."
cd /workspace/server && npm run seed 2>/dev/null

# 3. 启动服务
echo "[3/3] 启动服务..."
echo ""
echo "----------------------------------------"
echo "  后端: http://localhost:3001"
echo "  前端: http://localhost:5173"
echo "----------------------------------------"
echo ""

# 并行启动前后端
cd /workspace/server && npm start &
SERVER_PID=$!

cd /workspace/client && npm run dev &
CLIENT_PID=$!

# 捕获退出信号，清理子进程
cleanup() {
    echo ""
    echo "正在关闭服务..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 等待子进程
wait