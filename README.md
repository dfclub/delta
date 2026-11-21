# 三角洲行动官网（打粥社）

打粥社 · 三角洲行动工作室的官网，纯静态页面（HTML + CSS + JS，无后端、无数据库）。
托管在 **GitHub Pages**，不依赖本机开机、不需要 XAMPP 或任何服务器在线。

## 在线地址

| 用途 | 地址 | 状态 |
| --- | --- | --- |
| **主入口（GitHub Pages）** | <https://dfclub.github.io/delta/> | 稳定，全球可访问 |
| 本地预览 | <http://127.0.0.1:8081/> | 仅本机，改文件即时生效 |
| 备用（Tailscale Funnel） | <https://mcserver.tailaf01bf.ts.net:8443/> | 依赖本机开机，白天可用 |
| 计划中（自定义域名） | <https://delta.dfclub.eu.org/> | 等 eu.org 人工审核，暂不可用 |
| 历史地址（Cloudflare Worker） | <https://delta.dfclub.workers.dev/> | 国内 DNS 污染，基本不可用 |

## 仓库信息

- 仓库：`dfclub/delta`（Public，默认分支 `main`）
- 发布方式：Settings → Pages → Deploy from a branch → `main` → 目录 `/(root)`
- 访问路径带 `/delta/` 后缀，因为仓库名是 `delta`
- 根目录的 **`.nojekyll` 必须存在**：关掉 Jekyll，否则中文目录（`画廊/`、`背景/`）和部分文件会被忽略，图片全 404

## 目录结构

| 路径 | 内容 |
| --- | --- |
| `index.html` | 首页（打粥社 · 三角洲行动工作室） |
| `home.html` | 「我们的官网 · 站点入口」导航页（多地址汇总，与根站 <https://dfclub.github.io/> 同款） |
| `gallery.html` | 画廊页，281 张卡片，前端分页（每页 12 张）+ 文件名搜索 |
| `team.html` | 团队成员页 |
| `log.html` | 网站日志页，改动按时间倒序记录 |
| `styles.css` | 全站样式，含 `.gallery-pager` 分页样式 |
| `scripts.js` | 全站脚本，末尾为画廊分页模块（`PAGE_SIZE = 12`） |
| `favicon.svg` / `favicon-64.png` | 站点图标 |
| `画廊/` | 281 张原图（按 1920 宽、JPG q88 压缩） |
| `画廊/thumb/` | 281 张缩略图（640 宽 JPG），卡片默认加载这一层 |
| `背景/` | 5 张版块背景图 |
| `画廊同步记录.json` / `画廊同步报告.json` | 壁纸巡检脚本的增量记录与运行报告 |

当前仓库共 **581 个文件 / 约 150 MB**，单文件均小于 25 MB。

## 为什么仓库里是压缩版

站点源目录（`D:\三角洲官网\DOEM3`）是 2 GB 级别的原图合集，GitHub 的限制是单文件 100 MB、单仓库 1 GB，原图直传不可行。
所以发布前由 `repo-prep.ps1` 生成一份压缩副本，规则：

- 宽度 > 1920 的图片等比缩到 1920
- `画廊/` 下的 PNG 转 JPG（质量 88、白底）
- 同步改写 `gallery.html` 里的图片引用和 `window.GALLERY_SIZES`
- 排除 `.vscode/`、`.htaccess`
- `.git`、`.gitattributes`、`.gitignore`、`.nojekyll` 先暂存再还原，保留提交历史

## 更新发布流程（四步，顺序不可跳过）

1. **先改源站**：只改 `D:\三角洲官网\DOEM3`，不要直接改本仓库的文件（下次重建会被覆盖）。
2. **补一条日志**：在 `log.html` 的 `.log-list` 最上方插入

   ```html
   <article class="log-entry"><time datetime="2026-11-21T21:00">2026-11-21 21:00</time><h3>一句话标题</h3><p>改了什么 + 为什么 + 影响</p></article>
   ```

   硬规则：任何一次站点改动都必须带一条对应日志，日志没写就不算改完。
3. **重建副本**：双击 `D:\三角洲官网\生成仓库副本.bat`（内部调用 `repo-prep.ps1`），把 `DOEM3` 压缩同步到本仓库目录。
4. **提交并推送**：GitHub Desktop 里填 Summary → `Commit to main` → `Push origin`；或用命令行

   ```bat
   cd /d D:\三角洲官网\网站压缩副本
   git add -A
   git commit -m "更新说明"
   git push origin main
   ```

推送后约 1 分钟 Pages 自动构建。**验证方法**：直接请求线上地址拿 200，不要用 `GET /repos/{owner}/{repo}/pages` 判断（未手动配置时会返回 404 误导）。

## 注意事项

- **同名 PNG/JPG 会互相覆盖**：`画廊/` 里有同名不同图的 `X.png` 与 `X.jpg`，转换时原 jpg 会另存为 `X_jpg.jpg`，`gallery.html` 同步改引用；重跑脚本后要确认这一步没丢图。
- `*.bak`、`*.tmp`、`~$*` 已在 `.gitignore` 里忽略；提交前仍建议清掉残留 `.bak` 与 `debug.log`。
- 脚本会把 `画廊同步报告.json`、`画廊同步记录.json`、`*.bak` 一起带进副本，属正常现象。
- 画廊卡片数、`画廊/` 原图数、`画廊/thumb/` 缩略图数三者必须一一对应（当前 281 / 281 / 281）；手工删图要同步删卡片。
- 网页端 Upload files 也能更新，但一次最多 100 个文件、单文件 ≤ 25 MB，本仓库 581 个文件不建议走这条路。
- 站点为纯静态，没有后台；画廊搜索与分页都在前端完成，不改任何文件。

## 相关文件（本机，不入仓库）

- `D:\三角洲官网\部署说明.md`：完整运维说明（服务管理、画廊巡检、发布流程、日志规则）
- `D:\三角洲官网\repo-prep.ps1`：压缩副本生成脚本
- `D:\三角洲官网\sync_gallery.py`：画廊壁纸月度巡检（每月 26 日 12:00）

## 内容合规

页面内容需遵守中国法律。托管在 GitHub Pages 走境外、无需备案，但违法违规内容仍可能被平台封停。
