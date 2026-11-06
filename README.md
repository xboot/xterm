# XTERM

A browser-based serial terminal built with the
[Web Serial API](https://developer.mozilla.org/docs/Web/API/Web_Serial_API) and
[xterm.js](https://xtermjs.org/).

Live: [xterm.xboot.org](https://xterm.xboot.org)

## Features

- Configurable baud rate, data bits, stop bits, parity, and flow control
- ANSI terminal emulation with direct keyboard input
- Optional timestamps, transfer statistics, and log downloads
- Chinese and English interfaces with dark and light themes
- Local-only serial communication; data is never uploaded

Requires HTTPS and a desktop Chromium browser with Web Serial support.

## Development

```bash
make start
make check
make build
```

## Deployment

Pushes to `main` are deployed automatically with GitHub Actions. To trigger a
deployment manually:

```bash
make deploy
```

## License

This program is free software; you can redistribute it and/or modify it under the terms of the MIT license. See [MIT License](LICENSE) for details.
