---
title: "C++操作protobuf"
date: 2026-08-16T21:57:40+08:00
lastmod: 2026-08-16T21:57:40+08:00
draft: false
author: "种树者"
description: "这是一篇讨论C++操作protobuf的文章"
images: []

tags: ["cpp","编程语言"]
categories: ["编程语言"]

lightgallery: true
---

我们用[google/protobuf/struct.proto](https://github.com/protocolbuffers/protobuf/blob/main/src/google/protobuf/struct.proto)来研究cpp如何操作protobuf，然后用一个例子验证我们的理解。

首先看`google/protobuf/struct.proto`的结构：

```proto
message Struct {
  // Unordered map of dynamically typed values.
  map<string, Value> fields = 1;
}

// Represents a JSON value.
//
// `Value` represents a dynamically typed value which can be either
// null, a number, a string, a boolean, a recursive struct value, or a
// list of values. A producer of value is expected to set one of these
// variants. Absence of any variant is an invalid state.
message Value {
  // The kind of value.
  oneof kind {
    // Represents a JSON `null`.
    NullValue null_value = 1;

    // Represents a JSON number. Must not be `NaN`, `Infinity` or
    // `-Infinity`, since those are not supported in JSON. This also cannot
    // represent large Int64 values, since JSON format generally does not
    // support them in its number type.
    double number_value = 2;

    // Represents a JSON string.
    string string_value = 3;

    // Represents a JSON boolean (`true` or `false` literal in JSON).
    bool bool_value = 4;

    // Represents a JSON object.
    Struct struct_value = 5;

    // Represents a JSON array.
    ListValue list_value = 6;
  }
}

// Represents a JSON `null`.
//
// `NullValue` is a sentinel, using an enum with only one value to represent
// the null value for the `Value` type union.
//
// A field of type `NullValue` with any value other than `0` is considered
// invalid. Most ProtoJSON serializers will emit a `Value` with a `null_value`
// set as a JSON `null` regardless of the integer value, and so will round trip
// to a `0` value.
enum NullValue {
  // Null value.
  NULL_VALUE = 0;
}

// Represents a JSON array.
message ListValue {
  // Repeated field of dynamically typed values.
  repeated Value values = 1;
}
```

我们最终会创造一个结构如下的`Struct`：

```json
{
  "name": "Alice",
  "age": 30,
  "is_admin": true,
  "nothing": null,

  "address": {
    "city": "Seattle",
    "zip": 98052
  },

  "languages": [
    "C++",
    "Go",
    "Python"
  ]
}
```
### C++操作总结

| Proto field      | C++ 写                         | C++ 读                  |
| ---------------- | ----------------------------- | ---------------------- |
| string           | `set_xxx()`                   | `xxx()`                |
| int32            | `set_xxx()`                   | `xxx()`                |
| int64            | `set_xxx()`                   | `xxx()`                |
| bool             | `set_xxx()`                   | `xxx()`                |
| enum             | `set_xxx()`                   | `xxx()`                |
| message          | `mutable_xxx()` 返回指针               | `xxx()` 返回常指针               |
| repeated scalar  | `add_xxx()`                   | `xxx()`, `xxx(int)` / range-for    |
| repeated message | `add_xxx()` 返回指针                  | `xxx()` 返回 `RepeatedPtrField`常指针, `xxx(int)` 返回常指针 / range-for    |
| map              | `mutable_xxx()`               | `xxx()`                |
| oneof            | `set_xxx()` 或 `mutable_xxx()` | `xxx()` + `xxx_case()` （返回case类型字符串常量） |

#### mutable_XXX()是什么？
mutable_XXX是protobuf C++ 里非常重要的一组 API。
假设：
```proto
message Person {
    Address address = 1;
}
```
C++ 通常会生成：
```proto
const Address& address() const;
Address* mutable_address();
```

所以，只读时用：

```cpp
const Address& address = person.address();
```
修改时用：
```cpp
Address* address = person.mutable_address();
```
### C++操作
#### 设置值（set values）

```cpp
#include <iostream>
#include <fstream>
#include <string>

#include <google/protobuf/struct.pb.h>

using google::protobuf::ListValue;
using google::protobuf::NullValue;
using google::protobuf::Struct;
using google::protobuf::Value;

void SetData(Struct* data) {
    // Set string value.
    (*data->mutable_fields())["name"].set_string_value("Alice");

    // Set number value.
    (*data->mutable_fields())["age"].set_number_value(30);

    // Set bool value.
    (*data->mutable_fields())["is_admin"].set_bool_value(true);

    // Set NULL value.
    (*data->mutable_fields())["nothing"].set_null_value(
        NullValue::NULL_VALUE
    );

    // ------------------------------------------------------------
    // 5. nested Struct
    //
    // address:
    // {
    //     city: "Seattle",
    //     zip: 98052
    // }
    // ------------------------------------------------------------
    Struct* address =
        (*data->mutable_fields())["address"].mutable_struct_value();
    (*address->mutable_fields())["city"].set_string_value("Seattle");
    (*address->mutable_fields())["zip"].set_number_value(98052);

    // ------------------------------------------------------------
    // 6. ListValue
    //
    // languages:
    // [
    //     "C++",
    //     "Go",
    //     "Python"
    // ]
    // ------------------------------------------------------------
    ListValue* languages =
        (*data->mutable_fields())["languages"].mutable_list_value();
    languages->add_values()->set_string_value("C++");
    languages->add_values()->set_string_value("Go");
    languages->add_values()->set_string_value("Python");
}
```

#### 读取值（read value）
```cpp
void ReadData(const Struct& data) {
    // Read map.
    const auto& fields = data.fields();
    std::cout << "number of fields = "
              << fields.size()
              << "\n\n";

    // Read string value.
    const Value& name = fields.at("name");
    std::cout << "name = "
              << name.string_value()
              << "\n";

    // Read number value.
    const Value& age = fields.at("age");
    std::cout << "age = "
              << age.number_value()
              << "\n";


    // Read bool value.
    const Value& is_admin = fields.at("is_admin");
    std::cout << "is_admin = "
              << std::boolalpha
              << is_admin.bool_value()
              << "\n";


    // Read one of value.
    // Value::kind_case() 可以告诉我们：
    // 当前到底设置了哪一个 oneof field
    const Value& value = fields.at("name");
    switch (value.kind_case()) {
        case Value::kStringValue:
            std::cout << "name contains a string\n";
            break;
        case Value::kNumberValue:
            std::cout << "name contains a number\n";
            break;
        case Value::kBoolValue:
            std::cout << "name contains a bool\n";
            break;
        case Value::kNullValue:
            std::cout << "name contains null\n";
            break;
        case Value::kStructValue:
            std::cout << "name contains a struct\n";
            break;
        case Value::kListValue:
            std::cout << "name contains a list\n";
            break;
        case Value::KIND_NOT_SET:
            std::cout << "name contains nothing\n";
            break;
    }

    // Read nested proto field.
    const Value& address_value = fields.at("address");
    const Struct& address = address_value.struct_value();
    std::cout << "\naddress.city = "
              << address.fields().at("city").string_value()
              << "\n";
    std::cout << "address.zip = "
              << address.fields().at("zip").number_value()
              << "\n";


    // Read repeated/ListValue value.
    const Value& languages_value = fields.at("languages");
    const ListValue& languages =
        languages_value.list_value();
    std::cout << "\nlanguages:\n";
    for (const Value& language : languages.values()) {
        std::cout << "  - "
                  << language.string_value()
                  << "\n";
    }
}
```

#### 序列化和反序列化（Serialize and de-serialize）
```cpp
    // Serialize
    std::string serialized;
    if (!data.SerializeToString(&serialized)) {
        std::cerr << "Serialize failed\n";
    }
    std::cout << "\nserialized size = "
              << serialized.size()
              << " bytes\n";

    // Parse
    Struct parsed;
    if (!parsed.ParseFromString(serialized)) {
        std::cerr << "Parse failed\n";
    }
```

### 生命周期

nested message 的生命周期由 protobuf parent object 管理。
这是 protobuf C++ 和普通 C++ object ownership 一个很重要的区别。


### 另一个例子

[参考文档](https://protobuf.dev/getting-started/cpptutorial/?utm_source=chatgpt.com)
以另一个proto为例：

```proto
edition = "2023";

package tutorial;

message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;

  enum PhoneType {
    PHONE_TYPE_UNSPECIFIED = 0;
    PHONE_TYPE_MOBILE = 1;
    PHONE_TYPE_HOME = 2;
    PHONE_TYPE_WORK = 3;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phones = 4;
}
```

我们可以看到生成的C++ API如下：

```cpp
  // name
  bool has_name() const; // Only for explicit presence
  void clear_name();
  const ::std::string& name() const;
  void set_name(const ::std::string& value);
  ::std::string* mutable_name();

  // id
  bool has_id() const;
  void clear_id();
  int32_t id() const;
  void set_id(int32_t value);

  // email
  bool has_email() const;
  void clear_email();
  const ::std::string& email() const;
  void set_email(const ::std::string& value);
  ::std::string* mutable_email();

  // phones
  int phones_size() const;
  void clear_phones();
  const ::google::protobuf::RepeatedPtrField< ::tutorial::Person_PhoneNumber >& phones() const;
  ::google::protobuf::RepeatedPtrField< ::tutorial::Person_PhoneNumber >* mutable_phones();
  const ::tutorial::Person_PhoneNumber& phones(int index) const;
  ::tutorial::Person_PhoneNumber* mutable_phones(int index);
  ::tutorial::Person_PhoneNumber* add_phones();
```