import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { transform } from 'esbuild'
import { createRenderer, defineComponent, h, reactive, nextTick } from 'vue'
import { getProductInnerCodes, validateProductInnerCodes } from '../productInnerCodes.js'

test('兼容旧产品，复制编号数组，避免未保存编辑污染原始资料', () => {
  assert.deepEqual(getProductInnerCodes({ innerId: 'A' }), ['A'])
  const product = { innerIds: ['A', 'B'] }
  const draft = getProductInnerCodes(product)
  draft.push('C')
  assert.deepEqual(product.innerIds, ['A', 'B'])
})

test('校验空行、重号、长度、换行和表情；保留大小写及前导零', () => {
  const validate = values => {
    let error
    validateProductInnerCodes(null, values, value => { error = value })
    return error
  }
  for (const invalid of [[], [''], ['A', ' A '], ['A'.repeat(51)], ['A\nB'], ['😀']]) {
    assert.ok(validate(invalid), JSON.stringify(invalid))
  }
  assert.equal(validate(['001', 'Abc', 'abc', 'A,B']), undefined)
})

// 编译真实 SFC，在 Vue 自定义渲染器中验证组件事件，不依赖浏览器或 jsdom。
const filename = new URL('../../views/production/component/InnerCodeEditor.vue', import.meta.url)
const { descriptor } = parse(await readFile(filename, 'utf8'))
const script = compileScript(descriptor, { id: 'inner-code-test', inlineTemplate: true })
let { code } = await transform(script.content, { loader: 'ts', format: 'esm' })
const require = createRequire(import.meta.url)
code = code.replace(/from ["']vue["']/g, `from ${JSON.stringify(pathToFileURL(require.resolve('vue')).href)}`)
const Editor = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default

function mountEditor(initial, lockPrimary) {
  const renderer = createRenderer({
    createElement: type => ({ type, children: [], props: {}, parent: null }),
    createText: text => ({ type: 'text', text }),
    createComment: text => ({ type: 'comment', text }),
    setText: (node, text) => { node.text = text },
    setElementText: (node, text) => { node.children = [{ type: 'text', text }] },
    patchProp: (node, key, _old, value) => { node.props[key] = value },
    insert: (node, parent, anchor) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      node.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index < 0) parent.children.push(node)
      else parent.children.splice(index, 0, node)
    },
    remove: node => { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1) },
    parentNode: node => node.parent,
    nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1],
  })
  const state = reactive({ codes: [...initial] })
  const app = renderer.createApp({ render: () => h(Editor, {
    modelValue: state.codes, lockPrimary, 'onUpdate:modelValue': value => { state.codes = value },
  }) })
  app.component('ElInput', defineComponent({
    props: ['modelValue', 'disabled'], emits: ['update:modelValue'],
    setup: (props, { emit }) => () => h('input', {
      value: props.modelValue, disabled: props.disabled,
      onInput: value => emit('update:modelValue', value),
    }),
  }))
  for (const [name, tag] of [['ElButton', 'button'], ['ElTag', 'span']]) {
    app.component(name, { setup: (_props, { slots }) => () => h(tag, null, slots.default?.()) })
  }
  const root = { children: [] }
  app.mount(root)
  const all = (type, node = root) => [
    ...(node.type === type ? [node] : []), ...(node.children || []).flatMap(child => all(type, child)),
  ]
  const text = node => node.text || (node.children || []).map(text).join('')
  return { state, all, button: label => all('button').find(node => text(node) === label), app }
}

test('真实组件支持连续添加、输入、删除中间编号，并锁定默认编号', async () => {
  const ui = mountEditor(['A'], true)
  assert.equal(ui.all('input')[0].props.disabled, true)
  ui.button('＋ 添加编号').props.onClick()
  await nextTick()
  ui.all('input')[1].props.onInput('B')
  await nextTick()
  ui.button('＋ 添加编号').props.onClick()
  await nextTick()
  ui.all('input')[2].props.onInput('C')
  await nextTick()
  assert.deepEqual([...ui.state.codes], ['A', 'B', 'C'])
  ui.button('删除').props.onClick()
  await nextTick()
  assert.deepEqual([...ui.state.codes], ['A', 'C'])
  assert.equal(ui.all('input')[1].props.value, 'C')
  ui.app.unmount()
})

test('新建产品默认编号可输入，已有多编号完整回显', () => {
  const ui = mountEditor(['001', '002', '003'], false)
  assert.equal(ui.all('input')[0].props.disabled, false)
  assert.deepEqual(ui.all('input').map(node => node.props.value), ['001', '002', '003'])
  ui.app.unmount()
})
