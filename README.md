# DSH_Plugin

[DeepSeek Harness](https://github.com/deepseek-ai) 的插件合集。每个插件一个文件夹，外加仓库根目录里
**一个可以直接安装的 `.tgz`** —— 不 clone、不 build，复制一行命令就能装。

当前包含：

| 插件 | 一句话 | 安装包 |
| --- | --- | --- |
| [**DSH-theme-display-2001SpaceOdyssey**](./Theme-Display-2001SpaceOdyssey) | 《2001 太空漫游》离心机走廊主题：可换底板、彩虹边框、锈铁与黄铜的废土风侧栏、青色会话标题胶囊 | [`DSH-theme-display-2001SpaceOdyssey.tgz`](./DSH-theme-display-2001SpaceOdyssey.tgz) |
| [**DSH-Theme-OpenDisplay-Stalker**](./Theme-OpenDisplay-Stalker) | 开机动画：3 秒序列 + 蓝色科技字「欢迎来到未来」，可上传自己的图，单击鼠标立刻跳过 | [`DSH-Theme-OpenDisplay-Stalker.tgz`](./DSH-Theme-OpenDisplay-Stalker.tgz) |
| [**dsh-pet-robot**](./Pet-Robot) | 桌面宠物废土机器人：任务需要你输入时响提示音 + 冒气泡、双击看余额、锁屏欢迎页、工具栏带**刷新**、以及真正能结束整个 DSH 的按钮 | [`dsh-pet-robot.tgz`](./dsh-pet-robot.tgz) |

三个插件**互不冲突**，可以同时装：不共用类名、`data-dsh-*` 属性、loader id、IndexedDB 库和 z-index 段
（每个插件的自检里都有专门一节逐项比对，并且都断言"和另外两个不冲突"）。

关键词：`DSH` `DeepSeek Harness` `theme` `display plugin` `DSH-theme-display-2001SpaceOdyssey`
`DSH-Theme-OpenDisplay-Stalker` `dsh-pet-robot` `2001 Space Odyssey` `2001太空漫游` `开机动画` `splash`
`boot animation` `主题插件` `废土` `机械迷城` `桌宠` `desktop pet` `锁屏` `lock screen` `余额`

---

## 安装

`dsh plugin add` 后面可以填**四种**东西：包名、GitHub 地址、`.tgz` 直链、本地路径。
按"别人拿到就能装"的方便程度排：

### ① 装最新版（推荐，无需任何账号）

直接拿仓库根目录里那个 `.tgz`：

| 插件 | 文件 |
| --- | --- |
| 2001 太空漫游主题 | [`DSH-theme-display-2001SpaceOdyssey.tgz`](./DSH-theme-display-2001SpaceOdyssey.tgz) |
| 开机动画 | [`DSH-Theme-OpenDisplay-Stalker.tgz`](./DSH-Theme-OpenDisplay-Stalker.tgz) |
| 桌面宠物 | [`dsh-pet-robot.tgz`](./dsh-pet-robot.tgz) |

1. 点开上面对应的文件
2. 页面右上角 **Download raw file**（或右键 **Copy raw file** 复制直链）
3. 装它：

```sh
dsh plugin --profile desktop add <上一步拿到的链接或下载下来的文件路径>
```

> 也可以直接 clone 本仓库，然后 `dsh plugin --profile desktop add ./<文件名>.tgz`。
>
> `.tgz` 直链**不走安装源**，是直接从 GitHub 取的，所以本机能访问 GitHub 即可（国内网络不通时，
> Harness 会提示改用镜像）。想锁定版本就用 tag 的链接。

图形界面同样可以：**设置 → 插件 → 添加插件**，把链接或文件路径粘进去。

### ② 按包名装（需要已发布到 npm）

```sh
dsh plugin --profile desktop add dsh-theme-display-2001-space-odyssey
dsh plugin --profile desktop add dsh-theme-open-display-stalker
dsh plugin --profile desktop add dsh-pet-robot
```

装完在 **设置 → 插件 → 已安装** 里就能看到它，行上自带**启用 / 停用开关**，随时关掉不影响其他插件。

### ③ 本地文件

```sh
dsh plugin --profile desktop add ./DSH-theme-display-2001SpaceOdyssey.tgz
```

### ④ 装完之后

| 插件 | 生效方式 |
| --- | --- |
| 主题、开机动画、桌宠的**界面部分** | **刷新页面**（Ctrl+R） |
| 桌宠的**宿主半**（`/quitdsh` 结束应用命令） | **完整重启一次 Harness** —— 宿主半只在启动时加载，只刷新页面不够 |

三个插件都是**冻结安装**（`file:vendor/<文件名>.tgz` + lockfile 完整性），装完不依赖本仓库、也不依赖任何源码目录。
升级时要先改版本号，否则 `pnpm` 会认为"已是最新"。

---

## 关于"搜到这个名字"

说清楚一件事，免得期望落空：

| 你想要的 | 能不能 | 说明 |
| --- | --- | --- |
| 在插件页输入 `DSH-theme-display-2001SpaceOdyssey` / `DSH-Theme-OpenDisplay-Stalker` / `dsh-pet-robot` 直接解析出插件 | ❌ / ❌ / ⚠️ | 这个名字解析走的是 **npm 源**，而 npm **禁止大写**包名（2017 年起），而且**大小写敏感**（实测 `npm view LODASH` → 404）。前两个驼峰名**不可能**成为 npm 包名；`dsh-pet-robot` 本身合法，但**仍需先发布到 npm** 才能按名解析 |
| 用含这个名字的链接安装 | ✅ | 就是上面 ① —— 文件名本身就带着插件名（`dsh-pet-robot.tgz` 也有对应的包名） |
| 在 GitHub 上搜到它 | ✅ | 仓库描述、topics、README、文件夹名、安装包文件名、`keywords` 全写了这些名字 |
| 输入小写包名安装 | ✅ | 先按 ② 发布到 npm，然后填小写连字符形式 |

结论：**"能被这个名字搜到"靠 GitHub + 文件名，"能被这个名字安装"靠 ① 的直链。**
想做到"输入名字就能装"，只有发布到 npm 一条路，而那时名字必须是小写连字符形式。

---

## 仓库结构

```
DSH_Plugin/
├── README.md                              ← 你在看的这个（插件索引）
├── LICENSE                                ← MIT
├── plugins.json                           ← 插件清单：文件夹 ↔ 安装包名
├── tools/pack-all.mjs                     ← 按清单把每个插件打成根目录的 .tgz
├── Theme-Display-2001SpaceOdyssey/        ← 插件 1（源码 + 自带自检）
│   ├── package.json  lib/  assets/  cordis.patch.yml  tools/  README.md
├── Theme-OpenDisplay-Stalker/             ← 插件 2（同上结构）
├── Pet-Robot/                             ← 插件 3（同上结构 + lib/index.js 宿主半）
├── DSH-theme-display-2001SpaceOdyssey.tgz ← 插件 1 的安装包（已提交，供直链使用）
├── DSH-Theme-OpenDisplay-Stalker.tgz      ← 插件 2 的安装包（已提交）
└── dsh-pet-robot.tgz                      ← 插件 3 的安装包（已提交）
```

约定：

- **一个插件一个文件夹**，文件夹名用短名（`Theme-Display-2001SpaceOdyssey`）
- **安装包放仓库根目录**，文件名用完整的插件名（`DSH-theme-display-2001SpaceOdyssey.tgz`）
- `lib/` 是手写产物、**没有构建步骤**，所以直接提交；`.tgz` 是发行产物，也提交
  （这样 `raw.githubusercontent.com` 的直链永远指向最新版）
- 每个插件自带 `tools/check.mjs`（断言式自检，`node tools/check.mjs` 即可跑），
  以及 `tools/freeze.mjs`（把产物冻进本地 profile 的 `vendor/`，供离线安装与开关）

## 新增一个插件

1. 在仓库根下建文件夹，写好 `package.json`（`name` 小写、`dsh.client.platform: "web"`）和 `lib/`
2. 在 `plugins.json` 的 `plugins` 里加一条（`dir` / `package` / `displayName` / `artifact` / `summary`）
3. 打包：

   ```sh
   node tools/pack-all.mjs            # 全部打包到仓库根
   node tools/pack-all.mjs --check    # 只校验根目录的 .tgz 是否与源码一致
   ```

4. 把新的文件夹 + 新的 `.tgz` 一起提交

每个插件自己的 `README.md` 写技术细节，本文件只做索引。

## 许可

[MIT](./LICENSE)
