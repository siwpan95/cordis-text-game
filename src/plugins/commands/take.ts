import type { Context } from 'cordis'

/** take 指令插件：拾取地上的物品。 */
export const takeCommand = {
  name: 'command:take',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'take',
      description: '拾取地上的物品',
      usage: 'take <物品>',
      aliases: ['get', 'pick'],
      run(args: string[]) {
        const q = args[0]
        if (!q) {
          ctx.renderer.print('用法：take <物品>')
          return
        }
        const id = ctx.world.findInRoom(q)
        if (!id) {
          ctx.renderer.print(`这里没有「${q}」。`)
          return
        }
        const r = ctx.world.takeItem(id)
        if (!r.ok) {
          ctx.renderer.print(r.reason!)
          return
        }
        ctx.renderer.print(`你拿起了${ctx.world.getItem(id)!.name}。`)
      },
    }))
  },
}
