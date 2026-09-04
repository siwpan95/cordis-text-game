import type { Context } from 'cordis'

/**
 * go 指令插件：前往某个方向。
 * 移动成功后自动 look 新房间。玩家也可直接输入方向（north/n/...）触发本指令。
 */
export const goCommand = {
  name: 'command:go',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'go',
      description: '前往某个方向',
      usage: 'go <north|south|east|west|up|down>',
      aliases: ['move', 'walk'],
      async run(args: string[]) {
        const dir = args[0]
        if (!dir) {
          ctx.renderer.print('用法：go <方向>（north/south/east/west/up/down，或 n/s/e/w/u/d）')
          return
        }
        const r = ctx.world.moveTo(dir)
        if (!r.ok) {
          ctx.renderer.print(r.reason!)
          return
        }
        ctx.renderer.print(`你向${dir}走去……`)
        await ctx.commands.dispatch('look')
      },
    }))
  },
}
