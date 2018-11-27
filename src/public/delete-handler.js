const fs = require('fs');
const path = require('path');
const fse = require('fse');
const chalk = require('chalk');
const {
	getEntryPath,
	isFile,
	formatDate,
	getTargetPath
} = require('./utils');

/**
 * 
 * @param { Array } toDeleteFiles 待删除文件的数组
 * @param { String } serverPath 
 * @param { String} staticPath 
 * @param { String } trashPath 
 * @param { String } projectName 
 */
class deleteHandler {
	constructor(toDeleteFiles, serverPath, staticPath, trashPath, projectName, env) {
		this.toDeleteFiles = toDeleteFiles;
		this.entryPath = getEntryPath(path.resolve(serverPath), path.resolve(staticPath));
		this.trashPath = trashPath;
		this.trashPath = path.join(this.trashPath, env + '-' + projectName + '-' + formatDate(new Date(), 'YYYYMMDDhhmmss'));
	}
	run() {
		if (this.toDeleteFiles.length <= 0) {
			console.log(chalk.green('nothing can be clean!'));
			return;
		}
		fse.mkdirSync(this.trashPath);
		this.toDeleteFiles.forEach((file) => {
			//  判断是文件还是文件夹
			let targetPath = getTargetPath(this.trashPath, file.replace(this.entryPath, ''));
			if (isFile(file)) {
				fse.copyFileSync(file, targetPath);
				fs.unlinkSync(file);
				console.log(`${chalk.green('delete')}: ${file}`);
			} else {
				fse.copydirSync(file, targetPath);
				fse.rmdirSync(file);
				console.log(`${chalk.green('delete')}: ${file}`);
			}
		});
		console.log(chalk.green('clean finish!'));
		console.log(`${chalk.green('此次清理文件的临时存放地址为')}: ${this.trashPath}`);
	}
}
module.exports = deleteHandler;
exports = deleteHandler;