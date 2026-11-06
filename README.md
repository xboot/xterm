# XTERM

基于 [Web Serial API](https://developer.mozilla.org/docs/Web/API/Web_Serial_API) 和
[xterm.js](https://xtermjs.org/) 的浏览器串口超级终端。

访问地址：[xterm.xboot.org](https://xterm.xboot.org)

## 功能

- 支持常用波特率、数据位、停止位、校验位和硬件流控
- xterm.js 终端仿真，支持 ANSI 色彩和键盘输入
- 直接在终端中输入，完整保留超级终端的交互方式
- 自动滚动、逐行接收时间戳
- RX / TX 实时统计和会话日志下载
- 响应式界面，配置项保存在浏览器本地
- 串口数据只在浏览器和设备之间传输

Web Serial 需要安全上下文，请使用 HTTPS 地址，并建议使用桌面版 Chrome、Edge
或其他支持 Web Serial 的 Chromium 浏览器。

## 开发

```bash
make start
```

检查并构建生产版本：

```bash
make check
make build
```

## 部署

推送到 `main` 分支会自动构建并部署到 GitHub Pages。也可以使用 GitHub CLI
手动触发：

```bash
make deploy
# 等价于：gh workflow run deploy.yml
```

首次使用时，需要在 GitHub 仓库的 **Settings → Pages → Build and deployment**
中将 Source 设为 **GitHub Actions**，并确保 `xterm.xboot.org` 的 DNS CNAME 指向
`xboot.github.io`。构建产物自带 `CNAME` 文件。

## License

This program is free software; you can redistribute it and/or modify it under the terms of the MIT license. See [MIT License](LICENSE) for details.
