const unitDefinitions = {
  kg: { family: 'mass', factor: 1000 },
  kilogram: { family: 'mass', factor: 1000 },
  kilograms: { family: 'mass', factor: 1000 },
  g: { family: 'mass', factor: 1 },
  gram: { family: 'mass', factor: 1 },
  grams: { family: 'mass', factor: 1 },
  l: { family: 'volume', factor: 1000 },
  liter: { family: 'volume', factor: 1000 },
  liters: { family: 'volume', factor: 1000 },
  litre: { family: 'volume', factor: 1000 },
  litres: { family: 'volume', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  milliliter: { family: 'volume', factor: 1 },
  milliliters: { family: 'volume', factor: 1 },
  millilitre: { family: 'volume', factor: 1 },
  millilitres: { family: 'volume', factor: 1 },
  pc: { family: 'pieces', factor: 1 },
  pcs: { family: 'pieces', factor: 1 },
  piece: { family: 'pieces', factor: 1 },
  pieces: { family: 'pieces', factor: 1 },
  ea: { family: 'pieces', factor: 1 },
  each: { family: 'pieces', factor: 1 },
  unit: { family: 'pieces', factor: 1 },
  units: { family: 'pieces', factor: 1 },
  ct: { family: 'pieces', factor: 1 },
  count: { family: 'pieces', factor: 1 },
  counts: { family: 'pieces', factor: 1 },
}

const pieceUnits = new Set(['pc', 'pcs', 'piece', 'pieces', 'ea', 'each', 'unit', 'units', 'ct', 'count', 'counts'])

export function isPieceUnit(unit) {
  return pieceUnits.has(String(unit ?? '').trim().toLowerCase())
}

export function getCompatibleUnits(baseUnit) {
  const unit = String(baseUnit ?? '').trim()
  const definition = unitDefinitions[unit.toLowerCase()]
  if (!definition) return unit ? [unit] : []
  if (definition.family === 'mass') return definition.factor === 1000 ? [unit, 'g'] : [unit, 'kg']
  if (definition.family === 'volume') return definition.factor === 1000 ? [unit, 'ml'] : [unit, 'L']
  return [...new Set([unit, 'pcs', 'piece', 'each'])]
}

export function convertQuantity(value, sourceUnit, targetUnit) {
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return null
  const sourceKey = String(sourceUnit ?? '').trim().toLowerCase()
  const targetKey = String(targetUnit ?? '').trim().toLowerCase()
  const source = unitDefinitions[sourceKey]
  const target = unitDefinitions[targetKey]
  if (!sourceKey || !targetKey) return null
  if (sourceKey === targetKey) return quantity
  if (!source || !target || source.family !== target.family) return null
  return quantity * source.factor / target.factor
}

export function convertQuantityToBase(value, sourceUnit, baseUnit) {
  return convertQuantity(value, sourceUnit, baseUnit)
}

export function formatQuantity(value, unit) {
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return '—'
  if (isPieceUnit(unit)) return String(quantity)
  return quantity.toFixed(6).replace(/\.?0+$/, '')
}
