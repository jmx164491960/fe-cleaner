const fs = require('fs');
const path = require('path');
/**
 * 把打包文件里的tags转换成时间
 * @param { String} tag tag的名字 
 */
exports.tagToTime = function (tag) {
	let time = tag.split('-')[0];
	let year = time.slice(0, 4);
	let month = time.slice(4, 6);
	let day = time.slice(6, 8);
	return `${year}-${month}-${day}`;
};

/**
 * 比较两个时间
 * @param { String } date 时间
 * @param { String } targetDate 时间2 
 * @param { Number } days 相差天数
 */
exports.isExpire = function (date, targetDate, days) {
	return dateDifference(date, targetDate) > days;
};

//两个时间相差天数 兼容firefox chrome
function dateDifference(sDate1, sDate2) { //sDate1和sDate2是2006-12-18格式  
	var dateSpan, iDays;
	sDate1 = Date.parse(sDate1);
	sDate2 = Date.parse(sDate2);
	dateSpan = sDate2 - sDate1;
	dateSpan = Math.abs(dateSpan);
	iDays = Math.floor(dateSpan / (24 * 3600 * 1000));
	return iDays
};
exports.dateDifference = dateDifference;

/**
 * 判断文件是否存在
 * @param { String} p 路径 
 */
function exists(p) {
	return fs.existsSync(p);
}

/**
 * 判断是否是文件
 * @param { String } p 路径 
 */
function isFile(p) {
	return exists(p) && fs.statSync(p).isFile();
}
exports.isFile = isFile

/**
 * 判断是否是文件夹
 * @param { String } p 路径 
 */
function isDir(p) {
	return exists(p) && fs.statSync(p).isDirectory();
}
exports.isDir = isDir

function getFileSize(p) {
	if (exists(p)) {
		return fs.statSync(p).size;
	}
	return 0;
}

/**
 * 
 * @param {Array} arr1 所有待判断的文件数组
 * @param {Array} arr2 收集依赖后的文件数组
 */
exports.getDiffFile = function (arr1, arr2) {
	let str = ',' + arr2.join(',') + ',';
	let newArr = arr1.filter((item) => {
		return str.indexOf(',' + item + ',') == -1;
	})
	return newArr;
}

/**
 * 
 * @param {Array} deleteFiles static目录下所有需要删除的文件的绝对路径
 * @param {Array} deleteDirs  tags目录下所有的需要删除的目录的绝对路径
 */
// exports.deleteHandler = function(deleteFiles, deleteDirs) {
//     let cleanSize = 0,
//         log = '';
//     // 对static下的废旧文件执行删除，并记录日志
//     deleteFiles = deleteFiles.map((item) => {
//         let size = getFileSize(item);
//         console.log('delete'.green + `: ${item} `, 'size'.green + `: ${(size / 1024).toFixed(2)} KB`);
//         log += `delete: ${item} size: ${(size / 1024).toFixed(2)} KB` + '\r\n';
//         cleanSize += size;
//         return fs.unlinkSync(item);
//     });
//     // 对server目录下的废旧文件执行删除，并记录日志
//     deleteDirs.forEach((item) => {
//         let removeDirReturn = removeDir(item);
//         cleanSize += removeDirReturn.allSize;
//         log += removeDirReturn.log;
//     });
//     return {
//         deleteArr: deleteFiles,
//         cleanSize,
//         log
//     };
// }

// function removeDir(p) {
//     let allSize = 0,
//         log = [];
//     // 对目录下每个文件做记录
//     findDeepFile(p);
//     // 删除目录
//     rimraf(p, (err) => {

//     });
//     /**
//      * 递归搜索文件夹下的文件
//      * @param {String} p 路径
//      */
//     function findDeepFile(p) {
//         // 记录文件夹下每个文件
//         if (isDir(p)) {
//             let fileList = fs.readdirSync(p);
//             if (fileList.length > 0) {
//                 fileList.forEach((file, index) => {
//                     fileList[index] = findDeepFile(path.resolve(p, file));
//                 });
//             }
//             // 记录文件夹路径
//             log += `delete: ${p} size: 0KB` + '\r\n';
//             console.log(`${'delete'.green}: ${p} ${'size'.green}: 0KB`);
//         } else if (isFile(p)) {
//             size = getFileSize(p);
//             // 记录文件大小
//             allSize += size;
//             console.log(`${'delete'.green}: ${p} ${'size'.green}: ${(size / 1024).toFixed(2)} KB`);
//             // 记录文件路径
//             log += `delete: ${p} size: ${(size / 1024).toFixed(2)} KB` + '\r\n';
//         }
//     }

//     return {
//         allSize,
//         log
//     };
// }
/**
 * 生成日志文件
 * @param { String } info 日志内容
 * @param { String } p 路径
 */
exports.createLogFile = function (p, info) {
	let date = new Date();
	let fileName = formatDate(date, 'YYYYMMDD-hhmmss') + '.txt';
	fs.writeFileSync(path.resolve(p, fileName), info);
}

function formatDate(date, formation) {
	var values = {
		Y: date.getFullYear(),
		M: date.getMonth() + 1,
		D: date.getDate(),
		h: date.getHours(),
		m: date.getMinutes(),
		s: date.getSeconds()
	};

	return formation.replace(/Y+|M+|D+|h+|m+|s+/g, (match) => {
		let result = values[match[0]];
		if (match.length > 1 && result.toString().length !== match.length) {
			result = (
				(new Array(match.length)).join('0') + result
			).slice(-match.length);
		}
		return result;
	});
}
exports.formatDate = formatDate;
/**
 * 根据命令行参数生成配置的函数，比如npm run [项目目录] [有效天数]
 * @param { Array } processArgv 
 */
exports.getConfig = function (processArgv) {
	// 项目目录名,资源有效期
	let [absolutePath, days] = processArgv;
	let projectName = path.basename(absolutePath),
		env = path.basename(path.resolve(absolutePath, '../')),
		entryPath = path.resolve(absolutePath, '../../../');
	return {
		projectName,
		env,
		entryPath,
		days: Number(days),
		tagPath: path.resolve(entryPath, 'server', env, projectName, 'tags'),
		staticPath: path.resolve(entryPath, 'static', env, projectName)
	};
}

/**
 * 校验输入的命令是否合法
 */
exports.validation = function (config) {
	let tagPath = config.tagPath;
	if (!(config.days >= 0)) {
		console.log(`${config.days}不是一个合法的天数,`, '请输入合法的有效天数！'.red);
		return false;
	} else if (!isDir(tagPath)) {
		console.log('请输入正确的项目名称'.red);
		return false;
	}
	return true;
}

/**
 *  根据server路径和static路径，取他们前面相同的部分的路径
 * @param { String } path1 
 * @param { String } path2 
 */
exports.getEntryPath = function (path1, path2) {
	let result = [];
	let arr1 = path1.split(path.sep),
		arr2 = path2.split(path.sep);

	arr1.some((item, index) => {
		if (item == arr2[index]) {
			result.push(item);
			return false;
		}
		return true;
	});
	result = result.join(path.sep);
	return result;
}

/**
 * 获取生成的目标路径
 * @param {String} trashPath 
 * @param {String} filePath 
 */
exports.getTargetPath = function (trashPath, filePath) {
	let arr = filePath.split(path.sep);
	// 把几个中间劫文件夹名过滤掉
	arr = arr.filter((item, index) => {
		return index != 0 && index != 2 && index != 3;
	});
	// 如果是server的目录，再删一个
	if (arr[0] == 'server') {
		arr.splice(1, 1);
	}
	let p = arr.join(path.sep);
	return path.join(trashPath, p);
}