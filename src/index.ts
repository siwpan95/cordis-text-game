import { Context } from 'cordis'
import './core/types'
import { World } from './core/world'
import { CommandRegistry } from './core/commands'
import { ChoiceUI } from './core/choices'
import { TerminalRenderer } from './plugins/terminal-renderer'
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

/**
 * 入口：创建一个 Cordis 根 Context，按“一切皆插件”的方式把各能力挂载上去。
 *
 * 挂载顺序上，依赖方（如 game-loop）在其依赖（world/renderer/commands）
 * 之后挂载；其实 Cordis 会按 inject 依赖图自动编排激活顺序，这里只是显式表达意图。
 */
const ctx = new Context()

async function main() {
  // 核心服务
  await ctx.plugin(World)
  await ctx.plugin(CommandRegistry)
  await ctx.plugin(ChoiceUI)
  await ctx.plugin(TerminalRenderer)
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
  process.exit(1)
})
