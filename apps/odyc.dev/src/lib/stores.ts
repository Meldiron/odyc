import { atom } from 'nanostores'
import { Backend, type BackendUser } from './backend'

export const userStore = atom<BackendUser | undefined>(undefined)

async function userStoreInit() {
	userStore.set(await Backend.getUserSafe())
}
