// Streams the approved OpenBarnyard data archive from Internet Archive.
// The upstream URL is fixed so this endpoint cannot be used as an open proxy.
const DATA_URL = "https://archive.org/download/data.tar_202611/Data.tar.gz";

export async function onRequest({ request }) {
	if (request.method !== "GET" && request.method !== "HEAD")
		return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });

	const headers = new Headers();
	for (const name of ["Range", "If-Range"]) {
		const value = request.headers.get(name);
		if (value)
			headers.set(name, value);
	}

	let upstream;
	try {
		upstream = await fetch(DATA_URL, {
			method: request.method,
			headers,
			redirect: "follow"
		});
	} catch (error) {
		return new Response("The data archive could not be reached: " + error.message, { status: 502 });
	}

	const responseHeaders = new Headers({
		"Content-Type": "application/gzip",
		"Content-Disposition": 'attachment; filename="Data.tar.gz"',
		"Cache-Control": "public, max-age=3600",
		"X-Content-Type-Options": "nosniff"
	});

	for (const name of ["Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"]) {
		const value = upstream.headers.get(name);
		if (value)
			responseHeaders.set(name, value);
	}

	return new Response(request.method === "HEAD" ? null : upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders
	});
}
