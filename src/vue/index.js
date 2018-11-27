const fs = require('fs');
const path = require('path');
const {
	tagToTime,
	isExpire,
	isFile,
	isDir,
	getDiffFile
} = require('../public/utils');

class vueAnalysis {
	constructor(config) {
		this.config = config || {};
	}
	filterTags() {
		let serverPath = this.config.server;
		// tags目录下的文件列表 
		let tagDir = fs.readdirSync(serverPath);
		let latestTag = tagDir[tagDir.length - 1];
		let latestTagTime = tagToTime(latestTag);
		let expireDir = [];
		// 筛选出没过期的tags
		tagDir = tagDir.filter((item) => {
			let timeStr = tagToTime(item);
			if (!isExpire(timeStr, latestTagTime, this.config.days)) {
				return true;
			} else {
				expireDir.push(path.resolve(serverPath, item));
				return false;
			}
		});
		return {
			tagDir,
			expireDir
		};
	}
	/**
	 * 根据时间的期限去收集对应tags下的build-record.json
	 */
	getTagDepen(tagDir) {
		let serverPath = this.config.server;
		// 从没过期的tags里分析build-record收集依赖
		let assetList = new Set();
		tagDir.forEach((item) => {
			try {
				let content = fs.readFileSync(path.join(serverPath, item, 'build-record.json'), 'utf-8');
				let assets = JSON.parse(content).assets;
				assets.forEach((assetItem) => {
					assetList.add(assetItem.name);
				});
			} catch (err) {

			}
		});
		assetList = Array.from(assetList);
		// 路径转化为绝对路径
		assetList.forEach((item, index) => {
			assetList[index] = path.resolve(this.config.static, item);
		});
		return assetList;
	}
	/**
	 * 得到指定路径下的所有文件路径
	 * @param {String} p 路径 
	 */
	getFileByPath(p) {
		let arr = [];
		findDeepFile(p);
		/**
		 * 递归搜索文件夹下的文件
		 * @param {String} p 路径
		 */
		function findDeepFile(p) {
			if (isDir(p)) {
				let fileList = fs.readdirSync(p);
				fileList.forEach((file, index) => {
					fileList[index] = findDeepFile(path.resolve(p, file));
				})
				// return fileList;
			} else if (isFile(p)) {
				arr.push(p);
			}
		}
		return arr;
	}
	// vueAnalysis实例的主函数
	run() {
		// 获取有效期内的目录，和过期了的目录
		let {
			tagDir,
			expireDir
		} = this.filterTags();
		let depens = this.getTagDepen(tagDir);
		// 这个项目没有build-record文件，不能执行清理

		if (depens.length == 0) {
			throw new Error(`Error: [${this.config.project}]缺少build-record.json,并不是一个可清理的项目`);
		}
		// 拿到项目对应static目录下所有文件的路径
		let arr = this.getFileByPath(this.config.static);
		// 对比static下的文件与收集依赖表depens的文件，得到过期待删除的文件列表
		let expireStatic = getDiffFile(arr, depens);
		// 得到一个待删除的文件列表
		let toDeleteFiles = expireStatic.concat(expireDir);

		return toDeleteFiles;
	}
}

module.exports = vueAnalysis;
exports = vueAnalysis;