# 生日项目部署指南

## 环境要求
- Node.js 16+ (用于开发和构建)
- Nginx (用于生产环境部署)

## 本地开发
1. 克隆仓库
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm run dev`

## Nginx部署
1. 确保已安装Nginx
2. 配置Nginx (参考nginx/default.conf)
3. 启动Nginx:
   ```bash
   d:\birthday\nginx_win\nginx-1.24.0\nginx.exe -p d:\birthday\nginx_win\nginx-1.24.0
   ```
4. 访问: http://localhost:8080

## Cloudflare Worker部署

### 一键部署
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cfengli007/happy-pxt/tree/main/cloudflare-worker)

### 手动部署
1. 安装Wrangler CLI: `npm install -g @cloudflare/wrangler`
2. 发布Worker: `wrangler publish`

### GitHub Actions自动化部署
1. 在仓库设置中添加以下环境变量:
   - `CF_ACCOUNT_ID`: Cloudflare账户ID
   - `CF_API_TOKEN`: Cloudflare API令牌
2. 创建`.github/workflows/deploy.yml`文件:
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: npm install -g @cloudflare/wrangler
      - run: wrangler publish
        env:
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

## 环境变量
- `ENCRYPTION_SECRET`: 数据加密密钥(32位以上随机字符串)
- `RESEND_API_KEY`: Resend邮件服务API密钥
- `SENDER_EMAIL`: 发件人邮箱地址
- `VERIFICATION_EMAIL`: 验证邮箱地址

## 注意事项
- 生产环境请确保Nginx配置正确
- Worker部署前请测试本地功能
- 静态资源路径需与Nginx配置匹配