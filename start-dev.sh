#!/bin/bash

echo "🚀 Starting CodeTime Navigator Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    jobs -p | xargs kill 2>/dev/null
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo "📦 Starting backend server on port 8001..."
cd backend
python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Both servers are running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8001"
echo ""
echo "💡 Try these example repositories:"
echo "   - https://github.com/facebook/react"
echo "   - https://github.com/vercel/next.js"
echo "   - https://github.com/microsoft/vscode"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop the script
wait