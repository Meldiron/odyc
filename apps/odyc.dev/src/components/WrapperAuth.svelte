<script>
	import { Backend } from '#lib/backend.ts'
	import { userStore } from '#lib/stores.ts'

	let { children } = $props()

	async function loadUser() {
		userStore.set(await Backend.getUserSafe())
	}

	let promise = $state(loadUser())
</script>

{#await promise then}
	{@render children?.()}
{:catch}
	{@render children?.()}
{/await}
