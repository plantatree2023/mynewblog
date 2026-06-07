---
title: "GCP中的IAM问答"
date: 2026-06-06T21:57:40+08:00
lastmod: 2026-06-06T21:57:40+08:00
draft: false
author: "种树者"
description: "这篇文章是一篇关于GCP IAM的问答"
images: []

tags: ["GCP", "Auth"]
categories: ["云计算"]

lightgallery: true
---




{{< admonition question >}}
什么是Service Account？
{{< /admonition >}}

{{< admonition info >}}
Service Account（服务账号）是一种特殊类型的 Google 账号，它通常代表一个应用、服务或虚拟机（VM）等非人类用户，而不是代表最终的终端用户。 它用于在不需要用户凭据（如密码或 OAuth 令牌）的情况下，让你的代码或服务能够安全地调用 Google Cloud APIs 并在 GCP 内进行身份验证与授权。 
{{< /admonition >}}

{{< admonition question >}}
Service Account的格式是什么？
{{< /admonition >}}

{{< admonition info >}}
Service Agent 的邮箱格式因产品而异。常见格式是：

`service-PROJECT_NUMBER@gcp-sa-[SERVICE].iam.gserviceaccount.com`

例如 API Gateway 是：
`service-PROJECT_NUMBER@gcp-sa-apigateway.iam.gserviceaccount.com`

Pub/Sub 是：
`service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com`

但也有很多例外，例如 Compute Engine：
`service-PROJECT_NUMBER@compute-system.iam.gserviceaccount.com`
{{< /admonition >}}


{{< admonition question >}}
P4SA是什么？
{{< /admonition >}}

{{< admonition info >}}
P4SA 全称为 Per-Product, Per-Project Service Account，通常在 GCP 中被称为 Service Agent（服务代理）。

1. 当你第一次使用某些特定的 GCP 服务（如API Gateway）时，Google 会在后台自动为你创建这些 Service Agents。

2. 它们是由 Google 管理的特殊 Service Account，目的是让这些 GCP 内部服务能够跨项目或在你的项目中安全地访问其他资源（例如：让 Cloud Build 有权限读取你的 Storage Bucket 里的代码）。

用户也可以自己创建Service Agent，详见GCP文档](https://docs.cloud.google.com/iam/docs/create-service-agents#identify-agents)
{{< /admonition >}}

{{< admonition question >}}
P4SA的格式是什么？
{{< /admonition >}}

{{< admonition info >}}
不同的 GCP 服务生成的 Service Agent 格式略有不同，但最常见的格式如下：

`service-[PROJECT-NUMBER]@gcp-sa-[SERVICE-NAME]-system.iam.gserviceaccount.com`

如`service-PROJECT_NUMBER@gcp-sa-apigateway.iam.gserviceaccount.com`

1. [PROJECT-NUMBER]：你的 GCP 项目编号（注意是纯数字的 Project Number，而不是 Project ID）。

2. [SERVICE-NAME]：特定服务的代号，例如 compute-engine、gcp-sa-pubsub 或 cloudservices。
{{< /admonition >}}


{{< admonition question >}}
P4SA在生成的时候会有什么role/permission？
{{< /admonition >}}

{{< admonition info >}}
P4SA（Service Agent）在被 GCP 自动创建时，通常会被默认授予一个由 Google 管理的专属“服务代理角色”（Service Agent Role）。这些默认角色已经由 Google 精心硬编码，包含该 Google Cloud 服务代表用户执行操作所需的一组（最小）权限。 例如，API Gateway 的服务代理会被授予 roles/apigateway.serviceAgent。 它包括如下permission。详情参见[GCP 文档](https://docs.cloud.google.com/iam/docs/roles-permissions/apigateway#apigateway.serviceAgent)。

请注意:

1. 这个role绑定的resource通常是当前项目，比如上面API Gateway的例子。但是也有folder/org级别的Service Agent。
2. 如果是自己创建的Service Agent，需要自己授予权限。

{{< /admonition >}}

{{< admonition question >}}
P4SA和用户创建的Service Account有什么区别？
{{< /admonition >}}

{{< admonition info >}}
除了上面提到的创建者，格式，权限的区别外。在密钥管理上，P4SA由 Google 100% 托管，无法下载 JSON 密钥，安全性极高。有权限的Principal可以创建、下载和管理Service Account密钥（不推荐但支持）。典型角色是`roles/iam.serviceAccountKeyAdmin`，包含`iam.serviceAccountKeys.create/delete/disable/enable/get/list`。另外不建议删除P4SA的IAM binding。删除可能导致对应的GCP服务直接瘫痪。而用户创建的Service Account则可以随时删除、修改、禁用。

P4SA不在用户的项目创建，所以用户不能直接访问，也不能直接管理/删除。
{{< /admonition >}}

{{< admonition question >}}
什么是P4SA project？
{{< /admonition >}}

{{< admonition info >}}
GCP产品中有一个Google Managed项目管理该产品下面的所有P4SA account。所有的P4SA account都可以在该项目的“Service Account”页面下找到。假设P4SA的格式如下`service-[PROJECT-NUMBER]@gcp-sa-[SERVICE-NAME]-system.iam.gserviceaccount.com`，该P4SA project的project id为`gcp-sa-[SERVICE-NAME]`。
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
2. 服务账号（Service Account），比如用户手动创建的 User-managed SA、系统自动生成的 P4SA (Service Agent)，以及 Compute Engine 默认的服务账号。
3. 谷歌群组，比如 dev-team@yourcompany.com
4. 域名，它代表整个组织域名下的所有用户。比如：domain:yourcompany.com。一旦把角色赋给它，公司里的每一个人都会自动继承该权限。
5. 所有人。

	allAuthenticatedUsers：任何通过Google Account认证的人和Service Account。

	allUsers：互联网上的任何人，无论是否已经认证。
6. Workload Identity Pool（外部身份/联合身份）定义：用于让非 GCP 的外部服务（比如 AWS 的 EC2、GitHub Actions、或者你自己的本地机房）安全地访问 GCP，无需下载长期的 JSON 密钥。
7. 其他。包括Workforce Identity，Workload Identity，PrincipalSet。

详见[GCP文档](https://docs.cloud.google.com/iam/docs/principal-identifiers#allow)。
{{< /admonition >}}


{{< admonition question >}}
GCP IAM里面的Resource是什么?可以是什么类型的资源？
{{< /admonition >}}

{{< admonition info >}}
Resource是指被操作的对象。也就是你在 GCP 里面创建的各种云服务实体。可以是Organization：组织。Folder：文件夹，比如Production文件夹，Staging文件夹。Project：项目。Service-specific resource。比如BigQuery的dataset和table。
{{< /admonition >}}


{{< admonition question >}}
Resource可以是一个Service Account吗？
{{< /admonition >}}

{{< admonition info >}}
可以，Service Account具有双重身份。可以是Principal，也可以Resource。
{{< /admonition >}}


{{< admonition question >}}
可以给我举几个Service Account作为resource的例子吗？
{{< /admonition >}}

{{< admonition info >}}
1. 场景 1：允许 A 冒充 B（Impersonation，即生成短期凭证）

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
当一个人类用户创建了一个Service Account之后，人类用户有任何Service Account的role吗？
{{< /admonition >}}

{{< admonition info >}}
没有，该人类用户不会自动获得任何该Service Account的role。该人类用户对他的所有控制权，全部来自于该项目所继承下来的权限。这是因为Service Account是*项目*的子资源（Resource），该Service Account不属于任何人。该人类用户可以创建Service Account只是因为该人类用户拥有了某个高阶角色比如 Project Editor、Project Owner 或 Create Service Accounts）。

那么，假如该人类用户只是Project Editor，而他想把该Service Account授权给某个员工。该人类用户尝试运行`gcloud iam service-accounts add-iam-policy-binding`会发现权限不足。这是因为该人类用户只是Editor，不是Owner。解决这个问题需要用Project Owner或IAM Administrator执行操作，显式地把该Service Account Admin的特定角色授予你。具体需要的是iam.serviceAccounts.setIamPolicy权限。参见[GCP文档](https://docs.cloud.google.com/iam/docs/roles-permissions/iam#iam.serviceAccountAdmin)。


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
经过身份验证的主账号（例如用户或其他服务账号）以服务账号的身份进行身份验证以获取该服务账号的权限时，这就称为模拟（冒充）服务账号。

Service Account A 想要冒充（impersonate/actAs）Service Account B，核心逻辑是：B 是资源，A 是主体。 也就是说，B需要给A 授权。具体来说，是有`iam.serviceAccounts.setIamPolicy`权限的管理员进行操作，把Service Account B的某个role grant 给A。

冒充需要`iam.serviceAccounts.getAccessToken`权限。该权限包含在Service Account Token Creator 角色中。具体来说，你需要在 Service Account B 的 IAM 策略中，将 Service Account Token Creator 角色授予 Service Account A。参见[GCP文档](https://docs.cloud.google.com/iam/docs/service-account-impersonation#required-permissions)。

```bash
gcloud iam service-accounts add-iam-policy-binding \
    sa-b@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="serviceAccount:sa-a@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator"
```

举一个例子就是Service Account A想要进Service Account B的房子，那需要B的进入自己房子的token。那么这个时候需要A被授予生成B token的role，然后A才能拿着B的token进入B的房子。
{{< /admonition >}}


{{< admonition question >}}
冒充的Principal可以是什么？
{{< /admonition >}}

{{< admonition info >}}
可以是人类用户或者Service Account和其他的一些实体，详情参见[GCP文档](https://docs.cloud.google.com/sdk/docs/authenticate?utm_source=chatgpt.com#choose_the_right_principal_for_the_task)。
{{< /admonition >}}


{{< admonition question >}}
冒充有哪些用途？
{{< /admonition >}}

{{< admonition info >}}
[GCP文档](https://docs.cloud.google.com/iam/docs/service-account-impersonation#use-cases)

1. 向用户授予临时提升的访问权限
2. 测试一组特定权限是否足以完成任务
3. 在本地开发只能以服务账号身份运行的应用，可以向人类用户授予冒充服务账号所需的权限
4. 验证外部应用的身份
{{< /admonition >}}


{{< admonition question >}}
如何进行冒充？
{{< /admonition >}}

{{< admonition info >}}
[GCP文档](https://docs.cloud.google.com/iam/docs/service-account-impersonation#impersonation-overview)
1. 使用`--impersonate-service-account` flag.
2. 使用短时有效凭据（credential）
3. 使用凭据配置文件
{{< /admonition >}}


{{< admonition question >}}
以Service Account的身份进行身份验证，一定需要冒充Service Account账号吗？
{{< /admonition >}}

{{< admonition info >}}
不是。[参见GCP文档](https://docs.cloud.google.com/iam/docs/service-account-impersonation#authentication_without_impersonation)。
1. 对workload，可以以使用attached的Service Account
2. 对人类用户，可以直接使用Service Account Key。这种方法，人类用户不参与identity，所以这个不叫冒充。
{{< /admonition >}}


{{< admonition question >}}
一个project的人类用户owner在这个project里面创建了一个Service Account，这个人类用户可以impersonate as这个Service Account吗？为什么？是因为他有什么permission？
{{< /admonition >}}

{{< admonition info >}}
不可以，但是可以通过给自己授予`iam.serviceAccounts.getAccessToken`权限，比如`roles/iam.serviceAccountTokenCreator`角色实现。[GCP文档](https://docs.cloud.google.com/iam/docs/roles-permissions/iam#iam.serviceAccounts.getAccessToken)明确指出Owner没有`iam.serviceAccounts.getAccessToken`权限。但是Owner有`iam.serviceAccounts.setIamPolicy`[权限](https://docs.cloud.google.com/iam/docs/roles-permissions/iam#iam.serviceAccounts.setIamPolicy)，所以Owner可以给自己授予`roles/iam.serviceAccountTokenCreator`角色，然后就可以生成token并冒充了。

```bash
gcloud auth print-access-token \
  --impersonate-service-account=testnewaccount@spheric-backup-427305-v3.iam.gserviceaccount.com
WARNING: This command is using Service Account impersonation. All API calls will be executed as [testnewaccount@spheric-backup-427305-v3.iam.gserviceaccount.com].
ya29.c.c0AZ4bxxxxxxxxxxxxxxxxxxxxxx
```
{{< /admonition >}}

{{< admonition question >}}
Service Account User是什么?
{{< /admonition >}}

{{< admonition info >}}
Service Account User的核心权限是`iam.serviceAccounts.actAs`。它的作用不是“直接变成这个 Service Account”，而是：
允许某个Principal把这个Service Account 挂到某个 Google Cloud 资源上，让那个资源运行时以这个 Service Account 的身份执行。这个Principal可以是人类用户或者另一个Service Account主体。
{{< /admonition >}}

{{< admonition question >}}
Service Account User有什么用途？
{{< /admonition >}}

{{< admonition info >}}
用户部署 Cloud Run，并指定运行时Service Account，部署用户需要对该SA 有`actAs`；CI/CD 的Cloud Build部署Cloud Run。Cloud Build SA 需要对runtime SA有`actAs`。
{{< /admonition >}}

{{< admonition question >}}
Service Account User和Service Account Token Creator的区别是什么？
{{< /admonition >}}

{{< admonition info >}}
Service Account User不允许Principal为Service Account创建短时凭证，也不可以用`gcloud --impersonate-service-account`来冒充Service Account。这些都需要Service Account Token Creator。Service Account User主要用于部署Cloud Run等GCP产品的场景。
{{< /admonition >}}

{{< admonition question >}}
Bob执行了下面的命令。下面的Principal，Resource，Role是什么？

```bash
gcloud storage buckets add-iam-policy-binding gs://my-bucket \
  --member="user:alice@example.com" \
  --role="roles/storage.objectViewer"
 ```
{{< /admonition >}}

{{< admonition info >}}
Bob = 发起修改 IAM policy 请求的人

Alice = 被授予权限的 principal

my-bucket = 被绑定 IAM policy 的 resource

roles/storage.objectViewer = 授予 Alice 的 role

Bob 要成功执行这条命令，需要 Bob 自己对 my-bucket 有修改 IAM policy 的权限，比如类似`storage.buckets.setIamPolicy`。
{{< /admonition >}}

{{< admonition question >}}
用户创建的Serivce Account的Key是短期的还是长期的？
{{< /admonition >}}

{{< admonition info >}}
长期的。通常指用户下载下来的JSON key。里面包含了Service Account的私钥。默认情况下，这种 key不会自动过期，除非用户手动删除、轮换，或者组织策略强制限制 key 的有效期。Google官方也说明，Service ccount key 默认不失效，并且现在可以用 Organization Policy 给新 key 设置过期限制。
{{< /admonition >}}

{{< admonition question >}}
用户冒充Service Account得到的Access Token是短期的还是长期的？
{{< /admonition >}}

{{< admonition info >}}
短期的，不包含私钥。比如`print-access-token`打印出来的OAuth 2.0 access token的有效期是1小时，过期需要重新生成。
{{< /admonition >}}

{{< admonition question >}}
Role分哪些种类？
{{< /admonition >}}

{{< admonition info >}}
Basic：比如Viewer，Editor，Owner。

Predefined：比如Service Account Token Creator。

Custom：自己创建的role，可以自行添加predefined的权限。
{{< /admonition >}}

{{< admonition question >}}
{{< /admonition >}}

{{< admonition info >}}
{{< /admonition >}}


Topics：
IAM Policy Troubleshooter
IAM Policy Analyzer
Deny Policy
Org Policy
Workload Identity Federation
IAM Conditions 的 CEL 表达式