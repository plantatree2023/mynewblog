---
weight: 4
title: "Envoy里流式协议的数据流"
date: 2026-04-09T21:57:40+08:00
lastmod: 2026-04-09T21:57:40+08:00
draft: true
author: "种树者"
description: "这篇文章展示了流式数据在Envoy中是怎样流动的"
images: []

tags: ["Envoy", "Streaming"]
categories: ["Cloud Native"]

lightgallery: true
---

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

```go-html-template {file="layouts/_shortcodes/hl.html"}
{{ $code := .Inner | strings.TrimSpace }}
{{ $lang := or (.Get 0) "go" }}
{{ $opts := dict "hl_inline" true "noClasses" true }}
{{ transform.Highlight $code $lang $opts }}
```

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

使用Docker构建Wasm filter。注意我们这里使用了下载到本地的proxy-wasm-cpp-sdk
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
