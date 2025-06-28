<script>
	import { Backend } from '#lib/backend.ts'
	import { userStore } from '#lib/stores.ts'
	
	async function onSignOut() {
	await Backend.signOut();
	window.location.href = '/';
	}
</script>

{#if $userStore}
	<p>Welcome {$userStore.email}</p> <button onclick={onSignOut}>Sign out</button>
{:else}
	<button onclick={() => Backend.signIn()}>Sign in with GitHub</button>
{/if}
