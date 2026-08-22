---
title: "C++小抄cheatsheet"
date: 2026-08-15T21:57:40+08:00
lastmod: 2026-08-15T21:57:40+08:00
draft: false
author: "种树者"
description: "这是一篇C++ cheatsheet小抄"
images: []

tags: ["cpp","编程语言"]
categories: ["编程语言"]

lightgallery: true
---

### 参考文档 （References）

1. [C++ QUICK REFERENCE by Matt Mahoney](https://www.cheat-sheets.org/saved-copy/cppqref.20210603.html)
2. [C++ Quick reference by utkuufuk](https://github.com/utkuufuk/cpp-quick-reference)
3. [C++ cheatsheet by Fechin](https://quickref.me/cpp.html)

### 预处理器（preprocessor）

```cpp
                        // 单行comment
                        /* 多行comment */
#include<stdio.h>       // 插入标准头文件
#include "myfile.h"     // 插入当前文件夹文件
#define X some text     // 用some text替换X
#define F(a,b) a+b      // 用1+2替换替换F(1,2)
#define X \
  some text             // 继续行
#undef X                // 移除定义
#if defined(X)          // 条件编译 (#ifdef X)
#else                   // 可选项 （#ifndex X 或 #if !defined(X))
#endif                  // 必须出现在#if和#ifdef后
```

### 字面量（literals）

```cpp
255, 0377, 0xff         // 整数（十进制，八进制，十六进制）decimal，octal，hex
2147483647L, 0x7fffffff1// 长整型数（32位）（Long）
123.0, 1.23e2           // 浮点数（double）
'1', '\141', '\x61'     // 字符（字面量，八进制，十六进制）
'\n', '\\', '\'', '\"'  // 换行符，反斜杠，单引号，双引号
"string\n"              // 以换行符和\0结尾的字符串数组
"hello" "world"         // 组合的字符串
true, false             // 布尔常量1和0
```

### 声明（declarations）

```cpp
int x;                  // 声明x为一个整数（值未定义）
int x=255;              // 声明并初始化x为255
short s; long l;        // 16或32位整数
char c='a';             // 8位字符
unsigned char u=255; signed char s=-1;  // 字符可以是signed也可以是unsigned的
unsigned long x=0xffffffffL;            // short，int，long默认为signed的，除非特别标明
float f; double d;      // 单精度和双精度数（永不为unsigned的）
bool b=true;            // true或者false，也可以用整数1，0
int a, b, c;            // 多个声明
int a[10];              // 一个10个整数的数组，a[0]到a[9]
int a[]={0,1,2};        // 一个初始化了的数组（或者int a[3]={0, 1, 2};)
int a[2][3]={{1,2,3},{4,5,6}};          // 整数的二维数组
char s[]="hello";       // 字符串（6个元素，包括'\0'）
int* p;                 // p是一个整数的指针
char* s="hello";        // s是一个未命名的，包含了"hello"的数组的指针
void* p=NULL;           // untyped内存的地址
int& r=x;               // r是整数x的(左值)引用
T a; T& ref=a;          // ref 是 a 的(左值)引用
ref.xxx;                // 实际调用 a.xxx

enum weekend {SAT,SUN}; // weekend是有值SAT和SUN的枚举类型
enum weekend day;       // day是weekend类型的变量
enum weekend {SAT=0,SUN=1};             // 枚举类型显式表示为整数
enum {SAT,SUN} day;     // 匿名枚举 TODO
typedef String char*;   // String s;表示 char* s;
const int c=3;          // 常量必须被初始化，不能被重新赋值
const int* p=a;         // p的内容是常量
int* const p=a;         // p是常量，p的内容不是
const int* const p=a;   // p和p的内容都是常量
const int& cr=x;        // cr是一个常量引用，不能被赋值去修改他所指向的变量x的值
auto x = 10;            // 编译器推导类型
```

### 存储类 （storage class）

```cpp
int x;                  // 自动分配，内存分配仅在处于当前scope的时候存在
static int x;           // 全局声明周期，即使是在local scope中
extern int x;           // 有一个x整型变量存在，但不要在当前位置给他分配空间。它的真正定义和内存分配在程序的其他文件或位置
```


### 语句 （statement）

```cpp
x=y;                      // 所有的表达式都是语句
int x;                    // 声明是语句
;                         // 空语句

{                         // 一个代码块是一个单一语句
  int x;                  // x的scope是从声明开始直到代码块结束
  a;                      // C语言中，所有变量的声明必须在语句前
}
if (x) a;                 // 如果x是true（非0），执行/计算a
else if (y) b;            // 如果非x但是y，执行/计算b
else c;                   // 如果非x且非y，执行/计算c

while (x) a;              // 重复0次或多次，当x为true时

for (x; y; z) a;          // 等价于: x; while(y) {a; z;}

do a; while (x);          // 等价于: a; while(x) a;

switch (x) {              // x必须是整数
  case X1: a;             // 如果x == X1 (X1必须为常量), 跳转到这
  case X2: b;             // 如果x == X2, 跳转到这
  default: c;             // 否则跳转到这（可选）
}
break;                    // 跳出while，do或for loop，或switch
continue;                 // 跳到while, do, or for 循环底
return x;                 // 返回x给caller
try { a; }
catch (T t) { b; }        // 如果a抛出T，跳到这
catch (...) { c; }        // 如果a抛出别的，跳到这
```


### 函数（functions）

```cpp
int f(int x, int);        // f是一个接受两个整数，并返回整数的函数
void f();                 // f是一个不接受参数的过程（procedure）
void f(int a=0);          // f()等价于f(0)
f();                      // 默认返回类型是int
inline f();               // 优化执行速度
f() { statements; }       // 函数的定义必须放在全局作用域，即函数内部不能定义函数
T operator+(T x, T y);    // a+b (当a b为T类型) 调用operator+(a, b)
T operator-(T x);         // -a 调用函数 operator-(a)
T operator++(int);        // 后缀++或--必须带有一个 int 类型的虚拟参数，但是调用时不需传入
extern "C" {void f();}    // f() 在 C中被编译
```
函数参数和返回值可以是任意类型。函数在被使用之前，必须先进行声明或定义。它可以先被声明，稍后再进行定义。每个程序都由一组全局变量声明和一组函数定义组成（这些内容可以分布在不同的文件中），其中必须包含以下函数之一：

```cpp
int main()  { statements... }     或
int main(int argc, char* argv[]) { statements... }
```

argv 是一个包含 argc 个来自命令行字符串的数组。按照惯例，如果程序运行成功，main 函数返回状态码 0；如果发生错误，则返回 1 或更高的值。

具有不同参数的函数可以拥有相同的名称（即重载）。除了 `::`、`.`、`.*` 和 `?:` 之外的运算符都可以被重载。运算符的优先级顺序不受影响。不能创建新的运算符。

### 表达式（expression）

算符按优先级进行分组，优先级最高的排在最前面。单目运算符（一元运算符）和赋值运算符按照*从右向左*的顺序进行计算（结合）。所有其他运算符均按*从左向右*的顺序计算。优先级并不影响表达式求值的具体顺序，该顺序是未定义的。语言本身不会对数组越界、无效指针等问题进行运行时检查。

```cpp
T::X                      // 类 T 中定义的名称 X
N::X                      // 命名空间 N 中定义的名称 X
::X                       // 全局名称 X

t.x                       // 结构体或类 t 的成员 x
p->x                      // 指针 p 指向的结构体或类的成员 x
a[i]                      // 数组 a 的第 i 个元素
f(x,y)                    // 调用函数 f，参数为 x 和 y
T(x,y)                    // 用 x 和 y 初始化的类 T 对象
x++                       // 对 x 加 1，返回原值（后缀）
x--                       // 对 x 减 1，返回原值（后缀）
decltype(x) y = 20;       // x 是 int 时：int y = 20
typeid(x)                 // x 的类型
typeid(T)                 // 如果 x 是 T，则等于 typeid(x)
dynamic_cast<T>(x)        // 将 x 转换为 T，运行时检查
static_cast<T>(x)         // 将 x 转换为 T，不做运行时检查
reinterpret_cast<T>(x)    // 按 T 类型按位解释 x 
const_cast<T>(x)          // 转换 x 为相同类型 T，但去掉 const 属性

sizeof x                  // 表示对象 x 所用的字节数
sizeof(T)                 // 表示类型 T 所用的字节数
++x                       // 对 x 加 1，返回新值（前缀）
--x                       // 对 x 减 1，返回新值（前缀）
~x                        // x 的按位取反
!x                        // 如果 x 为 0 则为 true，否则为 false（在 C 中为 1 或 0）
-x                        // 一元取负
+x                        // 一元正号（默认）比如用来对齐符号
&x                        // x 的地址
*p                        // 地址 p 指向的内容（*&x 等于 x）
new T                     // 新分配的 T 对象的地址
new T(x, y)               // 使用 x,y 初始化的 T 对象的地址
new T[x]                  // 分配的 n 元素 T 数组的地址
delete p                  // 销毁并释放位于地址 p 的对象
delete[] p                // 销毁并释放位于 p 的对象数组
(T) x                     // 将 x 转换为 T（已过时，使用相应的 _cast<T>(x)）

x * y                     // 乘法
x / y                     // 除法（整数向 0 舍入）
x % y                     // 取模（结果符号与 x 相同）

x + y                     // 相加，或 &x[y]
x - y                     // 相减，或从 *x 到 *y 的元素数量

x << y                    // x 左移 y 位（x * 2^y）
x >> y                    // x 右移 y 位（x / 2^y）

x < y                     // 小于
x <= y                    // 小于等于
x > y                     // 大于
x >= y                    // 大于等于

x == y                    // 等于
x != y                    // 不等于

x & y                     // 按位与（3 & 6 等于 2）

x ^ y                     // 按位异或（3 ^ 6 等于 5）

x | y                     // 按位或（3 | 6 等于 7）

x && y                    // 逻辑与：先计算 x，只有 x 为真（1）时才计算 y

x || y                    // 逻辑或：先计算 x，只有 x 为假（0）时才计算 y

x = y                     // 将 y 赋给 x，返回 x 的新值
x += y                    // 复合赋值（示例：x = x + y），还有 -= *= /= <<= >>= &= |= ^=

x ? y : z                 // 如果 x 为真（非 0）则为 y，否则为 z

throw x                   // 抛出异常，若未被捕获则终止

x , y                     // 求值 x 和 y，返回 y（很少使用）
```

### 类（classes）

```cpp
class T {                 // 新的类型
private:                  // 仅 T 的成员函数可访问的部分
protected:                // 也可被派生类访问
public:                   // 所有人都可访问
  int x;                  // 成员数据
  void f();               // 成员函数
  void g() {return;}      // 内联成员函数
  void h() const;         // 不修改任何数据成员
  int operator+(int y);   // t+y 表示 t.operator+(y)
  int operator-();        // -t 表示 t.operator-()
  
  T(): x(1) {}            // 带初始化列表的构造函数
  T(const T& t): x(t.x) {}  // 拷贝构造函数
  T(T&& t): x(std::move(t.x)) {/*t.x=nullptr;*/}      // 移动构造函数（move）
  T& operator=(const T& t) {x=t.x; return *this; }  // （拷贝）赋值运算符
  T& operator=(T&& t) {x=std::move(t.x);return *this;}  // 移动赋值符（move）
  ~T();                   // 析构函数（自动清理）

  explicit T(int a);      // 允许 t=T(3)，但不允许 t=3，防止隐式类型转换
  operator int() const {return x;}  // 允许 int(t)
  friend void i();        // 友元函数，全局函数 i() 拥有私有访问权限，可以访问私有函数和变量
  friend class U;         // 友元类，类 U 的成员拥有私有访问权限
  static int y;           // 所有 T 对象共享的数据
  static void l();        // 共享代码，可访问 y 但不能访问 x
  class Z {};             // 嵌套类 T::Z
  typedef int V;          // T::V 表示 int
};
void T::f() {             // 类 T 的成员函数 f 的实现
  this->x = x;}           // this 是当前对象的地址（意味着 x=x;）
int T::y = 2;             // 静态成员初始化（必须）
T::l();                   // 调用静态成员
struct T {                // 等价于：class T { public:
  virtual void f();       // 可在运行时被派生类重写
  virtual void g()=0; };  // 必须被重写（纯虚函数）
class U: public T {};     // 公有继承：派生类 U 继承基类 T 的所有成员
class V: private T {};    // 私有继承：T 的继承成员变为私有，所有public，protected变成private
class W: public T, public U {};  // 多重继承
class X: public virtual T {}; // 从 X 派生的类直接拥有基类 T，防止菱形继承多实例的问题
```
所有类都拥有默认的拷贝构造函数、赋值运算符和析构函数，它们会如上所示对每个数据成员和基类执行对应的操作。如果类中没有定义任何构造函数，系统还会提供一个默认的无参构造函数（创建数组时需要用到此构造函数）。构造函数、赋值运算符和析构函数不能被继承。

###  模板（template）

```cpp
template <class T> T f(T t);        // 为所有类型重载 f
template <class T> class X {        // 带类型参数 T 的类
  X(T t); };                        // 构造函数
template <class T> X<T>::X(T t) {}  // 构造函数定义（实现）
X<int> x(3);                        // 类型为 "X of int" 的对象
template <class T, class U=T, int n=0>  // 带默认参数的模板
```

###  命名空间（namespace）

```cpp
namespace N {class T {};} // 隐藏名称 T
N::T t;                   // 使用命名空间 N 中的名称 T
using namespace N;        // 使 T 在不写 N:: 的情况下可见
```

###  数组（array）

```cpp
int arr[5] = {10, 20, 30, 40, 50};  // 声明并初始化一个数组
int* p = arr;                       // p 指针指向 arr[0]

// 以下三种写法获取到的地址完全相同：
int* p1 = arr + 2;                  // 指向元素 30 的地址
int* p2 = &arr[2];                  // 指向元素 30 的地址（&x[y] 的写法）
int* p3 = &2[arr];                  // 可以颠倒，原理也是因为 2 + arr 等价于 &2[arr]

int cnt = &arr[4] - &arr[2];        // 返回2，arr[2]到arr[4]间的元素个数

char ref[5] = {'R', 'e', 'f'};                            
for (const int &n : ref) {}         // Range 遍历数组
for (int i = 0; i < sizeof(ref); ++i) {}  // 传统遍历数组
```

### 生命周期（owning）

```cpp
void foo() {int x = 10;}            // foo() 的 stack frame 拥有 x，不需delete x
int x = 10;                         // x own 自己的生命周期
int* p = &x;                        // p 不是 x 的owning pointer，p 被销毁时 x 仍然存在
void foo() {int x = 10; int* p = &x;} // x 和 p 都会被销毁
void foo() {
  int* p = new int(10);             // 谁 delete p 谁就是 owner，这里 p 是owning pointer
}                                   // p 这个指针消失，heap 上的 int(10) 还在，memory leak

void foo() {
    std::unique_ptr<int> p =         // p 明确拥有这个 object
      std::make_unique<int>(10);     // std::unique_ptr 默认是一个 owning pointer
    std::cout << *p << std::endl;
}                                    // p 的 destructor 自动执行，delete int，释放 heap object

auto p = std::make_shared<int>(10); // p own 这个 int
auto q = p;                         // q 现在也 own 这个 int，p，q share ownership
p.reset();                          // 还不能删这个 int，q reset 后才能删
std::weak_ptr<int> w = p;           // w 观察（并不拥有）int(10), 即使 w 还存在，int(10) 也可以被释放
std::cout << *w;                    // 非法
if (auto p2 = w.lock()) {           // 尝试获得一个新shared_ptr p2
    std::cout << *p2 << std::endl;  // int(10) 还活着
} else {}                           // int(10) 已经被销毁

std::unique_ptr<int> p =
    std::make_unique<int>(10);      // p own int(10)
foo(p);                             // 不允许，不能有两个owner
std::unique_ptr<int> q =            // q own int(10)， ownership 转移
    std::move(p);                   // p 变成 empty/有时为nullptr

int x = 10; int y = std::move(x);   // x 和 y 都是 10，int 没有move constructor/move assignment

int x = 10; int& r = x;             // r，reference 不拥有 x

```

### 复制（copy）
```cpp
int a = 10;                         // 创建一个新int
int b = a;                          // copy 创建 b，并用 a 的值初始化它
b = a;                              // 赋值
```

对类来说：
```cpp
class Person {
public:
    std::string name;
};

Person a; a.name = "Alice";         // default construction，调用 Person::Person()
Person b = a;                       // copy construction，调用 Person::Person(const Person&)
Person c; c = a;                    // copy assignment, 调用 operator=(const Person&)
Person c = std::move(a);            // move construction, 调用 Person(Person&&)
b = std::move(a);                   // move assignment，调用 operator=(Person&&)                                
```

### 编译期计算

```cpp
constexpr int square(int x) {       // constexpr 用在函数上，既可以编译期执行，也可以运行时执行
    return x * x;
}
constexpr int x = square(10);       // constexpr 用在变量上，必须是编译期就能确定的值
```

```cpp
consteval int square(int x) {       // consteval 用在函数上，必须编译期执行，不可以运行时执行
    return x * x;
}
constexpr int a = square(10);       // 合法
int b = square(x);                  // 不合法
```

```cpp
constinit int x = 100;              // 变量的初始化必须发生在编译期/静态初始化阶段
x = 200;                            // 变量可修改
constexpr int x = 100;
x = 200;                            // 变量不可修改
```

### 匿名函数（lambda）

完整定义：

```cpp
[capture](parameters) mutable noexcept -> return_type {body}
```

* [capture] 捕获列表
* [parameters] 参数
* [mutable] 允许修改捕获的值的副本，不允许修改外面的变量
* [noexcept] 不抛异常，如果函数抛出异常直接调用`std::terminate()`程序直接终止
* [int] 返回类型

常用定义：

```cpp
[capture](parameters) {body}
```

```cpp
auto compare = [](int a, int b) {   // 一个匿名函数
    return a > b;
};
bool x = compare(1, 2);             // 调用匿名函数
std::sort(v.begin(), v.end(), compare); // 传入一个匿名函数
```

捕获

```cpp
int x = 10;
auto f = [x]() {cout << x;};        // 捕获外部局部变量，[x] 捕获列表，() lambda没有参数
x = 20;
f();                                // 输出 10， [x] 按值捕获，进行了拷贝

int x = 10;
auto f = [&x]() {cout << x;};       // [&x] 按引用捕获
x = 20;
f();                                // 输出 20

int x = 10;
auto f = [x]() mutable {
    x++;
    std::cout << x;
};
f();                                // 输出 11
std::cout << x;                     // 输出 10，修改的是自己保存的copy，不是外部 x

auto f = [=]() {cout << x << y;};   // 全部按值捕获， [=] 相当于 [x, y]
auto f = [&]() {x++; y++;};         // 全部按引用捕获
auto f = [this]() {};               // 捕获this

int threshold = 10;
std::vector<int> v = {1, 5, 10, 15, 20};
std::count_if(v.begin(), v.end(), [=](int x) {
  return x > threshold;
});

std::sort(people.begin(), people.end(),
  [](const Person& a, const Person& b) {
      return a.age < b.age;
  }
);

auto f = [](auto a, auto b) {       // 模板化
  return a + b;                     // int： f(1, 2); double：f(1.5, 2.5)；
};
```

### C/C++ 标准库（C/C++ STANDARD LIBRARY）

此处仅列出了最常用的函数。不带 `.h` 后缀的头文件位于 `std` 命名空间中。文件名实际上均为小写。

#### ARRAY（数组）

```cpp
std::array<int, 3> marks;           // 声明数组
marks[0] = 92;                      // 赋值数组元素
std::cout << marks[2];              // 输出: 0
std::array<int, 3> = {92, 97, 98};  // 声明并初始化
std::cin >> marks[2];               // 标准输入到数组元素
```

#### STDIO.H, CSTDIO（输入/输出）

```cpp
FILE* f=fopen("filename", "r");  // 以只读方式打开，出错时返回 NULL (0)
  // 模式也可能是 "w"（写入）"a"（追加）"a+"（更新）"rb"（二进制）
fclose(f);                // 关闭文件 f
fprintf(f, "x=%d", 3);    // 打印 "x=3"  其他转换说明：
  "%5d %u %-8ld"            // int 宽度为 5，unsigned int，long 左对齐
  "%o %x %X %lx"            // 八进制、十六进制、大写十六进制、长十六进制
  "%f %5.1f"                // float 或 double：123.000000、123.0
  "%e %g"                   // 1.23e2，可用 f 或 g
  "%c %s"                   // char、char*
  "%%"                      // %
sprintf(s, "x=%d", 3);    // 将内容打印到字符数组 s 中
printf("x=%d", 3);        // 打印到标准输出（屏幕，除非被重定向）
printf(stderr, ...        // 打印到标准错误输出（不被重定向）
getc(f);                  // 从 f 读取一个字符（作为 int）或 EOF
ungetc(c, f);             // 把字符 c 放回到 f 中
getchar();                // 等价于 getc(stdin)
putc(c, f)                // 等价于 fprintf(f, "%c", c)
putchar(c);               // 等价于 putc(c, stdout)
fgets(s, n, f);           // 从 f 读取一行到 char s[n] 中，EOF 时返回 NULL
gets(s)                   // 等价于 fgets(s, INT_MAX, f)，但不做边界检查
fread(s, n, 1, f);        // 从 f 读取 n 个字节到 s，返回实际读取数量
fwrite(s, n, 1, f);       // 将 s 写入 f，返回实际写入数量
fflush(f);                // 强制写出缓冲区中的数据到 f
fseek(f, n, SEEK_SET);    // 将二进制文件 f 定位到偏移 n
ftell(f);                 // 返回在 f 中的位置，出错返回 -1L
rewind(f);                // 等价于 fseek(f, 0L, SEEK_SET); clearerr(f)
feof(f);                  // 判断是否到达文件末尾？
ferror(f);                // 是否发生错误？
perror(s);                // 打印 char* s 和对应错误消息
clearerr(f);              // 清除错误标志
remove("filename");       // 删除文件，成功返回 0
rename("old", "new");     // 重命名文件，成功返回 0
f = tmpfile();            // 创建临时文件，模式为 "wb+"
tmpnam(s);                // 将唯一文件名写入字符数组 s[L_tmpnam]
```

#### STDLIB.H, CSTDLIB（杂项函数）

```cpp
atof(s); atol(s); atoi(s);// 将 char* s 转换为 float、long、int
rand(), srand(seed);      // 生成 0 到 RAND_MAX 的随机整数，并重置随机数种子
void* p = malloc(n);      // 分配 n 字节内存，已过时，建议使用 new
free(p);                  // 释放内存，已过时，建议使用 delete
exit(n);                  // 终止程序并返回状态码 n
system(s);                // 执行系统命令 s（依赖于系统）
getenv("PATH");           // 返回环境变量值或 0（依赖于系统）
abs(n); labs(ln);         // 返回 int、long 的绝对值
```

#### STRING.H, CSTRING（字符数组处理函数）

字符串的类型是 `char[]`（字符数组），且其使用的最后一个元素为 `'\0'`。

```cpp
strcpy(dst, src);         // 复制字符串，不做边界检查
strcat(dst, src);         // 将 src 追加到 dst，不做边界检查
strcmp(s1, s2);           // 比较：<0 表示 s1<s2，0 表示 s1==s2，>0 表示 s1>s2
strncpy(dst, src, n);     // 复制前 n 个字符，也有 strncat()、strncmp()
strlen(s);                // 返回 s 的长度，不计 \0
strchr(s,c); strrchr(s,c);// 返回 s 中字符 c 的第一次/最后一次出现位置，未找到返回 0
strstr(s, sub);           // 返回 s 中子串 sub 的第一次出现位置，未找到返回 0

  // mem... 系列函数适用于任意指针类型（void*），参数 n 表示字节长度。
memmove(dst, src, n);     // 从 src 复制 n 个字节到 dst
memcmp(s1, s2, n);        // 按 strcmp 的方式比较 n 个字节
memchr(s, c, n);          // 在 s 中查找第一个字节 c，返回地址或 0
memset(s, c, n);          // 将 s 的前 n 个字节设置为 c
```

#### CTYPE.H, CCTYPE（字符类型）

```cpp
isalnum(c);               // c 是字母或数字吗？
isalpha(c); isdigit(c);   // c 是字母吗？是数字？
islower(c); isupper(c);   // c 是小写字母吗？是大写字母？
tolower(c); toupper(c);   // 将 c 转换为小写/大写
```

#### STRING_VIEW

```cpp


```

#### MATH.H, CMATH（浮点数学）

```cpp
sin(x); cos(x); tan(x);   // 三角函数，x（double）以弧度为单位
asin(x); acos(x); atan(x);// 反三角函数
atan2(y, x);              // atan(y/x)
sinh(x); cosh(x); tanh(x);// 双曲函数
exp(x); log(x); log10(x); // e 的 x 次方，基数 e 的对数，基数 10 的对数
pow(x, y); sqrt(x);       // x 的 y 次方，平方根
ceil(x); floor(x);        // 向上/向下取整（返回 double）
fabs(x); fmod(x, y);      // 绝对值，x mod y
```

#### TIME.H, CTIME（时钟）

```cpp
clock()/CLOCKS_PER_SEC;   // 自程序启动以来的时间（秒）
time_t t=time(0);         // 绝对时间（秒），未知时返回 -1
tm* p=gmtime(&t);         // 若 UTC 不可用返回 0，否则 p->tm_X 中的 X 为：
                          // sec, min, hour, mday, mon (0-11), year (-1900), 
                          // wday, yday, isdst
asctime(p);               // "Day Mon dd hh:mm:ss yyyy\n"
asctime(localtime(&t));   // 同样的格式，本地时间
```

#### ASSERT.H, CASSERT（调试辅助）

```cpp
assert(e);                // 若 e 为 false，则打印消息并中止
#define NDEBUG            // （在 #include <assert.h> 之前）关闭 assert
```

#### NEW.H, NEW（内存出界 out of memory 处理器）

```cpp
set_new_handler(handler); // 当内存不足时改变行为
void handler(void) {throw bad_alloc();}  // 默认
```

#### IOSTREAM.H, IOSTREAM（替代 stdio.h）

```cpp
cin >> x >> y;              // 从标准输入读取 x 和 y（任意类型）
cout << "x=" << 3 << endl;  // 写到标准输出
cerr << x << y << flush;    // 写到标准错误输出并刷新
c = cin.get();              // 等价于 c = getchar();
cin.get(c);                 // 读取一个字符
cin.getline(s, n, '\n');    // 读取一行到 char s[n]，直到 '\n'（默认）
if (cin)                    // 状态正常（非 EOF）？
                            // 为任意类型 T 读/写时：
istream& operator>>(istream& i, T& x) {i >> ...; x=...; return i;}
ostream& operator<<(ostream& o, const T& x) {return o << ...;}
```

#### FSTREAM.H, FSTREAM（文件 I/O，行为与 cin、cout 类似）

```cpp
ifstream f1("filename");  // 以读取方式打开文本文件
if (f1)                   // 检查是否打开成功且输入可用
  f1 >> x;                // 从文件读取对象
f1.get(s);                // 读取字符或一行
f1.getline(s, n);         // 读取一行到字符串 s[n]
ofstream f2("filename");  // 以写入方式打开文件
if (f2) f2 << x;          // 写入文件
```

#### IOMANIP.H, IOMANIP（输出格式化）

```cpp
cout << setw(6) << setprecision(2) << setfill('0') << 3.1; // 输出 "003.10"
```

#### STRING（可变长度字符数组）

```cpp
string s1, s2="hello";    // 创建字符串
s1.size(), s2.size();     // 字符数：0、5
s1 += s2 + ' ' + "world"; // 拼接
s1 == "hello world"       // 比较，还支持 <, >, != 等
s1[0];                    // 'h'
s1.substr(m, n);          // 从 s1[m] 开始，长度为 n 的子字符串
s1.c_str();               // 转成 const char*
getline(cin, s);          // 读取以 '\n' 结尾的一行
```

#### VECTOR（可变长度数组/栈，并带内存分配）

```cpp
vector<int> a(10);        // a[0]..a[9] 是 int（默认大小为 0）
a.size();                 // 元素个数（10）
a.push_back(3);           // 增加到 11 个元素，a[10]=3
a.back()=4;               // a[10]=4;
a.pop_back();             // 大小减少 1
a.front();                // a[0];
a[20]=1;                  // 崩溃：未做边界检查
a.at(20)=1;               // 与 a[20] 类似，但抛出 out_of_range()
for (vector<int>::iterator p=a.begin(); p!=a.end(); ++p)
  *p=0;                   // 把所有元素置为 0
vector<int> b(a.begin(), a.end());  // b 是 a 的副本
vector<T> c(n, x);        // c[0]..c[n-1] 初始化为 x
T d[10]; vector<T> e(d, d+10);      // e 从 d 初始化
```

#### DEQUE（数组/栈/队列）

`deque<T>` 和 `vector<T>` 类似，但是还支持:

```cpp
a.push_front(x);          // 把 x 放到 a[0]，其余元素后移
a.pop_front();            // 删除 a[0]，其余元素前移
```

#### UTILITY（Pair）

```cpp
pair<string, int> a("hello", 3);  // 一个 2 元素结构体
a.first;                  // "hello"
a.second;                 // 3
```

#### MAP（关联数组）

`std::map`使用红黑树,，平均查找复杂度`O(log N)`

```cpp
map<string, int> a;       // 从 string 到 int 的map
a["hello"]=3;             // 添加或替换元素 a["hello"]
for (map<string, int>::iterator p=a.begin(); p!=a.end(); ++p)
  cout << (*p).first << (*p).second;  // 输出 hello, 3
a.size();                 // 1
```

#### UNORDERED_MAP，UNORDERED_SET（哈希表）

`std::unordered_map`使用哈希表，平均查找复杂度`O(1)`

```cpp
#include <unordered_map>
std::unordered_map<std::string, int> age;
age["Alice"] = 20;
```

```cpp
std::unordered_set<std::string> names;
names.insert("Alice");
names.contains("Bob")     // 返回 false
names.find("Bob") != names.end()  // 返回false    
```

|          | `std::map` | `std::unordered_map` |
| -------- | ---------- | -------------------- |
| 底层       | 红黑树        | 哈希表                  |
| 查找       | O(log N)   | 平均 O(1)              |
| key 是否有序 | **有序**     | **无序**               |
| 遍历       | 按 key 排序   | 没有排序保证               |
| 支持范围查询   | 很方便        | 不适合                  |
| 典型用途     | 需要排序       | 只需要快速查找              |

#### STACK，QUEUE，PRIORITY_QUEUE（栈，队列，优先队列）

它们叫`container adapters`（容器适配器）。他们并不是像 vector、list 那样的底层容器。而是在其他容器之上套了一层接口，只允许你以某种方式操作它。

```cpp
#include <stack>
std::stack<int> s;
s.push(10);
s.top();
s.pop();
```

```cpp
#include <queue>
std::queue<std::string> q;
q.push("Alice");
q.front();
q.pop();
q.empty();
```

```cpp
std::priority_queue<int> pq;    // 默认大顶堆max heap
pq.push(10);
pq.top();
pq.pop();
std::priority_queue<            // 定义小顶堆
    int,                        // 元素类型
    std::vector<int>,           // 底层容器
    std::greater<int>           // 比较器
> pq;
```

#### ALGORITHM（60 种算法集合，基于迭代器）

```cpp
min(x, y); max(x, y);     // 返回 x、y 中较小/较大的值（要求类型定义 <）
swap(x, y);               // 交换变量 x 和 y 的值
sort(a, a+n);             // 按 < 对数组 a[0]..a[n-1] 进行排序
sort(a.begin(), a.end()); // 对 vector 或 deque 进行排序
```

#### RANGE（范围）

```cpp
vector<int> v = {5, 2, 8, 1, 3};
sort(v.begin(), v.end()); // 旧方法
ranges::sort(v);          // 新方法
ranges::sort(v, std::greater{});  // 临时创建一个 std::greater<int> 做比较器，自动模板推导省略了<int>
ranges::find(v, 8);
ranges::count(v, 8);
ranges::reverse(v);
ranges::for_each(v, [](int x){cout << x;});
ranges::find_if(v, [](int x){return x % 2 == 0;});

int arr[] = {5, 2, 8, 1, 3};
std::ranges::sort(arr);   // 对array 有效
```

##### LAZY VIEW（惰性视图）

```cpp
auto even = v             // 偶数视图
          | std::views::filter([](int x) {
                return x % 2 == 0;
            });
for (int x : even) {      // 真正遍历他的时候才从 v 提取数据
    std::cout << x << '\n';
}

// 串行range
auto result =
    v
    | std::views::filter([](int x) {
          return x % 2 == 0;
      })
    | std::views::transform([](int x) {
          return x * 10;
      })
    | std::views::take(2);

// 转化成容器
auto result =
    v
    | std::views::filter([](int x) {
          return x % 2 == 0;
      })
    | std::ranges::to<std::vector>();
```

#### OPTIONAL，VARIANT，TUPLE （实用代数类型）

实用代数类型是可以通过 Sum（+）和 Product（×）组合出来的数据类型，其中：

| C++                    | 数学/类型理论 | 意思           |
| ---------------------- | ------- | ------------ |
| `tuple<A, B>`          | `A × B` | A **和** B 都有 |
| `struct { A a; B b; }` | `A × B` | A **和** B 都有 |
| `variant<A, B>`        | `A + B` | A **或者** B   |
| `optional<A>`          | `A + 1` | A 或者 nothing |

`std::optional`

```cpp
#include <optional>
std::optional<int> a1 = 1;// std::optional<int> 有一个可以从 int 构造的构造函数 optional(const T& value) 
std::optional<int> a2 = std::nullopt;
if (a1) {return 12;}      // 返回12
a1.has_value();           // 返回true（或1）
a2.has_value();           // 返回false（或0）
a2.value_or(18);          // 返回18
std::optional<User>       // 本身拥有那个T
```

`std::variant`

```cpp
std::variant<int, std::string> value;
value = 123;              // value为123 int
std::holds_alternative<int>(value)    // 返回true（1）
std::get<int>(value);     // 返回 123
value = "1232";
std::holds_alternative<std::string>(value)    // 返回true（1）

std::visit([](auto&& x) { // 无论是int还是 string，lambda都处理
    std::cout << x << "\n";
}, value);

struct MouseEvent {int x, y;};
struct KeyEvent {int key;};
using Event = std::variant<MouseEvent, KeyEvent>;
Event event = MouseEvent{1, 2};
Event event = KeyEvent{6};
```

`std::tuple`

```cpp
std::tuple<int, double, std::string> t{
    10,
    3.14,
    "hello"
};
std::get<0>(t);         // 返回 10
std::get<2>(t);         // 返回 "hello"
auto [x, y, name] = t;  // x -> 10, y -> 3.14, name -> hello

std::tuple<int, int, int> get_position() {
    return {10, 20, 30};
}
auto [x, y, z] = get_position();
```
