const Path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "development",
    entry: "./src/index.jsx",
    output: {
        path: Path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.jsx$/,
                use: [
                    {
                        loader: "thread-loader",
                        options: {
                            worker: 2
                        }
                    },
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                // 解析 react jsx 语法
                                "@babel/preset-react"
                            ],
                            compact: false
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                loader: "raw-loader"
            },
            {
                test: /\.(less|css)$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: Path.join(__dirname, 'src/index.html'),
        }),
    ],
    devServer: {
        static: {
            directory: Path.join(__dirname, 'src'),
        },
        // server: {
        //     type: "https",
        //     options: {
        //         key: fs.readFileSync('./localhost-key.pem'),
        //         cert: fs.readFileSync('./localhost.pem')
        //     }
        // },
        port: 666,

        // 解开 localhost 封锁
        historyApiFallback: true,
        allowedHosts: "all",
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};