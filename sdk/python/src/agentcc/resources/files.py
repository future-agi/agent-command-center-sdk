"""Files resource — file management with full AgentCC integration."""

from __future__ import annotations

from typing import Any

from agentcc._base_client import RequestOptions
from agentcc._constants import NOT_GIVEN
from agentcc._agentcc_params import build_extra_headers, collect_agentcc_params, merge_session_headers
from agentcc.types.files import FileDeleted, FileList, FileObject


class Files:
    """Sync files resource."""

    def __init__(self, client: Any) -> None:
        self._client = client

    def create(
        self,
        *,
        file: Any,
        purpose: str,
        # AgentCC-specific params
        session_id: Any = NOT_GIVEN,
        trace_id: Any = NOT_GIVEN,
        request_metadata: Any = NOT_GIVEN,
        properties: dict[str, str] | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileObject:
        agentcc_params = collect_agentcc_params(
            session_id=session_id, trace_id=trace_id,
            request_metadata=request_metadata,
        )

        extra_hdrs = build_extra_headers(
            extra_headers=extra_headers, properties=properties,
            user_id=user_id, request_id=request_id,
        )
        extra_hdrs = merge_session_headers(self._client, extra_hdrs)

        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="POST",
            url="/v1/files",
            headers=extra_hdrs,
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        base = self._client._get_base_client()
        url = base._build_url(opts.url)
        headers = base._build_headers(opts, agentcc_params)
        headers.pop("Content-Type", None)
        headers.pop("content-type", None)
        timeout_val = opts.timeout or base._timeout
        client = base._ensure_client()
        response = client.request(
            method=opts.method,
            url=url,
            files={"file": file},
            data={"purpose": purpose},
            headers=headers,
            timeout=timeout_val,
        )
        if response.status_code >= 400:
            base._process_error(response)
        return base._process_response_body(response, FileObject)

    def list(
        self,
        *,
        purpose: str | None = None,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileList:
        from agentcc._utils import parse_timeout

        url = "/v1/files"
        if purpose is not None:
            url = f"/v1/files?purpose={purpose}"

        opts = RequestOptions(
            method="GET",
            url=url,
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return self._client._get_base_client()._request_with_retry(opts, FileList)

    def retrieve(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileObject:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="GET",
            url=f"/v1/files/{file_id}",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return self._client._get_base_client()._request_with_retry(opts, FileObject)

    def content(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> bytes:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="GET",
            url=f"/v1/files/{file_id}/content",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        base = self._client._get_base_client()
        url = base._build_url(opts.url)
        headers = base._build_headers(opts)
        timeout_val = opts.timeout or base._timeout
        client = base._ensure_client()
        response = client.request(
            method=opts.method,
            url=url,
            headers=headers,
            timeout=timeout_val,
        )
        if response.status_code >= 400:
            base._process_error(response)
        return response.content

    def delete(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileDeleted:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="DELETE",
            url=f"/v1/files/{file_id}",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return self._client._get_base_client()._request_with_retry(opts, FileDeleted)


class AsyncFiles:
    """Async files resource."""

    def __init__(self, client: Any) -> None:
        self._client = client

    async def create(
        self,
        *,
        file: Any,
        purpose: str,
        # AgentCC-specific params
        session_id: Any = NOT_GIVEN,
        trace_id: Any = NOT_GIVEN,
        request_metadata: Any = NOT_GIVEN,
        properties: dict[str, str] | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileObject:
        agentcc_params = collect_agentcc_params(
            session_id=session_id, trace_id=trace_id,
            request_metadata=request_metadata,
        )

        extra_hdrs = build_extra_headers(
            extra_headers=extra_headers, properties=properties,
            user_id=user_id, request_id=request_id,
        )
        extra_hdrs = merge_session_headers(self._client, extra_hdrs)

        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="POST",
            url="/v1/files",
            headers=extra_hdrs,
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        base = self._client._get_base_client()
        url = base._build_url(opts.url)
        headers = base._build_headers(opts, agentcc_params)
        headers.pop("Content-Type", None)
        headers.pop("content-type", None)
        timeout_val = opts.timeout or base._timeout
        client = base._ensure_client()
        response = await client.request(
            method=opts.method,
            url=url,
            files={"file": file},
            data={"purpose": purpose},
            headers=headers,
            timeout=timeout_val,
        )
        if response.status_code >= 400:
            base._process_error(response)
        return base._process_response_body(response, FileObject)

    async def list(
        self,
        *,
        purpose: str | None = None,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileList:
        from agentcc._utils import parse_timeout

        url = "/v1/files"
        if purpose is not None:
            url = f"/v1/files?purpose={purpose}"

        opts = RequestOptions(
            method="GET",
            url=url,
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return await self._client._get_base_client()._request_with_retry(opts, FileList)

    async def retrieve(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileObject:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="GET",
            url=f"/v1/files/{file_id}",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return await self._client._get_base_client()._request_with_retry(opts, FileObject)

    async def content(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> bytes:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="GET",
            url=f"/v1/files/{file_id}/content",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        base = self._client._get_base_client()
        url = base._build_url(opts.url)
        headers = base._build_headers(opts)
        timeout_val = opts.timeout or base._timeout
        client = base._ensure_client()
        response = await client.request(
            method=opts.method,
            url=url,
            headers=headers,
            timeout=timeout_val,
        )
        if response.status_code >= 400:
            base._process_error(response)
        return response.content

    async def delete(
        self,
        file_id: str,
        *,
        extra_headers: dict[str, str] | None = None,
        timeout: Any = NOT_GIVEN,
    ) -> FileDeleted:
        from agentcc._utils import parse_timeout

        opts = RequestOptions(
            method="DELETE",
            url=f"/v1/files/{file_id}",
            headers=extra_headers or {},
            timeout=parse_timeout(timeout) if timeout is not NOT_GIVEN else None,
        )
        return await self._client._get_base_client()._request_with_retry(opts, FileDeleted)
