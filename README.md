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
   nginx.exe -p ./nginx_win/nginx-1.24.0
   # 注意：请根据实际安装位置调整路径，确保nginx.exe在系统PATH中或使用完整路径
   ```
4. 访问: http://localhost:8080

## Cloudflare Worker部署

### 一键部署
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cfengli007/happy-pxt/tree/main/cloudflare-worker)


### 手动部署
1. 安装Wrangler CLI: `npm install -g @cloudflare/wrangler`
2. 发布Worker: `wrangler publish`

## 环境变量
- `ENCRYPTION_SECRET`: 数据加密密钥(32位以上随机字符串)
- `RESEND_API_KEY`: Resend邮件服务API密钥
- `SENDER_EMAIL`: 发件人邮箱地址
- `VERIFICATION_EMAIL`: 验证邮箱地址

## 注意事项
- 生产环境请确保Nginx配置正确
- Worker部署前请测试本地功能
- 静态资源路径需与Nginx配置匹配