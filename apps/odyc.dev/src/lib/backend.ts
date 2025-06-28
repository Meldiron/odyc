import {
	Account,
	AppwriteException,
	Client,
	OAuthProvider,
	type Models,
} from 'appwrite'

export type BackendUser = Models.User<{}> // Empty object is type for user preferences

export class Backend {
	// Connection
	static #client = new Client()
		.setEndpoint('https://fra.cloud.appwrite.io/v1')
		.setProject('odyc-js')

	// Service SDKs
	static #account: Account = new Account(this.#client)

	static signIn() {
		let pathSuccess = '/oauth/callback'
		// TODO: Ensure to keep lang in path if present
		this.#account.createOAuth2Token(
			OAuthProvider.Github,
			window.location.origin + pathSuccess, // On success, claim session token
			window.location.href, // On failure, come back
		)
	}

	static async signInFinish(
		userId: string,
		tokenSecret: string,
	): Promise<Models.Session> {
		return this.#account.createSession(userId, tokenSecret)
	}

	static async getUserSafe(): Promise<BackendUser | undefined> {
		try {
			const user = await this.#account.get()
			return user
		} catch (error: unknown) {
			if (error instanceof AppwriteException && error.code === 401) {
				console.log(error)
				return undefined
			}
			throw error
		}
	}
	
	static async signOut() {
    await this.#account.deleteSession('current');
	}
}
