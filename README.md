## 常用命令

开启一个Hugo示例服务器

```shell
hugo server

hugo # After you add a resource e.g. image, run this.
```

Git操作
```shell
git status
git add .
git commit -m "Commit message"
git push origin main

# Pull latest updates from remote
git pull origin main

# Remove a file accidentally checked in
git rm --cached <your-file>

# Sync latest changes in submodules
# Run this from the main repo
git submodule update --remote --merge
```

本仓库包含了一个私密博客的目录，下面是如何修改私密博客并同步到主项目的方法。
```shell
# 1. 进入子模块目录
cd content/posts/private

# 2. 确保在子模块的分支上
git checkout main

# 3. 添加并提交在子模块中的博客
git add .
git commit -m "Add a new private post"

# 4. 推送到子模块的远程仓库
git push origin main

# 5. 回到主项目根目录，同步子模块的指针
cd ../../../
git add content/posts/private
git commit -m "Sync submodule pointer"
git push origin main
```


## 有用的链接
[本页面链接](https://plantatree2023.github.io/mynewblog): https://plantatree2023.github.io/mynewblog

使用的引擎: Hugo

文档地址: [https://gohugo.io/documentation/](https://gohugo.io/documentation/)

使用的主题: LoveIt

仓库地址: [https://github.com/dillonzq/LoveIt](https://github.com/dillonzq/LoveIt)

我照抄的网站: [https://github.com/dillonzq/LoveIt/tree/master/exampleSite](https://github.com/dillonzq/LoveIt/tree/master/exampleSite)



