/* global __webpack_public_path__ */
__webpack_public_path__ = '/static/js/';

declare module 'onairos' {
    export function Onairos({ requestData, webpageName, proofMode }: { requestData: object; webpageName: string; proofMode?: boolean }): JSX.Element;
    // Add other exports here if any
}
