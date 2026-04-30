---
weight: 4
title: "Envoy里流式协议的数据流"
date: 2026-04-09T21:57:40+08:00
lastmod: 2026-04-09T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章展示了流式数据在Envoy中是怎样流动的"
images: []

tags: ["Envoy", "Streaming"]
categories: ["Cloud Native"]

lightgallery: true
---


### 定义后端服务
先用protobuf定义你的服务。该服务有一个双向流API BiStream。

````proto {file="content/example.md"}
syntax = "proto3";
package api;
option go_package = "envoystreaming/api";

service StreamService {
  rpc BiStream(stream Data) returns (stream Data);
}

message Data { string body = 1; }
````



{{< admonition type=tip title="提示" open=true >}}
为了使Go服务能识别到你定义的服务。你需要先运行下面的代码生成服务定义。执行之后，你会看到他生成了名为stream_grpc.pb.go的Go语言服务定义。
{{< /admonition >}}

````bash

protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    api/stream.proto
````

然后我门用Go语言实现该服务。该服务按顺序从输入流中轮询发送过来的数据。当他发现有数据发送过来的时候，间隔5秒发送一个ACK响应，一共发三个。


{{< highlight go >}}
package main

import (
	"io"
	"log"
	"net"
	"time"

	"envoystreaming/api"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type server struct {
	api.UnimplementedStreamServiceServer
}

func (s *server) BiStream(stream api.StreamService_BiStreamServer) error {
	for {
		req, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		log.Printf("[Backend] Recv: %s", req.Body)

		// 模拟流速控制：每 5000ms 回复一个，模拟流式下发
		for i := 1; i < 3; i++ {
			time.Sleep(5000 * time.Millisecond)
			err := stream.Send(&api.Data{Body: "ACK-" + req.Body})
			if err != nil {
				return err
			}
		}
	}
}

func main() {
	lis, _ := net.Listen("tcp", ":50051")
	s := grpc.NewServer()
	api.RegisterStreamServiceServer(s, &server{})

	reflection.Register(s) // 使用反射方便查看API

	log.Println("Backend listening on :50051...")
	s.Serve(lis)
}
{{< /highlight >}}

{{< highlight bash >}}
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    api/stream.proto
}
{{< /highlight >}}

实现之后我们先来测试后端服务器是可以跑通的。执行下面的命令开启后端服务。后端服务会跑在端口50051上。服务器的日志会直接打印在stdout。

````bash
go run backend/main.go
````

然后我们使用grpccurl工具向该后端服务发送请求。

你可以选择只发一个请求。

```bash
grpcurl -plaintext -proto ./api/stream.proto -d '{"body": "hello"}' localhost:50051 api.StreamService/BiStream
```

也可以选择开启一个连接，然后发送多个请求。
````bash
grpcurl -plaintext -proto ./api/stream.proto -d @ localhost:8080 api.StreamService/BiStream
````
你可以持续不断地发送请求。后端服务器会依次响应。

{{< admonition type=tip title="提示" open=true >}}
如果你不确定自己定义的API方法是什么，你可以用`grpcurl -plaintext localhost:50051 list` 查看你所有的API方法。
{{< /admonition >}}

我们可以看到如下响应。

客户端：
```bash
zheyu@ZhedeAir envoystreaming % grpcurl -plaintext -proto ./api/stream.proto -d @ localhost:50051 api.StreamService/BiStream
{"body": "hello2"}
{
  "body": "ACK-hello2"
}
{
  "body": "ACK-hello2"
}
{
  "body": "ACK-hello2"
}
{"body": "hello3"}
{
  "body": "ACK-hello3"
}
{
  "body": "ACK-hello3"
}
{
  "body": "ACK-hello3"
}
```

服务器端：
```bash
zheyu@ZhedeAir envoystreaming % go run backend/main.go
2026/04/10 11:30:52 Backend listening on :50051...
2026/04/10 11:30:58 [Backend] Recv: hello2
2026/04/10 11:31:32 [Backend] Recv: hello3
```

### 定义filter

这里为了观察数据流的流动，我们使用cpp语言定义3个相同的Wasm filter。

```cpp
#include <string>
#include "proxy_wasm_intrinsics.h"

class MyStreamContext : public Context {
public:
  explicit MyStreamContext(uint32_t id, RootContext* root) : Context(id, root) {}

  // --- Request Path ---
  FilterHeadersStatus onRequestHeaders(uint32_t headers, bool end_stream) override {
    LOG_INFO("C++ Filter >>> Request Headers received");
    return FilterHeadersStatus::Continue;
  }

  FilterDataStatus onRequestBody(size_t body_buffer_length, bool end_stream) override {
    LOG_INFO("C++ Filter >>> Request Body (size: " + std::to_string(body_buffer_length) + ")");
    return FilterDataStatus::Continue;
  }

  // --- Response Path ---
  FilterHeadersStatus onResponseHeaders(uint32_t headers, bool end_stream) override {
    LOG_INFO("C++ Filter <<< Response Headers received");
    return FilterHeadersStatus::Continue;
  }

  FilterDataStatus onResponseBody(size_t body_buffer_length, bool end_stream) override {
    LOG_INFO("C++ Filter <<< Response Body (size: " + std::to_string(body_buffer_length) + ")");
    return FilterDataStatus::Continue;
  }
};

static RegisterContextFactory register_MyStreamContext(CONTEXT_FACTORY(MyStreamContext));
```


然后我们使用Docker构建Wasm filter。注意我们这里使用了下载到本地的proxy-wasm-cpp-sdk。下面的命令将构建filter.wasm文件。
{{< highlight bash >}}
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) \
  emscripten/emsdk emcc -O3 \
  filter.cc \
  proxy-wasm-cpp-sdk/proxy_wasm_intrinsics.cc \
  -I/src/proxy-wasm-cpp-sdk \
  -o filter.wasm \
  -s STANDALONE_WASM \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -s EXPORTED_FUNCTIONS="['_malloc','_free']" \
  --no-entry
{{< /highlight >}}

然后我们使用下面的Envoy定义来开启一个Envoy实例。请注意以下要点。

1. filter的`root_id`字段必须为空。否则将和filter代码里面的root不匹配。注意此时的filter代码里root没有被设置。
2. filter的code位置我们必须设置为`/etc/envoy/filter.wasm`,这是因为在下一步我们将会在Docker里面运行Envoy实例，Docker没有办法感知我们当前项目的位置。
3. cluster的`address`必须设置为`host.docker.internal`。如果设置为本地地址`127.0.0.1`，它访问的是容器内部的Loopback。而Go后端运行在Mac宿主机上。它们就像在两个平行的时空，互相看不见。
4. cluster的`type`字段必须设置为`LOGICAL_DNS`。这是因为假如使用`STATIC` (默认)，Envoy认为address字段里填的必须是一个可以直接使用的 IP地址。然后它试图直接调用操作系统的网络接口去连接，看到 `host.docker.internal`这一串字母时，它会觉得这“不像一个 IP”，所以会识别不了。当我们使用`LOGICAL_DNS`后，Envoy 会在启动以及运行期间，定期去调用 DNS 解析（在容器里会询问 Docker 的内置 DNS 服务器），将`host.docker.internal`转换成宿主机的真实 IP。
```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address: { address: 0.0.0.0, port_value: 8080 }
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                http_filters:
                  - name: envoy.filters.http.wasm
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
                      config:
                        name: "my_filter_1"
                        root_id: ""
                        configuration:
                          "@type": "type.googleapis.com/google.protobuf.StringValue"
                          value: "any_config"
                        vm_config:
                          vm_id: "my_vm_1"
                          runtime: "envoy.wasm.runtime.v8"
                          code:
                            local:
                              filename: "/etc/envoy/filter.wasm"
                  - name: envoy.filters.http.wasm
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
                      config:
                        name: "my_filter_2"
                        root_id: ""
                        configuration:
                          "@type": "type.googleapis.com/google.protobuf.StringValue"
                          value: "any_config"
                        vm_config:
                          vm_id: "my_vm_1"
                          runtime: "envoy.wasm.runtime.v8"
                          code:
                            local:
                              filename: "/etc/envoy/filter.wasm"
                  - name: envoy.filters.http.wasm
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
                      config:
                        name: "my_filter_3"
                        root_id: ""
                        configuration:
                          "@type": "type.googleapis.com/google.protobuf.StringValue"
                          value: "any_config"
                        vm_config:
                          vm_id: "my_vm_1"
                          runtime: "envoy.wasm.runtime.v8"
                          code:
                            local:
                              filename: "/etc/envoy/filter.wasm"
                  - name: envoy.filters.http.router
                    typed_config: { "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router }
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes:
                        - match: { prefix: "/" }
                          route: { cluster: grpc_backend }
  clusters:
    - name: grpc_backend
      type: LOGICAL_DNS
      http2_protocol_options: {}
      load_assignment:
        cluster_name: grpc_backend
        endpoints:
          - lb_endpoints:
              - endpoint: { address: { socket_address: { address: host.docker.internal, port_value: 50051 } } }
```

现在我们用下面的命令在Docker里面启动一个Envoy实例，观察数据流运动结果。

```bash
DOCKER_API_VERSION=1.40 docker run --rm -it \
  -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml \
  -v $(pwd)/filtercpp/filter.wasm:/etc/envoy/filter.wasm \
  -v $(pwd)/filtercpp/slowfilter.wasm:/etc/envoy/slowfilter.wasm \
  -p 8080:8080 \
  envoyproxy/envoy-contrib:v1.30-latest \
  envoy -c /etc/envoy/envoy.yaml -l info
```

### 实验结果


#### Happy case

当我们使用如下命令建立连接，但是不发送数据的时候，我们看到客户端发送了Header建立了连接。


```text
[2026-04-10 22:02:39.622][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 22:02:39.622][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 22:02:39.622][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
```

我们用下面的参数输出debug日志后，我们可以看到在得到Header之前downstream和Envoy建立了连接和一个新的stream。注意此时的connection Id为0，`end_stream`为false。并且我们看到了envoy

```bash


```

```text
[2026-04-21 01:13:58.669][27][debug][conn_handler] [source/common/listener_manager/active_tcp_listener.cc:160] [Tags: "ConnectionId":"0"] new connection from 192.168.65.1:64799
[2026-04-21 01:13:58.674][27][debug][http] [source/common/http/conn_manager_impl.cc:398] [Tags: "ConnectionId":"0"] new stream
[2026-04-21 01:13:58.674][27][debug][http2] [source/common/http/http2/codec_impl.cc:1942] [Tags: "ConnectionId":"0"] Http2Visitor::OnEndHeadersForStream(1)
[2026-04-21 01:13:58.674][27][debug][http] [source/common/http/conn_manager_impl.cc:1147] [Tags: "ConnectionId":"0","StreamId":"8538165979598051927"] request headers complete (end_stream=false):
':method', 'POST'
':scheme', 'http'
':path', '/api.StreamService/BiStream'
':authority', 'localhost:8080'
'content-type', 'application/grpc'
'user-agent', 'grpcurl/1.9.3 grpc-go/1.61.0'
'te', 'trailers'
'grpc-accept-encoding', 'gzip'
```

在Header流过Wasm filter之后，我门看到Envoy正在试图做routing决定。然后我门看到Envoy创建了一个连接到upstream。然后又给这个连接创建了一个stream。

```text
[2026-04-21 01:13:58.677][27][debug][router] [source/common/router/router.cc:515] [Tags: "ConnectionId":"0","StreamId":"8538165979598051927"] cluster 'grpc_backend' match for URL '/api.StreamService/BiStream'
[2026-04-21 01:13:58.677][27][debug][router] [source/common/router/router.cc:738] [Tags: "ConnectionId":"0","StreamId":"8538165979598051927"] router decoding headers:
':method', 'POST'
':scheme', 'http'
':path', '/api.StreamService/BiStream'
':authority', 'localhost:8080'
'content-type', 'application/grpc'
'user-agent', 'grpcurl/1.9.3 grpc-go/1.61.0'
'te', 'trailers'
'grpc-accept-encoding', 'gzip'
'x-forwarded-proto', 'http'
'x-request-id', 'aeca9b84-34fd-4758-bb5b-c2323ff369bd'
'x-envoy-expected-rq-timeout-ms', '15000'
[2026-04-21 01:13:58.678][27][debug][pool] [source/common/conn_pool/conn_pool_base.cc:291] trying to create new connection
[2026-04-21 01:13:58.678][27][debug][pool] [source/common/conn_pool/conn_pool_base.cc:145] creating a new connection (connecting=0)
[2026-04-21 01:13:58.678][27][debug][http2] [source/common/http/http2/codec_impl.cc:1720] [Tags: "ConnectionId":"1"] updating connection-level initial window size to 268435456
[2026-04-21 01:13:58.678][27][debug][connection] [./source/common/network/connection_impl.h:98] [Tags: "ConnectionId":"1"] current connecting state: true
[2026-04-21 01:13:58.678][27][debug][client] [source/common/http/codec_client.cc:57] [Tags: "ConnectionId":"1"] connecting
[2026-04-21 01:13:58.678][27][debug][connection] [source/common/network/connection_impl.cc:1021] [Tags: "ConnectionId":"1"] connecting to 192.168.65.254:7580
[2026-04-21 01:13:58.679][27][debug][connection] [source/common/network/connection_impl.cc:1040] [Tags: "ConnectionId":"1"] connection in progress
[2026-04-21 01:13:58.683][27][debug][connection] [source/common/network/connection_impl.cc:751] [Tags: "ConnectionId":"1"] connected
[2026-04-21 01:13:58.683][27][debug][client] [source/common/http/codec_client.cc:88] [Tags: "ConnectionId":"1"] connected
[2026-04-21 01:13:58.683][27][debug][pool] [source/common/conn_pool/conn_pool_base.cc:328] [Tags: "ConnectionId":"1"] attaching to next stream
[2026-04-21 01:13:58.683][27][debug][pool] [source/common/conn_pool/conn_pool_base.cc:182] [Tags: "ConnectionId":"1"] creating stream


```

当我们开始发送数据`{"body": "hello}`，我们看到后端首先发回Header，然后发回三个响应体。注意请求和响应流过filter的顺序是正好相反的。
```text
[2026-04-10 22:04:21.209][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:21.210][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:21.210][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:26.223][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 22:04:26.223][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 22:04:26.223][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 22:04:26.224][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:26.224][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:26.224][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:31.219][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:31.219][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:31.219][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:36.221][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:36.221][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:36.221][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:52.293][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:52.294][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:52.294][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:15]::onRequestBody() C++ Filter >>> Request Body (size: 16)
[2026-04-10 22:04:57.298][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:57.298][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:04:57.298][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:02.299][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:02.299][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:02.299][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:07.300][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:07.300][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
[2026-04-10 22:05:07.300][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:26]::onResponseBody() C++ Filter <<< Response Body (size: 20)
```

为什么后端没有立即发回响应的Header？这是因为在gRPC框架中，后端不会在建立连接后就立即发送响应Header。当后端的Go代码执行到`stream.Send()`时，gRPC框架才发现这是本流的第一次下发数据，它会先自动封装一个响应Headers（HTTP 200, content-type: application/grpc 等）发出去，紧接着再发送数据帧。我们可以用下面的方法验证。

首先在Go后端BiStream方法的最开始加上下面的代码。下面的代码将打印stream信息。

```go
ctx := stream.Context()

// 1. 打印元数据 (Headers)
if md, ok := metadata.FromIncomingContext(ctx); ok {
	log.Printf("[Stream Info] Metadata: %v", md)
}

// 2. 打印客户端地址
if p, ok := peer.FromContext(ctx); ok {
	log.Printf("[Stream Info] Remote Addr: %s", p.Addr.String())
}
```
然后在两个不同的终端运行下面的命令连接。发现Go后端分别建立了两个连接。每个连接的stream id和客户端地址都不同。
```bash
grpcurl -plaintext -proto ./api/stream.proto -d @ localhost:8080 api.StreamService/BiStream
```

```text
2026/04/10 15:31:36 [Stream Info] Metadata: map[:authority:[localhost:8080] content-type:[application/grpc] grpc-accept-encoding:[gzip] user-agent:[grpcurl/1.9.3 grpc-go/1.61.0] x-envoy-expected-rq-timeout-ms:[15000] x-forwarded-proto:[http] x-request-id:[36a02abb-89e2-455e-ac4e-2996519d489d]]
2026/04/10 15:31:36 [Stream Info] Remote Addr: 127.0.0.1:59312
2026/04/10 15:31:40 [Stream Info] Metadata: map[:authority:[localhost:8080] content-type:[application/grpc] grpc-accept-encoding:[gzip] user-agent:[grpcurl/1.9.3 grpc-go/1.61.0] x-envoy-expected-rq-timeout-ms:[15000] x-forwarded-proto:[http] x-request-id:[d0b8dbc1-7e3b-45e6-a5ce-08ec760427d9]]
2026/04/10 15:31:40 [Stream Info] Remote Addr: 127.0.0.1:59316
```

下面我们尝试在连接建立后直接发送一个Header，不等第一个请求题到来。可以看到响应头直接返回，不需要第一个请求头。

```text
[2026-04-10 22:40:11.520][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 22:40:11.520][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 22:40:11.520][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 22:40:11.527][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 22:40:11.527][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 22:40:11.527][30][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:21]::onResponseHeaders() C++ Filter <<< Response Headers received
```

如果我们此时直接发一个请求，并立即关闭连接你会看到如下日志。
```bash
zheyu@ZhedeAir envoystreaming % grpcurl -plaintext -proto ./api/stream.proto -d '{"body": "hello"}' localhost:8080 api.StreamService/BiStream
{
  "body": "ACK-hello"
}
{
  "body": "ACK-hello"
}
{
  "body": "ACK-hello"
}
```

```text
[2026-04-10 23:17:37.601][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 23:17:37.601][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 23:17:37.601][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:10]::onRequestHeaders() C++ Filter >>> Request Headers received
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 12)
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 12)
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 12)
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 0)
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 0)
[2026-04-10 23:17:37.604][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:16]::onRequestBody() C++ Filter >>> Request Body (size: 0)
[2026-04-10 23:17:38.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:23]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 23:17:38.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:23]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 23:17:38.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:23]::onResponseHeaders() C++ Filter <<< Response Headers received
[2026-04-10 23:17:38.115][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:38.115][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:38.115][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:38.612][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:38.612][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:38.612][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:39.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_3 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:39.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_2 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
[2026-04-10 23:17:39.114][31][info][wasm] [source/extensions/common/wasm/context.cc:1195] wasm log my_filter_1 my_vm_1: [filter.cc:29]::onResponseBody() C++ Filter <<< Response Body (size: 16)
```

你会看到在size为12的请求体之后一个一个size为0的请求体。该请求体是我们在发送了gRPC数据帧后面的http2数据帧。该数据帧有`END_STREAM`标志。这是因为我们用的`-d`，他会在发送完数据之后立即请求关闭连接。

{{< admonition type=warning title="注意" open=true >}}
当你直接发送一个请求并立即关闭的情况下，最好将发送响应的间隔变小。否则可能会发生请求端请求了关闭但是响应流正在休眠的情况
{{< /admonition >}}