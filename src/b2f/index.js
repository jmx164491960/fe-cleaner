const fs = require('fs');
const path = require('path');
const sep = path.sep;
const join = path.join;
const chalk = require('chalk');

const {
	tagToTime,
	isExpire,
	isFile,
	isDir
} = require('../public/utils');

class b2fAnalysis {

	constructor(config) {
		this.config = config;
		// 收集需删除的tags，供调试对照使用
		this.delTags = [];
		// 收集需删除的静态文件地址，供调试对照使用
		this.delFiles = [];
		// 收集不需删除的静态文件地址，供调试对照使用
		this.notDelFiles = [];
		// 所有需删除的文件及文件夹地址
		this.allDelFiles = [];
	}
	// 分析函数
	analysis() {
		let sPath = this.config.server;
		let files = fs.readdirSync(sPath);
		let latestTag = tagToTime(files[files.length - 1]);
		files.forEach((val, index) => {
			let fPath = join(sPath, val);
			if (isDir(fPath)) {
				let tag = tagToTime(val);
				if (!isExpire(tag, latestTag, this.config.days)) {
					let assetPath = `${fPath}${sep}asset-config.json`;
					let md5Path = `${fPath}${sep}md5-map.json`;
					if (isFile(md5Path)) {
						this.collectNotDelFiles(md5Path, 'MD5');
					}
					if (isFile(assetPath)) {
						this.collectNotDelFiles(assetPath, 'asset');
					}
				} else {
					this.collectDelTag(fPath);
				}
			}
		});
		this.collectDelFiles();
	}
	// 收集需删除文件
	collectAllDel(pathStr, type) {
		this.allDelFiles.push(pathStr);
		switch (type) {
			case 'tag':
				this.delTags.push(pathStr);
				break;
			default:
				this.delFiles.push(pathStr);
				break;
		}
	}
	// 收集需删除tags文件
	collectDelTag(pathStr) {
		this.collectAllDel(pathStr, 'tag');
	}
	// 收集需删除静态文件
	collectDelFile(pathStr) {
		this.collectAllDel(pathStr, 'files');
	}
	// 收集不需要需删除静态文件
	collectNotDelFiles(pathStr, type) {
		if (type === 'MD5') {
			this.collectMD5Files(pathStr);
		}
		if (type === 'asset') {
			this.collectAssetFiles(pathStr);
		}
	}
	// 遍历文件
	mapFiles(sPath, cb) {
		function findFiles(filePath) {
			let files = fs.readdirSync(filePath);
			files.forEach((val, index) => {
				let fPath = join(filePath, val);
				if (isFile(fPath)) {
					cb(fPath);
				} else if (isDir(fPath)) {
					findFiles(fPath);
				}
			});
		}
		findFiles(sPath);
	}
	// 收集需删除的静态文件
	collectDelFiles() {
		let sPath = `${this.config.static}${sep}assets`;
		let splitStr = `${this.config.project}${sep}assets${sep}`;
		this.mapFiles(sPath, (fPath) => {
			let tempPath = fPath.split(splitStr)[1];
			if (this.notDelFiles.indexOf(tempPath) === -1) {
				this.collectDelFile(fPath);
			}
		});
	}
	// 通过asset-config.json收集不需删除静态文件
	collectAssetFiles(pathStr) {
		let splitStr = `${this.config.project}${sep}assets${sep}`;
		function handleAssetPath(url, splitStr) {
			return url.split(splitStr)[1];
		}
		// 展平obj => ['val', 'val']
		function flattenObj(obj, handler, splitStr) {
			const collector = [];

			function flatten(tempObj) {
				for (let index in tempObj) {
					let value = tempObj[index];
					if (typeof(value) === 'object') {
						flatten(value);
					} else {
						typeof(handler) === 'function' ? collector.push(handler(value, splitStr)) : collector.push(value);
					}
				}
			}

			flatten(obj);
			return collector;
		}

		let data = fs.readFileSync(pathStr, 'utf8');
		try {
			let d = JSON.parse(data);
			let result = flattenObj(d.map, handleAssetPath, splitStr);
			result.forEach((val, index) => {
				this.notDelFiles.push(val);
			});
		} catch (e) {
			throw e;
		}
	}

	// 通过md5-map.json收集不需删除静态文件
	collectMD5Files(pathStr) {
		let data = fs.readFileSync(pathStr, 'utf8');
		try {
			let d = JSON.parse(data);
			for (let j in d) {
				let val = d[j];
				this.notDelFiles.push(val);
			}
		} catch (e) {
			throw e;
		}
	}
	// b2fAnalysis 执行函数
	run() {
		// 执行分析
		this.analysis();
		if (this.delTags.length === 0 && this.notDelFiles.length === 0 && this.allDelFiles.length !== 0) {
			console.log(chalk.red('未收集到待删除tags，但收集到的删除文件列表不为空，请确认server地址是否正确，精确到tags目录'));
			return [];
		}
		return Array.from(new Set(this.allDelFiles));
	}
}

module.exports = b2fAnalysis;
exports = b2fAnalysis;