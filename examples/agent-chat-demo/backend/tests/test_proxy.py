import unittest

import httpx

from app.main import MAX_REQUEST_BYTES, app


class ProxyTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.requests = []

        def handle(request):
            self.requests.append(request)
            if request.url.path.endswith("/send"):
                return httpx.Response(
                    200,
                    content=b'data: {"type":"runComplete"}\n\n',
                    headers={"content-type": "text/event-stream"},
                )
            if request.url.path.endswith("/fail"):
                return httpx.Response(409, json={"detail": "Agent attachment failed"})
            if request.url.path.endswith("/preview-proxy"):
                return httpx.Response(
                    200,
                    content=b"<html>Preview</html>",
                    headers={
                        "content-type": "text/html",
                        "content-security-policy": "sandbox allow-scripts",
                        "x-content-type-options": "nosniff",
                        "content-disposition": "inline",
                    },
                )
            return httpx.Response(200, json={"files": []})

        self.sdk = httpx.AsyncClient(
            base_url="http://127.0.0.1:8788",
            headers={"X-SDK-Token": "private-test-token"},
            transport=httpx.MockTransport(handle),
        )
        app.state.sdk_client = self.sdk
        self.client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app), base_url="http://test"
        )

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.sdk.aclose()

    async def test_upload_forwards_bytes_and_private_token_not_browser_credentials(
        self,
    ):
        response = await self.client.post(
            "/v3/textql/chats/chat-id/files?mode=csv",
            files={"file": ("sales.csv", b"month,revenue\nJan,100\n", "text/csv")},
            headers={"Authorization": "browser-secret", "X-SDK-Token": "spoofed"},
        )
        self.assertEqual(response.json(), {"files": []})
        forwarded = self.requests[0]
        self.assertEqual(forwarded.url.query, b"mode=csv")
        self.assertIn(b"month,revenue\nJan,100\n", forwarded.content)
        self.assertTrue(
            forwarded.headers["content-type"].startswith("multipart/form-data;")
        )
        self.assertEqual(forwarded.headers["X-SDK-Token"], "private-test-token")
        self.assertNotIn("authorization", forwarded.headers)
        self.assertNotIn("x-sdk-token", response.headers)

    async def test_stream_and_error_status_are_preserved(self):
        response = await self.client.post(
            "/v3/textql/chats/chat-id/send", json={"message": "Hi"}
        )
        self.assertEqual(response.text, 'data: {"type":"runComplete"}\n\n')
        self.assertIn("text/event-stream", response.headers["content-type"])
        response = await self.client.get("/v3/textql/fail")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json(), {"detail": "Agent attachment failed"})

    async def test_oversized_body_never_reaches_sdk_service(self):
        response = await self.client.post(
            "/v3/textql/chats/chat-id/files", content=b"x" * (MAX_REQUEST_BYTES + 1)
        )
        self.assertEqual(response.status_code, 413)
        self.assertEqual(self.requests, [])

    async def test_preview_security_headers_survive_the_proxy(self):
        response = await self.client.get(
            "/v3/textql/preview-proxy?url=https://example.test/chart"
        )
        self.assertEqual(
            response.headers["content-security-policy"], "sandbox allow-scripts"
        )
        self.assertEqual(response.headers["x-content-type-options"], "nosniff")
        self.assertEqual(response.headers["content-disposition"], "inline")

    async def test_sdk_connection_failure_is_a_safe_gateway_error(self):
        def fail(request):
            raise httpx.ConnectError("private diagnostic", request=request)

        async with httpx.AsyncClient(
            base_url="http://127.0.0.1:8788", transport=httpx.MockTransport(fail)
        ) as client:
            app.state.sdk_client = client
            response = await self.client.get("/v3/textql/chats")
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private diagnostic", response.text)


if __name__ == "__main__":
    unittest.main()
