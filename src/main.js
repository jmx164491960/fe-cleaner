#!/usr/bin/env node

const program = require('commander');
const vueAnalysis = require('./vue/index');
const b2fAnalysis = require('./b2f/index');
const deleteHandler = require('./public/delete-handler');
const path = require('path');
const currentPath = process.cwd();

program
	.version(require('../package.json').version, '-v, --version')
	.description('a test cli program')
	.usage('[options] [value ...]')
	.option('-t, --type [value]', '清理项目的类型')
	.option('-p, --project [value]', '清理项目文件名')
	.option('-d, --days <n>', '有效天数', parseInt)
	.option('-e, --env [value]', '清理项目的环境')
	.option('-S, --server [value]', '清理项目的服务文件地址')
	.option('-s, --static [value]', '清理项目的静态文件地址')
	.option('-T, --trash <string>', '清理项目的文件临时存放地址')
	.parse(process.argv);

let { type, project, days = 30, env, server, static, trash } = program;

server = path.resolve(currentPath, server);
static = path.resolve(currentPath, static);
trash = path.resolve(currentPath, trash);

let config = {
	days,
	env,
	project,
	server,
	static
}

let toDeleteFiles = [];

// 根据类型去选择不同的依赖分析函数
switch (type) {
	case 'b2f':
		let _b2f = new b2fAnalysis(config);
		toDeleteFiles = _b2f.run();
		break;
	case 'vue':
		let _v = new vueAnalysis(config);
		toDeleteFiles = _v.run();
		break;
	default:
		throw new Error("不被支持的项目类型! webapp -> vue; back2front -> b2f");
};

// 删除
let _deleteHandler = new deleteHandler(toDeleteFiles, server, static, trash, project, env);
_deleteHandler.run();