import type { Context } from 'cordis'

/** quit 指令插件：退出游戏（通过事件通知主循环停止）。 */
export const quitCommand = {
  name: 'command:quit',
  inject: ['renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'quit',
      description: '退出游戏',
      aliases: ['exit', 'q'],
      run() {
        ctx.renderer.print('正在退出……')
        ctx.emit('game/quit')
      },
    }))
  },
}
