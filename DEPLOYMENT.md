# 部署说明

将代码推送到 GitHub 后，在 Vercel 导入仓库并部署。GitHub Pages 没有服务端接口，无法安全保存腾讯云密钥，因此不适用于本项目的上传功能。

在 Vercel 的 Environment Variables 中填入 `.env.example` 的所有变量。腾讯云 CAM 创建一个只允许对本 COS 桶执行 `cos:PutObject` 的角色，并将 ARN 填到 `TENCENT_COS_ROLE_ARN`。

在 COS CORS 中允许 Vercel 域名使用 `PUT, GET, HEAD`，允许请求头 `*`。部署后，在网站右下角管理入口输入 `UPLOAD_PASSWORD`，即可上传视频、背景图和项目封面；文件直传 COS，内容清单自动同步。
