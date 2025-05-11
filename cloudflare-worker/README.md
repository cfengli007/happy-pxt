# 生日邮件定时发送服务 - Cloudflare Worker

## 项目概述
该Cloudflare Worker用于在未来指定日期发送邮件，适用于生日网站的"给未来的自己写封信"功能。

### 核心技术
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

## 快速开始

### 一键部署
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cfengli007/happy-pxt/tree/main/cloudflare-worker)

### 手动部署
1. 安装Wrangler CLI: `npm install -g @cloudflare/wrangler`
2. 发布Worker: `wrangler publish`

## 详细配置

### 前置条件
1. **Cloudflare账号**：在[Cloudflare](https://cloudflare.com)注册
2. **Node.js和npm**：从[nodejs.org](https://nodejs.org/)安装
3. **Wrangler CLI**：Cloudflare的Worker命令行工具
4. **Resend账号**：在[Resend.com](https://resend.com)注册并获取API密钥

### KV存储配置
1. 创建KV命名空间：
```bash
npx wrangler kv:namespace create SCHEDULED_EMAILS_KV
```
2. 更新`wrangler.toml`中的KV绑定

### 环境变量
| 变量名 | 描述 | 示例值 | 是否必需 |
|--------|------|--------|---------|
| BIRTHDAY_WISHES | 生日祝福语列表，JSON格式，用作验证码 | ["祝福语1","祝福语2"] | 是 |
| ENCRYPTION_SECRET | 加密密钥，用于加密存储的邮件数据 | base64编码字符串 | 是 |
| RESEND_API_KEY | Resend API密钥，用于发送邮件 | re_1234567890abcdef | 是 |
| SCHEDULED_EMAIL_TEMPLATE | 定时邮件HTML模板 | `<html>...</html>` | 是 |
| SCHEDULED_SENDER_NAME | 定时邮件发件人名称 | "FROM 2025" | 否 |
| SCHEDULED_EMAIL_SUBJECT | 定时邮件主题 | "来自2025的你的一封信！" | 否 |
| SENDER_EMAIL | 发送定时邮件的邮箱地址 | sender@example.com | 是 |
| VERIFICATION_EMAIL | 验证邮件发件人邮箱 | your-verified-email@domain.com | 是 |
| VERIFICATION_EMAIL_TEMPLATE | 验证邮件HTML模板 | `<html>...</html>` | 是 |
| VERIFICATION_SENDER_NAME | 验证邮件发件人名称 | "祝你快乐" | 否 |
| VERIFICATION_EMAIL_SUBJECT | 验证邮件主题 | "【祝你快乐】邮箱验证码" | 否 |

**注意：**
1. 所有变量都必须在wrangler.toml中配置绑定或通过`wrangler secret put`设置
2. EMAIL必须是Resend账户中已验证的邮箱
3. ENCRYPTION_SECRET建议使用`openssl rand -base64 32`生成

设置方式：
```bash
npx wrangler secret put <变量名>
```

## 开发指南

### 本地开发
1. 创建`.dev.vars`文件配置本地环境变量
2. 启动开发服务器：
```bash
npm start
# 或
npx wrangler dev
```

### API端点

#### 1. 发送验证邮件
- **`POST /send-verification-email`**：发送验证邮件到指定邮箱

请求示例：
```json
{
  "email": "recipient@example.com"
}
```

响应示例：
```json
{
  "success": true,
  "message": "验证邮件已发送，请检查您的收件箱。"
}
```

#### 2. 验证邮箱
- **`POST /verify-email`**：验证邮箱和验证码

请求示例：
```json
{
  "email": "recipient@example.com",
  "code": "验证祝福语"
}
```

响应示例：
```json
{
  "success": true,
  "message": "邮箱验证成功！祝福已送达！"
}
```

#### 3. 定时发送邮件
- **`POST /schedule-email`**：定时发送邮件

请求示例：
```json
{
  "email": "recipient@example.com",
  "message": "给未来的自己的消息！",
  "sendDate": "YYYY-MM-DDTHH:mm:ss.sssZ"
}
```

响应示例：
```json
{
  "success": true,
  "message": "邮件已成功安排，将在指定时间发送。"
}
```

## 高级配置

### GitHub Actions CI/CD
示例`deploy-worker.yml`：
```yaml
name: 部署Cloudflare Worker

on:
  push:
    branches: [main]
    paths: ['cloudflare-worker/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: 安装Wrangler
        run: npm install --save-dev wrangler
        working-directory: ./cloudflare-worker
      - name: 部署Worker
        run: npx wrangler deploy
        working-directory: ./cloudflare-worker
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
```

## 开源组件
- [@cloudflare/wrangler](https://github.com/cloudflare/wrangler): Apache-2.0


## 最佳实践
- **错误处理**：实现指数退避重试机制
- **日志记录**：使用结构化JSON日志
- **安全性**：定期轮换加密密钥
- **性能**：对API端点添加速率限制