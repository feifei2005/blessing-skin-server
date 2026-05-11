import * as path from 'path'
import * as webpack from 'webpack'
import { execSync } from 'child_process'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'

interface Env {
  production?: boolean
}

export default function (env?: Env): webpack.Configuration {
  const isDev = !env?.production
  const isGitpod = 'GITPOD_REPO_ROOT' in process.env

  return {
    name: 'app',
    mode: isDev ? 'development' : 'production',
    entry: {
      app: [
        ...(isDev ? ['react-hot-loader/patch'] : []),
        '@/styles/common.css',
        'admin-lte/dist/css/alt/adminlte.components.min.css',
        'admin-lte/dist/css/alt/adminlte.core.min.css',
        'admin-lte/dist/css/alt/adminlte.pages.min.css',
        'admin-lte/dist/css/alt/adminlte.light.min.css',
        '@fortawesome/fontawesome-free/css/all.min.css',
        '@/index.tsx',
      ],
    },
    output: {
      clean: true,
      path: `${__dirname}/public/app`,
      publicPath: process.env.NO_HASH ? '/app/' : '/',
      filename:
        isDev || process.env.NO_HASH
          ? '[name].js'
          : '[name].[contenthash:7].js',
      chunkFilename:
        isDev || process.env.NO_HASH ? '[id].js' : '[id].[contenthash:7].js',
      crossOriginLoading: 'anonymous',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: isDev ? 'tsconfig.dev.json' : 'tsconfig.build.json',
            transpileOnly: true,
          },
        },
        {
          test: /\.css$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            'postcss-loader',
          ],
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(png|webp|svg|woff2?|eot|ttf)$/,
          type: 'asset',
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name].[contenthash:7].css',
        chunkFilename: isDev ? '[id].css' : '[id].[contenthash:7].css',
      }),
      new HtmlWebpackPlugin({
        template: `${__dirname}/resources/assets/template.html`,
        chunks: ['app'],
        scriptLoading: 'defer',
        filename: 'index.html',
      }),
      new webpack.DefinePlugin({
        'window.Deno': 'true',
        Deno: {
          args: [],
          build: {},
          version: {},
        },
        'process.platform': '"browser"',
        'process.env.REACT_APP_API_BASE': JSON.stringify(
          process.env.REACT_APP_API_BASE || '',
        ),
        'process.env.REACT_APP_OAUTH_CLIENT_ID': JSON.stringify(
          process.env.REACT_APP_OAUTH_CLIENT_ID || '1',
        ),
      }),
    ].concat(isDev ? [new webpack.HotModuleReplacementPlugin()] : []),
    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
      alias: {
        ...(isDev ? { 'react-dom': '@hot-loader/react-dom' } : {}),
        '@': path.resolve(__dirname, 'resources/assets/src'),
        readline: '@/scripts/cli/readline.ts',
        prompts: 'prompts/lib/index.js',
        assert: false,
      },
    },
    optimization: {
      // @ts-ignore
      minimizer: [new CssMinimizerPlugin({}), '...'],
    },
    experiments: {
      syncWebAssembly: true,
    },
    devtool: isDev ? 'eval-source-map' : 'source-map',
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      historyApiFallback: true,
      host: '0.0.0.0',
      hot: true,
      hotOnly: true,
      stats: 'errors-warnings',
      allowedHosts: ['localhost'].concat(
        isDev && isGitpod ? ['.gitpod.io'] : [],
      ),
    },
    stats: 'errors-warnings',
    ignoreWarnings: [/size limit/i],
  }
}
