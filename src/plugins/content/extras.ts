import type { Context } from 'cordis'

/**
 * 内容插件：铁箱谜题（演示「扩展游戏内容 = 加一个内容插件」，且机制互相解耦）。
 *
 * 地窖描述里提到「墙角有一只铁箱」，原示例剧情没真正与之交互。本插件补上：
 *   - 锈钥匙：地窖里，点亮后可见可捡
 *   - 铁箱：不可拾取，仅作场景陈设（look 可见）
 *   - 璀璨宝石：藏在铁箱里，用锈钥匙（use key）开箱后才出现
 *
 * 关键设计：开箱动作挂在「锈钥匙」的 onUse 上，玩家需先把钥匙拿进背包再用。
 * 这与引擎的 `use` 语义一致（use = 使用背包里的物品），无需改动任何指令源码。
 * 与黑暗机制的协作：地窖 dark 时 takeItem 直接失败，必须先 `use torch` 点亮，
 * 钥匙与铁箱才可见可交互——本插件完全不关心黑暗，全靠事件/状态解耦。
 *
 * 全部通过 World 的可逆副作用写入：卸载本插件 → 钥匙/铁箱/宝石自动从世界消失。
 */
export const extrasPlugin = {
  name: 'content:extras',
  inject: ['world'],
  apply(ctx: Context) {
    // 铁箱：不可拾取，留在原地作场景陈设
    ctx.effect(() => ctx.world.defineItem({
      id: 'chest', name: '铁箱', takeable: false,
      description: '一只沉重的铁箱，锁孔里卡着锈迹。',
    }))
    ctx.effect(() => ctx.world.placeItem('chest', 'cellar'))

    // 锈钥匙：地窖里，点亮后可见可捡；onUse 负责开箱
    ctx.effect(() => ctx.world.defineItem({
      id: 'key', name: '锈钥匙', takeable: true,
      description: '一把锈迹斑斑的铜钥匙，似乎能开什么锁。',
      onUse(c: Context) {
        if (c.world.currentRoom !== 'cellar') {
          c.renderer.print('这里没有可以开的铁箱。')
          return
        }
        if (c.world.hasFlag('chest_opened')) {
          c.renderer.print('铁箱已经空了。')
          return
        }
        c.world.addFlag('chest_opened')
        c.world.placeItem('gem', 'cellar')
        c.renderer.print('你蹲下身，把锈钥匙捅进铁箱锁孔——咔的一声，铁箱弹开，里面躺着一颗【璀璨宝石】！')
      },
    }))
    ctx.effect(() => ctx.world.placeItem('key', 'cellar'))

    // 璀璨宝石：开箱后才出现
    ctx.effect(() => ctx.world.defineItem({
      id: 'gem', name: '璀璨宝石', takeable: true,
      description: '一颗在黑暗中也微微发光的宝石。',
    }))
  },
}
