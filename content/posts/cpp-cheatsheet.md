---
title: "cpp小抄cheatsheet"
date: 2026-08-15T21:57:40+08:00
lastmod: 2026-08-15T21:57:40+08:00
draft: false
author: "种树者"
description: "这是一篇cpp cheatsheet小抄"
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
int& r=x;               // r是整数x的引用
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
```

### 存储类 （storage class）
```cpp
int x;                  // 自动分配，内存分配仅在处于当前scope的时候存在
static int x;           // 全局声明周期，即使是在local scope中
extern int x;           // 有一个x整型变量存在，但不要在当前位置给他分配空间。它的真正定义和内存分配在程序的其他文件或位置
```


### 语句 （statement）

```cpp
x=y;                      // Every expression is a statement
int x;                    // Declarations are statements
;                         // Empty statement

{                         // A block is a single statement
  int x;                  // Scope of x is from declaration to end of block
  a;                      // In C, declarations must precede statements
}
if (x) a;                 // If x is true (not 0), evaluate a
else if (y) b;            // If not x and y (optional, may be repeated)
else c;                   // If not x and not y (optional)

while (x) a;              // Repeat 0 or more times while x is true

for (x; y; z) a;          // Equivalent to: x; while(y) {a; z;}

do a; while (x);          // Equivalent to: a; while(x) a;

switch (x) {              // x must be int
  case X1: a;             // If x == X1 (must be a const), jump here
  case X2: b;             // Else if x == X2, jump here
  default: c;             // Else jump here (optional)
}
break;                    // Jump out of while, do, or for loop, or switch
continue;                 // Jump to bottom of while, do, or for loop
return x;                 // Return x from function to caller
try { a; }
catch (T t) { b; }        // If a throws a T, then jump here
catch (...) { c; }        // If a throws something else, jump here
```

STATEMENTS
x=y;                      // Every expression is a statement
int x;                    // Declarations are statements
;                         // Empty statement

{                         // A block is a single statement
  int x;                  // Scope of x is from declaration to end of block
  a;                      // In C, declarations must precede statements
}
if (x) a;                 // If x is true (not 0), evaluate a
else if (y) b;            // If not x and y (optional, may be repeated)
else c;                   // If not x and not y (optional)

while (x) a;              // Repeat 0 or more times while x is true

for (x; y; z) a;          // Equivalent to: x; while(y) {a; z;}

do a; while (x);          // Equivalent to: a; while(x) a;

switch (x) {              // x must be int
  case X1: a;             // If x == X1 (must be a const), jump here
  case X2: b;             // Else if x == X2, jump here
  default: c;             // Else jump here (optional)
}
break;                    // Jump out of while, do, or for loop, or switch
continue;                 // Jump to bottom of while, do, or for loop
return x;                 // Return x from function to caller
try { a; }
catch (T t) { b; }        // If a throws a T, then jump here
catch (...) { c; }        // If a throws something else, jump here

FUNCTIONS
int f(int x, int);        // f is a function taking 2 ints and returning int
void f();                 // f is a procedure taking no arguments
void f(int a=0);          // f() is equivalent to f(0)
f();                      // Default return type is int
inline f();               // Optimize for speed
f() { statements; }       // Function definition (must be global)
T operator+(T x, T y);    // a+b (if type T) calls operator+(a, b)
T operator-(T x);         // -a calls function operator-(a)
T operator++(int);        // postfix ++ or -- (parameter ignored)
extern "C" {void f();}    // f() was compiled in C
Function parameters and return values may be of any type. A function must either be declared or defined before it is used. It may be declared first and defined later. Every program consists of a set of a set of global variable declarations and a set of function definitions (possibly in separate files), one of which must be:

int main()  { statements... }     or
int main(int argc, char* argv[]) { statements... }
argv is an array of argc strings from the command line. By convention, main returns status 0 if successful, 1 or higher for errors.

Functions with different parameters may have the same name (overloading). Operators except :: . .* ?: may be overloaded. Precedence order is not affected. New operators may not be created.


EXPRESSIONS

Operators are grouped by precedence, highest first. Unary operators and assignment evaluate right to left. All others are left to right. Precedence does not affect order of evaluation, which is undefined. There are no run time checks for arrays out of bounds, invalid pointers, etc.
T::X                      // Name X defined in class T
N::X                      // Name X defined in namespace N
::X                       // Global name X

t.x                       // Member x of struct or class t
p->x                      // Member x of struct or class pointed to by p
a[i]                      // i'th element of array a
f(x,y)                    // Call to function f with arguments x and y
T(x,y)                    // Object of class T initialized with x and y
x++                       // Add 1 to x, evaluates to original x (postfix)
x--                       // Subtract 1 from x, evaluates to original x
typeid(x)                 // Type of x
typeid(T)                 // Equals typeid(x) if x is a T
dynamic_cast<T>(x)        // Converts x to a T, checked at run time
static_cast<T>(x)         // Converts x to a T, not checked
reinterpret_cast<T>(x)    // Interpret bits of x as a T
const_cast<T>(x)          // Converts x to same type T but not const

sizeof x                  // Number of bytes used to represent object x
sizeof(T)                 // Number of bytes to represent type T
++x                       // Add 1 to x, evaluates to new value (prefix)
--x                       // Subtract 1 from x, evaluates to new value
~x                        // Bitwise complement of x
!x                        // true if x is 0, else false (1 or 0 in C)
-x                        // Unary minus
+x                        // Unary plus (default)
&x                        // Address of x
*p                        // Contents of address p (*&x equals x)
new T                     // Address of newly allocated T object
new T(x, y)               // Address of a T initialized with x, y
new T[x]                  // Address of allocated n-element array of T
delete p                  // Destroy and free object at address p
delete[] p                // Destroy and free array of objects at p
(T) x                     // Convert x to T (obsolete, use .._cast<T>(x))

x * y                     // Multiply
x / y                     // Divide (integers round toward 0)
x % y                     // Modulo (result has sign of x)

x + y                     // Add, or &x[y]
x - y                     // Subtract, or number of elements from *x to *y

x << y                    // x shifted y bits to left (x * pow(2, y))
x >> y                    // x shifted y bits to right (x / pow(2, y))

x < y                     // Less than
x <= y                    // Less than or equal to
x > y                     // Greater than
x >= y                    // Greater than or equal to

x == y                    // Equals
x != y                    // Not equals

x & y                     // Bitwise and (3 & 6 is 2)

x ^ y                     // Bitwise exclusive or (3 ^ 6 is 5)

x | y                     // Bitwise or (3 | 6 is 7)

x && y                    // x and then y (evaluates y only if x (not 0))

x || y                    // x or else y (evaluates y only if x is false (0))

x = y                     // Assign y to x, returns new value of x
x += y                    // x = x + y, also -= *= /= <<= >>= &= |= ^=

x ? y : z                 // y if x is true (nonzero), else z

throw x                   // Throw exception, aborts if not caught

x , y                     // evaluates x and y, returns y (seldom used)

CLASSES
class T {                 // A new type
private:                  // Section accessible only to T's member functions
protected:                // Also accessable to classes derived from T
public:                   // Accessable to all
  int x;                  // Member data
  void f();               // Member function
  void g() {return;}      // Inline member function
  void h() const;         // Does not modify any data members
  int operator+(int y);   // t+y means t.operator+(y)
  int operator-();        // -t means t.operator-()
  T(): x(1) {}            // Constructor with initialization list
  T(const T& t): x(t.x) {}  // Copy constructor
  T& operator=(const T& t) {x=t.x; return *this; }  // Assignment operator
  ~T();                   // Destructor (automatic cleanup routine)
  explicit T(int a);      // Allow t=T(3) but not t=3
  operator int() const {return x;}  // Allows int(t)
  friend void i();        // Global function i() has private access
  friend class U;         // Members of class U have private access
  static int y;           // Data shared by all T objects
  static void l();        // Shared code.  May access y but not x
  class Z {};             // Nested class T::Z
  typedef int V;          // T::V means int
};
void T::f() {             // Code for member function f of class T
  this->x = x;}           // this is address of self (means x=x;)
int T::y = 2;             // Initialization of static member (required)
T::l();                   // Call to static member
struct T {                // Equivalent to: class T { public:
  virtual void f();       // May be overridden at run time by derived class
  virtual void g()=0; };  // Must be overridden (pure virtual)
class U: public T {};     // Derived class U inherits all members of base T
class V: private T {};    // Inherited members of T become private
class W: public T, public U {};  // Multiple inheritance
class X: public virtual T {}; // Classes derived from X have base T directly
All classes have a default copy constructor, assignment operator, and destructor, which perform the corresponding operations on each data member and each base class as shown above. There is also a default no-argument constructor (required to create arrays) if the class has no constructors. Constructors, assignment, and destructors do not inherit.


TEMPLATES
template <class T> T f(T t);        // Overload f for all types
template <class T> class X {        // Class with type parameter T
  X(T t); };                        // A constructor
template <class T> X<T>::X(T t) {}  // Definition of constructor
X<int> x(3);                        // An object of type "X of int"
template <class T, class U=T, int n=0>  // Template with default parameters

NAMESPACES

namespace N {class T {};} // Hide name T
N::T t;                   // Use name T in namespace N
using namespace N;        // Make T visible without N::

C/C++ STANDARD LIBRARY

Only the most commonly used functions are listed. Header files without .h are in namespace std. File names are actually lower case.
STDIO.H, CSTDIO (Input/output)

FILE* f=fopen("filename", "r");  // Open for reading, NULL (0) if error
  // Mode may also be "w" (write) "a" append, "a+" update, "rb" binary
fclose(f);                // Close file f
fprintf(f, "x=%d", 3);    // Print "x=3"  Other conversions:
  "%5d %u %-8ld"            // int width 5, unsigned int, long left just.
  "%o %x %X %lx"            // octal, hex, HEX, long hex
  "%f %5.1f"                // float or double: 123.000000, 123.0
  "%e %g"                   // 1.23e2, use either f or g
  "%c %s"                   // char, char*
  "%%"                      // %
sprintf(s, "x=%d", 3);    // Print to array of char s
printf("x=%d", 3);        // Print to stdout (screen unless redirected)
fprintf(stderr, ...       // Print to standard error (not redirected)
getc(f);                  // Read one char (as an int) or EOF from f
ungetc(c, f);             // Put back one c to f
getchar();                // getc(stdin);
putc(c, f)                // fprintf(f, "%c", c);
putchar(c);               // putc(c, stdout);
fgets(s, n, f);           // Read line into char s[n] from f.  NULL if EOF
gets(s)                   // fgets(s, INT_MAX, f); no bounds check
fread(s, n, 1, f);        // Read n bytes from f to s, return number read
fwrite(s, n, 1, f);       // Write n bytes of s to f, return number written
fflush(f);                // Force buffered writes to f
fseek(f, n, SEEK_SET);    // Position binary file f at n
ftell(f);                 // Position in f, -1L if error
rewind(f);                // fseek(f, 0L, SEEK_SET); clearerr(f);
feof(f);                  // Is f at end of file?
ferror(f);                // Error in f?
perror(s);                // Print char* s and error message
clearerr(f);              // Clear error code for f
remove("filename");       // Delete file, return 0 if OK
rename("old", "new");     // Rename file, return 0 if OK
f = tmpfile();            // Create temporary file in mode "wb+"
tmpnam(s);                // Put a unique file name in char s[L_tmpnam]
STDLIB.H, CSTDLIB (Misc. functions)

atof(s); atol(s); atoi(s);// Convert char* s to float, long, int
rand(), srand(seed);      // Random int 0 to RAND_MAX, reset rand()
void* p = malloc(n);      // Allocate n bytes.  Obsolete: use new
free(p);                  // Free memory.  Obsolete: use delete
exit(n);                  // Kill program, return status n
system(s);                // Execute OS command s (system dependent)
getenv("PATH");           // Environment variable or 0 (system dependent)
abs(n); labs(ln);         // Absolute value as int, long
STRING.H, CSTRING (Character array handling functions)

Strings are type char[] with a '\0' in the last element used.
strcpy(dst, src);         // Copy string. Not bounds checked
strcat(dst, src);         // Concatenate to dst. Not bounds checked
strcmp(s1, s2);           // Compare, <0 if s1<s2, 0 if s1==s2, >0 if s1>s2
strncpy(dst, src, n);     // Copy up to n chars, also strncat(), strncmp()
strlen(s);                // Length of s not counting \0
strchr(s,c); strrchr(s,c);// Address of first/last char c in s or 0
strstr(s, sub);           // Address of first substring in s or 0
  // mem... functions are for any pointer types (void*), length n bytes
memmove(dst, src, n);     // Copy n bytes from src to dst
memcmp(s1, s2, n);        // Compare n bytes as in strcmp
memchr(s, c, n);          // Find first byte c in s, return address or 0
memset(s, c, n);          // Set n bytes of s to c
CTYPE.H, CCTYPE (Character types)

isalnum(c);               // Is c a letter or digit?
isalpha(c); isdigit(c);   // Is c a letter?  Digit?
islower(c); isupper(c);   // Is c lower case?  Upper case?
tolower(c); toupper(c);   // Convert c to lower/upper case
MATH.H, CMATH (Floating point math)

sin(x); cos(x); tan(x);   // Trig functions, x (double) is in radians
asin(x); acos(x); atan(x);// Inverses
atan2(y, x);              // atan(y/x)
sinh(x); cosh(x); tanh(x);// Hyperbolic
exp(x); log(x); log10(x); // e to the x, log base e, log base 10
pow(x, y); sqrt(x);       // x to the y, square root
ceil(x); floor(x);        // Round up or down (as a double)
fabs(x); fmod(x, y);      // Absolute value, x mod y
TIME.H, CTIME (Clock)

clock()/CLOCKS_PER_SEC;   // Time in seconds since program started
time_t t=time(0);         // Absolute time in seconds or -1 if unknown
tm* p=gmtime(&t);         // 0 if UCT unavailable, else p->tm_X where X is:
  sec, min, hour, mday, mon (0-11), year (-1900), wday, yday, isdst
asctime(p);               // "Day Mon dd hh:mm:ss yyyy\n"
asctime(localtime(&t));   // Same format, local time
ASSERT.H, CASSERT (Debugging aid)

assert(e);                // If e is false, print message and abort
#define NDEBUG            // (before #include <assert.h>), turn off assert
NEW.H, NEW (Out of memory handler)

set_new_handler(handler); // Change behavior when out of memory
void handler(void) {throw bad_alloc();}  // Default
IOSTREAM.H, IOSTREAM (Replaces stdio.h)

cin >> x >> y;              // Read words x and y (any type) from stdin
cout << "x=" << 3 << endl;  // Write line to stdout
cerr << x << y << flush;    // Write to stderr and flush
c = cin.get();              // c = getchar();
cin.get(c);                 // Read char
cin.getline(s, n, '\n');    // Read line into char s[n] to '\n' (default)
if (cin)                    // Good state (not EOF)?
                            // To read/write any type T:
istream& operator>>(istream& i, T& x) {i >> ...; x=...; return i;}
ostream& operator<<(ostream& o, const T& x) {return o << ...;}
FSTREAM.H, FSTREAM (File I/O works like cin, cout as above)

ifstream f1("filename");  // Open text file for reading
if (f1)                   // Test if open and input available
  f1 >> x;                // Read object from file
f1.get(s);                // Read char or line
f1.getline(s, n);         // Read line into string s[n]
ofstream f2("filename");  // Open file for writing
if (f2) f2 << x;          // Write to file
IOMANIP.H, IOMANIP (Output formatting)

cout << setw(6) << setprecision(2) << setfill('0') << 3.1; // print "003.10"
STRING (Variable sized character array)

string s1, s2="hello";    // Create strings
s1.size(), s2.size();     // Number of characters: 0, 5
s1 += s2 + ' ' + "world"; // Concatenation
s1 == "hello world"       // Comparison, also <, >, !=, etc.
s1[0];                    // 'h'
s1.substr(m, n);          // Substring of size n starting at s1[m]
s1.c_str();               // Convert to const char*
getline(cin, s);          // Read line ending in '\n'
VECTOR (Variable sized array/stack with built in memory allocation)

vector<int> a(10);        // a[0]..a[9] are int (default size is 0)
a.size();                 // Number of elements (10)
a.push_back(3);           // Increase size to 11, a[10]=3
a.back()=4;               // a[10]=4;
a.pop_back();             // Decrease size by 1
a.front();                // a[0];
a[20]=1;                  // Crash: not bounds checked
a.at(20)=1;               // Like a[20] but throws out_of_range()
for (vector<int>::iterator p=a.begin(); p!=a.end(); ++p)
  *p=0;                   // Set all elements of a to 0
vector<int> b(a.begin(), a.end());  // b is copy of a
vector<T> c(n, x);        // c[0]..c[n-1] init to x
T d[10]; vector<T> e(d, d+10);      // e is initialized from d
DEQUE (array/stack/queue)

deque<T> is like vector<T>, but also supports:
a.push_front(x);          // Puts x at a[0], shifts elements toward back
a.pop_front();            // Removes a[0], shifts toward front
UTILITY (Pair)

pair<string, int> a("hello", 3);  // A 2-element struct
a.first;                  // "hello"
a.second;                 // 3
MAP (associative array)

map<string, int> a;       // Map from string to int
a["hello"]=3;             // Add or replace element a["hello"]
for (map<string, int>::iterator p=a.begin(); p!=a.end(); ++p)
  cout << (*p).first << (*p).second;  // Prints hello, 3
a.size();                 // 1
ALGORITHM (A collection of 60 algorithms on sequences with iterators)

min(x, y); max(x, y);     // Smaller/larger of x, y (any type defining <)
swap(x, y);               // Exchange values of variables x and y
sort(a, a+n);             // Sort array a[0]..a[n-1] by <
sort(a.begin(), a.end()); // Sort vector or deque