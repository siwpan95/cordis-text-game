import type { Context } from 'cordis'

/**
 * greet 指令插件（README「新增一条指令」示例）。
 *
 * 演示「加一条指令 = 加一个插件」：只需声明用到的服务（inject），
 * 用 ctx.effect 包裹注册，卸载即自动注销。游戏其余代码零改动。
 */
export const greetCommand = {
  name: 'command:greet',
  inject: ['world', 'renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'greet',
      description: '向冒险者问好',
      aliases: ['hi'],
      run() {
        const here = ctx.world.getRoom(ctx.world.currentRoom)
        ctx.renderer.print(`欢迎来到迷雾地窖，冒险者！你正身处【${here?.name ?? '未知之地'}】。`)
      },
    }))
  },
}
