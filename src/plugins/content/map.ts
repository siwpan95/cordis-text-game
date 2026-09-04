import type { Context } from 'cordis'

/**
 * 内容插件：地图（房间）。
 *
 * 注意——地图也是“插件”。想换一张图，只要写一个 map 插件并挂载，
 * 旧地图随插件卸载而自动消失。本示例是一段「迷雾地窖」迷你冒险。
 */
export const mapPlugin = {
  name: 'content:map',
  inject: ['world'],
  apply(ctx: Context) {
    ctx.world.markStart('start')

    ctx.effect(() => ctx.world.defineRoom({
      id: 'start', name: '残破的庭院',
      description: '月光洒在长满荒草的庭院里，北面有一扇半开的木门。',
      exits: { north: 'hall' },
    }))

    ctx.effect(() => ctx.world.defineRoom({
      id: 'hall', name: '昏暗的大厅',
      description: '大厅中央塌了一角，地上散落着碎砖。南边是来时的庭院，地面有个通往地下的楼梯。',
      exits: { south: 'start', down: 'cellar' },
    }))

    ctx.effect(() => ctx.world.defineRoom({
      id: 'cellar', name: '地窖', dark: true,
      description: '阴冷的地窖，墙角有一只铁箱，隐约闪着微光。',
      exits: { up: 'hall' },
    }))

    // 庭院里放着一支火把
    ctx.effect(() => ctx.world.placeItem('torch', 'start'))
  },
}
