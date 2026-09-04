import { Context, Service } from 'cordis'
import type { Renderer, Choice } from '../core/renderer'
import * as readline from 'node:readline'

/**
 * 终端渲染插件。
 *
 * 这是 Renderer 的一种“具体实现”。它也是一个插件：挂载后即为 ctx.renderer。
 * 想支持网页，只需另写一个 WebRenderer 插件（用 DOM 实现 print/prompt），
 * 在入口处换成 await ctx.plugin(WebRenderer) 即可，其余代码零改动。
 */
export class TerminalRenderer extends Service implements Renderer {
  private rl: readline.Interface

  constructor(ctx: Context) {
    super(ctx, 'renderer')
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY ?? false,
    })
  }

  print(text: string): void {
    process.stdout.write(text + '\n')
  }

  prompt(question?: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question ?? '', (answer) => resolve(answer))
    })
  }

  /** 终端没有鼠标，降级为「编号菜单」：输入编号选，或直接照常输入指令 */
  async choose(question: string, choices: Choice[]): Promise<string> {
    this.print(question)
    let lastGroup: string | undefined
    choices.forEach((c, i) => {
      if (c.group && c.group !== lastGroup) this.print(`[${c.group}]`)
      lastGroup = c.group
      this.print(`  ${i + 1}. ${c.label}`)
    })
    this.print('（输入编号选择，或直接输入指令，回车跳过）')
    const answer = (await this.prompt('\n> ')).trim()
    if (!answer) return ''
    const n = Number(answer)
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) return choices[n - 1].command
    return answer
  }

  close(): void {
    this.rl.close()
  }
}
