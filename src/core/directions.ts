/**
 * 方向键 -> 中文标签。房间 exits 的键存的是英文（north/up…），
 * 但展示给玩家要本地化为「北/上」。集中在此，look / go / 选项 UI 共用同一份，
 * 避免「按钮显示『向北走』、出口却写『north』」这类不一致。
 */
export const DIR_LABEL: Record<string, string> = {
  north: '北', south: '南', east: '东', west: '西', up: '上', down: '下',
  n: '北', s: '南', e: '东', w: '西', u: '上', d: '下',
}

/** 取方向的中文标签，未知方向原样返回（同时兼容 n/s/e/w 等简写） */
export function dirLabel(dir: string): string {
  return DIR_LABEL[dir] ?? dir
}
