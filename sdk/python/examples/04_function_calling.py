"""Function calling (tool use) with the AgentCC SDK.

Demonstrates defining tools, sending them to the model, handling
tool_calls in the response, and sending results back for a final answer.
"""

import json
import os

from agentcc import AgentCC

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

client = AgentCC(api_key=API_KEY, base_url=BASE_URL)

# Define tools using the standard OpenAI tool format
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]


# Simulate calling the actual function
def get_weather(location: str, unit: str = "celsius") -> str:
    return json.dumps({"location": location, "temperature": 22, "unit": unit, "condition": "sunny"})


# Step 1: Send the user message with tools
messages = [{"role": "user", "content": "What's the weather in Paris?"}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # Let the model decide whether to call a tool
)

assistant_msg = response.choices[0].message
print(f"Finish reason: {response.choices[0].finish_reason}")

# Step 2: If the model wants to call tools, execute them
if assistant_msg.tool_calls:
    # Append the assistant message (with tool_calls) to the conversation
    messages.append({
        "role": "assistant",
        "content": assistant_msg.content,
        "tool_calls": [
            {"id": tc.id, "type": tc.type, "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
            for tc in assistant_msg.tool_calls
        ],
    })

    for tool_call in assistant_msg.tool_calls:
        print(f"Tool call: {tool_call.function.name}({tool_call.function.arguments})")
        args = json.loads(tool_call.function.arguments)
        result = get_weather(**args)

        # Append the tool result to the conversation
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": result,
        })

    # Step 3: Send the tool results back for the final answer
    final_response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
    )
    print(f"Final answer: {final_response.choices[0].message.content}")
else:
    print(f"Direct answer: {assistant_msg.content}")

client.close()
