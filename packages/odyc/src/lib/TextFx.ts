import { FONT_SIZE } from '../consts'
import { RendererParams } from '../renderer'
import { characters } from './font'
import { resolveColor } from './string'

const EFFECTS = {
	'~': 'waveY',
	_: 'waveX',
	'%': 'shake',
	'=': 'shakeX',
	'^': 'shakeY',
	'°': 'blink',
} as const

type TokenType = 'char' | 'color' | 'effect' | 'separator'

type TokenPattern = {
	pattern: string
	type: TokenType
	process?: (m: string) => string
}

type Token = {
	value: string
	type: TokenType
}

type EffectSymbol = keyof typeof EFFECTS

type Effect = (typeof EFFECTS)[EffectSymbol]

export type Char = {
	value: string
	color?: string
	effect?: Effect
}

export class TextFx {
	#tokensPatterns: TokenPattern[]
	#regExp: RegExp
	#separatorChar: string
	#defaultColor: string
	#colors: RendererParams['colors']

	constructor(
		separatorChar: string,
		defaultColor: string,
		colors: RendererParams['colors'],
	) {
		this.#separatorChar = separatorChar
		this.#defaultColor = defaultColor
		this.#colors = colors
		this.#tokensPatterns = [
			{
				pattern: '\\\\.',
				type: 'char',
				process: (m) => m.charAt(1),
			},
			{
				pattern: this.#escapeRegex(separatorChar),
				type: 'char',
			},
			{
				pattern: '<.>',
				type: 'color',
				process: (m: string) => m.charAt(1),
			},
			{
				pattern: Object.keys(EFFECTS).map(this.#escapeRegex).join('|'),
				type: 'effect',
				process: (m: string) => EFFECTS[m as EffectSymbol],
			},
			{
				pattern: `[^\\n\\r\\t]`,
				type: 'char',
			},
		]
		this.#regExp = new RegExp(
			this.#tokensPatterns.map((t) => `(${t.pattern})`).join('|'),
			'g',
		)
	}

	parseText(text: string, maxLength: number) {
		const tokens = this.#tokenize(text)

		const chars = this.#tokensToChars(tokens)

		const lines = this.#breakLines(chars, maxLength)
		return lines
	}

	draw(
		ctx: CanvasRenderingContext2D,
		text: Char[],
		x: number,
		y: number,
		time: number,
	) {
		for (let charIndex = 0; charIndex < text.length; charIndex++) {
			const char = text[charIndex]
			if (char === undefined) continue
			let posX = x + charIndex * FONT_SIZE
			let posY = y
			const charColor = char.color
				? resolveColor(char.color, this.#colors)
				: null
			if (charColor) ctx.fillStyle = charColor
			else ctx.fillStyle = this.#defaultColor

			switch (char.effect) {
				case 'waveY':
					posY += Math.floor(Math.sin(time * 0.01 + charIndex) * 3)
					break
				case 'waveX':
					posX += Math.floor(Math.sin(time * 0.01 + charIndex) * 2)
					break
				case 'shake':
					posX += Math.floor((Math.random() - 0.5) * 2)
					posY += Math.floor((Math.random() - 0.5) * 2)
					break
				case 'shakeX':
					posX += Math.floor((Math.random() - 0.5) * 2)
					break
				case 'shakeY':
					posY += Math.floor((Math.random() - 0.5) * 2)
					break
				case 'blink':
					if (Math.sin(time * 0.015) > 0) ctx.fillStyle = 'transparent'
					break
			}
			TextFx.#drawChar(ctx, char.value, posX, posY)
		}
	}

	#tokenize(str: string): Token[] {
		const matches = str.matchAll(this.#regExp)
		const tokens: Token[] = []
		for (const match of matches) {
			match.shift()
			const index = match.findIndex((m) => m !== undefined)
			const { type, process } = this.#tokensPatterns[index]!
			const value = process ? process(match[index]!) : match[index]!
			tokens.push({ value, type })
		}
		return tokens
	}

	#tokensToChars(tokens: Token[]): Char[] {
		let chars: Char[] = []
		const colorsQueue: string[] = []
		const effectsQueue: Effect[] = []
		for (let index = 0; index < tokens.length; index++) {
			const token = tokens[index]
			if (!token) continue
			const { type, value } = token

			if (type === 'char') {
				const color = colorsQueue[colorsQueue.length - 1]
				const effect = effectsQueue[effectsQueue.length - 1]
				chars.push({
					value,
					color,
					effect,
				})
				continue
			}

			if (token.type === 'color') {
				const index = colorsQueue.lastIndexOf(value)
				if (index !== -1) colorsQueue.splice(index, 1)
				else colorsQueue.push(value)
				continue
			}

			if (token.type === 'effect') {
				const index = effectsQueue.lastIndexOf(value as Effect)
				if (index !== -1) effectsQueue.splice(index, 1)
				else effectsQueue.push(value as Effect)
			}
		}
		return chars
	}

	#breakLines(chars: Char[], maxLength: number): Char[][] {
		const result: Char[][] = []

		loop: while (chars.length > 0) {
			const separatorIndex = chars.findIndex(
				(el, i) => el.value === this.#separatorChar && i < maxLength,
			)
			if (separatorIndex !== -1) {
				result.push(chars.splice(0, separatorIndex))
				chars.splice(0, 1)
				continue
			} else if (chars.length <= maxLength) {
				result.push(chars)
				chars = []
				continue
			}

			for (let c = maxLength; c >= 0; c--) {
				const char = chars[c]
				if (char?.value === ' ') {
					result.push(chars.splice(0, c))
					chars.splice(0, 1)
					continue loop
				}
			}
			result.push(chars.splice(0, maxLength))
		}

		if (chars.length > 0) result.push(chars)
		return result
	}

	#escapeRegex(str: string) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

	static #drawChar(
		ctx: CanvasRenderingContext2D,
		char: string,
		x: number,
		y: number,
	) {
		const charCode = char.charCodeAt(0)
		const charTemplate = this.#getCharTemplate(charCode)
		if (!charTemplate) return
		for (let cy = 0; cy < FONT_SIZE; cy++) {
			const row = charTemplate[cy]
			if (row === undefined) continue
			for (let cx = 0; cx < FONT_SIZE; cx++) {
				if (row & (1 << cx)) {
					ctx.fillRect(x + cx, y + cy, 1, 1)
				}
			}
		}
	}

	static text(
		ctx: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
	) {
		for (let index = 0; index < text.length; index++) {
			const char = text.charAt(index)
			TextFx.#drawChar(ctx, char, x + index * FONT_SIZE, y)
		}
	}

	static #getCharTemplate(code: number) {
		const charSet = characters.find(
			(el) => code >= el.start && code < el.start + el.characters.length,
		)
		if (!charSet) return null
		return charSet.characters[code - charSet.start]
	}
}
