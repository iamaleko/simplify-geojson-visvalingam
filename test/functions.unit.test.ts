import assert from 'assert'
import { Position } from 'geojson'

import { groupPositions } from '@lib/functions'

function getRangeCoordinates(coordinates: Position[], sortIndexes: Uint32Array, from: number, to: number): string[] {
  const values: string[] = []
  for (let i = from; i <= to; i++) {
    values.push(JSON.stringify(coordinates[sortIndexes[i]]))
  }
  return values
}

describe('functions - groupPositions()', () => {
  it('should group unique positions into singleton ranges', () => {
    const coordinates: Position[] = [
      [10, 10],
      [0, 0],
      [1, 1],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(result.sortIndexes), [1, 2, 0])
    assert.deepStrictEqual(Array.from(result.groupedFrom), [2, 0, 1])
    assert.deepStrictEqual(Array.from(result.groupedTo), [2, 0, 1])
  })

  it('should group duplicate positions even when they are not adjacent in input order', () => {
    const coordinates: Position[] = [
      [5, 5],
      [1, 1],
      [5, 5],
      [2, 2],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(result.sortIndexes), [1, 3, 0, 2])
    assert.deepStrictEqual(Array.from(result.groupedFrom), [2, 0, 2, 1])
    assert.deepStrictEqual(Array.from(result.groupedTo), [3, 0, 3, 1])
  })

  it('should assign correct groupedTo for the last sorted position', () => {
    const coordinates: Position[] = [
      [0, 1],
      [4, 5],
      [5, 3],
      [5, 2],
      [1, 5],
      [5, 2],
      [0, 1],
      [4, 0],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(result.sortIndexes), [0, 6, 4, 7, 1, 3, 5, 2])
    assert.deepStrictEqual(Array.from(result.groupedFrom), [0, 4, 7, 5, 2, 5, 0, 3])
    assert.deepStrictEqual(Array.from(result.groupedTo), [1, 4, 7, 6, 2, 6, 1, 3])
  })

  it('should assign the same range to duplicate positions', () => {
    const coordinates: Position[] = [
      [0, 1],
      [4, 5],
      [5, 3],
      [5, 2],
      [1, 5],
      [5, 2],
      [0, 1],
      [4, 0],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual([result.groupedFrom[0], result.groupedTo[0]], [0, 1])
    assert.deepStrictEqual([result.groupedFrom[6], result.groupedTo[6]], [0, 1])
    assert.deepStrictEqual([result.groupedFrom[3], result.groupedTo[3]], [5, 6])
    assert.deepStrictEqual([result.groupedFrom[5], result.groupedTo[5]], [5, 6])
  })

  it('should keep groupedFrom less or equal to groupedTo for every position', () => {
    const coordinates: Position[] = [
      [0, 1],
      [4, 5],
      [5, 3],
      [5, 2],
      [1, 5],
      [5, 2],
      [0, 1],
      [4, 0],
    ]

    const result = groupPositions(coordinates)

    for (let i = 0; i < coordinates.length; i++) {
      assert.ok(result.groupedFrom[i] <= result.groupedTo[i], `invalid range for position ${i}`)
    }
  })

  it('should map every position to a range containing only equal coordinates', () => {
    const coordinates: Position[] = [
      [0, 1],
      [4, 5],
      [5, 3],
      [5, 2],
      [1, 5],
      [5, 2],
      [0, 1],
      [4, 0],
    ]

    const result = groupPositions(coordinates)

    for (let i = 0; i < coordinates.length; i++) {
      const from = result.groupedFrom[i]
      const to = result.groupedTo[i]
      const expected = JSON.stringify(coordinates[i])
      const values = getRangeCoordinates(coordinates, result.sortIndexes, from, to)

      assert.ok(values.length > 0)
      assert.ok(
        values.every((value) => value === expected),
        `range for position ${i} contains non-equal coordinates`,
      )
    }
  })
})
