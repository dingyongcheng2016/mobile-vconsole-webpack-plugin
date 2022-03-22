/**
 * @author dyc<bugcheng@163.com> 
 */

'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const VConsolePath = path.resolve(__dirname, './src/vconsole.js');
const VConsolePathContent = fs.readFileSync(VConsolePath, 'utf8');
const PLuginID = 'ConsoleDebugWebpackPlugin';

const isObject = (data) => Object.prototype.toString.call(data) === '[object Object]';
const isArray = (data) => Object.prototype.toString.call(data) === '[object Array]';
const isString = (data) => typeof data === 'string';


const getDebugJs = function () {
    return debugFileContent;
};

class vConsoleWebpackPlugin {

    constructor (options = {}) {
        this.options = Object.assign({
            filter: [],
            enable: false  // 插件开关，默认“关”
        }, options);
        if (typeof this.options.filter === 'string') {
            this.options.filter = [this.options.filter];
        }
    }

    apply(compiler) {
        const enable = this.options.enable;
        let pathVconsole = 'vconsole-webpack-plugin/src/vconsole.js';
        // const _root = module.parent.paths.find(item => { // eslint-disable-line no-unused-vars
        //     let tmpPathVconsole = path.join(item, 'vconsole-webpack-plugin/src/vconsole.js');
        //     if (fs.existsSync(item) && fs.existsSync(tmpPathVconsole)) {
        //         pathVconsole = tmpPathVconsole;
        //         return true;
        //     }
        //     return false;
        // });

        const that = this;
    
        const pluginFunction = (local, entry) => {
            if (enable) {
                if (isString(entry)) {
                    if (!that.checkFilter([entry], that.options.filter)) {
                        // TODO: entry 为 string 时，修改不了，只有 object 才可以修改
                        entry = [pathVconsole, entry];
                        console.warn('[vconsole-webpack-plugin] 暂不支持 entry 为 string 类型的情况\n');
                    }
                } else if (isArray(entry)) {
                    if (!that.checkFilter(entry, that.options.filter)) {
                        entry.unshift(pathVconsole);
                    }
                } else if (isObject(entry)) {
                    for (let key in entry) {
                        if (that.options.filter.indexOf(key) < 0) {
                            if (isArray(entry[key])) {
                                if (!that.checkFilter(entry[key], that.options.filter)) { // 记住这句不能提升到上层 if，因为有其他类型情况，导致检测文件夹时出错
                                    entry[key].unshift(pathVconsole);
                                }
                            } else if (isString(entry[key])) {
                                if (!that.checkFilter([entry[key]], that.options.filter)) {
                                    entry[key] = [pathVconsole, entry[key]];
                                }
                            } else if (isObject(entry[key])) {
                                if (!that.checkFilter([entry[key]], that.options.filter)) {
                                    // 兼容webpack 5 增加import参数
                                    if (entry[key].import && isArray(entry[key].import)) {
                                        entry[key].import.unshift(pathVconsole);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    
        if (compiler.hooks) {
            // console.log('it is webpack 4');
            compiler.hooks.entryOption.tap({ name: 'vConsolePlugin' }, pluginFunction);
        } else {
            // console.log('it is not webpack 4');
            compiler.plugin('entry-option', pluginFunction);
        }
    };

    checkFilter(entries, filter) {
        for (var i = 0; i < entries.length; i++) {
            // 去重，避免两次初始化 vconsole
            if (!fs.existsSync(entries[i])) { // 处理 webpack-dev-server 开启的情况
                continue;
            }
            
            if (fs.statSync(entries[i]).isDirectory()) {
                return that.checkFilter(fs.readdirSync(entries[i]), filter);
            }
    
            let data = '';
            try {
                data = that.codeClean((fs.readFileSync(entries[i]) || '').toString());
            } catch (e) {}
    
            if (data.toLowerCase().indexOf('new vconsole(') >= 0
                || data.indexOf('new require(\'vconsole') >= 0
                || data.indexOf('new require("vconsole') >= 0
                ) {
                return true;
            }
    
            // 过滤黑名单
            for (var j = 0; j < filter.length; j++) {
                if (filter[j] === entries[i]) {
                    return true;
                }
            }
        }
        return false;
    };

    // 去除注释
    codeClean(str) {
        const reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g;
        return str.replace(reg, function(word) { // 去除注释后的文本
            return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? '' : word;
        });
    }
}

module.exports = vConsoleWebpackPlugin;