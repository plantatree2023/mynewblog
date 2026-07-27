---
title: "GCP Log Explorer祛魅"
date: 2026-06-24T21:57:40+08:00
lastmod: 2026-06-24T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章是一篇关于GCP Log Explorer的文章"
images: []

tags: ["GCP"]
categories: ["云计算"]

lightgallery: true
---

本文我们将研究GCP的Log Explorer里到底能看到多少种日志，每种日志都长什么样，每种日志做什么操作才能被触发。

### Audit Log

Audit Log以`cloudaudit.googleapis.com`起手，并有几种子类，比如：

* cloudaudit.googleapis.com/activity
* cloudaudit.googleapis.com/data_access
* cloudaudit.googleapis.com/system_event
* cloudaudit.googleapis.com/policy

并且它一定有protoPayload:
```json
{
  "protoPayload": {}
}
```


#### Admin Activity Log
记录资源管理操作，比如stop一个GCE实例：
```bash
gcloud compute instances stop instance-20260611-230219-scope2
```

看到以下log：
```json {hl_lines=[2,3,36,76]}
{
  "protoPayoload": {
    "@type": "type.googleapis.com/google.clud.audit.AuditLog",
    "status": {},
    "authenticationInfo": {
      "principalEmail": "yuzhehappymax@gmail.com",
      "principalSubject": "user:yuzhehappymax@gmail.com",
      "oauthInfo": {
        "oauthClientId": "32555940559.apps.googleusercontent.com"
      }
    },
    "requestMetadata": {
      "callerIp": "50.35.95.108",
      "callerSuppliedUserAgent": "google-cloud-sdk gcloud/569.0.0 command/gcloud.compute.instances.stop invocation-id/494d4907aae642a0946876231832eb63 environment/None environment-version/None client-os/MACOSX client-os-ver/23.4.0 client-pltf-arch/arm interactive/True from-script/False python/3.13.7 term/xterm-256color  (Macintosh; Intel Mac OS X 23.4.0),gzip(gfe)",
      "requestAttributes": {
        "time": "2026-06-25T04:52:36.353195Z",
        "auth": {}
      },
      "destinationAttributes": {}
    },
    "serviceName": "compute.googleapis.com",
    "methodName": "v1.compute.instances.stop",
    "authorizationInfo": [
      {
        "resource": "projects/spheric-backup-427305-v3/zones/us-central1-c/instances/instance-20260611-230219-scope2",
        "permission": "compute.instances.stop",
        "granted": true,
        "resourceAttributes": {
          "service": "compute",
          "name": "projects/spheric-backup-427305-v3/zones/us-central1-c/instances/instance-20260611-230219-scope2",
          "type": "compute.instances"
        },
        "permissionType": "ADMIN_WRITE"
      }
    ],
    "resourceName": "projects/spheric-backup-427305-v3/zones/us-central1-c/instances/instance-20260611-230219-scope2",
    "request": {
      "@type": "type.googleapis.com/compute.instances.stop"
    },
    "response": {
      "@type": "type.googleapis.com/operation",
      "targetId": "9038872313705431335",
      "targetLink": "https://www.googleapis.com/compute/v1/projects/spheric-backup-427305-v3/zones/us-central1-c/instances/instance-20260611-230219-scope2",
      "selfLinkWithId": "https://www.googleapis.com/compute/v1/projects/spheric-backup-427305-v3/zones/us-central1-c/operations/3823486100174867195",
      "progress": "0",
      "status": "RUNNING",
      "name": "operation-1782363156161-6550cc2c8a25a-96b76d14-cb2edf66",
      "insertTime": "2026-06-24T21:52:36.303-07:00",
      "zone": "https://www.googleapis.com/compute/v1/projects/spheric-backup-427305-v3/zones/us-central1-c",
      "startTime": "2026-06-24T21:52:36.315-07:00",
      "operationType": "stop",
      "user": "yuzhehappymax@gmail.com",
      "selfLink": "https://www.googleapis.com/compute/v1/projects/spheric-backup-427305-v3/zones/us-central1-c/operations/operation-1782363156161-6550cc2c8a25a-96b76d14-cb2edf66",
      "id": "3823486100174867195"
    },
    "resourceLocation": {
      "currentLocations": [
        "us-central1-c"
      ]
    }
  },
  "insertId": "-wehf3ae1bd54",
  "resource": {
    "type": "gce_instance",
    "labels": {
      "project_id": "spheric-backup-427305-v3",
      "instance_id": "9038872313705431335",
      "zone": "us-central1-c"
    }
  },
  "timestamp": "2026-06-25T04:52:36.140560Z",
  "severity": "NOTICE",
  "labels": {
    "compute.googleapis.com/root_trigger_id": "904a96e4-727d-407c-bfcb-899e19a4d2d8"
  },
  "logName": "projects/spheric-backup-427305-v3/logs/cloudaudit.googleapis.com%2Factivity",
  "operation": {
    "id": "operation-1782363156161-6550cc2c8a25a-96b76d14-cb2edf66",
    "producer": "compute.googleapis.com",
    "first": true
  },
  "receiveTimestamp": "2026-06-25T04:52:36.397295775Z"
}
```

#### Data Access Log

记录读取数据。

默认很多服务关闭。对下面的命令，需要打开IAM -> Audit Logs -> Google Cloud Storage -> Data Read。
```bash
gs://test_bucket_xxx/xxx.docx
```


```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```
```