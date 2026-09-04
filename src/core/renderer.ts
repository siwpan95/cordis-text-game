/**
 * 渲染层抽象接口。
 *
 * 整个游戏只通过 ctx.renderer 与外界交互（输出文字 / 读取输入）。
 * 具体实现是一个“插件”：终端版用 Node readline，网页版可以另写一个
 * WebRenderer 插件并替换挂载即可——游戏其余部分完全不用改动。
 */
/** 一个可点击/可选的操作项：点了等价于输入 command */
export interface Choice {
  label: string
  command: string
  /** 分组名（如「移动」「拾取」），渲染器可据此分块展示；可省略 */
  group?: string
}

export interface Renderer {
  /** 输出一行（或多行）文字 */
  print(text: string): void
  /** 向玩家索取一行输入 */
  prompt(question?: string): Promise<string>
  /** 关闭底层资源（如 readline），让进程可以自然退出 */
  close(): void
  /**
   * 可选能力：鼠标可选的行动菜单。
   * 未实现时（或渲染器不支持时）上层自动回退到 prompt 文本输入，
   * 因此终端/捕获渲染器无需实现也能正常玩。
   */
  choose?(question: string, choices: Choice[]): Promise<string>
}
