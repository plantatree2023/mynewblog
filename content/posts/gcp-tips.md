---
title: "GCP Tip Q&A"
date: 2026-06-08T21:57:40+08:00
lastmod: 2026-06-08T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章记录了一些有关GCP的小tips"
images: []

tags: ["GCP"]
categories: ["云计算"]

lightgallery: true
---

{{< admonition question >}}
用gcloud auth print-access-token，print的是谁的token？
{{< /admonition >}}

{{< admonition info >}}
gcloud auth print-access-token 打印的是当前 gcloud CLI 正在使用的“活跃身份（active account）”对应的 OAuth 2.0 access token。

比如使用`gcloud auth list`，你会看到：

```
ACCOUNT
user1@gmail.com  (active)
user2@gmail.com
```

打印的就是 user1@gmail.com 的 access token。
{{< /admonition >}}

{{< admonition question >}}
我可以冒充一个Service Account借到他的Token吗？
{{< /admonition >}}


{{< admonition info >}}
可以，比如：

```bash
gcloud auth print-access-token \
  --impersonate-service-account=sa@project.iam.gserviceaccount.com
```
{{< /admonition >}}

{{< admonition question >}}
GCP的gcloud command太麻烦了，通常都有好几个部分，比如上面的例子里面gcloud auth print-access-token就有三个部分了，有的甚至有四个部分。请问有什么诀窍记忆gcloud的这些部分吗？
{{< /admonition >}}


{{< admonition info >}}
这个问题很典型：gcloud 看起来像“命令很长很碎”，但其实它是有固定结构的，不是靠死记的。

### 1. 核心诀窍：把 gcloud 当成“句子结构”

gcloud 的设计其实是：

> gcloud + 资源域 + 动作 + 参数

也可以理解成：

> gcloud + “在什么领域” + “做什么事” + “具体怎么做”

用你的例子拆解：
```bash
gcloud auth print-access-token
```
拆成三段：

|部分	|含义|
|:------:| -----------:|
|gcloud	|工具本体|
|auth	|认证模块（domain / group）|
|print-access-token	|动作|

👉 本质是：

> 在 auth 这个领域里，执行 print-access-token 这个动作

### 2. 第二个关键认知：gcloud = “资源树”

gcloud 不是命令集合，而是层级资源系统：

```
gcloud
 ├── auth
 │     ├── login
 │     ├── list
 │     ├── print-access-token
 │
 ├── compute
 │     ├── instances
 │     │       ├── list
 │     │       ├── create
 │
 ├── iam
 ├── config
```

👉 所以你不是在记命令，而是在“走树”

### 3. 第三个诀窍：动词永远在最后

gcloud 有一个非常稳定的规律：

最后一段几乎一定是动作（verb）

例如：

1. `print-access-token` → 打印 token
2. `list` → 列出资源
3. `create` → 创建资源
4. `describe` → 查看详情
5. `delete` → 删除

👉 所以你只要记：

> 前面是“领域”，最后是“动作”

### 4. 第四个诀窍：中间部分是“资源类型”

更复杂一点的命令，比如：

```bash
gcloud compute instances list
```

拆解：

部分	含义
|:------:| -----------:|
|compute	|产品域（GCE）|
|instances|	资源类型|
|list	|动作|

👉 结构是：

> compute（云产品） → instances（资源） → list（操作）

### 5. 最重要的记忆方法：不要背命令，要背“语法模式”

你真正需要记的只有 3 种模式：

#### 模式 A：认证类（auth / config）

```bash
gcloud auth <action>
gcloud config <action>
```
例子：

1. login
2. list
3. print-access-token

#### 模式 B：资源类（compute / iam / storage）

```bash
gcloud <service> <resource> <action>
```
例子：
```bash
gcloud compute instances list
gcloud compute instances create
```

#### 模式 C：project级操作
```bash
gcloud projects <action>
```
例子：
```bash
gcloud projects list
gcloud projects describe
```

### 6. 一个非常实用的技巧：用“补全思维”而不是记忆

你不需要记完整命令，只需要：
```bash
gcloud auth <TAB><TAB>
```
或者：
```bash
gcloud compute instances <TAB><TAB>
```
👉 真实使用中：

> 90% 的 gcloud 命令是“tab补出来的”，不是背出来的

7. 最关键的一句话总结

> gcloud 不是一堆命令，而是一个“树状语法”：
> 领域（service） → 资源（resource） → 动作（verb）


{{< /admonition >}}
