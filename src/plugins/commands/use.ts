import type { Context } from 'cordis'

/**
 * use 指令插件：使用背包里的物品。
 * 物品是否“有用”由 ItemDef.onUse 决定——把行为数据化、插件化。
 */
export const useCommand = {
  name: 'command:use',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'use',
      description: '使用背包里的物品',
      usage: 'use <物品>',
      aliases: ['u'],
      async run(args: string[]) {
        const q = args[0]
        if (!q) {
          ctx.renderer.print('用法：use <物品>')
          return
        }
        const id = ctx.world.findItem(q)
        if (!id) {
          ctx.renderer.print(`没有「${q}」这件物品。`)
          return
        }
        if (!ctx.world.hasItem(id)) {
          ctx.renderer.print('你身上没有这件物品。')
          return
        }
        const def = ctx.world.getItem(id)!
        if (!def.onUse) {
          ctx.renderer.print(`你试着摆弄${def.name}，但什么也没发生。`)
          return
        }
        await def.onUse(ctx)
      },
    }))
  },
}
