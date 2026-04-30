---
weight: 4
title: "Envoy的ext_proc"
date: 2026-04-27T21:57:40+08:00
lastmod: 2026-04-27T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章展示了Envoy中的ext_proc功能"
images: []

tags: ["Envoy"]
categories: ["Cloud Native"]

lightgallery: true
---
本篇文章中，我们学习Envoy中的ext_proc功能。


### 基本功能
首先我们搭建一个最简单的ext_proc，并观察他的基本使用方法。

首先我们搭建一个简单的外部后端。该后端只处理response header，他在原有header的基础上加一个`x-extproc-hello`header。


```go
package main

import (
  "log"
  "net"

  "google.golang.org/grpc"
  "google.golang.org/grpc/codes"
  "google.golang.org/grpc/status"

  configPb "github.com/envoyproxy/go-control-plane/envoy/config/core/v3"
  extProcPb "github.com/envoyproxy/go-control-plane/envoy/service/ext_proc/v3"
)

type extProcServer struct {
  extProcPb.UnimplementedExternalProcessorServer
}

// Process handles external processing requests from Envoy.
// It listens for incoming requests, modifies response headers,
// and sends the updated response back to Envoy.
//
// When a request with response headers is received, it adds a custom header
// "x-extproc-hello" with the value "Hello from ext_proc" and returns the modified headers.
//
// Note: The `RawValue` field is used instead of `Value` because it supports
// setting the header value as a byte slice, allowing precise handling of binary data.
//
// This function is called once per HTTP request to process gRPC messages from Envoy.
// It exits when an error occurs while receiving or sending messages.

func (s *extProcServer) Process(
  srv extProcPb.ExternalProcessor_ProcessServer,
) error {
  for {
    req, err := srv.Recv()
    if err != nil {
      return status.Errorf(codes.Unknown, "error receiving request: %v", err)
    }

    log.Printf("Received request: %+v\n", req)

    // Prepare the response to be returned to Envoy.
    resp := &extProcPb.ProcessingResponse{}

    // Only process response headers, not request headers.
    if respHeaders := req.GetResponseHeaders(); respHeaders != nil {
      log.Println("Processing Response Headers...")

      resp = &extProcPb.ProcessingResponse{
        Response: &extProcPb.ProcessingResponse_ResponseHeaders{
          ResponseHeaders: &extProcPb.HeadersResponse{
            Response: &extProcPb.CommonResponse{
              HeaderMutation: &extProcPb.HeaderMutation{
                SetHeaders: []*configPb.HeaderValueOption{
                  {
                    Header: &configPb.HeaderValue{
                      Key:      "x-extproc-hello",
                      RawValue: []byte("Hello from ext_proc"),
                    },
                  },
                },
              },
            },
          },
        },
      }
      log.Printf("Sending response: %+v\n", resp)
      // Send the response back to Envoy.
      if err := srv.Send(resp); err != nil {
        return status.Errorf(codes.Unknown, "error sending response: %v", err)
      }
    } else {
      // If it is not a callback in the response header stage, do not make any modifications and continue processing the next event.
      // For request_headers or other events, do not modify & ensure that Envoy will not be stuck.
      // An empty processing can be returned for request_headers, or it can be skipped in envoy.yaml.
      // Here, simply continue to wait for the next event.
      log.Printf("Not sending response %+v\n", resp)
      continue
    }
  }
}

func main() {
  lis, err := net.Listen("tcp", ":9000")
  if err != nil {
    log.Fatalf("Failed to listen: %v", err)
  }

  grpcServer := grpc.NewServer()
  // Register the ExternalProcessorServer with the gRPC server.
  extProcPb.RegisterExternalProcessorServer(grpcServer, &extProcServer{})

  log.Println("Starting gRPC server on :9000...")
  if err := grpcServer.Serve(lis); err != nil {
    log.Fatalf("Failed to serve: %v", err)
  }
}
```
然后我们配置一个本地的Envoy实例。该实例会call上面定义的外部后端进行处理。


```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          protocol: TCP
          address: 0.0.0.0
          port_value: 8082
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                access_log:
                  - name: envoy.access_loggers.stdout
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                      log_format:
                        text_format: "[%START_TIME%] \"%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%\" %RESPONSE_CODE% %RESPONSE_FLAGS% \"%RESP(X-EXTPROC-HELLO)%\" \"%RESP(CONTENT-TYPE)%\" \"%RESP(CONTENT-LENGTH)%\" %DURATION% ms\n"
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: [ "*" ]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            host_rewrite_literal: www.envoyproxy.io
                            cluster: service_envoyproxy_io
                http_filters:
                  - name: envoy.filters.http.ext_proc
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
                      grpc_service:
                        envoy_grpc:
                          cluster_name: ext_proc_cluster
                      failure_mode_allow: true
                      processing_mode:
                        request_header_mode: SKIP
                        response_header_mode: SEND
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: ext_proc_cluster
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      load_assignment:
        cluster_name: ext_proc_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 9000
    - name: service_envoyproxy_io
      type: LOGICAL_DNS
      dns_lookup_family: V4_ONLY
      load_assignment:
        cluster_name: service_envoyproxy_io
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: www.envoyproxy.io
                      port_value: 443
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          sni: www.envoyproxy.io
```

分别使用`envoy -c envoy.yaml`和`go run main.go`启动Envoy和后端。当我们使用`curl -I http://localhost:8082`call Envoy的时候我们会看到如下header。

```bash
zheyu@ZhedeAir envoyext_proc % curl -I http://localhost:8082                     
HTTP/1.1 200 OK
accept-ranges: bytes
age: 8154
cache-control: public,max-age=0,must-revalidate
cache-status: "Netlify Edge"; hit
content-length: 15991
content-security-policy: frame-ancestors 'self';
content-type: text/html; charset=UTF-8
date: Wed, 29 Apr 2026 02:48:51 GMT
etag: "7ffdbb8473232c16f9299e0ceaf9b2cf-ssl"
server: envoy
strict-transport-security: max-age=31536000
x-nf-request-id: 01KQBJ79M7HD2HD1KCP4VY3SFN
x-envoy-upstream-service-time: 103
x-extproc-hello: Hello from ext_proc
```

我们观察到新的`x-extproc-hello`header已经被加了上去。

### 运行时跳过/运行ext_proc
这个部分里我们研究如何在运行时动态的跳过或者运行运行ext_proc。
#### 基于route

我们将上面的Envoy配置修改成如下方式。
```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          protocol: TCP
          address: 0.0.0.0
          port_value: 8082
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                access_log:
                  - name: envoy.access_loggers.stdout
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                      log_format:
                        text_format: "[%START_TIME%] \"%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%\" %RESPONSE_CODE% %RESPONSE_FLAGS% \"%RESP(X-EXTPROC-HELLO)%\" \"%RESP(CONTENT-TYPE)%\" \"%RESP(CONTENT-LENGTH)%\" %DURATION% ms\n"
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: [ "*" ]
                      routes:
                        # 重点 1：先匹配带有特定 Header 的请求
                        - match:
                            prefix: "/"
                            headers:
                              - name: "x-run-ext"
                                exact_match: "false"
                          route:
                            host_rewrite_literal: www.envoyproxy.io
                            cluster: service_envoyproxy_io
                          # 重点 2：针对这条路由，禁用 ext_proc 过滤器
                          typed_per_filter_config:
                            envoy.filters.http.ext_proc:
                              "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExtProcPerRoute
                              disabled: true

                        # 重点 3：默认路由，不带 header 或值不为 true 的请求会走这里，正常触发 ext_proc
                        - match:
                            prefix: "/"
                          route:
                            host_rewrite_literal: www.envoyproxy.io
                            cluster: service_envoyproxy_io
                http_filters:
                  - name: envoy.filters.http.ext_proc
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
                      grpc_service:
                        envoy_grpc:
                          cluster_name: ext_proc_cluster
                      failure_mode_allow: true
                      processing_mode:
                        request_header_mode: SKIP
                        response_header_mode: SEND
                  - name: envoy.filters.http.ext_proc_required
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
                      grpc_service:
                        envoy_grpc:
                          cluster_name: ext_proc_cluster2
                      failure_mode_allow: true
                      processing_mode:
                        request_header_mode: SKIP
                        response_header_mode: SEND
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: ext_proc_cluster
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      load_assignment:
        cluster_name: ext_proc_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 9000
    - name: ext_proc_cluster2
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: { }
      load_assignment:
        cluster_name: ext_proc_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 9002
    - name: service_envoyproxy_io
      type: LOGICAL_DNS
      dns_lookup_family: V4_ONLY
      load_assignment:
        cluster_name: service_envoyproxy_io
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: www.envoyproxy.io
                      port_value: 443
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          sni: www.envoyproxy.io
```

注意到上面的Envoy：
1. 配置了两个ext_proc filter。一个是`envoy.filters.http.ext_proc`另一个是`envoy.filters.http.ext_proc_required`。对第一个filter，我们加了一个per route 配置，如果发现`x-run-ext`为false，则不run这个filter。
2. 我们启动两个外部后端实例，分别对应上面两个filter。

接下来，我们修改外部后端代码，使其可以从外部接受端口，并且可以动态的决定要加什么header。
```go
package main

import (
  "flag"
  "fmt"
  "log"
  "net"

  configPb "github.com/envoyproxy/go-control-plane/envoy/config/core/v3"
  extProcPb "github.com/envoyproxy/go-control-plane/envoy/service/ext_proc/v3"
  "google.golang.org/grpc"
  "google.golang.org/grpc/codes"
  "google.golang.org/grpc/status"
)

type extProcServer struct {
  extProcPb.UnimplementedExternalProcessorServer
  // 新增字段，用于存储逻辑后缀
  headerSuffix string
}

func (s *extProcServer) Process(
  srv extProcPb.ExternalProcessor_ProcessServer,
) error {
  for {
    req, err := srv.Recv()
    if err != nil {
      return status.Errorf(codes.Unknown, "error receiving request: %v", err)
    }

    log.Printf("Received request: %+v\n", req)

    resp := &extProcPb.ProcessingResponse{}

    if respHeaders := req.GetResponseHeaders(); respHeaders != nil {
      log.Println("Processing Response Headers...")

      // 根据传入的参数构造 Header 内容
      headerValue := "Hello from ext_proc"
      header := fmt.Sprintf("x-extproc-hello-%s", s.headerSuffix)

      resp = &extProcPb.ProcessingResponse{
        Response: &extProcPb.ProcessingResponse_ResponseHeaders{
          ResponseHeaders: &extProcPb.HeadersResponse{
            Response: &extProcPb.CommonResponse{
              HeaderMutation: &extProcPb.HeaderMutation{
                SetHeaders: []*configPb.HeaderValueOption{
                  {
                    Header: &configPb.HeaderValue{
                      Key:      header,
                      RawValue: []byte(headerValue),
                    },
                  },
                },
              },
            },
          },
        },
      }
      log.Printf("Sending response: %+v\n", resp)
      if err := srv.Send(resp); err != nil {
        return status.Errorf(codes.Unknown, "error sending response: %v", err)
      }
    } else {
      log.Printf("Not sending response %+v\n", resp)
      continue
    }
  }
}

func main() {
  // 1. 定义命令行参数
  // 参数：port (int), headerSuffix (string)
  port := flag.Int("port", 9000, "gRPC server port")
  headerSuffix := flag.String("headerSuffix", "", "Suffix to append to x-extproc-hello header")

  // 2. 解析参数
  flag.Parse()

  // 3. 监听指定端口
  address := fmt.Sprintf(":%d", *port)
  lis, err := net.Listen("tcp", address)
  if err != nil {
    log.Fatalf("Failed to listen on %s: %v", address, err)
  }

  grpcServer := grpc.NewServer()

  // 4. 注册服务，并传入 headerSuffix
  extProcPb.RegisterExternalProcessorServer(grpcServer, &extProcServer{
    headerSuffix: *headerSuffix,
  })

  log.Printf("Starting gRPC server on %s with suffix: '%s'...\n", address, *headerSuffix)
  if err := grpcServer.Serve(lis); err != nil {
    log.Fatalf("Failed to serve: %v", err)
  }
}

```

修改后的代码如上所示。我门配置了一个参数`headerSuffix`，根据`headerSuffix`，我们选择性的改变header的key。下面我们使用`go run main.go -port 9002 -headerSuffix required`和`go run main.go -port 9000`启动两个外部后端实例。

分别测试当``为true和false的情况。我们发现true的时候出现两个header，false的时候只出现一个，非required的那个filter被跳过了。


```bash
zheyu@ZhedeAir envoyext_proc % curl -I http://localhost:8082 -H "x-run-ext: true"
HTTP/1.1 200 OK
accept-ranges: bytes
age: 9500
cache-control: public,max-age=0,must-revalidate
cache-status: "Netlify Edge"; hit
content-length: 15991
content-security-policy: frame-ancestors 'self';
content-type: text/html; charset=UTF-8
date: Wed, 29 Apr 2026 03:11:17 GMT
etag: "7ffdbb8473232c16f9299e0ceaf9b2cf-ssl"
server: envoy
strict-transport-security: max-age=31536000
x-nf-request-id: 01KQBKGCW1DW3EV38B49BDBSB4
x-envoy-upstream-service-time: 138
x-extproc-hello-required: Hello from ext_proc
x-extproc-hello-: Hello from ext_proc
```


```bash
zheyu@ZhedeAir envoyext_proc % curl -I http://localhost:8082 -H "x-run-ext: false"
HTTP/1.1 200 OK
accept-ranges: bytes
age: 9677
cache-control: public,max-age=0,must-revalidate
cache-status: "Netlify Edge"; hit
content-length: 15991
content-security-policy: frame-ancestors 'self';
content-type: text/html; charset=UTF-8
date: Wed, 29 Apr 2026 03:14:14 GMT
etag: "7ffdbb8473232c16f9299e0ceaf9b2cf-ssl"
server: envoy
strict-transport-security: max-age=31536000
x-nf-request-id: 01KQBKNSP7ABDQZD9B4RZ0F9JQ
x-envoy-upstream-service-time: 112
x-extproc-hello-required: Hello from ext_proc
```


#### 基于EtensionWithMatcher

ExtensionWithmatcher相当于给一个filter加上一个wrapper，该wrapper给base filter添加判断逻辑，假如满足就执行，否则可以选择skip。
```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          protocol: TCP
          address: 0.0.0.0
          port_value: 8082
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager

                stat_prefix: ingress_http
                access_log:
                  - name: envoy.access_loggers.stdout
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                      log_format:
                        text_format: "[%START_TIME%] \"%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%\" %RESPONSE_CODE% %RESPONSE_FLAGS% \"%RESP(X-EXTPROC-HELLO)%\" \"%RESP(CONTENT-TYPE)%\" \"%RESP(CONTENT-LENGTH)%\" %DURATION% ms\n"
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: [ "*" ]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            host_rewrite_literal: www.envoyproxy.io
                            cluster: service_envoyproxy_io
                http_filters:
                  - name: with-matcher
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.common.matching.v3.ExtensionWithMatcher
                      extension_config:
                        name: envoy.filters.http.ext_proc
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
                          grpc_service:
                            envoy_grpc:
                              cluster_name: ext_proc_cluster
                          failure_mode_allow: true
                          processing_mode:
                            request_header_mode: SKIP
                            response_header_mode: SEND
                      xds_matcher:
                        matcher_list:
                          matchers:
                            - predicate:
                                single_predicate:
                                  input:
                                    name: request-headers
                                    typed_config:
                                      "@type": type.googleapis.com/envoy.type.matcher.v3.HttpRequestHeaderMatchInput
                                      header_name: x-run-ext
                                  value_match:
                                    exact: "false"
                              on_match:
                                action:
                                  name: skip
                                  typed_config:
                                    "@type": type.googleapis.com/envoy.extensions.filters.common.matcher.action.v3.SkipFilter
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: ext_proc_cluster
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      load_assignment:
        cluster_name: ext_proc_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 9000
    - name: service_envoyproxy_io
      type: LOGICAL_DNS
      dns_lookup_family: V4_ONLY
      load_assignment:
        cluster_name: service_envoyproxy_io
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: www.envoyproxy.io
                      port_value: 443
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          sni: www.envoyproxy.io
```
如下示例，我们给刚才的ext_proc添加一个ExtentionWithMatcher。该filter加了一个判断逻辑，即假如header`x-run-ext`是false，则跳过ext_proc filter。下面我们来观察实验效果。

当`x-run-ext`不是false，我们看到了`x-extproc-hello-` header。
```bash
zheyu@ZhedeAir envoyext_proc % curl -I http://localhost:8082 -H "x-run-ext: 234"  
HTTP/1.1 200 OK
accept-ranges: bytes
age: 4092
cache-control: public,max-age=0,must-revalidate
cache-status: "Netlify Edge"; hit
content-length: 15991
content-security-policy: frame-ancestors 'self';
content-type: text/html; charset=UTF-8
date: Thu, 30 Apr 2026 01:12:11 GMT
etag: "114158b78a6492cac9dd8fb00e036d76-ssl"
server: envoy
strict-transport-security: max-age=31536000
x-nf-request-id: 01KQDZ310WTPCBRRWTDZYMFD7Z
x-envoy-upstream-service-time: 107
x-extproc-hello-: Hello from ext_proc
```

当`x-run-ext`是false，我们看不到`x-extproc-hello-` header。

```bash
zheyu@ZhedeAir envoyext_proc % curl -I http://localhost:8082 -H "x-run-ext: false"
HTTP/1.1 200 OK
accept-ranges: bytes
age: 5218
cache-control: public,max-age=0,must-revalidate
cache-status: "Netlify Edge"; hit
content-length: 15991
content-security-policy: frame-ancestors 'self';
content-type: text/html; charset=UTF-8
date: Thu, 30 Apr 2026 01:30:57 GMT
etag: "114158b78a6492cac9dd8fb00e036d76-ssl"
server: envoy
strict-transport-security: max-age=31536000
x-nf-request-id: 01KQE05CFGRY7NKP97A63Y3Q0K
x-envoy-upstream-service-time: 110

```
```
