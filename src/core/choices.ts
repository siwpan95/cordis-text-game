import { Context, Service } from 'cordis'
import type { Choice } from './renderer'

/** 方向英文 -> 中文标签（含简写） */
const DIR_LABEL: Record<string, string> = {
  north: '北', south: '南', east: '东', west: '西', up: '上', down: '下',
  n: '北', s: '南', e: '东', w: '西', u: '上', d: '下',
}

/**
 * ChoiceUI：可点击行动选项服务（ctx.choices）。
 *
 * 它本身也是一个插件（extends Service）。选项完全由「当前世界状态 + 事件总线」推导：
 *   房间出口 -> 移动；地上物品 -> 拾取；背包物品 -> 使用；再加一组系统指令。
 * 生成后用 ctx.parallel('choices/collect', ...) 让其它插件增删
 * （例如黑暗机制在漆黑时去掉「拾取」选项），因此新增机制无需改动本文件。
 *
 * 关键：选项只携带 command 字符串，点击 = 把该字符串丢回 commands.dispatch，
 * 与键盘输入走完全相同的链路，游戏逻辑零改动。
 */
export class ChoiceUI extends Service {
  static inject = ['world', 'renderer', 'commands']

  constructor(ctx: Context) {
    super(ctx, 'choices')
  }

  /** 生成当前情境下的可选项 */
  async build(): Promise<Choice[]> {
    const { world } = this.ctx
    const room = world.getRoom(world.currentRoom)
    const choices: Choice[] = []

    // 移动：当前房间的每个出口
    for (const dir of Object.keys(room?.exits ?? {})) {
      choices.push({ group: '移动', label: `向${DIR_LABEL[dir] ?? dir}走`, command: `go ${dir}` })
    }
    // 拾取：当前房间地上「拿得起来」的物品（如铁箱拿不动，就不给按钮）
    for (const id of world.getRoomItems(world.currentRoom)) {
      const def = world.getItem(id)
      if (def?.takeable === false) continue
      choices.push({ group: '拾取', label: `捡起${def?.name ?? id}`, command: `take ${id}` })
    }
    // 使用：背包里「有行为」的物品（无 onUse 的仍可用键盘输入 use 摆弄）
    for (const id of world.inventory()) {
      const def = world.getItem(id)
      if (!def?.onUse) continue
      choices.push({ group: '使用', label: `使用${def.name}`, command: `use ${id}` })
    }
    // 系统指令
    choices.push({ group: '系统', label: '环顾四周', command: 'look' })
    choices.push({ group: '系统', label: '查看背包', command: 'inventory' })
    choices.push({ group: '系统', label: '帮助', command: 'help' })
    choices.push({ group: '系统', label: '退出游戏', command: 'quit' })

    const state = { choices }
    await this.ctx.parallel('choices/collect', state)
    return state.choices
  }

  /** 取下一步行动：渲染器支持 choose 就用鼠标选项，否则回退文本输入 */
  async next(): Promise<string> {
    const choices = await this.build()
    if (this.ctx.renderer.choose) {
      return this.ctx.renderer.choose('请选择行动（也可直接在下方输入指令）：', choices)
    }
    return this.ctx.renderer.prompt('\n> ')
  }
}
