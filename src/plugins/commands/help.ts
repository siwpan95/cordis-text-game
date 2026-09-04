import type { Context } from 'cordis'

/** help 指令插件：列出所有已注册指令（即所有指令插件）。 */
export const helpCommand = {
  name: 'command:help',
  inject: ['renderer', 'commands'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.commands.register({
      name: 'help',
      description: '查看所有可用指令',
      aliases: ['h', '?'],
      run() {
        const cmds = ctx.commands.list().sort((a, b) => a.name.localeCompare(b.name))
        ctx.renderer.print('可用指令：')
        for (const c of cmds) {
          const al = c.aliases && c.aliases.length ? `（别名：${c.aliases.join('/')}）` : ''
          ctx.renderer.print(`  ${c.name} ${al}\n    ${c.description}`)
        }
      },
    }))
  },
}
