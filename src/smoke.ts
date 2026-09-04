/**
 * 非交互式冒烟测试：用一个“捕获输出”的渲染器替代终端渲染器，
 * 脚本化跑一遍完整流程，验证引擎与插件协作是否正确。
 *
 * 运行：npm run smoke   （见 package.json 中脚本）
 */
import { Context, Service } from 'cordis'
import type { Renderer } from './core/renderer'
import './core/types'
import { World } from './core/world'
import { CommandRegistry } from './core/commands'
import { ChoiceUI } from './core/choices'
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

/** 把渲染输出收集到数组里，便于断言（这本身也是一个 Renderer 插件！） */
class CaptureRenderer extends Service implements Renderer {
  lines: string[] = []
  constructor(ctx: Context) {
    super(ctx, 'renderer')
  }
  print(t: string) {
    this.lines.push(t)
  }
  async prompt() {
    return ''
  }
  close() {}
}

const ctx = new Context()

async function main() {
  await ctx.plugin(World)
  await ctx.plugin(CommandRegistry)
  await ctx.plugin(ChoiceUI)
  await ctx.plugin(CaptureRenderer)
  await ctx.plugin(lookCommand)
  await ctx.plugin(goCommand)
  await ctx.plugin(takeCommand)
  await ctx.plugin(inventoryCommand)
  await ctx.plugin(useCommand)
  await ctx.plugin(helpCommand)
  await ctx.plugin(quitCommand)
  await ctx.plugin(greetCommand)
  await ctx.plugin(mapPlugin)
  await ctx.plugin(itemsPlugin)
  await ctx.plugin(roomExtrasPlugin)
  await ctx.plugin(extrasPlugin)

  const cap = ctx.renderer as CaptureRenderer
  const dump = (label: string) => {
    console.log(`\n===== ${label} =====`)
    console.log(cap.lines.join('\n'))
    cap.lines.length = 0
  }
  /** 打印当前情境下「鼠标可点」的选项（即网页版按钮、终端版编号菜单的内容） */
  const showChoices = async (label: string) => {
    const cs = await ctx.choices.build()
    console.log(`\n----- ${label} · 可点选项 -----`)
    console.log(cs.map((c) => `${c.group ? `${c.group}/` : ''}${c.label}[${c.command}]`).join('  '))
    return cs
  }

  await ctx.commands.dispatch('look'); dump('起始房间 look')
  await showChoices('起始房间（庭院）')
  await ctx.commands.dispatch('greet'); dump('greet 示例指令')
  await ctx.commands.dispatch('take torch'); dump('take torch')
  await ctx.commands.dispatch('inventory'); dump('inventory')
  await ctx.commands.dispatch('go north'); dump('go north -> 大厅')
  await ctx.commands.dispatch('down'); dump('down -> 地窖（黑暗）')
  const darkChoices = await showChoices('黑暗地窖（不应出现拾取项）')
  console.log('  → 含「拾取」选项？', darkChoices.some((c) => c.command.startsWith('take ')))
  await ctx.commands.dispatch('take treasure'); dump('黑暗中拿金币（应失败）')
  await ctx.commands.dispatch('use torch'); dump('use torch（点亮）')
  await ctx.commands.dispatch('look'); dump('点亮后 look 地窖')
  await ctx.commands.dispatch('take treasure'); dump('take treasure')
  await ctx.commands.dispatch('use key'); dump('use key（未拾取，应提示没带在身上）')
  const litChoices = await showChoices('点亮后地窖（应出现拾取项）')
  const takeKey = litChoices.find((c) => c.command === 'take key')!
  await ctx.commands.dispatch(takeKey.command); dump(`点击「${takeKey.label}」（用选项代替文本输入）`)
  await ctx.commands.dispatch('use key'); dump('use key（开箱）')
  await ctx.commands.dispatch('take gem'); dump('take gem')
  await ctx.commands.dispatch('xyzzy'); dump('未知指令')
  await ctx.commands.dispatch('up'); dump('up -> 大厅')

  console.log('\n最终状态：')
  console.log('  当前房间 =', ctx.world.currentRoom)
  console.log('  背包 =', ctx.world.inventory().map((id) => ctx.world.getItem(id)!.name))
  console.log('  torch_lit 标记 =', ctx.world.hasFlag('torch_lit'))
  console.log('  chest_opened 标记 =', ctx.world.hasFlag('chest_opened'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
