import assert from 'assert'
import { Position } from 'geojson'

import { deletePositions, groupPositions, type Groups, type Positions } from '@lib/functions'

function getGroupIndexes(groups: Groups, index: number, length: number): number[] {
  const indexes: number[] = []
  for (let member = groups.groupOf[index]; member < length; member = groups.nextInGroup[member]) {
    const nextMember = groups.nextInGroup[member]
    assert.ok(
      nextMember > member && nextMember <= length,
      `invalid next index ${nextMember} for group member ${member}`,
    )
    indexes.push(member)
  }
  return indexes
}

describe('functions - groupPositions()', () => {
  it('should link equal positions in input order without sorting other groups', () => {
    const coordinates: Position[] = [
      [5, 5],
      [1, 1],
      [5, 5],
      [5, 2],
      [5, 5],
    ]

    const groups = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(groups.groupOf), [0, 1, 0, 3, 0])
    assert.strictEqual(groups.groupSize[0], 3)
    assert.strictEqual(groups.nextInGroup[0], 2)
    assert.strictEqual(groups.nextInGroup[2], 4)
    assert.strictEqual(groups.nextInGroup[4], coordinates.length)
  })

  it('should distinguish fractional coordinates across both signs', () => {
    const coordinates: Position[] = [
      [0.25, -0.5],
      [-0.25, 0.5],
      [-0.25, -0.5],
      [0.25, 0.5],
      [0, 0],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(result.groupOf), [0, 1, 2, 3, 4])
    assert.deepStrictEqual(Array.from(result.groupSize), [1, 1, 1, 1, 1])
  })

  it('should preserve input order within duplicate fractional coordinate groups', () => {
    const coordinates: Position[] = [
      [0.25, -0.5],
      [-0.25, 0.5],
      [0.25, -0.5],
      [-0.25, 0.5],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(getGroupIndexes(result, 0, coordinates.length), [0, 2])
    assert.deepStrictEqual(getGroupIndexes(result, 1, coordinates.length), [1, 3])
  })

  it('should group signed zeros without merging distinct subnormal coordinates', () => {
    const coordinates: Position[] = [
      [0, Number.MIN_VALUE],
      [-0, 0],
      [0, -0],
      [0, -Number.MIN_VALUE],
      [Number.MIN_VALUE, 0],
      [-Number.MIN_VALUE, 0],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(getGroupIndexes(result, 1, coordinates.length), [1, 2])
    assert.deepStrictEqual(getGroupIndexes(result, 0, coordinates.length), [0])
    assert.deepStrictEqual(getGroupIndexes(result, 3, coordinates.length), [3])
    assert.deepStrictEqual(getGroupIndexes(result, 4, coordinates.length), [4])
    assert.deepStrictEqual(getGroupIndexes(result, 5, coordinates.length), [5])
  })

  it('should group unique positions into singleton ranges', () => {
    const coordinates: Position[] = [
      [10, 10],
      [0, 0],
      [1, 1],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(Array.from(result.groupOf), [0, 1, 2])
    assert.deepStrictEqual(Array.from(result.groupSize), [1, 1, 1])
  })

  it('should group duplicate positions even when they are not adjacent in input order', () => {
    const coordinates: Position[] = [
      [5, 5],
      [1, 1],
      [5, 5],
      [2, 2],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(getGroupIndexes(result, 0, coordinates.length), [0, 2])
    assert.deepStrictEqual(getGroupIndexes(result, 1, coordinates.length), [1])
    assert.deepStrictEqual(getGroupIndexes(result, 3, coordinates.length), [3])
  })

  it('should resolve repeated x coordinates with different y values', () => {
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

    assert.deepStrictEqual(getGroupIndexes(result, 0, coordinates.length), [0, 6])
    assert.deepStrictEqual(getGroupIndexes(result, 1, coordinates.length), [1])
    assert.deepStrictEqual(getGroupIndexes(result, 2, coordinates.length), [2])
    assert.deepStrictEqual(getGroupIndexes(result, 3, coordinates.length), [3, 5])
    assert.deepStrictEqual(getGroupIndexes(result, 7, coordinates.length), [7])
  })

  it('should retain the first y group after upgrading an x entry to a map', () => {
    const coordinates: Position[] = [
      [5, 3],
      [5, 2],
      [5, 3],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(getGroupIndexes(result, 2, coordinates.length), [0, 2])
    assert.strictEqual(result.groupSize[0], 2)
  })

  it('should reuse a third y group added to an existing map', () => {
    const coordinates: Position[] = [
      [5, 3],
      [5, 2],
      [5, 1],
      [5, 1],
    ]

    const result = groupPositions(coordinates)

    assert.deepStrictEqual(getGroupIndexes(result, 3, coordinates.length), [2, 3])
    assert.strictEqual(result.groupSize[2], 2)
  })

  it('should assign the same root to duplicate positions', () => {
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

    assert.strictEqual(result.groupOf[0], result.groupOf[6])
    assert.strictEqual(result.groupOf[3], result.groupOf[5])
    assert.notStrictEqual(result.groupOf[0], result.groupOf[3])
  })

  it('should make every group root a position in that group', () => {
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
      assert.ok(result.groupOf[i] <= i, `invalid root for position ${i}`)
      assert.deepStrictEqual(coordinates[result.groupOf[i]], coordinates[i])
    }
  })

  it('should map every position to a group containing only equal coordinates', () => {
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
      const indexes = getGroupIndexes(result, i, coordinates.length)
      const expected = JSON.stringify(coordinates[i])
      const values = indexes.map((index) => JSON.stringify(coordinates[index]))

      assert.ok(values.length > 0)
      assert.strictEqual(values.length, result.groupSize[result.groupOf[i]])
      assert.ok(
        values.every((value) => value === expected),
        `group for position ${i} contains non-equal coordinates`,
      )
    }
  })
})

function createLinePositions(coordinates: Position[]): Positions {
  return {
    coordinates,
    prevIndexes: coordinates.map((_, i) => (i === 0 ? -1 : i - 1)),
    nextIndexes: coordinates.map((_, i) => (i === coordinates.length - 1 ? -1 : i + 1)),
  }
}

function createRingPositions(coordinates: Position[]): Positions {
  return {
    coordinates,
    prevIndexes: coordinates.map((_, i) => (i === 0 ? coordinates.length - 1 : i - 1)),
    nextIndexes: coordinates.map((_, i) => (i === coordinates.length - 1 ? 0 : i + 1)),
  }
}

describe('functions - deletePositions()', () => {
  it('should preserve deletion order through repeated heap repairs', () => {
    const positions = createLinePositions([
      [0, 0],
      [1, 5],
      [2, 0],
      [3, 1],
      [4, 0],
      [5, 4],
      [6, 0],
      [7, 3],
      [8, 0],
      [9, 2],
      [10, 0],
    ])

    const result = deletePositions(positions, groupPositions(positions.coordinates), 0, 0.5)

    assert.deepStrictEqual(Array.from(result), [0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0])
    assert.deepStrictEqual(
      positions.nextIndexes.filter((_, index) => !result[index]),
      [2, 5, 6, 10, -1],
    )
  })

  it('should delete a single ordinary candidate position in a line', () => {
    const positions = createLinePositions([
      [0, 0],
      [1, 1],
      [2, 0],
    ])

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 0)

    assert.deepStrictEqual(Array.from(result), [0, 1, 0])
    assert.deepStrictEqual(positions.prevIndexes, [-1, 0, 0])
    assert.deepStrictEqual(positions.nextIndexes, [2, 2, -1])
  })

  it('should wait for the whole duplicate group before deleting a grouped position', () => {
    const positions: Positions = {
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 0],
        [1, 1],
        [3, 0],
      ],
      prevIndexes: [-1, 0, 1, -1, 3],
      nextIndexes: [1, 2, -1, 4, -1],
    }

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 0)

    assert.deepStrictEqual(Array.from(result), [0, 0, 0, 0, 0])
  })

  it('should delete every position in a duplicate group once the whole group is ready', () => {
    const positions: Positions = {
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 0],
        [3, 0],
        [1, 1],
        [4, 0],
      ],
      prevIndexes: [-1, 0, 1, -1, 3, 4],
      nextIndexes: [1, 2, -1, 4, 5, -1],
    }

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 0)

    assert.deepStrictEqual(Array.from(result), [0, 1, 0, 0, 1, 0])
    assert.deepStrictEqual(positions.prevIndexes, [-1, 0, 0, -1, 3, 3])
    assert.deepStrictEqual(positions.nextIndexes, [2, 2, -1, 5, 5, -1])
  })

  it('should skip stale heap entries after indirect group deletion', () => {
    const positions: Positions = {
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 0],
        [3, 0],
        [1, 1],
        [4, 0],
        [5, 0],
        [6, 1],
        [7, 0],
      ],
      prevIndexes: [-1, 0, 1, -1, 3, 4, -1, 6, 7],
      nextIndexes: [1, 2, -1, 4, 5, -1, 7, 8, -1],
    }

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 1)

    assert.deepStrictEqual(Array.from(result), [0, 1, 0, 0, 1, 0, 0, 1, 0])
  })

  it('should remove an entire triangular ring', () => {
    const positions = createRingPositions([
      [0, 0],
      [1, 1],
      [2, 0],
    ])

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 0)

    assert.deepStrictEqual(Array.from(result), [1, 1, 1])
  })

  it('should count whole-ring removal as three deletions for fraction budget', () => {
    const positions = createRingPositions([
      [0, 0],
      [1, 1],
      [2, 0],
    ])

    const result = deletePositions(positions, groupPositions(positions.coordinates), 0, 1 / 3)

    assert.deepStrictEqual(Array.from(result), [1, 1, 1])
  })

  it('should revisit an earlier triangular ring when another ring makes its groups ready', () => {
    const positions: Positions = {
      coordinates: [
        [0, 0],
        [1, 1],
        [0, 2],
        [0, 0],
        [2, 0],
        [1, 1],
      ],
      prevIndexes: [2, 0, 1, 5, 3, 4],
      nextIndexes: [1, 2, 0, 4, 5, 3],
    }

    const result = deletePositions(positions, groupPositions(positions.coordinates), 0, 0.1)

    assert.deepStrictEqual(Array.from(result), [1, 1, 1, 1, 1, 1])
  })

  it('should not remove a triangular ring when a neighboring duplicate group is not fully ready', () => {
    const positions: Positions = {
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 0],
        [1, 1],
        [3, 0],
      ],
      prevIndexes: [2, 0, 1, -1, 3],
      nextIndexes: [1, 2, 0, 4, -1],
    }

    const result = deletePositions(positions, groupPositions(positions.coordinates), Number.MAX_SAFE_INTEGER, 0)

    assert.deepStrictEqual(Array.from(result), [0, 0, 0, 0, 0])
  })
})
