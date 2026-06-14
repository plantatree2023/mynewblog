---
title: "Linux sort命令的玩法"
date: 2026-06-14T21:57:40+08:00
lastmod: 2026-06-14T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章记录了一些Linux sort命令排序输入流的新奇玩法"
images: []

tags: ["算法", "Linux", "排序"]
categories: ["算法", "Linux"]

lightgallery: true
---

阅读sort命令的帮助说明，我们看到下面一段文字：

> With no FILE, or when FILE is -, read standard input.

这引发了笔者的兴趣，让我们来看一下利用这个特性和其他相关特性我们可以玩出哪些花样。

{{< admonition warning >}}
本文实验基于 GNU coreutils sort，不同系统实现可能存在差异。
{{< /admonition >}}

### 基本用法

#### 命令行输出作为输入

sort可以利用管道把别的命令产生的输出流作为输入流进行排序。例如，你可以查看并排序当前目录下的所有文件：

```bash
zhe@zhe-virtual-machine:~$ ls | sort
BurpSuiteCommunity
conf
Desktop
Documents
Downloads
DVWA
inf
```

#### 键盘输入数据

你可以直接从键盘输入数据然后排序。直接运行`sort`，然后开始打字。

1.在终端输入`sort`并回车

```bash
sort
```

2.此时终端会等待你的输入，随意输入一些数据，每输完一行按回车换行：

```bash
2
1
3
5
1
```

3.所有数据输入完成后，按快捷键`Ctrl + D`。这在Linux中代表发送`EOF`即文件结束符，告诉`sort`标准输入已经结束。`sort`收到结束信号后，会立即在屏幕打印排序结果。

```bash
zhe@zhe-virtual-machine:~$ sort
2
1
3
5
1
1
1
2
3
5
```

#### 使用Here Documents作为输入

用Here Documents作为输入重定向，我们可以把多行文本直接当作输入传递给`sort`，而不需要创建临时文件。

```bash
zhe@zhe-virtual-machine:~$ sort << EOF
> a
> 4
> 12
> 4
> 2
> 1
> 4
> 
> EOF

1
12
2
4
4
4
a
```

### 使用`sort`进行归并排序

在这里，我们先模拟普通排序多个文件的过程，先使用两路`sort`排序两个文件。然后让两路`sort`的输出合并到一个标准输入，然后传递到第三个`sort`命令。注意此时我们没有用到归并排序。

我们可以使用进程替换（Process Substitution）。这种方式可以让前两个`sort`同时并行运行。

```bash
sort <(sort file1.txt) <(sort file2.txt)
```

`<(sort file1.txt)`会在后台运行该命令，并将其输出虚拟成一个临时文件（类似 /dev/fd/63）。第三个`sort`会同时读取这两个“虚拟文件”的内容并进行最终的排序。所以实际上执行的是：

```bash
sort /dev/fd/63 /dev/fd/62
```

首先我们生成两个1000行的文件，每行一个数字。

```bash
zhe@zhe-virtual-machine:~$ seq 1 1000 | shuf > file1.txt
zhe@zhe-virtual-machine:~$ seq 1 1000 | shuf > file2.txt
```

然后使用`sort`排序可以看到正确的结果：

```bash
zhe@zhe-virtual-machine:~$ sort <(sort file1.txt) <(sort file2.txt) | head -n 10
1
1
10
10
100
100
1000
1000
101
101
```

然而，值得注意的是，如上所述，用这种方法，外层的`sort`不会把`<(sort file1)` 这样的输入视为“已经排好序的有序 run”，因此不会直接进入线性归并流程。因为`sort`接收到的，实际上是*两个输入文件*。所以他的操作实际上是`sort`会将多个输入文件当作一个整体进行排序，并不保证利用“输入已部分有序”的信息。

归并排序的优点完全没有被利用到！我们完全没有利用到输入已经是被排序的特性！

我们可以使用`sort -m`开启归并排序。

{{< admonition note >}}
当我们使用`-m`参数的时候，第三个`sort`将不需要从头排序一遍，这非常适合排好序的流。它会将最后合并阶段的复杂度从`O(NlogN)`降到`O(N)`，非常适合处理大文件。注意，这里的`O(N)`仅指最后的合并阶段，不是整体的排序过程。最后合并阶段之前可能包含了很多复杂的其他流程比如块排序，外排序，这里的复杂度分析不包括这些过程。
{{< /admonition >}}

```bash
zhe@zhe-virtual-machine:~$ sort -m <(sort file1.txt) <(sort file2.txt) | head -n 10
1
1
10
10
100
100
1000
1000
101
101
```

#### 证明复杂度下降

在上一个段落，我们演示了`sort -m`的正确性。这个段落我们使用`time`演示`sort -m`会使复杂度显著下降。

首先我们生成两个5000000行的文件。

```bash
zhe@zhe-virtual-machine:~$ seq 1 5000000 | shuf > file3.txt
zhe@zhe-virtual-machine:~$ seq 1 5000000 | shuf > file4.txt
```

然后使用`time`检查使用和不使用归并排序的所用时间。

```bash
zhe@zhe-virtual-machine:~$ time sort -m <(sort file3.txt) <(sort file4.txt) > result_merge.txt
real	0m6.478s
user	0m26.397s
sys	0m1.941s

zhe@zhe-virtual-machine:~$ time sort <(sort file3.txt) <(sort file4.txt) > result_normal.txt
real	0m15.097s
user	0m34.149s
sys	0m4.895s
```

我们发现在该简易测试环境下，归并排序比非归并显示出明显的性能优势。

#### 注意

如下使用花括号 `{ ... ; }` 把两个`sort`命令包起来并不能把两个流都*并行地*投入一个输入流。`-m`依赖多个独立的输入流来进行归并，而pipe会把多个已排序的输出流合并成单一输入流，因此`-m`无法识别每个输入的有序边界。所以当你试图使用`sort -m`去归并排序这个流的时候看到的结果将是不正确的，因为归并排序假设的前提，即两个输入流是有序的被打破了。

```bash
{ sort file1.txt; sort file2.txt; } | sort -m
```