/**
 * 网页版入口：与 src/index.ts 几乎一致，唯一区别是挂载 WebRenderer 而非 TerminalRenderer。
 * 游戏的全部逻辑（指令插件、内容插件、主循环）完全复用，零改动——
 * 这正是「一切皆插件 + 依赖倒置」架构的价值：换渲染层只是换一个插件。
 *
 * 构建/运行见 package.json 的 build:web / web 脚本（用 esbuild 打包为浏览器 ES Module）。
 */
import { Context } from 'cordis'
import './core/types'
import { World } from './core/world'
import { CommandRegistry } from './core/commands'
import { ChoiceUI } from './core/choices'
import { WebRenderer } from './plugins/web-renderer'
import { gameLoop } from './plugins/game-loop'
import { lookCommand } from './plugins/commands/look'
import { goCommand } from './plugins/commands/go'
import { takeCommand } from './plugins/commands/take'
import { inventoryCommand } from './plugins/commands/inventory'
import { useCommand } from './plugins/commands/use'
import { helpCommand } from './plugins/commands/help'
import { quitCommand } from './plugins/commands/quit'
import { greetCommand } from './plugins/commands/greet'
import { mapPlugin } from './plugins/content/map'
import { itemsPlugin } from './plugins/content/items'
import { roomExtrasPlugin } from './plugins/content/room-extras'
import { extrasPlugin } from './plugins/content/extras'

const ctx = new Context()

async function main() {
  // 核心服务
  await ctx.plugin(World)
  await ctx.plugin(CommandRegistry)
  await ctx.plugin(ChoiceUI)
  await ctx.plugin(WebRenderer) // ← 网页渲染层（替换 TerminalRenderer）
  // 指令（每个都是插件）
  await ctx.plugin(lookCommand)
  await ctx.plugin(goCommand)
  await ctx.plugin(takeCommand)
  await ctx.plugin(inventoryCommand)
  await ctx.plugin(useCommand)
  await ctx.plugin(helpCommand)
  await ctx.plugin(quitCommand)
  await ctx.plugin(greetCommand)
  // 内容（地图 / 物品 / 黑暗机制 / 铁箱谜题，每个都是插件）
  await ctx.plugin(mapPlugin)
  await ctx.plugin(itemsPlugin)
  await ctx.plugin(roomExtrasPlugin)
  await ctx.plugin(extrasPlugin)
  // 主循环（依赖 world/renderer/commands，就绪后启动）
  await ctx.plugin(gameLoop)
}

main().catch((e) => {
  console.error(e)
})
