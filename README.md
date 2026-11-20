# Fit Tool v1.6 · 网页版

在线使用：<https://eric-thy.github.io/fit-tool-web/>

在浏览器里画路线、拖结点、调路线偏移，**本地生成** Garmin FIT 跑步数据。不需要后端，不需要安装任何东西。

## 功能

- **可撤回的画路线**：点击地图添加结点；`Ctrl+Z` 撤回、`Ctrl+Y`（或 `Ctrl+Shift+Z`）重做，
  添加结点、拖动结点、整体平移、清除、导入都可以撤回。
- **拖动每个结点**：路线上的橙色圆点就是结点，按住可随意拖到任何位置，折线与距离实时更新。
- **整体平移**：按住路线线条拖动，整条路线一起移动（不会误加点）。
- **保存 / 导入路线**：`导出路线` 保存为 GeoJSON（含路线模式、圈数、偏移量），`导入路线` 支持
  GeoJSON（Feature / FeatureCollection / LineString / Polygon）以及 `{points:[{lat,lng}]}` 旧格式。
- **路线偏移可调**：0 ~ 12 米，0 = 完全贴合绘制路线；偏移沿路线连续变化，多圈是一条自然窄带。
- **完整跑步数据**：距离、配速、心率、步频、步幅、触地时间、垂直振幅、垂直步幅比、累计步数等。
- **预览**：在地图上播放轨迹，并把整条生成轨迹画出来。
- **纯前端**：所有计算都在浏览器里完成，不上传任何数据。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 撤回 | `Ctrl+Z` / `Cmd+Z` |
| 重做 | `Ctrl+Y` 或 `Ctrl+Shift+Z` |

在输入框里按 `Ctrl+Z` 仍然是输入框自己的撤销，不会影响路线。

## 本地打开

直接双击 `index.html` 也能用（Leaflet 与生成逻辑都在本目录里）。
或起一个静态服务器：

```bash
python -m http.server 8080
# 打开 http://localhost:8080
```

## 部署到 GitHub Pages

仓库根目录就是站点根目录：

1. 把本目录内容推到仓库（默认分支 `main`）。
2. 仓库 **Settings → Pages**，Source 选择 **Deploy from a branch**，分支 `main`、目录 `/ (root)`。
3. 访问 `https://<用户名>.github.io/<仓库名>/`。

`.nojekyll` 已包含。

## 目录结构

```
index.html        页面
main.js           地图交互、结点拖动、撤回栈、导入导出、生成流程
style.css         样式
fit-core.js       浏览器端 FIT 生成核心（@garmin/fitsdk + 活动数据模拟）
leaflet/          Leaflet 1.9.4（本地化，不依赖 CDN）
```

## 说明

- 桌面版 `fit-tool.exe` 与本网页版共用同一份 `main.js`，只是生成后端不同（本地服务 / 浏览器内核），
  两边生成的 FIT 文件逐字节一致。
- 地图源可选天地图 / OSM / Google / 腾讯，国内源可能需要自备 Key（保存在浏览器本地）。
- 生成的数据仅供个人测试 / 学习使用，请遵守所在学校与平台的相关规定。
