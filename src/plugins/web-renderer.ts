import { Context, Service } from 'cordis'
import type { Renderer, Choice } from '../core/renderer'

/**
 * 网页渲染插件（README「新增渲染层（如网页）」示例）。
 *
 * 同样是 Renderer 接口的一个「具体实现」，只不过把 print/prompt/close 接到 DOM。
 * 在 web.ts 里用 `await ctx.plugin(WebRenderer)` 替换 TerminalRenderer 即可，
 * 游戏的全部逻辑（指令、内容、主循环）一行不改。
 *
 * prompt 通过「挂起一个 Promise，等表单提交时再 resolve」实现异步读入，
 * 完美契合 game-loop 里 `await ctx.renderer.prompt(...)` 的写法。
 */
export class WebRenderer extends Service implements Renderer {
  private out!: HTMLElement
  private actions!: HTMLElement
  private input!: HTMLInputElement
  private pending: ((value: string) => void) | null = null

  constructor(ctx: Context) {
    super(ctx, 'renderer')
    const bind = () => this.bind()
    // 等到 DOM 就绪再绑定元素（脚本可能在 <body> 解析前执行）
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind)
      else bind()
    }
  }

  private bind() {
    const out = document.getElementById('out')
    const actions = document.getElementById('actions')
    const input = document.getElementById('cmd') as HTMLInputElement | null
    const form = document.getElementById('form') as HTMLFormElement | null
    if (!out || !actions || !input || !form) {
      console.error('[WebRenderer] 缺少 #out/#actions/#cmd/#form 元素')
      return
    }
    this.out = out
    this.actions = actions
    this.input = input
    // 鼠标点击选项、或直接在输入框敲指令，都走同一个 resolver
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const value = this.input.value ?? ''
      this.input.value = ''
      this.resolve(value)
    })
  }

  /** 统一结算一次输入（按钮点击 / 手动输入共用） */
  private resolve(value: string) {
    this.clearActions()
    if (this.pending) {
      const done = this.pending
      this.pending = null
      done(value)
    }
  }

  private awaitInput(): Promise<string> {
    return new Promise((resolve) => { this.pending = resolve })
  }

  private clearActions() {
    if (this.actions) this.actions.replaceChildren()
  }

  print(text: string): void {
    if (!this.out) return
    for (const line of text.split('\n')) {
      const p = document.createElement('div')
      p.className = 'line'
      p.textContent = line
      this.out.appendChild(p)
    }
    this.out.scrollTop = this.out.scrollHeight
  }

  prompt(question?: string): Promise<string> {
    if (this.input) {
      this.input.placeholder = question ?? '> '
      this.input.focus()
    }
    return this.awaitInput()
  }

  /** 鼠标可点：把选项渲染成按钮，点一下即等价于输入该指令 */
  async choose(question: string, choices: Choice[]): Promise<string> {
    this.print(question)
    if (this.actions) {
      let lastGroup: string | undefined
      for (const c of choices) {
        // 分组变化时插一个分组标题（如「移动」「拾取」）
        if (c.group && c.group !== lastGroup) {
          const tag = document.createElement('span')
          tag.className = 'group'
          tag.textContent = c.group
          this.actions.appendChild(tag)
        }
        lastGroup = c.group
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'chip'
        btn.textContent = c.label
        btn.addEventListener('click', () => this.resolve(c.command))
        this.actions.appendChild(btn)
      }
    }
    if (this.input) {
      this.input.placeholder = '> 点上方按钮，或直接输入指令'
      this.input.focus()
    }
    const value = await this.awaitInput()
    this.clearActions()
    if (value) this.print(`> ${value}`)
    return value
  }

  close(): void {
    this.pending = null
    this.clearActions()
  }
}
