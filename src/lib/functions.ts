import { Position } from 'geojson'

export type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}

export type Groups = {
  sortIndexes: Uint32Array
  groupedFrom: Uint32Array
  groupedTo: Uint32Array
}

export function groupPositions(coordinates: Position[]): Groups {
  const sortIndexes = new Uint32Array(coordinates.length)
  const groupedFrom = new Uint32Array(coordinates.length)
  const groupedTo = new Uint32Array(coordinates.length)
  for (let i = 0; i < coordinates.length; i++) {
    sortIndexes[i] = i
  }
  sortIndexes.sort((a, b) => {
    return coordinates[a][0] - coordinates[b][0] || coordinates[a][1] - coordinates[b][1]
  })
  if (coordinates.length) {
    groupedTo[sortIndexes[coordinates.length - 1]] = groupedTo.length - 1
  }
  for (let i = 1, j = coordinates.length - 2; i < coordinates.length; i++, j--) {
    if (
      coordinates[sortIndexes[i]][0] !== coordinates[sortIndexes[i - 1]][0] ||
      coordinates[sortIndexes[i]][1] !== coordinates[sortIndexes[i - 1]][1]
    ) {
      groupedFrom[sortIndexes[i]] = i
    } else {
      groupedFrom[sortIndexes[i]] = groupedFrom[sortIndexes[i - 1]]
    }
    if (
      coordinates[sortIndexes[j]][0] !== coordinates[sortIndexes[j + 1]][0] ||
      coordinates[sortIndexes[j]][1] !== coordinates[sortIndexes[j + 1]][1]
    ) {
      groupedTo[sortIndexes[j]] = j
    } else {
      groupedTo[sortIndexes[j]] = groupedTo[sortIndexes[j + 1]]
    }
  }
  return {
    sortIndexes,
    groupedFrom,
    groupedTo,
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
  let l: number, r: number, t: number
  while (true) {
    t = i
    if ((l = i << 1) <= heap[0] && heapcompare(heap[t], heap[l], priority, coordinates) > 0) t = l
    if ((r = l + 1) <= heap[0] && heapcompare(heap[t], heap[r], priority, coordinates) > 0) t = r
    if (i === t) break
    heapswap(heap, heapRev, i, t)
    i = t
  }
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

  const candidatesByGroupFrom = new Uint32Array(n)
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

    if (!isCandidate[i]) {
      isCandidate[i] = 1
      candidatesByGroupFrom[groups.groupedFrom[i]]++
    }

    if (candidatesByGroupFrom[groups.groupedFrom[i]] !== groups.groupedTo[i] - groups.groupedFrom[i] + 1) {
      continue
    }

    for (let k: number, j = groups.groupedFrom[i]; j <= groups.groupedTo[i]; j++) {
      k = groups.sortIndexes[j]
      if (isDeleted[k]) {
        continue
      }

      if (
        positions.prevIndexes[k] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[k]] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[positions.prevIndexes[k]]] === k
      ) {
        if (!isCandidate[positions.prevIndexes[k]]) {
          isCandidate[positions.prevIndexes[k]] = 1
          candidatesByGroupFrom[groups.groupedFrom[positions.prevIndexes[k]]]++
        }
        if (!isCandidate[positions.nextIndexes[k]]) {
          isCandidate[positions.nextIndexes[k]] = 1
          candidatesByGroupFrom[groups.groupedFrom[positions.nextIndexes[k]]]++
        }

        if (
          candidatesByGroupFrom[groups.groupedFrom[positions.prevIndexes[k]]] ===
            groups.groupedTo[positions.prevIndexes[k]] - groups.groupedFrom[positions.prevIndexes[k]] + 1 &&
          candidatesByGroupFrom[groups.groupedFrom[positions.nextIndexes[k]]] ===
            groups.groupedTo[positions.nextIndexes[k]] - groups.groupedFrom[positions.nextIndexes[k]] + 1
        ) {
          isDeleted[k] = 1
          isDeleted[positions.nextIndexes[k]] = 1
          isDeleted[positions.prevIndexes[k]] = 1
          toDelete -= 3
          j = groups.groupedFrom[i] - 1
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
    }
  }
  return isDeleted
}
