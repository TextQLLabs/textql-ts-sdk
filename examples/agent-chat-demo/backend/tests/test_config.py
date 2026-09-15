import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from textql_sdk._connect.public import agent_pb2, llm_model_pb2 as models

from app import textql_router


class AgentModelConfigTests(unittest.IsolatedAsyncioTestCase):
    async def test_model_comes_from_agent_then_org_then_system(self):
        for pinned, org_default, expected in [
            (models.MODEL_SONNET_5, models.MODEL_OPUS_5, "MODEL_SONNET_5"),
            (models.MODEL_UNKNOWN, models.MODEL_OPUS_5, "MODEL_OPUS_5"),
            (models.MODEL_UNKNOWN, None, "MODEL_OPUS_4_8"),
            (models.MODEL_UNKNOWN, models.MODEL_DEFAULT, "MODEL_OPUS_4_8"),
        ]:
            with self.subTest(pinned=pinned, org_default=org_default):
                payload, settings = await self.get_config(pinned, org_default)
                self.assertEqual(payload["model"], expected)
                if pinned != models.MODEL_UNKNOWN:
                    settings.assert_not_awaited()
                else:
                    settings.assert_awaited_once_with(body={})

    async def test_settings_failure_keeps_agent_configuration_available(self):
        payload, _ = await self.get_config(
            models.MODEL_UNKNOWN, None, error=RuntimeError("Settings unavailable")
        )
        self.assertEqual(payload["agent_id"], "test-agent")
        self.assertEqual(payload["model"], "MODEL_UNKNOWN")

    async def get_config(self, pinned, org_default, error=None):
        settings = AsyncMock(
            return_value=SimpleNamespace(organization=SimpleNamespace(
                default_llm_model=org_default,
                system_default_model=models.MODEL_OPUS_4_8,
            )),
            side_effect=error,
        )
        sdk = SimpleNamespace(
            rbac=SimpleNamespace(who_am_i_async=AsyncMock(return_value=SimpleNamespace(email=None))),
            settings=SimpleNamespace(get_async=settings),
        )
        streaming = SimpleNamespace(agents=SimpleNamespace(get_agent=AsyncMock(
            return_value=agent_pb2.GetAgentResponse(agent={
                "id": "test-agent", "name": "Test agent", "llm_model": pinned,
            })
        )))
        app = FastAPI()
        app.include_router(textql_router.router)
        with (
            patch.object(textql_router, "_sdk", sdk),
            patch.object(textql_router, "_streaming", streaming),
            patch.dict("os.environ", {"TEXTQL_AGENT_ID": "test-agent"}),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.get("/v3/textql/config")
        self.assertEqual(response.status_code, 200)
        return response.json(), settings
