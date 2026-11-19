import { BufferGeometry, Float32BufferAttribute } from 'three'

export function makeAnatomyRelief(image) {
  const { width, height } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, width, height).data

  const points = []
  const uv = []
  const facing = []
  const indices = []
  const vertices = new Map()
  const boundary = new Map()

  function vertex(pixel) {
    if (vertices.has(pixel)) return vertices.get(pixel)
    const u = (pixel % width + .5) / width
    const v = (Math.floor(pixel / width) + .5) / height
    const x = (u - .5) * 5.48
    const y = (.5 - v) * 5.48
    const depth = pixels[pixel * 4] / 255
    const offset = -.06 + .10 * Math.exp(-((y - .93) ** 2) / .5)
    const index = points.length / 3
    points.push(x, y, offset + depth * .48, x, y, offset - depth * .39)
    uv.push(u, 1 - v, u, 1 - v)
    facing.push(1, 0)
    vertices.set(pixel, index)
    return index
  }

  function edge(from, to) {
    const key = from + ':' + to
    const reverse = to + ':' + from
    if (!boundary.delete(reverse)) boundary.set(key, [from, to])
  }

  function face(a, b, c) {
    if (![a, b, c].every(index => pixels[index * 4] > 0)) return
    const x = vertex(a), y = vertex(b), z = vertex(c)
    indices.push(x, y, z, x + 1, z + 1, y + 1)
    edge(x, y)
    edge(y, z)
    edge(z, x)
  }

  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width - 1; col++) {
      const topLeft = row * width + col
      face(topLeft, topLeft + width, topLeft + 1)
      face(topLeft + 1, topLeft + width, topLeft + width + 1)
    }
  }

  for (const [a, b] of boundary.values()) indices.push(b, a, a + 1, b, a + 1, b + 1)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setAttribute('artFront', new Float32BufferAttribute(facing, 1))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
