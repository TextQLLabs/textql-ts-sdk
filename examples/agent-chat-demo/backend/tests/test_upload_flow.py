import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from textql_sdk._connect.public import chat_pb2, dataset_pb2

from app import textql_router


class UploadFlowTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.order = []
        self.history = []
        self.cell = chat_pb2.Cell(
            id="file-cell", complete=True,
            tabular_file_cell={"file_name": "revenue.csv", "dataset_source_id": "dataset-1"},
        )

        async def register(request):
            self.order.append("register")
            self.assertTrue(request.ephemeral)
            self.assertEqual(request.type, dataset_pb2.TYPE_TABULAR)
            return SimpleNamespace(dataset_id="dataset-1", dataset_version=1, presign_url="https://storage.test/upload")

        async def process(request):
            self.order.append("process")
            self.assertEqual(request.dataset_id, "dataset-1")
            return SimpleNamespace(dataset=dataset_pb2.Dataset(id="dataset-1"))

        async def attach(request):
            self.order.append("attach")
            self.assertEqual(request.chat_id, "chat-1")
            self.assertEqual(request.dataset_id, "dataset-1")
            self.history.append(self.cell)
            return chat_pb2.AttachDatasetResponse(
                cell=self.cell, dataset={"id": "dataset-1", "name": "revenue.csv"},
            )

        def transfer(request):
            self.order.append("transfer")
            self.assertEqual(request.method, "PUT")
            self.assertEqual(request.content, b"month,revenue\nJan,100\n")
            self.assertNotIn("authorization", request.headers)
            return httpx.Response(200)

        self.datasets = SimpleNamespace(
            create_upload_presign_url=AsyncMock(side_effect=register),
            process_upload_presign_url=AsyncMock(side_effect=process),
        )
        self.chats = SimpleNamespace(
            attach_dataset=AsyncMock(side_effect=attach),
            get_chat_history=AsyncMock(side_effect=lambda request: SimpleNamespace(cells=self.history, has_more=False)),
            get_chat=AsyncMock(return_value=chat_pb2.GetChatResponse(chat={"id": "chat-1", "agent_id": "agent-1"})),
            send_message=AsyncMock(return_value=chat_pb2.SendResponse(cell_id="user-cell")),
        )
        self.storage = httpx.AsyncClient(transport=httpx.MockTransport(transfer))
        app = FastAPI()
        app.include_router(textql_router.router)
        app.state.datasets = self.datasets
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")
        self.patches = [
            patch.object(textql_router, "_http", self.storage),
            patch.object(textql_router, "_streaming", SimpleNamespace(chats=self.chats)),
            patch.dict("os.environ", {"TEXTQL_AGENT_ID": "agent-1"}),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.storage.aclose()

    async def test_upload_finishes_without_chat_creation_or_attachment(self):
        response = await self.client.post("/v3/textql/files", files={
            "file": ("revenue.csv", b"month,revenue\nJan,100\n", "text/csv"),
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"file": {"id": "dataset-1", "name": "revenue.csv", "status": "uploaded"}})
        self.assertEqual(self.order, ["register", "transfer", "process"])
        self.chats.attach_dataset.assert_not_awaited()
        self.chats.get_chat.assert_not_awaited()
        self.chats.send_message.assert_not_awaited()
        self.chats.get_chat_history.assert_not_awaited()

    async def test_attachment_returns_confirmed_cell_without_sending(self):
        response = await self.client.post("/v3/textql/chats/chat-1/files/attach", json={"dataset_id": "dataset-1"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["file"]["cell_id"], "file-cell")
        self.chats.send_message.assert_not_awaited()
        self.assertEqual(self.order, ["attach"])
        # Recover a lost response without appending a duplicate attachment.
        response = await self.client.post("/v3/textql/chats/chat-1/files/attach", json={"dataset_id": "dataset-1"})
        self.assertEqual(response.status_code, 200)
        self.chats.attach_dataset.assert_awaited_once()

    async def test_attachment_rejects_a_chat_owned_by_another_agent(self):
        self.chats.get_chat.return_value = chat_pb2.GetChatResponse(chat={"id": "chat-1", "agent_id": "other-agent"})
        response = await self.client.post("/v3/textql/chats/chat-1/files/attach", json={"dataset_id": "dataset-1"})
        self.assertEqual(response.status_code, 409)
        self.chats.attach_dataset.assert_not_awaited()
        self.chats.send_message.assert_not_awaited()

    async def test_empty_upload_and_empty_message_are_rejected(self):
        response = await self.client.post("/v3/textql/files", files={"file": ("empty.csv", b"", "text/csv")})
        self.assertEqual(response.status_code, 400)
        self.datasets.create_upload_presign_url.assert_not_awaited()
        response = await self.client.post("/v3/textql/chats/chat-1/send", json={"message": " "})
        self.assertEqual(response.status_code, 422)
        self.chats.send_message.assert_not_awaited()
