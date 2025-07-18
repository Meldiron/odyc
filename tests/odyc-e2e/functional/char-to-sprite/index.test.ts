import { expect, test } from 'vitest'
import { charToSprite } from 'odyc'

test('converts characters to sprites correctly', async () => {
	'0123456789abcdefghijklmnopqrstuvwsyzABCDEFGHIJKLMNOPQRSTUVWSYZ'
		.split('')
		.forEach((c) => {
			expect(charToSprite(c, '1')).toMatchSnapshot()
		})
})
