import json
from langchain_core.messages import SystemMessage
from langchain.tools import Tool
from langgraph.graph import START, StateGraph, MessagesState
from langgraph.prebuilt import tools_condition, ToolNode
from app.utils.openai_utils import llm
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient
from app.config import MONGODB_URI
import requests
from app.utils.intent_utils import get_balance, parse_balance
from app.utils.trends import trend_tokens


def create_swap_agent():
    
    def fetch_balance(*args):
        try:
            if not args or not args[0]:
                raise ValueError("Wallet address is required")

            wallet_address = args[0]
            print("Wallet Address:", wallet_address)

            raw_balance = get_balance(wallet_address, "zec.omft.near")
            if not raw_balance or not isinstance(raw_balance, list):
                raise ValueError("Invalid balance response")
            
            zec_balance = parse_balance(raw_balance[0], decimals=8)
            return {
                "zec_balance": zec_balance,
                "success": True
            }
        except Exception as e:
            return {
                "message": str(e),
                "type": "balance",
                "success": False
            }

    def swap_zec(*args):
        print(args)
        """Prepares a cross-chain bridge request between Sonic and Solana."""
        if not args or not args[0]:
            return {"response": "Error: No input data received. Please provide valid input.", "success": False}

        # Check if the input is already a dictionary or a JSON string
        params = args[0]
        if isinstance(params, str):
            try:
                params = json.loads(params)  # Parse JSON string to dictionary
            except json.JSONDecodeError as e:
                return {"response": f"Error: Invalid JSON format. Details: {str(e)}", "success": False}
        elif not isinstance(params, dict):
            return {"response": "Error: Input data is neither a JSON string nor a dictionary.", "success": False}

        required_fields = ["inputTokenSymbol", "outputTokenSymbol", "amount"]
        for field in required_fields:
            if field not in params or not params[field]:
                return {"response": f"Missing required field: {field}", "success": False}

        return {
            "inputTokenSymbol": params["inputTokenSymbol"],
            "outputTokenSymbol": params["outputTokenSymbol"],
            "amount": params["amount"],
            "type": "swap",
            "success": True
        }

    fetch_balance_tool = Tool(
        name="fetch_zec_balance",
        func=fetch_balance,
        description="This tool is to fetch the ZEC balance. If user asks for fetch balance, call the tool and return the "
                    "tool response."
                    "- `address` must be a string.\n"
                    "Call this tool only when all parameters are correctly provided."
    )

    swap_zec_tool = Tool(
        name="swap_zec",
        func=swap_zec,
        description="This tool is to swap ZEC to other tokens and other tokens to ZEC. Either input token or output "
                    "token should be ZEC. The Params are inputTokenSymbol, outputTokenSymbol, amount Ensure the following "
                    "details are provided:"
                    "- `inputTokenSymbol`: The token user want to swap from. This should be a token symbol "
                    "- `outputTokenSymbol`: The token user wants to swap to. This should be a token symbol"
                    "- `amount`: The amount of tokens to swap. This should be a number."
                    "Call this tool only when all parameters are correctly provided.",
    )

    # ✅ Bind tools to LLM
    llm_with_tools = llm.bind_tools([fetch_balance_tool, swap_zec_tool])

    # ✅ Define Assistant Node
    sys_msg = SystemMessage(
        content=(
            "You are an AI-powered Swapping Assistant. You can assist with swapping tokens on NEAR Intents. "
            "Ensure the account has sufficient balance to swap tokens. "
            "Call fetch_zec_balance tool to check balance. If the user has an insufficient balance to swap, ask the user to go to the bridge agent and bridge ZEC from their Zcash network wallet to NEAR intents before making the swap."
        )
    )

    def assistant(state: MessagesState):
        response = llm_with_tools.invoke([sys_msg] + state["messages"])
        return {"messages": state["messages"] + [response]}

    # ✅ Build Graph
    builder = StateGraph(MessagesState)
    builder.add_node("tools", ToolNode([fetch_balance_tool, swap_zec_tool]))
    builder.add_node("assistant", assistant)
    builder.add_edge(START, "assistant")
    # builder.add_conditional_edges("assistant", tools_condition)
    builder.add_conditional_edges("assistant", tools_condition, "tools")
    builder.add_edge("tools", "assistant")

    mongodb_client = MongoClient(MONGODB_URI)
    checkpointer = MongoDBSaver(
        mongodb_client,
        db_name="new_memory_1",
        checkpoint_ns="AGY"
    )

    graph = builder.compile(checkpointer=checkpointer)
    return graph
