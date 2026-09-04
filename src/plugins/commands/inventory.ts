import type { Context } from 'cordis'

/** inventory 指令插件：查看背包。 */
export const inventoryCommand = {
  name: 'command:inventory',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'inventory',
      description: '查看背包里的物品',
      aliases: ['inv', 'i'],
      run() {
        const inv = ctx.world.inventory()
        if (!inv.length) {
          ctx.renderer.print('你的背包空空如也。')
          return
        }
        ctx.renderer.print('背包里有：' + inv.map((id) => ctx.world.getItem(id)!.name).join('、'))
      },
    }))
  },
}
