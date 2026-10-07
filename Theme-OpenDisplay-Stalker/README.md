# DSH-Theme-OpenDisplay-Stalker

DeepSeek Harness Web UI 的**开机动画** display 插件。打开新窗口时，先用 3 秒播一段开机序列：
你放的那张图从模糊里醒来，蓝色科技字 **欢迎来到未来** 一个一个亮起 —— **点一下鼠标就直接进界面**。

- 只做 display 层：不替换任何官方插槽，只新增两个座位（`shell.overlay` + `settings.section`），
  用**自己的 id**，卸载后不留痕
- 与 `DSH-theme-display-2001SpaceOdyssey` **零冲突**：不共用类名、属性、id、存储库、z-index 段
  （自检里有一节专门逐项比对两个插件）
- 无构建步骤：`lib/` 是手写产物，图片按 base64 内联在 bundle 里，宿主不需要提供任何静态资源

## 1. 四条需求是怎么落地的

| 需求 | 做法 |
| --- | --- |
| **① 3 秒，点一下鼠标立即完成并进入 DSH** | 整条时间线挂在 `--dsh-stalker-ms`（默认 3000ms）上，所有动画都是它的比例；`onPointerDown` 一次即进入收尾 |
| **② 每次打开新窗口都要有动画** | 判据是**每个文档播一次**（模块级变量，不是 localStorage/sessionStorage）。新窗口 = 新文档 = 新 bundle 实例 = 播一次；页面内重渲染绝不会重播 |
| **③ 一张图 + 逐渐显示「欢迎来到未来」** | 图可以是内置画面，也可以自己上传；上传的图被**复制进 IndexedDB**，所以原文件删掉照样播。文字按**每个字**一个元素、依次从模糊里亮起 |
| **④ 单击 = 跳到最后一帧，然后立即进入** | 点击时加上 `is-finishing`：所有图层**瞬间吸附到最后一帧**（图清晰、六个字全亮、进度条走满），再走一遍 200ms 淡出，然后卸载 |

关于 ② 有个细节值得说明：**用 `sessionStorage` 是错的**。从已有窗口 `window.open` 出来的窗口会**继承**
sessionStorage，那样新窗口反而不播；`localStorage` 更糟，会直接让动画永远只播一次。所以这里用的是
模块级变量 —— 它天然就是「每个文档」的粒度。自检里有一条专门禁止这两种存储出现在 bundle 里。

## 2. 安装

以下 `<repo>` 指本插件所在仓库（DSH_Plugin）的根目录。

```sh
# ① 单文件（推荐）
dsh plugin --profile desktop add ./DSH-Theme-OpenDisplay-Stalker.tgz

# ② 仓库直链（点开仓库根目录的 .tgz → Copy raw file 拿到直链）
dsh plugin --profile desktop add <直链>

# ③ 本机开发态
dsh plugin --profile desktop add file:<repo>/Theme-OpenDisplay-Stalker
```

装完**刷新页面**，然后开一个新窗口就能看到动画。在 **设置 → 插件 → 已安装** 里可以随时开关它。

## 3. 设置页

**设置 → 开机动画**：

| 控件 | 作用 |
| --- | --- |
| 选择图片… | 上传自己的开机画面（`image/*`）。图片会以 Blob 存进 IndexedDB，**原文件删掉不影响** |
| 恢复内置画面 | 删掉存的那条记录，回到内置的废土画面 |
| 重播开机动画 | 立刻再播一次，不用真去开新窗口 |
| 动画时长 | 0.8s ~ 10s 滑杆，默认 3.0s；**整条时间线按比例缩放**，不是只改等待时间 |

## 4. 几个实现上的坑（都踩过并修了）

**开机遮罩不能挂在座位里。** `shell.overlay` 是官方给整屏浮层留的座位，看起来正合适 —— 但它的 CSS 是
`z-index: 20; pointer-events: none`（直接子元素才拿回 `pointer-events: auto`）。`z-index: 20` 意味着
**整个图层被压在标题条「应用 / 编辑」菜单（1100）之下**，遮罩会被自家 chrome 盖住。
所以座位照常注册（生命周期归座位管），但内容用 `createPortal` **挂到 `document.body`**，
在根堆叠上下文里拿 `z-index: 9999`。

**渐变文字必须放在 `@supports` 里。** 蓝色的科技感靠 `background-clip: text` + 蓝白渐变。但如果浏览器
不认这个属性，**字会变成全透明**（`-webkit-text-fill-color: transparent` 生效、裁剪没生效）。
所以渐变整块包在 `@supports ((background-clip: text) or (-webkit-background-clip: text))` 里，
不支持就退回纯蓝 + 辉光，绝不会出现"字消失"。

**"跳到最后一帧"要用另一个动画名。** 收尾淡出是一个带 `animation-delay: calc(ms - exit)` 的动画。
点击时只改 delay 是不保险的（已启动的动画改 delay 是否重置按实现而定），所以 `is-finishing` 里把
`animation-name` 换成 `dshStalkerExitNow` —— 换名字**一定**从 0 重新开始淡出。
自检里有一条 `the finishing state restarts the fade instead of reusing the delayed one` 守着这件事。

**内置画面必须内联。** 宿主只为客户端 bundle 提供服务，不提供插件的静态资源，所以画面要么是
bundle 里的 base64，要么就没有。`tools/gen-art.mjs` 生成 SVG 并**回写** `lib/client.js` 里的
`POSTER_RENDITION`。自检里禁止 bundle 里出现 `fetch(` 或 `assets/`。

## 5. 可调旋钮

都在 `lib/client.js` 顶部：

| 常量 | 作用 |
| --- | --- |
| `TITLE` | 要显示的那行字（当前 `欢迎来到未来`）；改字数不用改别的，镜头和错位会自动跟随 |
| `DEFAULT_DURATION_MS` / `MIN_DURATION_MS` / `MAX_DURATION_MS` | 时长与可调范围（3000 / 800 / 15000） |
| `EXIT_MS` | 收尾淡出时长（200ms），自然结束和点击跳过共用 |
| `REDUCED_DURATION_MS` | 系统开启"减少动态效果"时的等待（700ms，只显示最终画面） |
| `CHAR_FIRST_AT` / `CHAR_STEP` | 第一个字出现的位置、字与字的间隔（都是时间线的比例） |
| `SCENE_Z` | 遮罩层级（9999） |
| `POSTER_RENDITION` | 内置画面（由 `gen-art.mjs` 生成，别手改） |

颜色/字体在样式表里：`.dshStalkerChar` 的 `color` + 辉光、`@supports` 里的渐变四色、
`.dshStalkerTitle` 的 `font-family` 字体栈。

想换内置画面：改 `tools/gen-art.mjs` 里的场景参数，跑 `node tools/gen-art.mjs`。

## 6. 自检

```sh
node tools/check.mjs
```

拿真实的 `lib/client.js` 跑一遍桩环境（假 ModuleLoader / DOM / 无 IndexedDB / 假 slots），断言：

- 身份：loader id = 包名、只 require 基线模块、`platform: web`
- 增量性：只新增两个自己的座位、**不覆盖任何 theme token**（token 层留给主题插件）
- 遮罩：确实 portal 到 `document.body`（否则会被标题条盖住）
- 文案：**每个字一个元素**、顺序正确、错位严格递增（字数是从 `TITLE` 推出来的，不是写死的）
- 交互：`onPointerDown` 存在、`is-finishing` 把所有图层吸附到最后一帧、淡出换了动画名
- 每个窗口一次：守卫是文档级变量，且**禁止** `sessionStorage`/`localStorage` 出现在 bundle 里
- 图片是数据：写入/读回 IndexedDB、用 object URL、内置画面是内联 data URI、bundle 里不含 `fetch(`
- 样式表全部作用域化、注释都闭合、`@supports` 守卫在、reduced-motion 分支在
- 卸载：座位注销、样式表移除、作用域属性还原
- **互不冲突**：与 `Theme-Display-2001SpaceOdyssey` 逐项比对包名、loader id、类名/属性前缀、
  存储库名、z-index 段

## 7. 目录

```
Theme-OpenDisplay-Stalker/
├── package.json          name 是小写 npm 名；loader 行 id 是 DSH-Theme-OpenDisplay-Stalker
├── cordis.patch.yml      Loader 行（组合包加载入口）
├── lib/
│   ├── index.js          宿主半：空实现，只为让加载器发现这个包
│   └── client.js         客户端半：整个开机动画（含内联画面与样式表）
├── assets/open-display.svg   内置画面（gen-art.mjs 生成；实际用的是 bundle 里那份 base64）
└── tools/
    ├── gen-art.mjs       生成画面并回写 bundle
    ├── check.mjs         契约自检
    ├── freeze.mjs        固化安装：打包 + 放进 profile 的 vendor
    └── sync-profile.mjs  开发态同步（识别到固化安装会拒绝执行）
```

## 8. 许可

MIT
