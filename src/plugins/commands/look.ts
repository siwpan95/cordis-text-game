import type { Context } from 'cordis'
import { dirLabel } from '../../core/directions'

/**
 * look 指令插件：环顾四周。
 *
 * 房间描述由多部分拼成：房间本身 + 地上物品 + 出口，
 * 另外通过 ctx.parallel('room/describe', ...) 让其它插件（如黑暗机制）
 * 往描述里追加 / 改写内容——这就是 Cordis 事件总线解耦的威力。
 */
export const lookCommand = {
  name: 'command:look',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'look',
      description: '环顾四周，查看当前房间',
      aliases: ['l', 'look around'],
      async run() {
        const room = ctx.world.getRoom(ctx.world.currentRoom)
        if (!room) {
          ctx.renderer.print('你漂浮在虚无之中。')
          return
        }
        const lines: string[] = []
        lines.push(`【${room.name}】`)
        lines.push(room.description)
        const items = ctx.world.getRoomItems(room.id)
        if (items.length) {
          lines.push('地上：' + items.map((id) => ctx.world.getItem(id)?.name ?? id).join('、'))
        }
        const exits = room.exits ? Object.keys(room.exits) : []
        lines.push('出口：' + (exits.length ? exits.map(dirLabel).join('、') : '无'))

        // 交给其它插件补充 / 改写描述
        await ctx.parallel('room/describe', { roomId: room.id, lines })

        ctx.renderer.print(lines.join('\n'))
      },
    }))
  },
}
