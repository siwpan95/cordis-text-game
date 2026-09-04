import type { Context } from 'cordis'

/**
 * 内容插件：物品定义。
 *
 * 物品同样是插件内容。物品可以携带行为（onUse），让“使用”指令产生剧情效果。
 */
export const itemsPlugin = {
  name: 'content:items',
  inject: ['world'],
  apply(ctx: Context) {
    ctx.effect(() => ctx.world.defineItem({
      id: 'torch', name: '火把', takeable: true,
      description: '一支还能用的火把。',
      onUse(c: Context) {
        c.world.addFlag('torch_lit')
        c.renderer.print('你点亮了火把，四周亮了起来。')
      },
    }))

    ctx.effect(() => ctx.world.defineItem({
      id: 'treasure', name: '闪亮金币', takeable: true,
      description: '一枚沉甸甸、闪着光的金币。',
    }))

    // 金币藏在地窖
    ctx.effect(() => ctx.world.placeItem('treasure', 'cellar'))
  },
}
