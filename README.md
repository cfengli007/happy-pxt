# 生日邮件定时发送服务 - Cloudflare Worker

## 主要功能
- 定时发送生日祝福邮件（通过Cloudflare Worker+Resend邮件服务）
- 邮件内容加密存储（未完成）

## 快速开始
### 一键部署
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cfengli007/happy-pxt/tree/main/cloudflare-worker)
### 手动部署
1. 克隆仓库
2. 安装依赖: `npm install`
3. 配置环境变量（详见下方）

## 部署选项
### Cloudflare Worker部署
详细部署指南请参考：[cloudflare-worker/README.md](./cloudflare-worker/README.md)

### Nginx部署(可选)
1. 确保已安装Nginx
2. 配置Nginx (参考nginx/default.conf)
3. 启动Nginx:
   ```bash
   nginx.exe -p ./nginx_win/nginx-1.24.0
   ```

## 核心环境变量
| 变量名 | 用途 | 格式要求 |
|--------|------|----------|
| RESEND_API_KEY | 通过Resend API发送邮件 | 从Resend账户获取 |
| SENDER_EMAIL | 发件人邮箱 | 已验证的Resend邮箱 |
| ENCRYPTION_SECRET | 加密KV存储数据 | 32位以上随机字符串 |
| VERIFICATION_EMAIL | 发送验证码邮箱 | 已验证的Resend邮箱 |

## 使用的开源组件

- **[Node.js](https://nodejs.org/)**: JavaScript运行时环境 (MIT License)
- **[wrangler](https://github.com/cloudflare/wrangler2)**: Cloudflare Workers开发工具 (MIT License)
- **[bootstrap-icons](https://github.com/twbs/icons)**: Bootstrap图标库 (MIT License)
- **[wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)**: 音频波形可视化库 (BSD 3-Clause License)
- **[OpenSSL](https://www.openssl.org/)**: 加密工具包 (OpenSSL License)
- **[PCRE](http://www.pcre.org/)**: 正则表达式库 (BSD License)
- **[nginx](https://nginx.org/)**: Web服务器 (BSD License)
- **[zlib](https://zlib.net/)**: 数据压缩库 (zlib License)

## 许可证

本项目使用MIT许可证，完整文本请参见[LICENSE](./LICENSE)文件。

## 注意事项
- 生产环境请确保Nginx配置正确
- Worker部署前请测试本地功能
- 静态资源路径需与Nginx配置匹配