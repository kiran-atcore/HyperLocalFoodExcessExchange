export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    // If the path is an OAuth auth callback (e.g. mobile://auth, auth, access_token, id_token)
    // Return null to prevent Expo Router from navigating to an unmatched route.
    // WebBrowser.openAuthSessionAsync handles the tokens directly.
    if (
      path.includes('auth') ||
      path.includes('access_token') ||
      path.includes('id_token') ||
      path.startsWith('mobile://auth') ||
      path === 'mobile://' ||
      path === 'mobile:///' ||
      path === '/'
    ) {
      if (!initial) {
        return null;
      }
    }
  } catch (e) {
    console.warn('Error in redirectSystemPath', e);
  }
  return path;
}
