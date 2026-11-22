import { strict as assert } from 'node:assert'
import { compositeColor, contrastRatio, parseHexColor } from '../src/terms/lib/contrast.ts'

const white = parseHexColor('#ffffff')!
const black = parseHexColor('#000000')!
const gray = parseHexColor('#777777')!
const grayOnWhite = contrastRatio(gray, white)

assert.equal(contrastRatio(black, white), 21)
assert.equal(grayOnWhite.toFixed(2), '4.48')
assert.ok(grayOnWhite < 4.5)
assert.deepEqual(compositeColor(black, white, 0.5), [127.5, 127.5, 127.5])
console.log('contrast ok: #777 on #fff ≈ 4.48:1')
