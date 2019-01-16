# `<authorized-image>`

A component that allows to show images that require authorization using a bearer token.

## Usage

```sh
npm install Collaborne/authorized-image --save
```

_Note:_ The component depends on a working `URL` constructor. For supporting IE11 and older browser you need to also install a polyfill as, such as [webcomponents/URL](https://github.com/webcomponents/URL):
```sh
npm install @webcomponents/url --save
```

## Restrictions, Known Issues, and Differences to `<img>`/`<iron-image>`

This component can solve problems related to caching images that require authorization, but at the same time can also introduce a lot of potential problems:

* The `<authorized-image>` component will fetch the images when then `src` is known and the component is likely visible based on an [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
* The `<authorized-image>` component will fetch images once per component instance, even when the URL is equal to other instances on the same page.
* When using a token the `<authorized-image>` component will do a CORS pre-flight request due to the `authorization` HTTP header in the request. Using a reasonable [`Access-Control-Max-Age`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) value on the server side helps in reducing the impact by that.
* Images fetched via the `<authorized-image>` component must comply to the `connect-src` Content-Security-Policy directive rather than the `img-src` directive.

## License

    This software is licensed under the Apache 2 license, quoted below.

    Copyright 2011-2018 Collaborne B.V. <http://github.com/Collaborne/>

    Licensed under the Apache License, Version 2.0 (the "License"); you may not
    use this file except in compliance with the License. You may obtain a copy of
    the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    License for the specific language governing permissions and limitations under
    the License.
