import { getStore } from "@netlify/blobs";

// Wrapper around @netlify/blobs' getStore() that falls back to manual
// siteID/token configuration when the automatic `NETLIFY_BLOBS_CONTEXT`
// environment variable isn't injected by the runtime.
//
// Observed on this project's deploy previews (and possibly production): the
// function runtime provides `SITE_ID` and `NETLIFY_FUNCTIONS_TOKEN` but not
// `NETLIFY_BLOBS_CONTEXT`, which makes the zero-arg `getStore(name)` throw
// "The environment has not been configured to use Netlify Blobs." Passing
// `siteID`/`token` explicitly (per the @netlify/blobs manual-configuration
// docs) works around this without depending on that env var.
export function getBlobStore(name) {
  if (process.env.NETLIFY_BLOBS_CONTEXT) {
    // Automatic context is present — let the SDK use it as intended.
    return getStore(name);
  }

  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_FUNCTIONS_TOKEN || process.env.NETLIFY_TOKEN;

  if (siteID && token) {
    return getStore({ name, siteID, token });
  }

  // Neither automatic context nor the manual fallback env vars are
  // available — let the SDK throw its normal descriptive error.
  return getStore(name);
}
