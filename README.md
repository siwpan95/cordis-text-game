# Cordis 文字游戏（迷雾地窖）

## 仓库角色定位（投资组合分级 ①）

> 本仓在 siwpan 投资组合（D:/projects/repos，共 133 仓）中定级为 **① 核心推进**，领域 **游戏引擎/框架**，定位 **引擎平台层**。
> **角色**：Cordis 文字冒险引擎样例，随 cordis 维护。
> **维护策略**：① 核心推进——持续投入、不允许冻结；随所属收敛点 / 流水线长期演进。
> 投资组合统一分级索引：`D:/projects/repos/PORTFOLIO_TIERING.md`。

一个基于 [Cordis](https://github.com/cordiverse/cordis) 的「**一切皆插件**」文字冒险引擎示例。

核心思想：引擎本身只负责“把插件编排起来”——房间、物品、指令、渲染层、甚至黑暗机制，全是可装卸的插件。换一张地图、加一条指令、把终端换成网页，都只是“挂/卸一个插件”的事，无需改动任何核心代码。

## 运行

```bash
npm install
npm start          # 启动交互式文字游戏（在终端里玩）
npm run dev        # 同 start，但带热重载（tsx watch）
npm run smoke      # 非交互式冒烟测试，端到端验证引擎
npm run e2e        # 终端版端到端测试：编号菜单 + 文本输入 + 退出流程
npm run build      # tsc 类型检查 + 产出 dist/
npm run build:web  # 用 esbuild 把网页版打包为 public/game.js
npm run web        # 构建网页版并启动本地静态服务（http://localhost:8080）
```

> 终端交互需在真实终端（TTY）中进行；`smoke` 用内置的“捕获渲染器”跑完整流程，适合 CI / 验证。
> 网页版打开后即为同一套引擎，只是渲染层换成 `WebRenderer`，游戏逻辑零改动。

## 玩法（示例剧情）

你身处「残破的庭院」，北面是大厅，大厅有通往地窖的楼梯。地窖一片漆黑，需要先捡起火把并 `use torch` 点亮，才能看清并取走「闪亮金币」。地窖墙角还有一只铁箱：捡起「锈钥匙」后 `use key` 可开箱，取出「璀璨宝石」。

指令：`look`(l) · `go <方向>`(move) · `take <物品>`(get) · `inventory`(i) · `use <物品>`(u) · `greet` · `help`(h) · `quit`(q)。
也可以直接输入方向（`north`/`n`/`down`…）移动。

**不想打字？** 网页版每回合会直接给出可点击按钮（鼠标点一下即可行动，输入框仍可手动输入指令）；终端版则降级为「编号菜单」——输入编号选择，或照常直接输入指令。详见下方「鼠标可点选项」。

## 目录结构

```
cordis-text-game/
├─ src/
│  ├─ index.ts                 # 入口：创建 Context，按依赖挂载全部插件
│  ├─ web.ts                   # 网页版入口：与 index.ts 同构，仅换用 WebRenderer
│  ├─ smoke.ts                 # 非交互冒烟测试（用 CaptureRenderer 替代终端）
│  ├─ core/                    # 核心“服务”插件（仍是插件）
│  │  ├─ renderer.ts           #   Renderer 接口（渲染层抽象 + 可选 choose 能力）
│  │  ├─ world.ts              #   World 服务：房间/物品/玩家状态
│  │  ├─ commands.ts           #   CommandRegistry 服务：指令注册表
│  │  ├─ choices.ts            #   ChoiceUI 服务：按世界状态生成可点击选项
│  │  └─ types.ts              #   全局类型增强（把服务/事件挂到 Context 上）
│  ├─ plugins/
│  │  ├─ terminal-renderer.ts  # 渲染层插件：终端实现（Node readline）
│  │  ├─ web-renderer.ts       # 渲染层插件：网页实现（DOM，print/prompt/choose）
│  │  ├─ game-loop.ts          # 系统插件：读取输入→派发→输出 主循环
│  │  ├─ commands/             # 指令插件（每个文件 = 一个指令）
│  │  │  ├─ look.ts  go.ts  take.ts  inventory.ts  use.ts  help.ts  quit.ts  greet.ts
│  │  └─ content/              # 内容插件（游戏数据也是插件）
│  │     ├─ map.ts             #   房间地图
│  │     ├─ items.ts           #   物品定义（可带 onUse 行为）
│  │     ├─ room-extras.ts     #   黑暗机制（演示事件总线解耦）
│  │     └─ extras.ts          #   铁箱谜题（锈钥匙 + 铁箱 + 璀璨宝石）
├─ public/
│  └─ index.html               # 网页版页面（构建产物 game.js 也输出到这里，已 gitignore）
└─ scripts/
   ├─ serve.mjs                # 极简无依赖静态服务器（npm run web 用）
   └─ e2e-terminal.mjs         # 终端版端到端测试（npm run e2e 用）
```

## 架构要点（Cordis 三板斧）

1. **`Context` 是服务容器**：`new Context()` 自动装载 `events/logger/reflect/registry/fiber`。各能力通过 `ctx.<服务名>` 获取，而非 `import` 具体实现——依赖倒置，换实现零改动。
2. **`inject` 声明依赖**：插件用 `inject: ['world','commands']` 声明所需服务，Cordis 自动按依赖图编排激活顺序，依赖未就绪就等待，依赖消失自动卸载/重载。
3. **`effect` 可逆副作用**：所有注册（`ctx.provide` / `ctx.commands.register` / `ctx.on`）都通过 `ctx.effect(...)` 进行，**插件卸载时自动按逆序回滚**——没有内存泄漏，没有手动清理。

## 如何扩展（加东西 = 加插件）

### 1. 新增一条指令

新建 `src/plugins/commands/greet.ts`：

```ts
import type { Context } from 'cordis'

export const greetCommand = {
  name: 'command:greet',
  inject: ['world', 'renderer', 'commands'],  // 用到的服务都要声明
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'greet',
      description: '向冒险者问好',
      run() {
        ctx.renderer.print('欢迎来到迷雾地窖！')
      },
    }))
  },
}
```

然后在入口（`index.ts` 终端版 / `web.ts` 网页版）里 `await ctx.plugin(greetCommand)` 即可。卸载该插件，指令自动消失。

### 2. 新增一个渲染层（如网页）

实现同一个 `Renderer` 接口，把 `print`/`prompt`/`close` 接到 DOM（`choose` 是可选的鼠标能力）：

```ts
export class WebRenderer extends Service implements Renderer {
  private pending: ((value: string) => void) | null = null

  constructor(ctx: Context) { super(ctx, 'renderer') }

  print(text: string) {
    // 往 #out 里追加一行（用 textContent 而非 innerHTML，天然防 XSS）
  }

  // 关键：挂起一个 Promise，等玩家回车或点按钮时再 resolve
  prompt(q?: string) {
    return new Promise<string>((resolve) => { this.pending = resolve })
  }

  // 可选能力：把选项渲染成可点按钮，点击 = resolve(该选项的 command)
  async choose(q: string, choices: Choice[]) {
    return this.prompt(q)
  }

  close() { this.pending = null }
}
```

入口换成 `await ctx.plugin(WebRenderer)` 即可，游戏逻辑一行不改（完整实现见
`src/plugins/web-renderer.ts`，网页入口见 `src/web.ts`——它与 `index.ts` 的唯一区别就是这一行）。

### 3. 新增内容（房间 / 物品）

内容也是插件：`inject: ['world']` 后调用 `ctx.world.defineRoom(...)` / `defineItem(...)`，同样用 `ctx.effect` 包裹以便可逆。换剧情=换内容插件。

### 4. 用事件总线解耦机制（如更多环境效果）

监听 `room/describe` 往描述里追加内容，或监听 `game/move` 做触发，全程不碰 `look`/`go` 源码：

```ts
ctx.on('room/describe', (state) => {
  if (ctx.world.hasFlag('raining')) state.lines.push('（外面正下着雨。）')
})
```

## 鼠标可点选项（choose 能力）

核心思路：**点击 = 生成一行指令文本**，与键盘输入走完全相同的 `commands.dispatch` 链路，游戏逻辑零改动。

1. `Renderer` 接口多了个**可选**方法 `choose(question, choices)`。渲染器支持就出按钮，不支持则自动回退到 `prompt` 文本输入——所以终端/捕获渲染器不实现也能正常玩。
   - `WebRenderer`：渲染成一排可点按钮，输入框仍可手动敲指令，两者共用同一个 resolver。
   - `TerminalRenderer`：降级为编号菜单（输入编号选择，或直接输入指令）。
2. `ChoiceUI` 服务（`ctx.choices`）按**当前世界状态**推导选项，并按「移动 / 拾取 / 使用 / 系统」分组：
   - 移动：房间出口；拾取：地上拿得动的物品（`takeable: false` 的不出按钮，避免死选项）；
   - 使用：背包里有 `onUse` 的物品；系统：look / inventory / help / quit。
   网页版渲染成分组标题 + 一排按钮，终端版打印 `[组名]` 后列出编号。
3. 选项通过事件总线聚合，机制插件可增删。例如黑暗机制监听 `choices/collect`，漆黑时移除「拾取」项——看不见的东西不该点得到：

```ts
ctx.on('choices/collect', (state) => {
  const room = ctx.world.getRoom(ctx.world.currentRoom)
  if (room?.dark && !ctx.world.hasFlag('torch_lit')) {
    state.choices = state.choices.filter((c) => !c.command.startsWith('take '))
  }
})
```

主循环只改了一行：`await ctx.renderer.prompt(...)` → `await ctx.choices.next()`。

## 已知说明

- 当前使用官方 `cordis@4.0.0-rc.9`（rc 阶段，API 可能微调；本项目已以实际类型定义为准）。
- `rc` 版 `waterfall` 事件会丢失初始值，本工程统一用 `parallel` + 共享数组做聚合（见 `look` 指令与 `room-extras`）。
