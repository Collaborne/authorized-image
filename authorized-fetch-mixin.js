/* eslint-disable valid-jsdoc */
/**
 * Mixin that allows fetching with authorization through the browser cache and providing the result through a data: URL.
 *
 * @template T type of parent class
 * @param {T} parent parent class
 * @returns {T & AuthorizedFetchMixin} parent with this mixed in
 */
/* eslint-enable valid-jsdoc */
export const AuthorizedFetchMixin = parent => class extends parent { // eslint-disable-line padded-blocks
	/**
	 * Fetch the given `src` by authorizing with the given bearer token `token`.
	 *
	 * @param {string} src the source URL to fetch
	 * @param {string} [token] the token to use as bearer token
	 * @param {string} [mode='same-origin'] the request "mode" to use ('cors', 'no-cors', 'same-origin')
	 * @return {Promise<{dataUrl: string, src: string}>} a promise that resolves to an object providing the data: URL
	 */
	fetchDataUrl(src, token, mode) {
		if (!src) {
			return Promise.reject(new Error('No src to fetch given'));
		}
		const headers = new Headers();
		if (token) {
			headers.set('authorization', `Bearer ${token}`);
		}
		return fetch(src, {headers, mode})
			.then(response => {
				if (!response.ok) {
					throw new Error(`Cannot fetch: ${response.status} ${response.statusText}`);
				}
				return response.blob();
			})
			.then(blob => {
				return new Promise(resolve => {
					const fileReader = new FileReader();
					fileReader.onload = e => {
						resolve(this._fetched(src, e.target.result, token));
					};

					fileReader.readAsDataURL(blob);
				});
			})
			.catch(e => {
				console.error(`Cannot fetch ${src}: ${e.message}`);
				return this._fetched(src, '', token);
			});
	}

	_fetched(src, dataUrl, token) {
		return {
			dataUrl: dataUrl,
			src: src,
			token: token,
		};
	}
};
