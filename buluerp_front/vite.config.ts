import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    proxy: {
      '/dev-api': {
        //target: 'http://8.130.123.199:8080',
        target: 'http://localhost:8080',
        changeOrigin: true,
        proxyTimeout: 600000,
        rewrite: (path) => path.replace(/^\/dev-api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`➡ 代理请求: ${req.method} ${req.url}`)
            console.log(`🧾 真实发送目标: ${proxyReq.getHeader('host')}`)
            console.log(`🔗 Origin: ${proxyReq.getHeader('origin')}`)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`✅ 后端响应: ${req.method} ${req.url} → ${proxyRes.statusCode}`)
            // 上游响应只传了一部分便断开时，pipe 不会自动结束浏览器响应。
            proxyRes.on('aborted', () => res.destroy())
            proxyRes.on('error', () => res.destroy())
          })
          proxy.on('error', (err, req, res) => {
            console.error(`❌ 代理错误: ${req.method} ${req.url}`, err)
            if (!res.destroyed && 'writeHead' in res) {
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({ code: 502, msg: '后端连接中断，请先查询导入结果，勿重复提交' }))
              } else {
                res.destroy()
              }
            }
          })
        },
      },
    },
  },
})
