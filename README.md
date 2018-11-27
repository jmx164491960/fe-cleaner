# fe-cleaner

## 安装

打开命令行界面并切换到本项目源代码目录，运行（MacOS系统要加「sudo」）：

```bash
npm install . -g
```

## 查看版本

```bash
fe-cleaner -v
```

## 通用使用

启动服务：

```bash
fe-cleaner -t [清理项目的类型] -p [清理项目文件名] -d [有效天数] -e [清理项目的环境] -S [清理项目的服务文件地址] -s [清理项目的静态文件地址] -T [清理项目的文件临时存放地址]
```

##### 例如：

```bash
fe-cleaner -t vue -p webapp-attendance -d 1 -e test -S E:/svn/frontend/server/test/webapp-attendance/tags -s E:/svn/frontend/static/test/webapp-attendance -T E:/trash
```

该命令意思是清理webapp-attendance的test环境废旧资源，距离最后一次版本往前推1天前的版本代码都被定义为[废旧资源]。被清理的资源会被放到E:/trash里