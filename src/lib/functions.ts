import { Position } from 'geojson'

export type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}

export type Groups = {
  groupOf: Uint32Array
  groupSize: Uint32Array
  nextInGroup: Uint32Array
}

export function groupPositions(coordinates: Position[]): Groups {
  const groupOf = new Uint32Array(coordinates.length)
  const groupSize = new Uint32Array(coordinates.length)
  const nextInGroup = new Uint32Array(coordinates.length)
  const groupTail = new Uint32Array(coordinates.length)
  const groupsByX = new Map<number, number | Map<number, number>>()
  for (let i = 0; i < coordinates.length; i++) {
    const x = coordinates[i][0]
    const y = coordinates[i][1]
    const byX = groupsByX.get(x)
    let root: number
    if (byX === undefined) {
      root = i
      groupsByX.set(x, i)
    } else if (typeof byX === 'number') {
      if (coordinates[byX][1] === y) {
        root = byX
      } else {
        root = i
        const byY = new Map<number, number>()
        byY.set(coordinates[byX][1], byX)
        byY.set(y, i)
        groupsByX.set(x, byY)
      }
    } else {
      const existing = byX.get(y)
      if (existing === undefined) {
        root = i
        byX.set(y, i)
      } else {
        root = existing
      }
    }
    groupOf[i] = root
    if (root === i) {
      groupSize[root] = 1
      groupTail[root] = i
    } else {
      groupSize[root]++
      nextInGroup[groupTail[root]] = i
      groupTail[root] = i
    }
    nextInGroup[i] = coordinates.length
  }
  return {
    groupOf,
    groupSize,
    nextInGroup,
  }
}

function getPositionArea(i: number, positions: Positions): number {
  return (
    Math.abs(
      positions.coordinates[i][0] *
        (positions.coordinates[positions.prevIndexes[i]][1] - positions.coordinates[positions.nextIndexes[i]][1]) +
        positions.coordinates[positions.prevIndexes[i]][0] *
          (positions.coordinates[positions.nextIndexes[i]][1] - positions.coordinates[i][1]) +
        positions.coordinates[positions.nextIndexes[i]][0] *
          (positions.coordinates[i][1] - positions.coordinates[positions.prevIndexes[i]][1]),
    ) / 2
  )
}

function heapcompare(a: number, b: number, priority: Float64Array, coordinates: Position[]): number {
  return priority[a] - priority[b] || coordinates[a][0] - coordinates[b][0] || coordinates[a][1] - coordinates[b][1]
}

function heapsink(
  heap: Uint32Array,
  heapRev: Uint32Array,
  i: number,
  priority: Float64Array,
  coordinates: Position[],
): number {
  const value = heap[i]
  let l: number, r: number, t: number
  let selected: number
  while (true) {
    t = i
    selected = value
    if ((l = i << 1) <= heap[0] && heapcompare(selected, heap[l], priority, coordinates) > 0) {
      t = l
      selected = heap[l]
    }
    if ((r = l + 1) <= heap[0] && heapcompare(selected, heap[r], priority, coordinates) > 0) t = r
    if (i === t) break
    heap[i] = heap[t]
    heapRev[heap[i]] = i
    i = t
  }
  heap[i] = value
  heapRev[value] = i
  return i
}

function heapbubble(
  heap: Uint32Array,
  heapRev: Uint32Array,
  i: number,
  priority: Float64Array,
  coordinates: Position[],
): number {
  let t: number
  while (i > 1) {
    t = i >>> 1
    if (i === t || heapcompare(heap[t], heap[i], priority, coordinates) <= 0) break
    heapswap(heap, heapRev, i, t)
    i = t
  }
  return i
}

function heapupdate(
  heap: Uint32Array,
  heapRev: Uint32Array,
  val: number,
  priority: Float64Array,
  coordinates: Position[],
): void {
  heapbubble(heap, heapRev, heapsink(heap, heapRev, heapRev[val], priority, coordinates), priority, coordinates)
}

function heapswap(heap: Uint32Array, heapRev: Uint32Array, i: number, t: number): void {
  heapRev[heap[i]] = t
  heapRev[heap[t]] = i
  ;[heap[i], heap[t]] = [heap[t], heap[i]]
}

function heappop(heap: Uint32Array, heapRev: Uint32Array, priority: Float64Array, coordinates: Position[]): number {
  if (heap[0] > 1) {
    heapswap(heap, heapRev, 1, heap[0])
    heap[0]--
    heapsink(heap, heapRev, 1, priority, coordinates)
    return heap[heap[0] + 1]
  } else if (heap[0] === 1) {
    heap[0]--
    return heap[1]
  }
  return -1
}

function heapify(heap: Uint32Array, heapRev: Uint32Array, priority: Float64Array, coordinates: Position[]): void {
  for (let i = heap[0] >>> 1; i > 0; i--) {
    heapsink(heap, heapRev, i, priority, coordinates)
  }
}

export function deletePositions(positions: Positions, groups: Groups, tolerance: number, fraction: number): Uint8Array {
  const n = positions.coordinates.length

  const isDeleted = new Uint8Array(n)
  let toDelete = Math.round(n * fraction)

  const candidatesByGroup = new Uint32Array(n)
  const isCandidate = new Uint8Array(n)

  const heap = new Uint32Array(n + 1)
  const priority = new Float64Array(n)
  const heapRev = new Uint32Array(n)

  for (let i = 0; i < n; i++) {
    if (positions.prevIndexes[i] !== -1 && positions.nextIndexes[i] !== -1) {
      priority[i] = getPositionArea(i, positions)
      heap[0]++
      heap[heap[0]] = i
      heapRev[i] = heap[0]
    }
  }
  heapify(heap, heapRev, priority, positions.coordinates)

  let i: number
  while (heap[0]) {
    i = heappop(heap, heapRev, priority, positions.coordinates)

    if (isDeleted[i]) {
      continue
    }

    if (priority[i] >= tolerance && toDelete <= 0) {
      break
    }

    const groupId = groups.groupOf[i]
    if (!isCandidate[i]) {
      isCandidate[i] = 1
      candidatesByGroup[groupId]++
    }

    if (candidatesByGroup[groupId] !== groups.groupSize[groupId]) {
      continue
    }

    let k = groupId
    while (k < n) {
      if (isDeleted[k]) {
        k = groups.nextInGroup[k]
        continue
      }

      if (
        positions.prevIndexes[k] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[k]] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[positions.prevIndexes[k]]] === k
      ) {
        if (!isCandidate[positions.prevIndexes[k]]) {
          isCandidate[positions.prevIndexes[k]] = 1
          candidatesByGroup[groups.groupOf[positions.prevIndexes[k]]]++
        }
        if (!isCandidate[positions.nextIndexes[k]]) {
          isCandidate[positions.nextIndexes[k]] = 1
          candidatesByGroup[groups.groupOf[positions.nextIndexes[k]]]++
        }

        if (
          candidatesByGroup[groups.groupOf[positions.prevIndexes[k]]] ===
            groups.groupSize[groups.groupOf[positions.prevIndexes[k]]] &&
          candidatesByGroup[groups.groupOf[positions.nextIndexes[k]]] ===
            groups.groupSize[groups.groupOf[positions.nextIndexes[k]]]
        ) {
          isDeleted[k] = 1
          isDeleted[positions.nextIndexes[k]] = 1
          isDeleted[positions.prevIndexes[k]] = 1
          toDelete -= 3
          k = groupId
          continue
        }
      } else {
        isDeleted[k] = 1
        toDelete--
        positions.prevIndexes[positions.nextIndexes[k]] = positions.prevIndexes[k]
        positions.nextIndexes[positions.prevIndexes[k]] = positions.nextIndexes[k]

        if (positions.prevIndexes[positions.prevIndexes[k]] !== -1) {
          priority[positions.prevIndexes[k]] = getPositionArea(positions.prevIndexes[k], positions)
          heapupdate(heap, heapRev, positions.prevIndexes[k], priority, positions.coordinates)
        }
        if (positions.nextIndexes[positions.nextIndexes[k]] !== -1) {
          priority[positions.nextIndexes[k]] = getPositionArea(positions.nextIndexes[k], positions)
          heapupdate(heap, heapRev, positions.nextIndexes[k], priority, positions.coordinates)
        }
      }
      k = groups.nextInGroup[k]
    }
  }
  return isDeleted
}
