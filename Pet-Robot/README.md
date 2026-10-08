# dsh-pet-robot

DeepSeek Harness Web UI 的**桌宠**：一只废土风机器人趴在界面上。它管四件事 ——
任务完成提示音（可关）、双击看余额、真正关掉 DSH、以及一个保留「欢迎来到未来」的锁屏。

- 只做 display 层：不替换任何官方插槽，只新增两个座位（`shell.overlay` + `settings.section`），用**自己的 id**
- 与另外两个插件**零冲突**：不共用类名、属性、loader id、存储库、z-index 段（自检里逐项比对）
- **借用而不是重造**：关窗走 shell 的 `shortcuts`，余额走 shell 的 `remote.account`，
  完成信号用座位自带的 `useSessionStatus` —— 三个都做了防御性调用，缺一个只是按钮不可用，不会把插件搞崩

## 1. 六条需求分别落在哪

| 需求 | 实现 |
| --- | --- |
| **① 任务完成提示音可选** | 设置页四选一：关闭 / 电子哔声 / 机械咔哒 / 清脆铃声，带**试听**；工具条上是**双向开关**（绿=开 / 灰=关），关掉会记住上次选的音型。声音是**合成的**（振荡器 + 噪声缓冲），不带音频文件 |
| **② 废土风机器人** | 手绘 **inline SVG**（锈铁 + 危险条纹 + 单眼镜头 + 履带）：能呼吸、天线会摆、眼睛会眨，眼睛颜色随状态变（空闲暖橙 / 运行冷青 / 完成亮绿） |
| **③ 方便看余额** | **双击机器人**看余额卡片（总额 + 充值 + 赠送 + 刷新），工具条上也有「余额」按钮；读失败时会**说明原因**（见下） |
| **④ 关闭** | 工具条「关闭」→ 弹确认面板，给三个明确选择：**停止任务** / **关闭窗口** / **结束 DSH**（机制见第 2 节） |
| **⑤ 锁屏** | 「锁屏」按钮 → 全屏盖上**欢迎页**（背景可自己换 + 蓝色科技字**欢迎来到未来**，**没有任何提示文字**），**单击或按 Esc 解锁** |
| **⑥ 满意后再推 GitHub** | 已构建、已本地安装验证，**未提交、未推送** |

## 2. 平台事实：宿主是**子进程**（这轮才查清）

崩溃日志把真相说清楚了：

```
Error: dsh desktop host exited with 1: (node:73208) [DEP0180] DeprecationWarning...
    at ChildProcess.<anonymous> (lib/main.js:3724:64)
```

**`dsh desktop host` 是 Electron 主进程 fork 出来的子进程**（栈里是 `ChildProcess.<anonymous>`），
所以宿主半里 `import("electron")` 拿不到 `BrowserWindow` —— 上一版那个"宿主读窗口 URL"的桥**根本不可能生效**。
而子进程在任务跑到一半时被杀，**退出码是 1**，主进程就判定为**意外停止**，于是弹出"应用无法启动或已意外停止"。

| 想做什么 | 怎么做 | 结果 |
| --- | --- | --- |
| **完全退出（推荐）** | 托盘图标右键 →「退出 DeepSeek Harness」 | 官方路径：它会先列出在跑的任务再协调退出 ✓ |
| 「关闭窗口」 | 无论有没有任务 | **只是隐藏到系统托盘**（外壳的 close 处理写死了 `preventDefault()`），永远不会退出应用 |
| 「结束 DSH」 | 点面板上那个按钮 | 客户端通过 shell 自己的命令 Remote 让宿主半**杀掉主管它的外壳进程** → 整个应用消失，**不会有崩溃提示**（弹提示的那个进程已经没了）✓ |

面板里已经把这句话写出来了，并且**取消了"宿主没响应就自动关窗"的兜底** ——
那个兜底正是制造崩溃提示的原因之一。

## 3. 关闭面板的三个选择

点工具条「关闭」不会立刻关任何东西，而是给你三个明确的选择（外加取消）：

| 按钮 | 做什么 | 怎么做到的 |
| --- | --- | --- |
| **停止任务** | 停掉当前会话正在跑的那一轮 | **没有客户端服务**能做这件事（composer 才有），所以按它自己的标签找到 composer 的停止按钮并按下。当前没有可停的东西时按钮是灰的（`busy === 0`） |
| **关闭窗口** | 关掉当前窗口 | `ctx.shortcuts.closeWindow()`，拿不到就 `window.close()`。**没有任务在跑时这就是完全退出**（最后一个窗口关闭 → `app.quit()`） |
| **结束 DSH** | **强制结束整个应用**（不留托盘，正在跑的任务会被中断） | 见下 |

### "结束 DSH" 是怎么打通的

桌面版宿主有意在关窗后留在系统托盘：

- `backgroundNoticeBody: "正在运行的任务不会中断，可在系统托盘中重新打开窗口"`

而且**渲染进程没有任何退出通道** —— preload 暴露的 IPC 里没有 quit（`shortcuts-close-window`、`boot`、`updates-*`、`windows-menu`…），
桌面桥 `dshDesktop` 只有 `browser / deviceInfo / keyboard / shortcuts / updates`，
而唯一的客户端↔宿主通道（生成式 Remote 命名空间）**手工插件没法扩展**。

所以这个插件用了另一条路：**页面自己的 URL**。

1. 客户端点「结束 DSH」→ `location.hash = "dsh-pet-quit"`
2. **宿主半**（跑在 Electron 主进程里）监听着每个窗口的 `did-navigate-in-page` → 看到这个标记
3. → `app.quit()` 礼貌退出；**2500ms 后仍然活着就 `app.exit(0)` 强制结束**

页面只需要"请求退出"这一个能力，**真正的决定权和 `app.exit()` 都在宿主半**里。这条通道**只在桌面版存在**：
网页版里 `import("electron")` 直接失败，宿主半什么都不做 ✓。

如果宿主半没有响应，面板会**明说**（"宿主没有响应（网页版没有这个能力），已改为关闭窗口"）并退回关闭窗口，
不会给你一个按了没反应的按钮。

### 旧的说法（保留，因为仍然是平台事实）

**桌面版 DSH 有意在关窗后留在系统托盘。** 官方文案就是这么写的：

- `quitActiveTasks: "当前正在运行的任务将会中断"`
- `backgroundNoticeBody: "正在运行的任务不会中断，可在系统托盘中重新打开窗口"`

也就是说：**有任务在跑时关窗 = 隐藏到托盘继续跑**（不中断任务）；**没有任务在跑时关窗 = 最后一个窗口关闭 → `app.quit()`，完全退出**。

而且**渲染进程里没有任何"退出应用"的 IPC 通道** —— 我把 preload 暴露的通道全列了一遍
（`shortcuts-close-window`、`boot`、`updates-*`、`windows-menu`…），**没有 quit**；
桌面桥 `dshDesktop` 也只有 `browser / deviceInfo / keyboard / shortcuts / updates`。
所以一个网页插件**无法**强制退出主进程 —— 能做的只有关掉自己的窗口。

本插件的做法是**不撒谎**：点「关闭」先给一个确认面板，按实际情况说明会发生什么 ——
有任务在跑就写明"会留在托盘继续跑，完全退出请用托盘的「退出 DeepSeek Harness」"，
没有任务就写明"这是最后一个窗口的话 DSH 会完全退出"。**要强制中断所有任务并彻底退出，就是托盘右键 → 退出**（那里会列出在跑的任务）。

## 4. 关于余额读不出来

余额走官方 Remote：`ctx.remote.account.getBalance(metadata)`，`metadata` 必须带 `version / locale / timezoneOffsetSeconds`。踩过两个坑：

1. **只注入 `remote.account` 不够，必须同时注入 `remote`** —— `remote` 才是命名空间的持有者，
   否则 `ctx.remote` 可能根本不存在（叶子服务解析成功也没用），余额就会静默变成"没有账户接口"。
   现在两个都注入，并且**两种布局都接受**（`ctx.remote.account` 或 `ctx["remote.account"]`）。
2. **失败不能只说"失败"** —— 现在卡片会带上原因码（`no remote.account` / `not ok` / 具体异常消息）
   以及一次 `getState()` 的账户状态，因为"没登录"和"读坏了"要修的东西完全不同。

如果你那边仍然读不出来，卡片现在会告诉你到底是哪一种，把那行字发我即可。

## 5. 关于与 Theme-2001SpaceOdyssey 的隔离

桌宠和锁屏都 portal 到 `document.body`，而主题插件的 token 层和样式表也落在 `<body>` 上 ——
所以"命名空间隔离"不够，**继承**才是漏点：主题把 `--dsw-alias-label-primary` 改成冰蓝并加了文字辉光，
如果桌宠继续 `var(--dsw-...)` 继承，它的设置页和卡片就会跟着变色发光。

现在的做法是**彻底不读主题 token**：整个 bundle 里**一个 `--dsw-*` 都不出现**（自检里就是这么断言的），
四个表面（机器人 / 卡片 / 锁屏 / 设置页）各自重新声明 `color / font-family / font-size / font-weight /
line-height / letter-spacing / text-align / text-shadow / text-transform`。
好处是主题随便换，桌宠长相不变；代价是它也不会跟着主题变 —— 这正是"隔离"的意思。

## 6. 怎么用

| 操作 | 结果 |
| --- | --- |
| 悬停机器人 | 出现工具条：**余额 / 刷新 / 锁屏 / 音效 / 关闭** |
| 双击机器人 | 余额卡片（总额、充值、赠送） |
| 拖动机器人 | 换位置，位置会记住（写进 IndexedDB） |
| 单击「关闭」 | 变成「确认关闭」（4 秒后自动解除） |
| 再点一次「确认关闭」 | 关掉当前窗口；如果这是最后一个窗口，DSH 退出 |
| 「锁屏」 | 盖上欢迎页；单击任意处或按 Esc 解锁 |

**设置 → 桌宠**：提示音四选一 + 试听、立即锁屏、机器人大小（70%~160%）、重置位置、显示/隐藏。

## 7. 几件值得说明的事

**提示音默认不会在刚开窗时响。** 浏览器的自动播放策略要求先有一次用户交互才允许出声。
所以音频上下文是在**第一次 pointerdown / keydown** 时创建并 resume 的 —— 你点过任何地方之后，完成提示音才会响。

**「完成」是怎么判断的。** 客户端没有"任务完成"事件（只有 locale/theme/slots/connection 四个），
所以用座位自带的 `useSessionStatus` 拿整个会话状态表，取 **`running` → 其他** 这个下降沿算一次完成。
状态键是 `running / idle / ready / inactive / provisioning / failed / completed / deleted`，只有 `running` 代表还在干活。

**余额调用的是官方 Remote。** `ctx.remote.account.getBalance(metadata)`，`metadata` 必须带
`version / locale / timezoneOffsetSeconds`（Host 侧有 zod 校验）。值的形状是
`{ ok, value: { status: "ready", value: [{currency, balance}], bonusWallets: [...] } }`，
`null` 表示没有登录账户 —— 卡片会分别显示"未登录 / 无接口 / 读取失败"，不会假装是 0 元。
版本号优先问桌面桥 `dshDesktop.updates.status()`，拿不到才退回包里写的常量。

**拖动机器人不能吃掉按钮的点击。** 这是踩过的坑：拖动要在 `pointerdown` 时 `setPointerCapture`，
可一旦在**按钮上**按下也去捕获，浏览器会把 `pointerup` 重定向到捕获元素（也就是外层包装），
于是 `click` 的目标变成包装而不是按钮 —— **工具条上每个按钮都像死的**。
现在的规则是：按在 `button / input / a` 等控件上**完全不开始拖动**；而且**只在移动超过 4px 之后**才捕获指针。
自检里有 6 条断言**真的驱动** pointerdown/move/up 来守这件事（按控件不捕获、抖动不算拖动、真拖动才捕获、松手要释放）。

**提示音是双向开关，而且不丢状态。** 关掉会记住上一次选的音型，再打开是回到那一型而不是回到默认；
按钮本身用绿/灰两种底色显示当前是开还是关。另外 `hydrate()` 慢一步返回时不会覆盖你刚点的选择
（`touched` 守卫）—— 否则刚打开窗口时快速点一下会被 IndexedDB 的读结果回滚。

**锁屏只是方便，不是安全措施。** 它盖住界面并保留欢迎页，但 DSH 还在后面跑，任何人单击就能解开 —— 这是需求要的行为。
另外遮罩的解锁监听**直接挂在 DOM 节点上**（不是只靠 React 事件），并且万一 React 没能卸载它，节点会自己把自己移除：
一个全屏遮罩如果卡住，窗口就废了。

**机器人是 inline SVG，不是图片。** 眼睛要随状态变色、天线和履带要动，`<img>` 里的 data URI 两样都做不到。
（锁屏背景仍然是内联的 SVG 图片，它不需要动。）

**两个浮动面都 portal 到 `document.body`。** 座位所在的 `shell.overlay` 是 `z-index: 20` 的图层，
压在标题条菜单（1100）之下，画在里面会被自家 chrome 盖住。所以机器人取 9400、锁屏取 9990
（留 9999 给开机动画的遮罩）。

### 触发提示音的四个边沿 + 一个不依赖钩子的兜底

「需要我输入」在状态表里表现为四种变化，全都响（漏一次比多响一次糟）：

1. unning: true → false —— 这一轮跑完了
2. pendingInteraction: false → true —— 有提问在等你
3. completionUnread: false → true —— 有未读的完成
4. **运行中的会话数变少** —— 覆盖"会话直接从快照里消失"这种按 id 遍历看不到的情况

再加一个**完全不依赖状态钩子**的兜底：每 900ms 看一次 composer 的主按钮 ——
它在"正在生成"时是**停止**，一旦不再是停止，就说明轮到你了。
（前两次都是我对状态表的理解错了，所以这一层保证即使钩子缺失或不认识也能响。）
两个触发共用 1.5s 冷却，避免同一轮响两次。

### 提示音不响时怎么查

**设置 → 桌宠**最下面有一行**状态监听**读数：容器类型（应为 map）、会话数、运行中数、等待输入数、已触发次数。

- 数字在动、**已触发在涨** → 监听是好的，问题是音频（系统静音 / 还没拿到手势 / 输出设备）
- 全是 0 → 说明监听没拿到会话状态

## 8. 可调旋钮

都在 `lib/client.js` 顶部：

| 常量 | 作用 |
| --- | --- |
| `WELCOME` | 锁屏上的那行字（当前 `欢迎来到未来`），逐字渲染 |
| `SOUNDS` / `DEFAULT_SOUND` / `SOUND_GAIN` | 提示音选项、默认项、总音量 |
| `CELEBRATE_MS` | 完成后机器人高兴多久（4000ms） |
| `PET_Z` / `LOCK_Z` | 机器人 / 锁屏的层级（9400 / 9990） |
| `DEFAULT_SCALE` / `MIN_SCALE` / `MAX_SCALE` | 机器人大小范围 |
| `DEFAULT_POSITION` / `PET_INSET` | 初始停靠位置与贴边留白 |
| `FALLBACK_CLIENT_VERSION` | 拿不到桌面桥版本号时用的客户端版本 |
| `LOCK_RENDITION` | 锁屏背景（由 `gen-art.mjs` 生成，别手改） |

换锁屏背景：改 `tools/gen-art.mjs` 的场景参数，跑 `node tools/gen-art.mjs`。
机器人本身是 `RobotArt()` 里的 SVG（想改造型直接改那里的路径）。

## 9. 界面说明

- 「关闭」面板宽 320px，四个按钮**会自动换行**（之前 232px 且不换行，按钮会溢出卡片）
- 状态钩子不可用时机器人头上显示橙色**监听不可用**徽标

## 10. 自检

```sh
node tools/check.mjs
```

拿真实的 `lib/client.js` 跑桩环境（假 ModuleLoader / DOM / 无 IndexedDB / 假 slots+shortcuts+remote），断言：

- 身份与增量：loader id = 包名、只 require 基线模块、两个自己的座位、**不覆盖 theme token**
- **真的驱动**：点一次「关闭」**不许关窗**（只许进入待确认），点「余额」**真的调用** `remote.account.getBalance`，
  并且断言传进去的 metadata 形状合法（版本非空、locale 是串、时区是秒且能被 60 整除）
- 机器人：确实是 inline SVG（不是 `<img>`）、眼睛/天线是独立动画部件、`data-mood` 在位、可拖动
- 锁屏：保留 `欢迎来到未来`、逐字渲染、单击解锁、**有 DOM 级兜底移除**、Esc 也能解、层级在机器人之上
- 提示音：四个选项含 off、是合成的（无音频文件）、音频延后到手势、没有 AudioContext 也能活、
  完成判定是 `running → 其他` 的下降沿、off 时不响
- 存储：自己的库名、设置与位置分开、每次读都有默认值
- 样式表：只有一个、全部作用域化、注释闭合、`@supports` 守卫在、reduced-motion 分支在
- 卸载：座位注销、样式表移除、作用域属性还原、音频上下文关闭
- **互不冲突**：与 `Theme-Display-2001SpaceOdyssey`、`Theme-OpenDisplay-Stalker` 逐项比对

## 11. 目录

```
Pet-Robot/
├── package.json          name 与 loader 行 id 都是 dsh-pet-robot
├── cordis.patch.yml      Loader 行（组合包加载入口）
├── lib/
│   ├── index.js          宿主半：空实现，只为让加载器发现这个包
│   └── client.js         客户端半：桌宠、提示音、余额、关闭、锁屏
├── assets/lock-screen.svg    锁屏背景（gen-art.mjs 生成；实际用的是 bundle 里那份 base64）
└── tools/
    ├── gen-art.mjs       生成锁屏背景并回写 bundle
    ├── check.mjs         契约自检
    ├── freeze.mjs        固化安装：打包 + 放进 profile 的 vendor
    └── sync-profile.mjs  开发态同步（识别到固化安装会拒绝执行）
```

## 12. 许可

MIT
