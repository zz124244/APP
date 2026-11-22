import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()], build: { target: 'es2018', sourcemap: false }, server: { proxy: { '/api': {target:'http://127.0.0.1:8000',changeOrigin:false}, '/media': {target:'http://127.0.0.1:8000',changeOrigin:false}, '/mall/images': {target:'http://127.0.0.1:8000',changeOrigin:false} } } })
