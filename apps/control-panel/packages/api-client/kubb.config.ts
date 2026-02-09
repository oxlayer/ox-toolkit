import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  input: {
    path: '../../backend/api/api-spec/doc.json',
  },
  output: {
    path: './src',
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: './gen',
        barrelType: 'named',
      },
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
        barrelType: 'named',
      },
      infinite: {},
    }),
  ],
})
