<div align="center">
  <a href="https://mockoon.com" alt="mockoon logo">
    <img width="200" height="200" src="https://mockoon.com/images/logo-square-app.png">
  </a>
  <br>
  <a href="https://mockoon.com/"><img src="https://img.shields.io/badge/Website-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/newsletter/"><img src="https://img.shields.io/badge/Newsletter-Subscribe-green.svg?style=flat-square"/></a>
  <br>
  <br>
  <h1>Mockoon: 出色的API模拟工具</h1>
</div>

Mockoon是设计和运行模拟API的最简单、最快的方法。无需远程部署，无需账户，免费且开源。

它结合了一个[桌面应用程序](https://mockoon.com/download/)来在本地设计和运行模拟服务器，以及一个[CLI](https://mockoon.com/cli/)来自托管您的虚拟API。还提供了[云服务](#订阅-mockoon-cloud)，用于与团队协作、保持数据同步和部署模拟API。

API模拟通过减少对外部服务及其限制（速率限制、成本、可用性等）的依赖，帮助您加速开发和第三方API集成。
它还允许您在受控环境中测试应用程序，提供可预测的响应、状态码和延迟，并轻松模拟边缘情况和错误场景。
最后，您可以通过提供一致可靠的环境来测试和开发应用程序，从而更快地让新团队成员上手。

➡️ [下载](https://mockoon.com/download/)

<div align="center">
  <img width="50%" src="https://mockoon.com/images/hero-repo.png">
</div>

## 功能特性

Mockoon提供许多功能：

- 无限数量的本地模拟服务器和路由
- CLI用于在无头环境、CI等中运行模拟
- 完全控制路由定义：HTTP方法和状态、正则表达式路径、文件服务、自定义头部等
- OpenAPI兼容性
- 所有进入和转发请求的记录/日志
- JSON模板
- 代理转发模式
- HTTPS支持

您可以在网站上查看[完整列表](https://mockoon.com/features/)。

## 下载桌面应用程序

您可以直接从这个仓库或官方[网站](https://mockoon.com/download/)获取Mockoon桌面的[最新版本](https://github.com/mockoon/mockoon/releases/latest)。Mockoon桌面还可通过以下方式获取：

MacOS：

- [_Homebrew_](https://formulae.brew.sh/cask/mockoon)：`brew install --cask mockoon`。

Windows：

- _winget_：`winget install mockoon`。
- [_Chocolatey_](https://community.chocolatey.org/packages/mockoon)：`choco install mockoon`。
- [_Windows Store_](https://www.microsoft.com/en-us/p/mockoon/9pk8dmsn00jj)

Linux：

- [_Snap store_](https://snapcraft.io/mockoon)：`snap install mockoon`。
- [_AUR_](https://aur.archlinux.org/packages/mockoon-bin)：`yay -S mockoon-bin`。

## 安装CLI

Mockoon CLI作为[NPM包](https://www.npmjs.com/package/@mockoon/cli)提供。请查看我们的[专用文档](https://github.com/mockoon/mockoon/blob/main/packages/cli/README.md)来了解如何安装和使用它。

## 在云函数和无服务器环境中使用

Mockoon的Serverless [NPM包](https://www.npmjs.com/package/@mockoon/serverless)提供了一种在云函数和无服务器环境（AWS Lambda、GCP Functions、Firebase Functions等）中运行Mockoon模拟API的简便方法。

请查看我们的[专用文档](https://github.com/mockoon/mockoon/blob/main/packages/serverless/README.md)来了解如何使用它。

## 支持我们！

Mockoon是自豪的**独立**和**开源**项目，无需外部资金维护。我们依靠**赞助**和**Mockoon Cloud订阅**来不断改进项目并构建新功能。非常感谢以下公司对我们工作的支持并帮助我们成长（以及所有[赞助者](https://github.com/mockoon/mockoon/blob/main/backers.md)长期以来对这个项目的帮助！）：

### 铂金级

<div align="center" style="margin-top:20px;margin-bottom:20px;">
  <a href="https://github.blog/2023-04-12-github-accelerator-our-first-cohort-and-whats-next/">
      <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://mockoon.com/images/sponsors/light/github.png">
      <source media="(prefers-color-scheme: light)" srcset="https://mockoon.com/images/sponsors/github.png">
      <img src="https://mockoon.com/images/sponsors/light/github.png" alt="GitHub logo" />
      </picture>
  </a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://localazy.com/register?ref=a9CiDC61gOac-azO">
      <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://mockoon.com/images/sponsors/light/localazy.png">
      <source media="(prefers-color-scheme: light)" srcset="https://mockoon.com/images/sponsors/localazy.png">
      <img src="https://mockoon.com/images/sponsors/light/localazy.png" alt="Localazy logo" />
      </picture>
  </a>
</div>

### 黄金级

<div align="center" style="margin-top:20px;margin-bottom:20px;">
 
  <a href="https://www.lambdatest.com/">
      <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://mockoon.com/images/sponsors/light/lambdatest.png">
      <source media="(prefers-color-scheme: light)" srcset="https://mockoon.com/images/sponsors/lambdatest.png">
      <img src="https://mockoon.com/images/sponsors/light/lambdatest.png" alt="Lambdatest logo" />
      </picture>
  </a>
</div>

### 白银级

<div align="center" style="margin-top:20px;margin-bottom:20px;">
  <a href="https://www.emqx.io/">  
      <img src="https://mockoon.com/images/sponsors/emqx.png" alt="emqx logo" />
  </a>
</div>

如果您也想**支持Mockoon**，您可以**成为赞助者**或**订阅Mockoon Cloud**，每一份贡献都有助于项目的生存和发展。谢谢！

<div align="center" style="margin-top:20px;margin-bottom:20px;">
<a href="https://github.com/sponsors/mockoon"><img src="https://mockoon.com/images/sponsor-btn.png?" width="250" alt="sponsor button" /></a>
</div>

## 订阅Mockoon Cloud

Mockoon Cloud为 solo 开发者和团队提供高级功能，助力您的API开发：

- ☁️ [云部署](https://mockoon.com/cloud/docs/api-mock-cloud-deployments/)
- 🔄️ [数据同步和实时协作](https://mockoon.com/cloud/docs/data-synchronization-team-collaboration/)
- 🤖 [AI驱动的API模拟](https://mockoon.com/ai-powered-api-mocking/)
- 📃 访问数十个[即用型JSON模板](https://mockoon.com/templates/)。
- 💬 优先支持和培训。

立即升级，将您的API开发提升到新水平。

<div align="center" style="margin-top:20px;margin-bottom:20px;">
<a href="https://mockoon.com/cloud/"><img src="https://mockoon.com/images/cloud-btn.png?" width="250" alt="cloud button" /></a>
</div>

## Mockoon的文档

您可以在官方网站上找到Mockoon的[文档](https://mockoon.com/docs/latest/about/)。它涵盖了Mockoon最复杂的功能。欢迎贡献或请求涵盖新主题。

## 更新日志

您可以在官方网站上找到Mockoon应用程序的[更新日志](https://mockoon.com/releases/)。

## 支持/反馈

您可以在[官方社区](https://github.com/mockoon/mockoon/discussions)上讨论与Mockoon相关的所有内容并寻求帮助。这也是在这个仓库上打开问题之前讨论bug和功能请求的好地方。

## 贡献

如果您有兴趣为Mockoon做出贡献，请查看[贡献指南](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md)。

请同时查看我们的[行为准则](https://github.com/mockoon/.github/blob/main/CODE_OF_CONDUCT.md)。

## 路线图

如果您想了解下一个版本将包含什么，您可以查看全局[路线图](https://mockoon.com/public-roadmap/)或[订阅我们的新闻通讯](https://mockoon.com/newsletter/)。