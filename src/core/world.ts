import { Context, Service } from 'cordis'

/** 房间定义（内容插件通过 World.defineRoom 注册） */
export interface Room {
  id: string
  name: string
  description: string
  /** 方向 -> 目标房间 id */
  exits?: Record<string, string>
  /** 是否为黑暗房间（需光源才能看清，见 content:darkness 插件） */
  dark?: boolean
}

/** 物品定义 */
export interface ItemDef {
  id: string
  name: string
  description?: string
  /** 是否可拾取，默认 true */
  takeable?: boolean
  /** 使用时的行为（可触发剧情/解锁等） */
  onUse?: (ctx: Context) => void | Promise<void>
}

/**
 * World：游戏世界状态服务。
 *
 * 它本身也是一个插件（extends Service，挂载后即为 ctx.world）。
 * 房间、物品、玩家进度全部以“可逆副作用”形式写入，因此当对应的
 * 内容插件被卸载时，这些内容会自动从世界里消失。
 */
export class World extends Service {
  private rooms = new Map<string, Room>()
  private items = new Map<string, ItemDef>()
  private roomItems = new Map<string, Set<string>>()
  private player = { currentRoom: '', inventory: [] as string[], flags: new Set<string>() }
  private startRoomId = ''

  constructor(ctx: Context) {
    super(ctx, 'world')
  }

  // ---- 房间 ----
  defineRoom(room: Room): () => void {
    this.rooms.set(room.id, room)
    if (!this.roomItems.has(room.id)) this.roomItems.set(room.id, new Set())
    return () => {
      this.rooms.delete(room.id)
      this.roomItems.delete(room.id)
    }
  }
  getRoom(id: string): Room | undefined {
    return this.rooms.get(id)
  }

  // ---- 物品定义 ----
  defineItem(item: ItemDef): () => void {
    this.items.set(item.id, item)
    return () => { this.items.delete(item.id) }
  }
  getItem(id: string): ItemDef | undefined {
    return this.items.get(id)
  }

  // ---- 物品在房间中的摆放 ----
  placeItem(itemId: string, roomId: string): () => void {
    this.roomItems.get(roomId)?.add(itemId)
    return () => { this.roomItems.get(roomId)?.delete(itemId) }
  }
  getRoomItems(roomId: string): string[] {
    return [...(this.roomItems.get(roomId) ?? [])]
  }

  // ---- 玩家状态 ----
  get currentRoom(): string {
    return this.player.currentRoom
  }
  /** 标记起始房间（内容插件在加载时调用一次） */
  markStart(id: string): void {
    this.startRoomId = id
    if (!this.player.currentRoom) this.player.currentRoom = id
  }
  /** 直接进入某个房间（用于开局） */
  enter(id: string): void {
    this.player.currentRoom = id
  }
  /** 重开：回到起点、清空背包与标记 */
  reset(): void {
    this.player.currentRoom = this.startRoomId
    this.player.inventory = []
    this.player.flags.clear()
  }

  moveTo(direction: string): { ok: boolean; reason?: string } {
    const here = this.rooms.get(this.player.currentRoom)
    if (!here) return { ok: false, reason: '你不在任何房间。' }
    const target = here.exits?.[direction]
    if (!target) return { ok: false, reason: `这个方向（${direction}）没有出口。` }
    const from = this.player.currentRoom
    this.player.currentRoom = target
    this.ctx.emit('game/move', from, target)
    return { ok: true }
  }

  takeItem(itemId: string): { ok: boolean; reason?: string } {
    const here = this.rooms.get(this.player.currentRoom)
    if (here?.dark && !this.player.flags.has('torch_lit')) {
      return { ok: false, reason: '四周太黑了，你什么也摸不到。' }
    }
    const set = this.roomItems.get(this.player.currentRoom)
    if (!set || !set.has(itemId)) return { ok: false, reason: `这里没有「${itemId}」。` }
    const def = this.items.get(itemId)
    if (def && def.takeable === false) return { ok: false, reason: `「${def.name}」拿不起来。` }
    set.delete(itemId)
    this.player.inventory.push(itemId)
    this.ctx.emit('game/take', itemId)
    return { ok: true }
  }

  hasItem(itemId: string): boolean {
    return this.player.inventory.includes(itemId)
  }
  inventory(): string[] {
    return [...this.player.inventory]
  }

  addFlag(flag: string): void {
    this.player.flags.add(flag)
  }
  hasFlag(flag: string): boolean {
    return this.player.flags.has(flag)
  }

  // ---- 名称/别名匹配助手 ----
  private match(query: string, id: string, name?: string): boolean {
    const q = query.toLowerCase()
    return id.toLowerCase() === q || (!!name && name.toLowerCase() === q)
  }
  /** 在所有物品定义中按 id 或名称查找 */
  findItem(query: string): string | undefined {
    for (const [id, def] of this.items) {
      if (this.match(query, id, def.name)) return id
    }
    return undefined
  }
  /** 在当前房间的物品中按 id 或名称查找 */
  findInRoom(query: string, roomId: string = this.player.currentRoom): string | undefined {
    for (const id of this.getRoomItems(roomId)) {
      const def = this.items.get(id)
      if (this.match(query, id, def?.name)) return id
    }
    return undefined
  }
}
