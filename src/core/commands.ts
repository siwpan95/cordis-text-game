import { Context, Service } from 'cordis'

/** 一条指令的定义。每个指令本身就是一个插件向注册表注册的“内容”。 */
export interface Command {
  name: string
  description: string
  usage?: string
  aliases?: string[]
  run(args: string[]): void | Promise<void>
}

/** 可作为“方向”的简写，让玩家直接输入 north / n 等即可移动 */
const DIRECTIONS = new Set(['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd'])

/**
 * CommandRegistry：指令注册表服务（ctx.commands）。
 *
 * 所有指令都通过 register() 注册进来；register 返回一个 disposer，
 * 指令插件用 ctx.effect 包裹它，从而实现“卸载插件 = 注销指令”。
 */
export class CommandRegistry extends Service {
  private commands = new Map<string, Command>()

  // 声明对 renderer 的依赖：指令未就绪前不会激活，且能安全访问 ctx.renderer
  static inject = ['renderer']

  constructor(ctx: Context) {
    super(ctx, 'commands')
  }

  /** 注册指令（含别名）。返回注销函数。 */
  register(cmd: Command): () => void {
    const names = [cmd.name, ...(cmd.aliases ?? [])]
    for (const n of names) this.commands.set(n, cmd)
    return () => {
      for (const n of names) {
        if (this.commands.get(n) === cmd) this.commands.delete(n)
      }
    }
  }

  get(name: string): Command | undefined {
    return this.commands.get(name)
  }
  has(name: string): boolean {
    return this.commands.has(name)
  }
  /** 去重后的指令列表（用于 help） */
  list(): Command[] {
    return [...new Set(this.commands.values())]
  }

  /** 解析并派发一行玩家输入 */
  async dispatch(input: string): Promise<void> {
    const tokens = input.trim().split(/\s+/).filter(Boolean)
    if (!tokens.length) return
    let [verb, ...args] = tokens
    let cmd = this.commands.get(verb)
    // 直接输入方向（north/n/...）时，路由到 go 指令
    if (!cmd && DIRECTIONS.has(verb)) {
      args = [verb]
      cmd = this.commands.get('go')
    }
    if (!cmd) {
      this.ctx.renderer.print(`未知指令：「${verb}」。输入 help 查看可用指令。`)
      return
    }
    await cmd.run(args)
  }
}
