# DSH-theme-display-2001SpaceOdyssey

《2001 太空漫游》主题 **display** 插件 —— DeepSeek Harness Web UI 的显示层。

| 位置 | 效果 |
| --- | --- |
| 底板 | 可替换的整屏图片底板；默认是自带的甬道图（同心肋环 + 天花板灯带 + 尽头的光 + 走远的人影）。**透明度可调**（内置底板与自选图片都生效，设置页一个滑杆） |
| 左上角「新会话」 | **铆钉锈铁板**：四角铆钉 + 底边警示斜纹 + 拉丝金属纹 + 板缝 + 斜向高光扫光 + 顶部暖光/底部油污；字是**冷白 800 粗体**，带深色描边 + 冷色边光，不会跟暖色铁板糊在一起 |
| 侧栏「插件 / 自动化任务」等入口 | 同上，统一锈铁板 + 冷白字 |
| 工作区区域 | 加了一圈蓝色科技边框 + 四角括号 + 内发光 |
| 工作区「工作区」标题 | 官方用的是最暗的 `label-tertiary`，这里提升为**黄铜色标题**：加大加粗、拉开字距、加辉光，左侧一根发光黄铜条，标题行图标也一并转黄铜 |
| 工作区行 | 图标转青色并加发光、放大；行标题加粗到 600、字号 15px |
| 对话正文 | 字号从默认 14px 提到 **16px**，而且**标题 / 表格 / 流程行整条阶梯一起跟随**；文字借用「模式」胶囊那套处理 —— **带色调的金属感 + 柔和光晕** —— 但换成冷色**冰蓝 `#c8e4ff`**（既不是白、也不是胶囊的黄铜）；tertiary 刻意不动，否则层级会被拉平 |
| 会话标题 | 官方只是一个裸的 `label-primary` 文字（所以是白的、也不显眼）；现在做成**青色胶囊** `#9fe8ff` + 青色描边辉光，与旁边的模式胶囊明确区分 |
| 会话标题旁的「模式」 | 官方是 12px + 最暗的 `label-tertiary`，像条脚注；现在是一枚**黄铜胶囊**：13px / 700 字重 / 26px 高，带黄铜描边与辉光 |
| 顶部窗口条（应用 / 编辑 + 最小化那一条） | **纯色半透明底**，没有纹理也没有分隔线；两条**满高色带覆盖整条操作栏**，从左右飞向中间碰撞。**两侧永远同色**，色相按 **红→橙→黄→绿→青→蓝→紫** 每轮推进一档，碰撞瞬间同色**提亮并爆出辉光**（不是换色）。**约 3 秒一轮**，七轮共 21 秒走完一整道彩虹 |
| 品牌位 | 鲸鱼与 `DEEPSEEK HARNESS` 字标都变成 DeepSeek 蓝 `#4D6BFE` |
| 整屏外围 | **彩虹边框**：四条边各是一段连续光谱（顶 红→紫、右 紫→红、底 紫→红、左 红→紫，四角颜色对得上），**无光晕、无模糊**，就是一条干净的 4px 线；**5 秒转一圈**色相 |
| 输入框 | 去掉圆润卡片感：硬边内缩框 + 四角括号 + 顶部导轨 + 蓝色发光描边 |
| 全局 | 圆角刻度收紧、蓝色发丝描边、玻璃质感面板 |

---

## 1. 换背景（设置 → 2001 太空漫游）

侧栏进 **设置**，会多出一个分区 **「2001 太空漫游」**：

- **选择图片…** —— 挑任意本地图片当底板
- **背景透明度** —— 5%~100%，**内置底板和自选图片都能调**，并且会记住；选图后默认 55%（照片通常偏亮）
- **恢复内置底板** —— 回到自带的甬道图（透明度保持不变，可再拖回去）

透明度是**显示偏好**，不是图片的属性：它写在 `--dsh-2001-plate-opacity` 上，
所以内置甬道图也能淡入面板后面。卸载插件时会把这个变量和图片变量一起清掉。

两个关键行为：

1. **原图删掉也不影响**。选中的图片会被**复制进插件的 IndexedDB**（以 Blob 原样保存，不重新编码），
   页面通过 object URL 使用它，所以之后你把原文件删了、移走了，背景照常显示。
2. **记录丢了也能正常显示**。读不到记录（清过站点数据、库损坏、浏览器不支持 IndexedDB）时，
   自动回落到自带的甬道图，不会出现空白底板。

不想用设置页也可以用命令行换默认底板：

```sh
node tools/set-background.mjs "D:\stills\centrifuge.jpg"   # 本地图片，内嵌为 data: URI
node tools/set-background.mjs "https://host/still.jpg"     # 远程地址
node tools/set-background.mjs --reset                      # 回到自带甬道图
```

自带甬道图是 `assets/corridor.svg`，由 `tools/gen-corridor.mjs` 生成（真实 1/深度透视），改参数重跑即可。

## 2. 安装

有三种装法，**当前这台机器用的是第 3 种（固化）**。
以下 `<repo>` 指本插件所在仓库（DSH_Plugin）的根目录。

### ① 给别人用（单文件安装包，或直链）

`DSH-theme-display-2001SpaceOdyssey.tgz` —— 一个文件，直接装：

```sh
dsh plugin --profile desktop add ./DSH-theme-display-2001SpaceOdyssey.tgz
```

人在外面、手边没文件时，用仓库里那个 `.tgz` 的直链（点开仓库根目录的
`DSH-theme-display-2001SpaceOdyssey.tgz` → **Copy raw file** 就是直链；
`.tgz` 直链不走 npm 源，直接从 GitHub 取）：
也可以发到 npm 后按包名装（包已去掉 `private`；npm 名只能小写）：

```sh
npm publish
dsh plugin --profile desktop add dsh-theme-display-2001-space-odyssey
```

装完**刷新页面**；没变化就完整重启一次 Harness。

### ② 本机开发态（`file:` 指向工作区）

```sh
dsh plugin --profile desktop add file:<repo>/Theme-Display-2001SpaceOdyssey
```

改完源码执行 `node tools/sync-profile.mjs` 同步进 profile（就地覆写，不破坏 pnpm 的硬链接），再刷新页面。
**这种装法依赖工作区目录**：目录一改名或移走，profile 就会解析失败。

### ③ 固化态（推荐长期使用）

把包装进 profile 自己的 `vendor/` 目录，再让 profile 从**包内路径**安装：

```sh
node tools/freeze.mjs            # 打包 + 放进 <profile>/vendor/，并改好 package.json
```

之后 profile 里：

- 依赖写成 `file:vendor/DSH-theme-display-2001SpaceOdyssey.tgz`
- `pnpm-lock.yaml` 里带 **integrity 校验**，node_modules 里的文件来自 pnpm 的 store（**不再是工作区的硬链接**）
- `package.json` / `pnpm-lock.yaml` / `cordis.patch.yml` 里**不再出现任何指向工作区的路径**

也就是说：**工作区目录改名、移走、甚至删掉，插件照常工作。** 代价是改了源码要重新固化一次
（`node tools/freeze.mjs` → 让 profile 重新装 → 重启），不再能靠 `sync-profile.mjs` 热同步。

### 开关（启用 / 停用）

| 方式 | 位置 |
| --- | --- |
| **图形界面** | 侧栏 **设置 → 插件**，在 **已安装** 分组里找到 `dsh-theme-display-2001-space-odyssey`，行上就是启用/停用开关（也可以在 **官方/已安装** 列表里整包启停） |
| 命令行 | `dsh plugin --profile desktop disable DSH-theme-display-2001SpaceOdyssey` |
| patch 行 | 在 `cordis.patch.yml` 里写 `- id: DSH-theme-display-2001SpaceOdyssey` + `disabled: true` |

停用后再启用即可，不需要卸载。

## 3. 设计约束：只控制 display，方便叠加

| 它做了什么 | 叠加时的表现 |
| --- | --- |
| 用 `ctx.theme.overrideTokens(id, …)` 叠一层 **token 层** | 官方主题不被改动；多层按顺序合成，**按 token 后者胜出**；卸载即还原它覆盖的那几项 |
| 注入**一张**作用域为 `html[data-dsh-2001]` 的样式表 | 属性移除即无痕 |
| **新增**两个 `list` 座位：`settings.section` 设置分区、`shell.overlay` 整屏边框（都用**自己的 id**） | 官方分区与官方边框一个都不动；列表座位是叠加关系，不是替换 |
| 只读命中宿主公开的锚点 | 拿不到就只丢装饰，不会丢布局或功能 |

它明确**不碰**：别人的 Slot 座位、主题注册表、settings schema、任何服务。

### 它认得哪些宿主钩子

| 选择器 | 用途 | 稳定性 |
| --- | --- | --- |
| `[data-slot="sidebar.panellist"]` | 侧栏面板入口（插件 / 自动化任务…） | Slot 出口锚点，源码注释写明是 "purely addressable surface" |
| `[class*="_newSession"]` | 左上角新会话按钮 | CSS Module 局部名（哈希前缀变了也还成立） |
| `div:has(> [data-slot="sidebar.workspaces"])` | 工作区区域容器 | 用公开锚点反查父元素 |
| `[data-row-key]`、`[class*="_title"]` | 工作区行与标题 | 前者是行身份属性，后者是 CSS Module 局部名 |
| `html[data-windows-titlebar]`、`--dsh-windows-titlebar-height` | 桌面端顶部 40px 标题条 | 桌面壳自己写在 `<html>` 上 |
| `[data-windows-menu]` | 「应用 / 编辑」菜单宿主 | 桌面壳的固定属性；菜单在 Shadow DOM 里，样式只能靠**可继承的 CSS 变量**跨边界传递 |
| `[data-composer-card]` | 输入卡片 | 输入组件自己发布的语义标记 |
| `[data-slot="sidebar.brand.mark" / ".name"]` | 品牌位 | 官方鲸鱼与字标都用 `fill: currentColor`，所以只着色、不替换官方美术 |

### 它拥有的 token

`--dsw-alias-bg-base`、`bg-layer-1/2`、`bg-overlay`、`border-l1/l2`、`brand-primary`、
`label-primary/secondary`、`state-*` × 4、`--dsw-specific-sidebar-fill`、`-input-major`、
`-bubble`、`-bubble-highlight`、`-menu`、`-selector`、`-tip`。

深色的透明度是按宿主「**两到三层半透明表面叠在底板上**」推出来的：`bg-base` 取
`rgba(4,9,17,0.22)`，`(1-0.22)³ ≈ 0.47`，阅读区仍能看到约 47% 的底板，正文对比度保持 7:1 以上。

### 顶部两条色带 + 整屏边框的层级预算

```
5     标题条纯色半透明底（html::after）
30    宿主固定定位的新会话圆钮
1100  「应用 / 编辑」菜单
1200  两条碰撞色带   ← 满高覆盖整条操作栏；因为只是一层淡淡的水洗色，下面这些控件仍然看得清
1300  彩虹边框本体   ← 四条边，全部 pointer-events: none
```

色带**满高**（`top: 0` + `height: var(--dsh-windows-titlebar-height)`）、各占半屏宽，合起来正好盖满整条栏；
透明度刻意压得低（飞行 30% / 碰撞 52%），就是为了压过「应用 / 编辑」文字时仍然能读。
**两边的位移永远是向内的**：归位那一次反向位移被夹在**两帧全透明之间**，所以看不见（自检里有一条
`visible motion is inwards only` 专门守这个）。每一档的节拍按**一轮的比例**算，不是整段动画的百分比 ——
所以往 `RAIL_COLOURS` 里加颜色不会打乱节奏，也不会和相邻轮次的关键帧交错。
**尾端渐隐**用 `mask-image` 做，不参与颜色计算；填充与辉光在每一帧里直接声明，
所以即使动画不跑，色带也照样可见。
`prefers-reduced-motion: reduce` 下停止运动，直接停在碰撞后的提亮静止态。

### 整屏彩虹边框

挂在 `shell.overlay`（官方给整屏浮层留的列表座位）上，由 **4 个固定定位的 div** 组成，一条边一个。
**刻意不用 `mask` / `clip-path` / `border-image`** —— 那几种做法一旦属性没被支持，失败形态是"整屏被彩虹盖住"，
而用纯 `linear-gradient` 边条最坏只是少一条边。

四条边的颜色首尾相接（顶 红→紫、右 紫→红、底 紫→红、左 红→紫），四角重叠处颜色一致，所以看不出接缝 ——
自检里有一条 `frame corners agree end to end` 逐角比对首尾色值。

动画是 **`hue-rotate` 转一圈**而不是让渐变流动：边框本身已经含整个光谱，转满 360° 就回到同一帧，所以循环无接缝，
也不需要注册 `@property` 去插值渐变角度。四条边共用同一个动画，因此始终同相。

**光晕层已按要求整层移除**（不是隐藏）：没有 bloom 规则、没有 `blur()`、没有第二套关键帧，
组件也只渲染 4 个节点 —— 自检里 `frame has no glow layer at all` 与 `frame renders exactly four edge strips`
就是防止它哪天被顺手加回来。

### 对话正文与「模式」胶囊

**字号**：对话区和输入区都带 `data-conversation-region`，所以一条规则就能覆盖整个对话。
这里有个坑：官方是在 **`<body>` 上**用 `calc()` 从 `--dsh-content-font-size` 推导出
`--dsh-content-font-delta` 和次级那一对的 —— 而自定义属性里的 `var()` 是在**声明它的那个元素**上求值的。
所以如果只在对话区改字号，**正文会变大、标题/表格那一层会留在旧尺寸**，阶梯就散了。
因此这条规则把四个变量**在区内一起重新推导**（不是写死数值），于是 `CONVERSATION_FONT_SIZE` 仍然是一个旋钮。

**颜色**：只提亮 primary 和 secondary，tertiary 故意不动 —— 层级是靠"顶端更亮"读出来的，
每一级都提亮等于又拉平了。色调上**刻意不是白色**（那会读成系统默认字），
也**刻意不用胶囊的黄铜**（两者要能区分开），而是用冷色冰蓝 `#c8e4ff` + 一层宽而淡的冷色光晕
（`text-shadow: 0 0 12px`，靠继承覆盖整段正文，不参与布局）——
这层"带色调 + 光晕"就是胶囊那套处理的文字版。

**模式胶囊**：官方那个 `<span>` 是 12px + `label-tertiary`。提升成黄铜胶囊时加了一道
`:not(button *)` 约束 —— 同一个 header 槽位里还住着 `subagent-catalog` 和 `job-list` 两个**按钮**，
它们内部也有 `*_label` 的类名，这道约束保证只有那枚**非交互的胶囊本体**被改，不会在按钮里再套一层胶囊底。
另外**刻意不写 `display`**：官方有一套窄标题栏下隐藏这枚胶囊的规则，写死 `display` 会把它顶掉。

**会话标题胶囊**：这一枚是 `crumbCurrent`，官方给它的是裸 `label-primary`（就是白色文字、没有底）。
现在套用同一套胶囊做法，但换成**青色** —— 它和模式胶囊**紧挨着并排**，用同一个色系会看起来像一个控件。

于是这一行现在是**三档颜色**，各司其职：

| 元素 | 颜色 |
| --- | --- |
| 会话标题 | 青 `#9fe8ff`（胶囊） |
| 模式（创造模式） | 黄铜 `#e2b75f`（胶囊） |
| 对话正文 | 冰蓝 `#c8e4ff`（无底、带光晕） |

标题那条用 `header:has([data-slot="conversation.session.header.actions"])` 反查作用域，
避免别处同名 crumb 被误伤；同样**不写 `display`**，把 `inline-block` + 省略号行为留给官方。

## 4. 可调旋钮

都在 `lib/client.js` 顶部集中定义，改一处只影响一处：

| 常量 | 作用 |
| --- | --- |
| `SCRAP_IRON` / `SCRAP_IRON_HOVER` | 新会话与侧栏入口那块锈铁板的底色 |
| `SCRAP_EDGE` / `SCRAP_BRASS` | 铁板包边、黄铜高光（也是工作区标题色） |
| `SCRAP_TYPE` / `SCRAP_TYPE_RIM` | 入口文字与图标的颜色（冷白）与它外围的冷色边光；想换字色改这两个 |
| `BRAND_BLUE` | 品牌位蓝 |
| `CYAN` | 工作区图标青 |
| `RAIL_COLOURS` | 色相顺序表（当前 红→橙→黄→绿→青→蓝→紫）；**两侧共用**，想加档位就往数组里加一项，总时长会自动跟着变 |
| `RAIL_ALPHA_COLD` / `RAIL_ALPHA_HOT` | 色带在飞行中 / 碰撞提亮后的水洗浓度（现在 0.30 / 0.52；觉得太淡就往上调） |
| `RAIL_GLOW_COLD` / `RAIL_GLOW_HOT` | 色带外溢的辉光强度 |
| `RAIL_SECONDS_PER_ROUND` | 每轮几秒（当前 3） |
| `FRAME_SPECTRUM` | 整屏边框的七色顺序；四条边全部由它推导（含反向），所以改一处四边都跟着走 |
| `FRAME_SECONDS` | 边框色相转一圈的秒数（当前 5） |
| `CONVERSATION_FONT_SIZE` | 对话正文与输入区的字号（当前 16px）；标题/表格/流程行的阶梯会跟着一起推导 |
| `CONVERSATION_TEXT` / `CONVERSATION_TEXT_SOFT` / `CONVERSATION_TEXT_GLOW` | 对话区主色 / 次级色 / 光晕色（tertiary 不动） |
| `TITLE_TEXT` / `TITLE_FILL` / `TITLE_RING` / `TITLE_GLOW` | 会话标题胶囊的文字 / 底 / 描边 / 辉光（当前是青色系；想换成别的色系改这四个） |
| `BUILT_IN_PLATE_OPACITY` / `CUSTOM_PLATE_OPACITY` | 内置底板的默认透明度 / 第一次选图后落到的透明度 |
| `LINE` / `LINE_DIM` | 各处发丝描边 |

> 锈铁板是**纯 CSS 渐变**堆出来的，没有任何图片资源，所以在 40px 的顶部圆钮和整行入口上都不糊。
> 一条规则里叠了 **9 层**背景，`background-image` / `-size` / `-position` 是**三条平行列表** ——
> 自检里有一条 `scrap plate background layers stay aligned` 专门比对三者长度，改的时候顺序别错位。
> 想让铁板更亮或更旧，只需要动上面第一个常量。

## 5. 关闭 / 卸载

```sh
dsh plugin --profile desktop disable DSH-theme-display-2001SpaceOdyssey
dsh plugin --profile desktop remove  dsh-theme-display-2001-space-odyssey
```

或在 profile patch 里关掉这一行：

```yaml
- id: DSH-theme-display-2001SpaceOdyssey
  disabled: true
```

## 6. 自检

```sh
node tools/check.mjs          # 契约自检
node tools/sync-profile.mjs   # 同步进 profile
```

`tools/check.mjs` 用 stub 跑真实的 `lib/client.js`，断言 40 项不变量：ModuleLoader id 与包名一致、
**只依赖 baseline 模块**（给模块请求图加边的只有 `react`）、每个 token 都同时给出 `light`/`dark`、
设置分区用的是自己的 id、样式表只有一个 `<style>`、**每个选择器都在作用域内或带插件前缀**、
没有 `!important`、以及卸载后 token 层 / 设置分区 / 属性 / 样式表 / CSS 变量全部还原。

### 目录

```
lib/index.js      host 半：仅为让 Loader 发现本包而存在的空 apply
lib/client.js     浏览器半：token 层 + 作用域样式表 + 设置页（手写产物，无构建步骤）
cordis.patch.yml  本包插入的 Loader 行
assets/           甬道 SVG 与两张预览图
tools/            底板替换、契约自检、profile 同步、固化、甬道图生成
```

`lib/client.js` 是**手写并直接发布**的浏览器 bundle（`window.__ModuleLoader__.load` 包裹的 CJS），
仓库里没有构建步骤，改一行就生效。

> 注意：pnpm 用 `file:` 装本地包时是**硬链接**。用「先删后建」的方式覆写 `lib/client.js` 会让
> profile 里那份变成孤儿旧产物 —— 请用 `tools/sync-profile.mjs`（`writeFileSync` 就地覆写）。

---

## 7. 已验证 / 待你确认

**已验证（代码与运行时）**

- 包结构、`exports["./client"]`、`dsh.client.platform = "web"`、ModuleLoader id 与包名一致
- `node --check` 通过；`tools/check.mjs` 全部通过（含 CSS 选择器作用域静态分析）
- Loader 行 `include:DSH-theme-display-2001SpaceOdyssey` 处于 `active`
- profile 内文件与工作区源码逐字节一致（硬链接）
- `DSH-theme-display-2001SpaceOdyssey.tgz` 解包后 12 个文件与源码哈希一致

**未验证（需要你的眼睛）**

- 浏览器里的最终观感：锈铁板的分量、工作区标题的黄铜色够不够跳、两条色带碰撞的节奏与位置。
  这些只能看真实渲染。
