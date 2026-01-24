import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Force single React instance across all dependencies
const reactPath = path.resolve(__dirname, './node_modules/react');
const reactDomPath = path.resolve(__dirname, './node_modules/react-dom');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force all React imports to use the same instance
      'react': reactPath,
      'react-dom': reactDomPath,
    },
    dedupe: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'react/jsx-dev-runtime',
      'embla-carousel-react',
    ],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'embla-carousel-react',
    ],
    force: true,
    esbuildOptions: {
      // Ensure consistent React resolution
      resolveExtensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
}));
