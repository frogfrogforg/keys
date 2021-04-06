import * as path from "path"
import fs from "fs/promises"
import { PNG } from "pngjs"

// -- constants --
const Paths = {
  Images: "./docs"
}

const kImageSize = {
  width: 4,
  height: 4
}

const kImageLen = kImageSize.width * kImageSize.height
const kNumImages = 2 << (kImageSize.width * kImageSize.height)
const kBatchSize = 2 << 8

// -- lifetime --
async function main() {
  await fs.mkdir(Paths.Images, {
    recursive: true
  })

  await generate()
}

// -- commands --
async function generate() {
  let batch = 0
  let tasks = []

  for (let i = 0; i < kNumImages; i++) {
    // create image
    tasks.push(createImage(i))

    // if we are at our batch size
    batch++
    if (batch === kBatchSize) {
      await Promise.all(tasks)
      batch = 0
      tasks = []
    }
  }

  // wait for any leftover files; shouldn't happen if batch is a power of 2
  if (tasks.length != 0) {
    await Promise.all(tasks)
  }
}

// -- c/image
async function createImage(i) {
  const bitstr = i.toString(2).padStart(kImageLen, "0")
  const buffer = await createImageBuffer(bitstr)
  const dst = path.join(Paths.Images, bitstr + ".png")
  await fs.writeFile(dst, buffer)
}

async function createImageBuffer(bitstr) {
  return new Promise((res, rej) => {
    const png = new PNG(kImageSize)

    let i = 0
    for (const char of bitstr) {
      const o = i << 2
      const c = char === "1" ? 0x00 : 0xff

      png.data[o + 0] = c
      png.data[o + 1] = c
      png.data[o + 2] = c
      png.data[o + 3] = 0xff

      i++
    }

    res(PNG.sync.write(png, {
      colorType: 0
    }))
  })
}

// -- bootstrap --
main()
