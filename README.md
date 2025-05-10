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
1. 安装Wrangler CLI: `npm install -g @cloudflare/wrangler`
2. 发布Worker: `wrangler publish`

## 环境变量
- `CF_ACCOUNT_ID`: Cloudflare账户ID
- `KV_NAMESPACE_ID`: KV命名空间ID
- `ENCRYPTION_SECRET`: 数据加密密钥(32位以上随机字符串)
- `RESEND_API_KEY`: Resend邮件服务API密钥

## 注意事项
- 生产环境请确保Nginx配置正确
- Worker部署前请测试本地功能
- 静态资源路径需与Nginx配置匹配