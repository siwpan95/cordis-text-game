/**
 * 全局类型增强：把我们的服务与自定义事件挂到 Cordis 的 Context / Events 上。
 * 只要本文件被编译进项目（tsconfig 已 include src），增强即对全局生效。
 */
import type { Context } from 'cordis'
import type { World } from './world'
import type { CommandRegistry } from './commands'
import type { Renderer, Choice } from './renderer'
import type { ChoiceUI } from './choices'

declare module 'cordis' {
  interface Context {
    world: World
    renderer: Renderer
    commands: CommandRegistry
    choices: ChoiceUI
  }

  interface Events {
    'game/quit': () => void
    'game/move': (from: string, to: string) => void
    'game/take': (itemId: string) => void
    /** 房间描述聚合：各插件可往 lines 中追加内容（如黑暗、物品、NPC 等） */
    'room/describe': (state: { roomId: string; lines: string[] }) => void
    /** 可点击选项聚合：各插件可往 choices 中增删（如黑暗时去掉「拾取」） */
    'choices/collect': (state: { choices: Choice[] }) => void
  }
}
