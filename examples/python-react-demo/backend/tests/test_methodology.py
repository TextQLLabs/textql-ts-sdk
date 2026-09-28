import json
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from textql_sdk import Textql

from app import textql_router


class CreateChatMethodologyTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.requests = []

        def upstream(request):
            self.requests.append(request)
            return httpx.Response(200, json={"chat": {"id": "test-chat"}})

        self.upstream = httpx.AsyncClient(transport=httpx.MockTransport(upstream))
        self.sdk = Textql(
            api_key="test-api-key",
            server_url="https://textql.example/rpc/public",
            async_client=self.upstream,
        )
        app = FastAPI()
        app.include_router(textql_router.router)
        self.client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        )
        self.sdk_patch = patch.object(textql_router, "_sdk", self.sdk)
        self.sdk_patch.start()

    async def asyncTearDown(self):
        self.sdk_patch.stop()
        await self.client.aclose()
        await self.upstream.aclose()

    async def test_forwards_methodology_to_sdk_request(self):
        for methodology in (
            "METHODOLOGY_UNKNOWN",
            "METHODOLOGY_ADAPTIVE",
            "METHODOLOGY_PRESCRIPTIVE",
            "METHODOLOGY_THOROUGH",
            "METHODOLOGY_CAREFUL",
            "METHODOLOGY_ONTOLOGY_BUILDING",
        ):
            with self.subTest(methodology=methodology):
                response = await self.client.post(
                    "/v3/textql/chats",
                    json={"connector_ids": [123], "methodology": methodology},
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json(), {"chat_id": "test-chat"})
                request = self.requests[-1]
                self.assertEqual(
                    request.url.path,
                    "/rpc/public/textql.rpc.public.chat.ChatService/CreateChat",
                )
                payload = json.loads(request.content)
                self.assertEqual(payload["methodology"], methodology)
                self.assertEqual(payload["model"], "MODEL_OPUS_4_8")

    async def test_omitted_or_null_methodology_preserves_server_default(self):
        for fields in ({}, {"methodology": None}):
            with self.subTest(fields=fields):
                response = await self.client.post(
                    "/v3/textql/chats", json={"connector_ids": [123], **fields}
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertNotIn("methodology", json.loads(self.requests[-1].content))

    async def test_non_string_methodology_is_rejected_before_sdk_call(self):
        for methodology in (3, True, [], {}):
            with self.subTest(methodology=methodology):
                response = await self.client.post(
                    "/v3/textql/chats",
                    json={"connector_ids": [123], "methodology": methodology},
                )
                self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.requests, [])
