import { resolve } from 'path'
import CopyPlugin from 'copy-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlMinimizerPlugin from 'html-minimizer-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

// TODO split jodit js and css into different bundle
export default function config () {
  return {
    entry: resolve('src/entry.js'),
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        inferno: (process.env.INFERNO_ENV !== 'production') ? 'inferno/dist/index.dev.esm.js' : 'inferno/dist/index.esm.js'
      }
    },
    output: {
      path: resolve('./dist'),
      publicPath: '/',
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          resolve: {
            fullySpecified: false
          },
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [['babel-plugin-inferno', { imports: true }]]
            }
          }
        },
        {
          test: /\.(css|less)$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'less-loader'
          ]
        }
      ]
    },
    optimization: {
      minimize: true,
      minimizer: [
        '...',
        new HtmlMinimizerPlugin(),
        new CssMinimizerPlugin()
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'bundle.css',
        chunkFilename: '[name].css'
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/static', to: 'static' }
        ]
      })
    ],
    devServer: {
      static: {
        directory: 'src/static'
      },
      port: 29100,
      historyApiFallback: true
    }
  }
};
