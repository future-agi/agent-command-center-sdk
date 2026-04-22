"""Shared helpers for integration tests."""
from __future__ import annotations

from typing import Callable, TypeVar

import pytest
from agentcc._exceptions import (
    APIStatusError,
    BadGatewayError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)

T = TypeVar("T")


def skip_if_gateway_lacks_endpoint(fn: Callable[[], T]) -> T:
    """Run fn; skip (not fail) if the gateway doesn't have this endpoint/model
    configured. Distinguishes "gateway setup issue" from "SDK bug"."""
    try:
        return fn()
    except NotFoundError as e:
        pytest.skip(f"gateway returned 404: {e}")
    except InternalServerError as e:
        pytest.skip(f"gateway returned 500 (likely missing provider config): {e}")
    except BadGatewayError as e:
        pytest.skip(f"gateway returned 502 (upstream provider issue): {e}")
    except PermissionDeniedError as e:
        pytest.skip(f"gateway returned 403 (provider/model not permitted): {e}")
    except APIStatusError as e:
        code = getattr(e, "status_code", None)
        if code == 501:
            pytest.skip(f"gateway returned 501 (provider missing capability): {e}")
        if code == 403:
            pytest.skip(f"gateway returned 403 (provider/model not permitted): {e}")
        raise
