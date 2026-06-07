---
weight: 4
title: "Envoy的Header Mutation Filter"
date: 2026-05-27T21:57:40+08:00
lastmod: 2026-05-27T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章展示了Envoy的Header Mutation Filter"
images: []

tags: ["Envoy", "Envoy Filter"]
categories: ["云原生"]

lightgallery: true
---

Envoy配置如下。注意这里我们用set_metadata set了一个dynamic metadata。然后用header mutation filter把这个metadata设置为一个header。

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 10000
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: httpbin_service
                            # 覆盖 Host 头，因为 httpbin.org 依赖正确的 Host 才能正常响应
                            host_rewrite_literal: httpbin.org

                http_filters:
                  # ==========================================
                  # Filter 1: 使用 set_metadata 注入动态元数据
                  # ==========================================
                  - name: envoy.filters.http.set_metadata
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.set_metadata.v3.Config
                      metadata:
                        - metadata_namespace: "my.custom.namespace"
                          value:
                            my_key: "hello_from_metadata2"

                  # ==========================================
                  # Filter 2: 使用 header_mutation 提取并填入 Header
                  # ==========================================
                  - name: envoy.filters.http.header_mutation
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.header_mutation.v3.HeaderMutation
                      mutations:
                        request_mutations:
                          - append:
                              header:
                                key: "x-custom-header"
                                # 通过格式化语法提取前面注入的 Metadata
                                value: "%DYNAMIC_METADATA(my.custom.namespace:my_key)%"
                              append_action: OVERWRITE_IF_EXISTS_OR_ADD

                  # ==========================================
                  # 必须存在的 Router Filter (用于最终转发)
                  # ==========================================
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
    # 定义一个上游服务指向 httpbin.org，方便我们在响应中观察发出的 Headers
    # httpbin.org/get 接口的特性是：它会把接收到的所有请求头（Request Headers）以 JSON 格式原样返回给你。你会看到类似下面的输出：
    - name: httpbin_service
      type: LOGICAL_DNS
      dns_lookup_family: V4_ONLY
      load_assignment:
        cluster_name: httpbin_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: httpbin.org
                      port_value: 80

```

测试结果如下。
启动Envoy。
```bash
envoy -c headermutation.yaml
```

然后发一个request，我们看到header里面包含了我们设置的header。
```bash
zheyu@ZhedeAir envoyfilters % curl -s http://localhost:10000/get
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Host": "httpbin.org", 
    "User-Agent": "curl/8.4.0", 
    "X-Amzn-Trace-Id": "Root=1-6a17970a-3d4130781c0867e356cdd31e", 
    "X-Custom-Header": "hello_from_metadata2", 
    "X-Envoy-Expected-Rq-Timeout-Ms": "15000", 
    "X-Envoy-Original-Host": "localhost:10000"
  }, 
  "origin": "50.35.95.108", 
  "url": "http://httpbin.org/get"
}
```
