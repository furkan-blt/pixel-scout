import protectDraft from './server/fut-access.js';

export const config = { matcher: ['/games/fut-draft/:path*'] };
export default protectDraft;
