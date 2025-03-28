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


def create_trade_agent():

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
        
    
    def invest_zec(*args):
        try:
            """Prepares details for investment."""
            if not args or not args[0]:
                raise ValueError("Wallet address is required")

            wallet_address = args[0]
            print("Wallet Address:", wallet_address)

            raw_balance = get_balance(wallet_address, "zec.omft.near")
            if not raw_balance or not isinstance(raw_balance, list):
                raise ValueError("Invalid balance response")

            zec_balance = parse_balance(raw_balance[0], decimals=8)
            trends_tokens = trend_tokens()

            return {
                "amount": zec_balance,
                "tokens_to_invest": json.dumps(trends_tokens),
                "type": "invest",
                "success": True
            }
        except Exception as e:
            return {
                "message": str(e),
                "type": "invest",
                "success": False
            }

    fetch_balance_tool = Tool(
        name="fetch_zec_balance",
        func=fetch_balance,
        description="This tool is to fetch the ZEC balance. If user asks for fetch balance, call the tool and return the "
                    "tool response."
                    "- `address` must be a string.\n"
                    "Call this tool only when all parameters are correctly provided."
    )

    invest_zec_tool = Tool(
        name="invest_zec",
        func=invest_zec,
        description="This tool allows investing ZEC tokens in the top-picked momentum crypto tokens from the last 24 hours. "
                    "Required field:\n"
                    "- `address`: A string representing the recipient's address.\n"
                    "Call this tool only when all parameters are correctly provided."
    )

    # ✅ Bind tools to LLM
    llm_with_tools = llm.bind_tools([fetch_balance_tool, invest_zec_tool])

    # ✅ Define Assistant Node
    sys_msg = SystemMessage(
        content=(
            "You are an AI-powered Trading Agent. You are capable of doing investment and trading on NEAR intents by ZEC tokens. "
            "You can invest ZEC tokens in the top-picked momentum crypto tokens from the last 24 hours. "
            "If you found the user has the fund in their wallet or deposited funds, then you need to ask the user to confirm to invest the ZEC tokens. "
            "If the user has less than 0.01 ZEC in their wallet, ask the user to go to the bridge agent and bridge ZEC from their Zcash network wallet to NEAR intents before making the investment."
        )
    )

    def assistant(state: MessagesState):
        response = llm_with_tools.invoke([sys_msg] + state["messages"])
        return {"messages": state["messages"] + [response]}

    # ✅ Build Graph
    builder = StateGraph(MessagesState)
    builder.add_node("tools", ToolNode([fetch_balance_tool, invest_zec_tool]))
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
