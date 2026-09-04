/**
 * 极简静态文件服务器：仅用于本地预览网页版游戏（public/ 目录）。
 * 无任何第三方依赖，用 Node 内置 http/fs 即可。
 *
 * 用法：node scripts/serve.mjs  （默认 8080，可用 PORT 环境变量覆盖）
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'public')
const PORT = Number(process.env.PORT) || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'
    // 防目录穿越：归一化后必须仍在 ROOT 内
    const filePath = normalize(join(ROOT, urlPath))
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    const data = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found')
  }
})

server.listen(PORT, () => {
  console.log(`迷雾地窖（网页版）已启动： http://localhost:${PORT}`)
})
