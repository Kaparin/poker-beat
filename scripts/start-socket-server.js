// Скрипт для запуска WebSocket-сервера в производственном окружении
const { spawn } = require("child_process")
const path = require("path")

// Путь к файлу сервера
const serverPath = path.join(__dirname, "../server/index.ts")

// Запускаем сервер с помощью ts-node
const server = spawn("npx", ["ts-node", serverPath], {
  env: {
    ...process.env,
    NODE_ENV: "production",
  },
  stdio: "inherit",
})

server.on("close", (code) => {
  console.log(`WebSocket server exited with code ${code}`)
})

server.on("error", (err) => {
  console.error("Failed to start WebSocket server:", err)
})

