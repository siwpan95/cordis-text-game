/**
 * 终端版端到端测试：把游戏当子进程跑起来，交替用「编号」和「直接打字」喂输入。
 *
 * 覆盖 smoke.ts 覆盖不到的交互路径——TerminalRenderer.choose 的编号菜单、文本兜底、退出流程。
 * 用「等待输出出现标记」代替固定 sleep，避免时序抖动导致的假失败。
 *
 * 用法：npm run e2e
 */
import { spawn } from 'node:child_process'

/** 每回合行动选项区块的标记，出现一次 = 游戏在等一次输入 */
const PROMPT_MARK = '（输入编号选择，或直接输入指令，回车跳过）'

/** 依次执行：数字=点编号菜单，其它=直接输入指令 */
const script = [
  '2',              // 庭院：捡起火把
  '1',              // 向北 -> 大厅
  '2',              // 大厅：向下 -> 地窖
  '2',              // 地窖（黑）：使用火把
  '3',              // 地窖（亮）：捡起锈钥匙
  'take treasure',  // 直接打字：拿金币
  'use key',        // 直接打字：开箱
  'quit',           // 退出
]

/** 期望在全部输出中出现的断言（验证编号菜单与文本输入都生效） */
const expectations = [
  ['编号菜单出现', PROMPT_MARK],
  ['编号2捡到火把', '你拿起了火把。'],
  ['编号1走到大厅', '【昏暗的大厅】'],
  ['编号2下到地窖', '这里一片漆黑'],
  ['编号2点亮火把', '你点亮了火把'],
  ['编号3捡到锈钥匙', '你拿起了锈钥匙。'],
  ['文本输入拿到金币', '你拿起了闪亮金币。'],
  ['文本输入开箱', '铁箱弹开'],
  ['退出流程正常', '再见，冒险者！'],
]

const child = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: process.cwd(),
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
})

let out = ''
child.stdout.on('data', (d) => { out += d.toString() })
child.stderr.on('data', (d) => { out += d.toString() })

const countMarks = () => out.split(PROMPT_MARK).length - 1
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitFor(fn, timeoutMs = 20000) {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > timeoutMs) throw new Error('等待超时：游戏未按预期输出')
    await wait(50)
  }
}

async function main() {
  // 等首屏第一回合选项出现
  await waitFor(() => countMarks() >= 1 || out.includes('再见，冒险者！'))
  for (let i = 0; i < script.length; i++) {
    await waitFor(() => countMarks() >= i + 1 || out.includes('再见，冒险者！'))
    child.stdin.write(script[i] + '\n')
  }
  await waitFor(() => out.includes('再见，冒险者！'), 8000)
  child.kill()

  const failed = expectations.filter(([, text]) => !out.includes(text))
  for (const [name, text] of expectations) {
    console.log(`  ${out.includes(text) ? '✓' : '✗'} ${name}`)
  }
  if (failed.length) {
    console.error(`\n❌ e2e 失败：${failed.length} 项断言未通过`)
    for (const [name, text] of failed) console.error(`   - ${name}（缺少「${text}」）`)
    process.exit(1)
  }
  console.log(`\n✅ 终端版 e2e 通过（编号菜单 + 文本输入 + 退出，共 ${script.length} 步）`)
  process.exit(0)
}

main().catch((e) => {
  child.kill()
  console.error('❌ e2e 异常：', e.message)
  console.error(out.slice(-1500))
  process.exit(1)
})
