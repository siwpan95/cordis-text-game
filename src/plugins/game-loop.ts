import type { Context } from 'cordis'

/**
 * 游戏主循环插件。
 *
 * 它声明依赖 world / renderer / commands，因此只在这三个服务都就绪后才激活。
 * 激活后进入“读取输入 -> 派发指令 -> 输出”的循环，直到收到 game/quit。
 * apply 返回的 disposer 会在插件卸载（例如热更新）时把循环停下来。
 */
export const gameLoop = {
  name: 'system:game-loop',
  inject: ['world', 'renderer', 'commands', 'choices'],
  apply(ctx: Context) {
    let stopped = false
    ctx.on('game/quit', () => { stopped = true })

    ;(async () => {
      ctx.renderer.print('=================================')
      ctx.renderer.print('            迷 雾 地 窖')
      ctx.renderer.print('=================================')
      ctx.renderer.print('输入 help 查看指令，quit 退出游戏。')
      try {
        await ctx.commands.dispatch('look')
      } catch (e) {
        ctx.renderer.print('出错：' + errMsg(e))
      }

      while (!stopped) {
        // 渲染器支持鼠标选项就用选项，否则回退为文本输入（终端/捕获渲染器）
        const input = (await ctx.choices.next()).trim()
        if (!input) continue
        try {
          await ctx.commands.dispatch(input)
        } catch (e) {
          ctx.renderer.print('出错：' + errMsg(e))
        }
      }
      ctx.renderer.print('再见，冒险者！')
      ctx.renderer.close()
    })()

    return () => { stopped = true }
  },
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
