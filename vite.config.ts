import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                RawPinchDetector: resolve(__dirname, 'src/RawPinchDetector/RawPinchDetector.demo.html'),
                PinchedElementWrapper: resolve(__dirname, 'src/PinchedElementWrapper/PinchedElementWrapper.demo.html'),
                Pinchable: resolve(__dirname, 'src/Pinchable/Pinchable.demo.html'),
            },
        },
    },
})
