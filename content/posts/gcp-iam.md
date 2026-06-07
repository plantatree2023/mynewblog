---
title: "GCP中的IAM问答"
date: 2026-06-06T21:57:40+08:00
lastmod: 2026-06-06T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章是一篇关于GCP IAM的问答"
images: []

tags: ["GCP", "Auth"]
categories: ["Cloud Computing"]

lightgallery: true
---




{{< admonition question >}}
什么是service account？
{{< /admonition >}}

{{< admonition info >}}
Service Account（服务账号）是一种特殊类型的 Google 账号，它通常代表一个应用、服务或虚拟机（VM）等非人类用户，而不是代表最终的终端用户。 它用于在不需要用户凭据（如密码或 OAuth 令牌）的情况下，让你的代码或服务能够安全地调用 Google Cloud APIs 并在 GCP 内进行身份验证与授权。 
比如，当你写code去call BigQuery的GetTable API，你的code可以自动寻找你的service account。
{{< /admonition >}}

{{< admonition question >}}
service account的格式是什么？
{{< /admonition >}}

{{< admonition info >}}
用户自定义的Service Account的标准格式如 `[SA-NAME]@[PROJECT-ID].iam.gserviceaccount.com`
{{< /admonition >}}


{{< admonition question >}}
P4SA是什么？
{{< /admonition >}}

{{< admonition info >}}
P4SA 全称为 Per-Product, Per-Project Service-Account，通常在 GCP 中被称为 Service Agent（服务代理）。

1. 当你第一次使用某些特定的 GCP 服务（如BigQuery）时，Google 会在后台自动为你创建这些 Service Agents。

2. 它们是由 Google 管理的特殊 Service Account，目的是让这些 GCP 内部服务能够跨项目或在你的项目中安全地访问其他资源（例如：让 Cloud Build 有权限读取你的 Storage Bucket 里的代码）。
{{< /admonition >}}

{{< admonition question >}}
P4SA的格式是什么？
{{< /admonition >}}

{{< admonition info >}}
不同的 GCP 服务生成的 Service Agent 格式略有不同，但最常见的格式如下：

`service-[PROJECT-NUMBER]@[SERVICE-NAME]-system.iam.gserviceaccount.com`

1. [PROJECT-NUMBER]：你的 GCP 项目编号（注意是纯数字的 Project Number，而不是 Project ID）。

2. [SERVICE-NAME]：特定服务的代号，例如 compute-engine、gcp-sa-pubsub 或 cloudservices。
{{< /admonition >}}


{{< admonition question >}}
P4SA在生成的时候会有什么role/permission？
{{< /admonition >}}

{{< admonition info >}}
P4SA（Service Agent）在被 GCP 自动创建时，通常会被默认授予一个由 Google 管理的专属“服务代理角色”（Service Agent Role）。这些默认角色已经由 Google 精心硬编码，仅包含该服务正常运转所需的最小权限集。 例如，API Gateway 的服务代理会被授予 roles/apigateway.serviceAgent。 它包括如下permission。详情参见[GCP 文档](https://docs.cloud.google.com/iam/docs/roles-permissions/apigateway#apigateway.serviceAgent)。请注意这个role的resource是当前项目。

1. iam.serviceAccounts.getAccessToken

2. iam.serviceAccounts.getOpenIdToken

3. servicemanagement.services.check

4. servicemanagement.services.quota

5. servicemanagement.services.report

{{< /admonition >}}

{{< admonition question >}}
P4SA和用户创建的service account有什么区别？
{{< /admonition >}}

{{< admonition info >}}
除了上面提到的创建者，格式，权限的区别外。在密钥管理上，P4SA由 Google 100% 托管，无法下载 JSON 密钥，安全性极高。用户创建的Service Account用户可以自由创建、下载和管理 JSON 密钥（不推荐但支持）。另外不能/不建议删除P4SA。删除可能导致对应的 GCP 产品直接瘫痪。	而用户创建的Service Account则可以随时删除、修改、禁用。
{{< /admonition >}}

{{< admonition question >}}
什么是P4SA project？
{{< /admonition >}}

{{< admonition info >}}
GCP产品中有一个项目管理该产品下面的所有P4SA account。所有的P4SA account都可以在该项目的“Service account”页面下找到。假设P4SA的格式如下`service-[PROJECT-NUMBER]@[SERVICE-NAME]-system.iam.gserviceaccount.com`，该P4SA project的project id为`[SERVICE-NAME]`。
{{< /admonition >}}

{{< admonition question >}}
如何用gcloud给一个principal授予resource的role？
{{< /admonition >}}

{{< admonition info >}}
```bash
gcloud iam [service-accounts|projects|resource-manager folders|organizations] add-iam-policy-binding \
    [RESOURCE] \
    --member="[PRINCIPAL]" \
    --role="[ROLE]"
```
{{< /admonition >}}

{{< admonition question >}}
GCP IAM里面的Principal是什么？可以是什么类型的主体？
{{< /admonition >}}

{{< admonition info >}}
Principal是指发出请求的实体/主体。简单来说，就是“谁”或者“哪个程序”在尝试访问你的 GCP 资源。GCP IAM 允许不同类型的主体来代表人类、程序或服务。比如：
1. 人类用户，比如可以是企业用的 Google Workspace 账号（如 alice@yourcompany.com），也可以是个人注册的 Gmail 账号（如 bob@gmail.com）。
2. 服务账号（Service account），比如用户手动创建的 User-managed SA、系统自动生成的 P4SA (Service Agent)，以及 Compute Engine 默认的服务账号。
3. 谷歌群组，比如 dev-team@yourcompany.com
4. 域名，它代表整个组织域名下的所有用户。比如：domain:yourcompany.com。一旦把角色赋给它，公司里的每一个人都会自动继承该权限。
5. 所有人。

	allAuthenticatedUsers：任何通过 Google 账号登录的人（全世界所有拥有 Gmail/Workspace 账号的人，不局限于你的公司）。

	allUsers：互联网上的任何人（无需登录，通常用于配置完全公开的静态网站 Storage Bucket 或者是公开的 Cloud Run API）。
6. Workload Identity Pool（外部身份/联合身份）定义：用于让非 GCP 的外部服务（比如 AWS 的 EC2、GitHub Actions、或者你自己的本地机房）安全地访问 GCP，无需下载长期的 JSON 密钥。
{{< /admonition >}}


{{< admonition question >}}
GCP IAM里面的Resource是什么?可以是什么类型的主体？
{{< /admonition >}}

{{< admonition info >}}
Resource是指被操作的对象。也就是你在 GCP 里面创建的各种云服务实体。可以是Organization：公司/域名。Folder：文件夹，比如Production文件夹，Staging文件夹。Project：项目。Service-specific resource。比如BigQuery的dataset和table。
{{< /admonition >}}


{{< admonition question >}}
Resource可以是一个service account吗？
{{< /admonition >}}

{{< admonition info >}}
可以，service account具有双重身份。可以是Principal，也可以Resource。
{{< /admonition >}}


{{< admonition question >}}
可以给我举几个service account作为resource的例子吗？
{{< /admonition >}}

{{< admonition info >}}
1. 场景 1：允许 A 冒充 B（Impersonation / actAs）

   Resource（资源）：Service Account B

   Principal（主体）：Service Account A

   Role（角色）：Service Account Token Creator

   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
    sa-b@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="serviceAccount:sa-a@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator"
   ```

2. 场景 2：让某个工程师有权管理某个特定的 Service Account

   Resource（资源）：my-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

   Principal（主体）：dev-lead@company.com（用户）

   Role（角色）：roles/iam.serviceAccountAdmin（服务账号管理员）

   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
    my-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="user:dev-lead@company.com" \
    --role="roles/iam.serviceAccountAdmin"
   ```

3.  场景 3：允许用户在创建 VM 时，“挂载/使用”该 Service Account

    Resource（资源）：vm-runner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

    Principal（主体）：engineer@company.com（用户）

    Role（角色）：roles/iam.serviceAccountUser（服务账号使用者）

    ```bash
    gcloud iam service-accounts add-iam-policy-binding \
		vm-runner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
		--member="user:engineer@company.com" \
		--role="roles/iam.serviceAccountUser"
    ```
{{< /admonition >}}

{{< admonition question >}}
当一个人类用户创建了一个Service Account之后，人类用户有任何Service account的role吗？
{{< /admonition >}}

{{< admonition info >}}
没有，该人类用户不会自动获得任何该Service Account的role。该人类用户对他的所有控制权，全部来自于该项目所继承下来的权限。这是因为Service Account是*项目*的子资源（Resource），该Service Account不属于任何人。该人类用于可以创建Service Account只是因为该人类用户拥有了某个高阶角色比如 Project Editor、Project Owner 或 Create Service Accounts）。

那么，假如该人类用户只是Project Editor，而他想把该Service Account授权给某个员工。该人类用户尝试运行`gcloud iam service-accounts add-iam-policy-binding`会发现权限不足。这是因为该人类用户只是Editor，不是Owner。解决这个问题需要用Project Owner或IAM Administrator执行操作，显式的把该Service Account的特定角色授予你，比如Service Account Admin。具体需要的是iam.serviceAccounts.setIamPolicy权限。参见[GCP文档](https://docs.cloud.google.com/iam/docs/roles-permissions/iam#iam.serviceAccountAdmin)。

```bash
gcloud iam service-accounts add-iam-policy-binding \
    my-new-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="user:your-email@company.com" \
    --role="roles/iam.serviceAccountAdmin"
```
{{< /admonition >}}


{{< admonition question >}}
什么是冒充（Impersonate）？Service Account A想要冒充Service Account B，谁是Principal谁是resource，谁应该给谁权限？
{{< /admonition >}}

{{< admonition info >}}
Service Account A 想要冒充（impersonate/actAs）Service Account B，核心逻辑是：B 是资源，A 是主体。 也就是说，B 需要给 A 授权。

具体来说，你需要在 Service Account B 的 IAM 策略中，将 Service Account Token Creator 角色授予 Service Account A。

```bash
gcloud iam service-accounts add-iam-policy-binding \
    B@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="serviceAccount:A@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator"
```

举一个例子就是Service Account A想要进Service Account B的房子，那需要B的进入自己房子的token。那么这个时候需要A被授予生成B token的role，然后A才能拿着B的token进入B的房子。
{{< /admonition >}}


{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}


{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}


{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}


{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}


{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}
