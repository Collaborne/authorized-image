import '@polymer/iron-image/iron-image.js';
import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {AuthorizedFetchMixin} from './authorized-fetch-mixin.js';

/**
 * Image that uses the file-token to authenticate requests to images
 *
 * @customElement
 * @polymer
 */
class AuthorizedImage extends AuthorizedFetchMixin(PolymerElement) {
	static get template() {
		return html`
			<style>
			/* Fit this component into the the parent */
			:host {
				display: inline-block;
				overflow: hidden;
				position: relative;
			}

			/* Fit the image into this space */
			iron-image {
				width: 100%;
				height: 100%;
				vertical-align: top;
			}
			</style>
			<iron-image
				id="image"
				alt="{{alt}}"
				crossorigin="{{crossorigin}}"
				error="{{_ironImageError}}"
				fade="{{fade}}"
				height="{{height}}"
				loaded="{{loaded}}"
				loading="{{loading}}"
				placeholder="[[_computePlaceholder(src, placeholder)]]"
				position="{{position}}"
				preload="{{preload}}"
				prevent-load="[[_computePreventLoad(preventLoad, _displayed)]]"
				sizing="{{sizing}}"
				src="[[_computeSrc(src, _wasVisible, _displayed, token)]]"
				width="{{width}}"
			></iron-image>`;
	}

	static get is() {
		return 'authorized-image';
	}

	static get properties() {
		return {
			_displayed: Object,
			_ironImageError: Boolean,

			_supportsIntersectionObserver: {
				readOnly: true,
				type: Boolean,
				value: typeof IntersectionObserver === 'function',
			},

			/**
			 * Whether this image was visible according to the intersection observer.
			 *
			 * This value is only valid when the component is "ready" and _supportsIntersectionObserver is true.
			 */
			_visible: Boolean,

			/**
			 * Whether this image was ever visible.
			 * This property is used to delay the internal "fetch" request for invisible images, but avoid
			 * extra _computeSrc calls when this image is hidden after it was visible once.
			 */
			_wasVisible: {
				computed: '_computeWasVisible(_wasVisible, _supportsIntersectionObserver, _visible)'
			},

			alt: String,
			crossorigin: String,
			error: {
				computed: '_computeError(_ironImageError, _displayed)',
				notify: true,
				readOnly: true,
				reflectToAttribute: true,
				type: Boolean,
			},
			fade: Boolean,
			height: Number,
			loaded: {
				notify: true,
				readOnly: true,
				type: Boolean,
			},
			loading: {
				notify: true,
				readOnly: true,
				type: Boolean,
			},
			placeholder: String,
			position: String,
			preload: Boolean,
			preventLoad: Boolean,
			sizing: String,
			src: String,
			width: Number,

			token: String, // eslint-disable-line sort-keys
			mode: { // eslint-disable-line sort-keys
				type: String,
				value: 'cors',
			},
		};
	}

	ready() {
		super.ready();

		// Register an "intersection observer" to learn when this element is actually becoming
		// visible.
		// If the browser doesn't support this functionality we rely on the default value.
		// Observe mutations to the parent element that affect us
		if (this._supportsIntersectionObserver) {
			this._observer = new IntersectionObserver(entries => { // eslint-disable-line no-unused-vars
				// See https://stackoverflow.com/a/38873788/196315
				// XXX: Can we instead look at the entries, specifically 'isIntersecting'?
				this._visible = Boolean(this.offsetHeight || this.offsetWidth || this.getClientRects().length > 0);
			});
			this._observer.observe(this);
		}
	}

	_computeWasVisible(wasVisible, supportsIntersectionObserver, visible) {
		// If the element was visible before do no longer change.
		if (wasVisible) {
			return wasVisible;
		}

		// If the browser does not support intersection observers assume the element is
		// visible.
		if (!supportsIntersectionObserver) {
			return true;
		}

		// Otherwise: Check the property that will be set by the intersection observer.
		return visible;
	}

	_computeError(ironImageError, displayed) {
		return Boolean(ironImageError) || Boolean(displayed && displayed.dataUrl === '');
	}

	_computeSrc(src, wasVisible, displayed, token) {
		// Use the dataUrl if the src was fetched already earlier
		// In case the image wasn't loaded and the token changed, we try to fetch again to see if the image loads now.
		if (displayed && displayed.src === src && (displayed.dataUrl || displayed.token === token)) {
			return displayed.dataUrl;
		}

		// Start with a return value of '', which iron-image treats as "nothing to do"
		let result = '';

		if (src && wasVisible) {
			// Set base to support relative URLs
			const srcUrl = new URL(src, window.location);
			if (srcUrl.protocol === 'data:') {
				// Data URL, we can use that directly.
				this._displayed = this._fetched(src, src, token);
				result = src;
			} else if (!token) {
				// No token, so no need to go through fetch.
				// This means however that `img-src` in the CSP must be set for these.
				// XXX: It is possible that this observer is called before the `token` property is initialized though,
				//			in which case setting the result here will lead to problems if the image hasn't been fetched before.
				//			These problems will get cured as soon as the token property gets set though.
				//			If we're "lucky" and the browser has the image cached already we save one async cycle.
				this._displayed = this._fetched(src, src, token);
				result = src;
			} else {
				// Starting fetching content
				this.fetchDataUrl(src, token).then(fetched => {
					// Update the _displayed property with the result of fetching, as long as the value is still "current"
					// and the change would not be a noop (dataUrl, src, or token must have actually changed)
					if (!this._displayed || this._isChanged(this._displayed, fetched)) {
						this._displayed = fetched;
					}
				});
			}
		}

		return result;
	}

	_computePreventLoad(preventLoad, displayed) {
		// Prevent loading when either the user requested that, or when we cannot actually display things.
		if (preventLoad) {
			return true;
		}

		return Boolean(displayed && displayed.dataUrl === '');
	}

	_computePlaceholder(src, placeholder) {
		// Only use the placeholder when we do not have a src at all
		if (!src) {
			return placeholder;
		}

		return undefined;
	}

	_isChanged(displayed, fetched) {
		return displayed.src !== fetched.src || displayed.token !== fetched.token || displayed.dataUrl !== fetched.dataUrl;
	}
}
window.customElements.define(AuthorizedImage.is, AuthorizedImage);
