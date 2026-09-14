import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI

from app import textql_router


class PreviewProxyTests(unittest.IsolatedAsyncioTestCase):
    async def test_pdf_embeds_without_removing_html_sandbox(self):
        app = FastAPI()
        app.include_router(textql_router.router)
        # A URL ending in .pdf may return an HTML error page. MIME type,
        # rather than the filename, must determine whether it is sandboxed.
        for content_type, body, sandboxed in [
            ("application/pdf", b"%PDF-1.4\nfixture", False),
            ("application/pdf; charset=binary", b"%PDF-1.4\nfixture", False),
            ("text/html", b"<html><body>Error</body></html>", True),
            ("application/octet-stream", b"unknown", True),
        ]:
            with self.subTest(content_type=content_type):
                async with httpx.AsyncClient(
                    transport=httpx.MockTransport(
                        lambda request: httpx.Response(
                            200, content=body, headers={"content-type": content_type}
                        )
                    )
                ) as upstream:
                    with patch.object(textql_router, "_get_http", return_value=upstream):
                        async with httpx.AsyncClient(
                            transport=httpx.ASGITransport(app=app),
                            base_url="http://test",
                        ) as client:
                            response = await client.get(
                                "/v3/textql/preview-proxy",
                                params={"url": "https://textqlusercontent.com/asset/proxy/file.pdf"},
                            )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers["content-type"], content_type)
                self.assertEqual(response.headers["content-disposition"], "inline")
                self.assertEqual(response.headers["x-content-type-options"], "nosniff")
                self.assertEqual("content-security-policy" in response.headers, sandboxed)
                if sandboxed:
                    self.assertEqual(response.headers["content-security-policy"], "sandbox allow-scripts")
                self.assertIn(body, response.content)


if __name__ == "__main__":
    unittest.main()
