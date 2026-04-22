"""Structured output with Pydantic models.

Demonstrates using to_response_format() to get JSON output that conforms
to a Pydantic schema.  The gateway passes the json_schema to the provider
so the LLM is constrained to produce valid structured data.
"""

import json
import os

from pydantic import BaseModel

from agentcc import AgentCC, to_response_format

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")


# Define your schema as a Pydantic model
class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]


client = AgentCC(api_key=API_KEY, base_url=BASE_URL)

# to_response_format() converts a Pydantic class into the OpenAI json_schema format
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract event details from the text."},
        {"role": "user", "content": "Alice and Bob are meeting for lunch on Friday."},
    ],
    response_format=to_response_format(CalendarEvent),
)

# The response content is a JSON string matching our schema
raw_json = response.choices[0].message.content
print("Raw JSON:", raw_json)

# Parse into the Pydantic model for type-safe access
event = CalendarEvent.model_validate_json(raw_json)
print(f"Event: {event.name}")
print(f"Date: {event.date}")
print(f"Participants: {', '.join(event.participants)}")

# You can also validate manually with validate_json_response()
from agentcc import validate_json_response

schema = CalendarEvent.model_json_schema()
is_valid = validate_json_response(raw_json, schema)
print(f"Schema valid: {is_valid}")

client.close()
