import { Position } from 'geojson'

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
