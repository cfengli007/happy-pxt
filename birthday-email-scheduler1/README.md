# 生日邮件定时发送服务 - Cloudflare Worker

该Cloudflare Worker用于在未来指定日期发送邮件，适用于生日网站的"给未来的自己写封信"功能。

使用技术：
- Cloudflare Workers 无服务器计算
- Cloudflare KV 存储定时邮件数据
- Cloudflare Cron Triggers 定期检查并发送邮件
- Resend（或类似邮件服务）用于实际邮件发送
- KV中存储消息的基础加密（占位符，**需要完善实现**）

## 项目结构

```
cloudflare-worker/
├── .gitignore
├── package.json
├── README.md
├── wrangler.toml         # Wrangler配置文件
└── src/
    └── index.js          # Worker主脚本
```

## 前置条件

1.  **Cloudflare账号**：在[Cloudflare](https://cloudflare.com)注册
2.  **Node.js和npm**：从[nodejs.org](https://nodejs.org/)安装
3.  **Wrangler CLI**：Cloudflare的Worker命令行工具。全局安装：
    ```bash
    npm install -g wrangler
    ```
4.  **Resend账号**：在[Resend.com](https://resend.com)注册并获取API密钥，同时需要已验证的发送域名

## 安装指南

1.  **克隆仓库（或在现有项目中创建这些文件）**

2.  **进入`cloudflare-worker`目录**：
    ```bash
    cd path/to/your/project/cloudflare-worker
    ```

3.  **安装依赖（用于本地开发/部署的Wrangler）**：
    ```bash
    npm install
    ```

4.  **配置`wrangler.toml`**：
    *   打开`wrangler.toml`
    *   将`YOUR_ACCOUNT_ID`替换为实际的Cloudflare账号ID（可在Cloudflare仪表板中找到）
    *   `name`字段（`birthday-email-scheduler`）将是Worker服务的名称

5.  **创建KV命名空间**：
    *   运行以下命令。如果在`wrangler.toml`中使用了不同的绑定名称，请替换`SCHEDULED_EMAILS_KV`
        ```bash
        npx wrangler kv:namespace create SCHEDULED_EMAILS_KV
        ```
    *   Wrangler会输出命名空间的`id`，复制此ID
    *   将复制的`id`粘贴到`wrangler.toml`中的`SCHEDULED_EMAILS_KV`绑定，替换`YOUR_KV_NAMESPACE_ID`

6.  **设置Resend API密钥和加密密钥**：
    *   **RESEND_API_KEY**：来自Resend的API密钥
        ```bash
        npx wrangler secret put RESEND_API_KEY
        ```
        （Wrangler会提示输入密钥值）
    *   **ENCRYPTION_SECRET**：用于KV数据加密/解密的强唯一密钥字符串。生成安全的随机字符串
        ```bash
        npx wrangler secret put ENCRYPTION_SECRET
        ```
        **重要**：`src/index.js`中的当前加密是占位符。生产环境必须使用Web Crypto API或类似`encrypt-workers-kv`的库实现强加密

7.  **更新邮件`from`地址**：
    *   在`src/index.js`中找到以下行：
        `from: 'Birthday Wishes <onboarding@resend.dev>', // TODO: 替换为你已验证的Resend域名/邮箱`
    *   将`'onboarding@resend.dev'`替换为你在Resend中已验证域名的邮箱地址

## 本地开发

要本地运行Worker测试`/schedule-email`端点：

```bash
npm start
# 或
npx wrangler dev
```

这将启动本地服务器，通常地址为`http://localhost:8787`

*   **本地开发中的KV**：Wrangler会使用本地模拟KV。本地存储的数据不会自动同步到部署的KV命名空间，除非显式发布
*   **本地开发中的密钥**：如果密钥未在`.dev.vars`文件中（该文件被git忽略），Wrangler会提示输入本地开发所需的密钥
*   **Cron触发器**：可以通过手动访问`wrangler dev`暴露的`/__scheduled`端点测试cron触发器，或通过部署后观察日志

## 部署

将Worker部署到Cloudflare：

```bash
npm run deploy
# 或
npx wrangler deploy
```

部署后，Worker将在`https://birthday-email-scheduler.<YOUR_SUBDOMAIN>.workers.dev`上线（如果配置了自定义域名则使用自定义域名）

`wrangler.toml`中定义的cron触发器（`0 * * * *` - 每小时）将在部署的Worker上自动运行

## API端点

*   **`POST /schedule-email`**：定时发送邮件
    *   **请求体(JSON)**：
        ```json
        {
          "email": "recipient@example.com",
          "message": "给未来的自己的消息！",
          "sendDate": "YYYY-MM-DDTHH:mm:ss.sssZ" // 未来发送时间的ISO 8601日期字符串
        }
        ```
    *   **成功响应(200 OK)**：
        ```json
        {
          "success": true,
          "emailId": "生成的唯一ID",
          "message": "邮件定时发送成功"
        }
        ```
    *   **错误响应(400或500)**：
        ```json
        {
          "error": "描述问题的错误信息"
        }
        ```

## 数据加密

**关键**：`src/index.js`中当前的加密/解密函数是**占位符，生产环境不安全**。必须使用Web Crypto API直接实现或使用专为此设计的库（如`encrypt-workers-kv`([GitHub](https://github.com/bradyjoslin/encrypt-workers-kv))）替换它们

确保`ENCRYPTION_SECRET`足够强且保密

## GitHub Actions CI/CD（可选）

使用GitHub Actions自动化部署：

1.  在主项目根目录（如果是子目录则不在`cloudflare-worker`内）创建`.github/workflows`目录
2.  向该目录添加工作流YAML文件（如`deploy-worker.yml`）
3.  在GitHub仓库设置中将Cloudflare API Token配置为密钥（如`CF_API_TOKEN`）
4.  工作流通常会在`cloudflare-worker`目录运行`npm install`和`npx wrangler deploy`

示例`deploy-worker.yml`：

```yaml
name: 部署Cloudflare Worker

on:
  push:
    branches:
      - main # 或你的部署分支
    paths:
      - 'cloudflare-worker/**' # 仅当worker代码变更时运行

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: 部署Worker
    steps:
      - uses: actions/checkout@v3
      - name: 设置Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18' # 或你偏好的Node.js版本

      - name: 安装Wrangler
        run: npm install --save-dev wrangler
        working-directory: ./cloudflare-worker # 如果worker在不同子目录请调整

      - name: 部署Worker
        run: npx wrangler deploy
        working-directory: ./cloudflare-worker # 调整路径
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} # 同时将账号ID添加为密钥
```

记得在GitHub仓库中也添加`CF_ACCOUNT_ID`作为密钥

## 其他注意事项

*   **错误处理与重试**：增强cron作业以更优雅地处理Resend API失败（如重试逻辑、死信队列）
*   **日志**：添加更详细的日志，可能与Cloudflare Logpush集成
*   **可扩展性**：KV对读取高度可扩展。对于`/schedule-email`的高写入量，如果成为问题，考虑速率限制或批处理
*   **安全性**：除加密外，确保适当的输入验证并考虑Worker的其他安全最佳实践
*   **幂等性**：确保如果cron作业对同一封邮件运行多次（如因错误和重试），不会多次发送邮件。当前的状态检查有助于此