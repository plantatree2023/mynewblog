---
title: "GCP中的Metadata Server"
date: 2026-06-08T21:57:40+08:00
lastmod: 2026-06-08T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章是一篇关于GCP Metadata Server的入门"
images: []

tags: ["GCP", "Auth"]
categories: ["云计算"]

lightgallery: true
---

GCP Metadata Server 是 Google Cloud 在运行环境（GCE VM、GKE、Cloud Run、App Engine 等）内部提供的一个本地 HTTP 服务，用来让程序获取：

1. 当前实例信息（Instance Metadata）

2. 当前项目(Project)信息

3. Service Account 信息

4. OAuth Access Token

5. Identity Token (OIDC JWT)

6. 用户自定义 Metadata

它的作用类似 AWS 的 IMDS (Instance Metadata Service)。

下面通过GCE中的实例来理解Metadata Server的用法。

### 查看所有可用API

```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/
instance/
oslogin/
project/
```

### 获取项目Metadata
#### 获取项目id

```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/project/project-id
spheric-backup-427305-v3
```

#### 获取数字项目id

```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/project/numeric-project-id
713826089555
```

### Instance Metadata
Instance Metadata存在`http://metadata.google.internal/computeMetadata/v1/instance/`目录下面，每个路径都是一个key，对应了一些metadata信息。

查询所有路径：
```bash
yuzhehappymax@instance-20260609-051755:~$ curl   -H "Metadata-Flavor: Google"   http://metadata.google.internal/computeMetadata/v1/instance/
attributes/
cpu-platform
credentials/
description
disks/
gce-workload-certificates/
guest-attributes/
hostname
id
image
licenses/
machine-type
maintenance-event
name
network-interfaces/
partner-attributes/
preempted
remaining-cpu-time
scheduling/
service-accounts/
shutdown-details/
tags
upcoming-maintenance
virtual-clock/
zone
```

查询instance id：
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/id
857298834629604914
```
查询hostname：
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/hostname
instance-20260609-051755.us-central1-c.c.spheric-backup-427305-v3.internal
```

查询zone：
```bash
yuzhehappymax@instance-20260609-051755:~$ curl   -H "Metadata-Flavor: Google"   http://metadata.google.internal/computeMetadata/v1/instance/zone
projects/713826089555/zones/us-central1-c
```

Machine type：
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/machine-type
projects/713826089555/machineTypes/e2-micro
```

### Network Metadata
获取Internal IP
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip
10.128.0.32
```

获取External IP
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip
34.58.251.156
```

获取VPC Network
```bash
yuzhehappymax@instance-20260609-051755:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/network
projects/713826089555/networks/defaul
```

### Custom Metadata
如果创建VM时指定了metadata，可以这样读取。

```bash
gcloud compute instances create myvm \
  --metadata org=king,team=zheu
```


```bash
yuzhehappymax@instance-20260609-054925:~$ curl   -H "Metadata-Flavor: Google"   http://metadata.google.internal/computeMetadata/v1/instance/attributes/team
zheu
```

```bash
yuzhehappymax@instance-20260609-054925:~$ curl   -H "Metadata-Flavor: Google"   http://metadata.google.internal/computeMetadata/v1/instance/attributes/org
king
```

### Service Account API
这是最为重要的一类API。
```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/
713826089555-compute@developer.gserviceaccount.com/
default/
```
```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email
713826089555-compute@developer.gserviceaccount.com
```
查看Scope：
```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/scopes
https://www.googleapis.com/auth/devstorage.read_only
https://www.googleapis.com/auth/logging.write
https://www.googleapis.com/auth/monitoring.write
https://www.googleapis.com/auth/service.management.readonly
https://www.googleapis.com/auth/servicecontrol
https://www.googleapis.com/auth/trace.append
```

### 获取OAuth Access Token
这是 Metadata Server 最常用的接口。
```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
{"access_token":"ya29.c.xxx","expires_in":3336,"token_type":"Bearer"}
```

用Token调用Google API：
```bash
TOKEN=$(curl \
-H "Metadata-Flavor: Google" \
"http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
| jq -r .access_token)
```


```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
-H "Authorization: Bearer $TOKEN" \
https://cloudresourcemanager.googleapis.com/v1/projects
{
  "error": {
    "code": 403,
    "message": "Request had insufficient authentication scopes.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "ACCESS_TOKEN_SCOPE_INSUFFICIENT",
        "domain": "googleapis.com",
        "metadata": {
          "method": "google.cloudresourcemanager.v1.Projects.ListProjects",
          "service": "cloudresourcemanager.googleapis.com"
        }
      }
    ]
  }
}
yuzhehappymax@instance-20260609-054925:~$ curl \
-H "Authorization: Bearer $TOKEN" \
https://oauth2.googleapis.com/tokeninfo?access_token=$TOKEN
{
  "azp": "107662016686531267400",
  "aud": "107662016686531267400",
  "scope": "https://www.googleapis.com/auth/trace.append https://www.googleapis.com/auth/monitoring.write https://www.googleapis.com/auth/servicecontrol https://www.googleapis.com/auth/service.management.readonly https://www.googleapis.com/auth/logging.write https://www.googleapis.com/auth/devstorage.read_only",
  "exp": "1780987867",
  "expires_in": "3114",
  "access_type": "online"
}
```

用当前Token不能ListProject，这是因为该Token的scope太窄。ListProject需要`https://www.googleapis.com/auth/cloud-platform` scope，而GCE实例一旦创建就不能在运行时更改scope了。两种解决办法：一是重新创建VM并指定scope，二是用Cloud Run。Cloud Run是基于Service Account和IAM的。

重建VM并指定scope：
```bash
gcloud compute instances create INSTANCE_NAME \
  --scopes=https://www.googleapis.com/auth/cloud-platform
```

### 获取Identity Token （OIDC JWT）

```bash
yuzhehappymax@instance-20260609-054925:~$ curl \
-H "Metadata-Flavor: Google" \
"http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://my-service.run.app"
eyJhbGciOiJSUzI1N...
```

用`https://www.jwt.io/`解码该JWT得到如下结果：


Header:
```json
{
  "alg": "RS256",
  "kid": "7b021671ede90ee5a375c022a523d490181a2c9d",
  "typ": "JWT"
}
```


Payload:
```json
{
  "aud": "https://my-service.run.app",
  "azp": "107662016686531267400",
  "exp": 1780988695,
  "iat": 1780985095,
  "iss": "https://accounts.google.com",
  "sub": "107662016686531267400"
}
```
### Recursive API
获取全部Metadata
```bash
curl \
-H "Metadata-Flavor: Google" \
"http://metadata.google.internal/computeMetadata/v1/?recursive=true&alt=json"
```

### Wait For Change API

Metadata Server 有长轮询能力。

例如监听 Metadata 变化：
```bash
curl \
-H "Metadata-Flavor: Google" \
"http://metadata.google.internal/computeMetadata/v1/instance/attributes/my-config?wait_for_change=true"

```
