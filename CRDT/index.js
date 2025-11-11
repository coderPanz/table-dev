// CRDT 算法的 OP 模式实现 demo

const op1 = {
  op: "insert",
  value: "hello",
  index: 0,
}

const op2 = {
  op: 'delete',
  value: 'hello',
  index: 4
}

const OT_Apply = (op) => {
  let res = ''
  return res
}
