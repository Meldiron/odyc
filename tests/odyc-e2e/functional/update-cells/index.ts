import { createGame } from 'odyc'

export const init = () => {
	const game = createGame({
		templates: {
			'#': { solid: true, sprite: 1, visible: true },
			x: { solid: false, sprite: 2, dialog: 'Hello!', visible: true },
			e: { solid: false, sprite: 3, end: 'Game Over', visible: true },
			'*': { solid: false, sprite: 4, foreground: true, visible: true },
			o: { solid: false, sprite: 5, visible: false },
		},
		map: `
			x##e
			#*o#
			e##x
		`,
	})

	return { game }
}
