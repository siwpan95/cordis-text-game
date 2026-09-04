import type { Context } from 'cordis'

/**
 * 内容插件：黑暗机制（演示 Cordis 事件总线）。
 *
 * 它监听两类事件：
 *  1) 'room/describe'：房间标记为 dark、且玩家尚未点亮火把时，把描述替换成“一片漆黑”；
 *  2) 'choices/collect'：同样条件下，把「拾取」类可点击选项移除——
 *     看不见的东西，就不该出现在鼠标菜单里。
 * look / go 指令完全不知道黑暗机制的存在——这就是“用事件解耦”的效果：
 * 新增机制 = 新增一个插件，无需改动任何现有代码。
 */
export const roomExtrasPlugin = {
  name: 'content:darkness',
  inject: ['world'],
  apply(ctx: Context) {
    ctx.on('room/describe', (state: { roomId: string; lines: string[] }) => {
      const room = ctx.world.getRoom(state.roomId)
      if (room?.dark && !ctx.world.hasFlag('torch_lit')) {
        state.lines.length = 0
        state.lines.push(`【${room.name}】`)
        state.lines.push('这里一片漆黑，伸手不见五指，你什么也看不见。')
        state.lines.push('（也许需要一点光源？）')
      }
    })

    ctx.on('choices/collect', (state: { choices: { label: string; command: string }[] }) => {
      const room = ctx.world.getRoom(ctx.world.currentRoom)
      if (room?.dark && !ctx.world.hasFlag('torch_lit')) {
        state.choices = state.choices.filter((c) => !c.command.startsWith('take '))
      }
    })
  },
}
