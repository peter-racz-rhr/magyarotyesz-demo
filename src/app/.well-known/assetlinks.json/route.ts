/*
  Digital Asset Links: the file that lets the Android app (Google Play) open this site as itself,
  without the browser bar. Set these in the Vercel project, then redeploy:
    ANDROID_PACKAGE_NAME           e.g. hu.magyarotyesz.app (the package name you chose in PWABuilder)
    ANDROID_SHA256_FINGERPRINTS    the SHA-256 fingerprint(s) of the app signing key, comma separated
                                   (Play Console > App integrity > App signing, plus your upload key)
  Until both are set the answer is an empty list, which is valid and harmless.
*/
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME?.trim();
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const body = pkg && prints.length > 0 ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }] : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
}
