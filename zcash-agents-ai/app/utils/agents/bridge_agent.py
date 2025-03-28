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


def create_deposit_agent():
    BRIDGE_CHAINED_USER = "https://bridge.chaindefuser.com/rpc"

    def deposit_zec(*args):
        print("Args: ", args)
        wallet_address = args[0]
        print("Params: ", wallet_address)
        rpc_request = {
            "id": "dontcare",
            "jsonrpc": "2.0",
            "method": "deposit_address",
            "params": [{"account_id": wallet_address, "chain": "zec:mainnet"}]
        }

        response = requests.post(BRIDGE_CHAINED_USER, json=rpc_request)
        if response.ok:
            data = response.json().get("result", [])
            return {
                "address": data["address"],
                "chain": data["chain"],
                "type": "deposit",
                "success": True
            }
        else:
            return {
                "type": "deposit",
                "success": False
            }

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
    
    # def invest_zec(*args):
    #     """Prepares a details for invest."""
    #     print("Args: ", args)
    #     wallet_address = args[0]
    #     print("Params: ", wallet_address)
    #     raw_balance = get_balance(wallet_address, "zec.omft.near")
    #     zec_balance = parse_balance(raw_balance[0], decimals=8)
    #     trends_tokens = trend_tokens()
    #     return {
    #         "amount": zec_balance,
    #         "tokens_to_invest": json.dumps(trends_tokens),
    #         "type": "invest",
    #         "success": True
    #     }
    
    def withdraw_zec(*args):
        print(args)
        """Prepares a withdraw for zec token in zcash network."""
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

        required_fields = ["amount", "toAddress"]
        for field in required_fields:
            if field not in params or not params[field]:
                return {"response": f"Missing required field: {field}", "success": False}

        return {
            "amount": params["amount"],
            "toAddress": params["toAddress"],
            "type": "withdraw",
            "success": True
        }

    deposit_zec_tool = Tool(
        name="deposit_zec",
        func=deposit_zec,
        description="This tool is to create zec deposit address based on the near wallet address which user is giving. "
                    "require filed is address. NEAR Protocol, addresses can be either human-readable account IDs (like "
                    "jane.near) or implicit addresses (64 characters, like fb9243ce...), both representing the same "
                    "public key"
                    "- `address` must be a string.\n"
                    "Call this tool only when all parameters are correctly provided."
    )

    fetch_balance_tool = Tool(
        name="fetch_zec_balance",
        func=fetch_balance,
        description="This tool is to fetch the ZEC balance. If user asks for fetch balance, call the tool and return the "
                    "tool response."
                    "- `address` must be a string.\n"
                    "Call this tool only when all parameters are correctly provided."
    )

    # invest_zec_tool = Tool(
    #     name="invest_zec",
    #     func=invest_zec,
    #     description="This tool allows investing ZEC tokens in the top-picked momentum crypto tokens from the last 24 hours. "
    #                 "Required field:\n"
    #                 "- `address`: A string representing the recipient's address.\n"
    #                 "Call this tool only when all parameters are correctly provided."
    # )

    withdraw_zec_tool = Tool(
        name="withdraw_zec",
        func=withdraw_zec,
        description="This tool is to withdraw ZEC to Zcash network to address. "
                    "token should be ZEC. The Params are amount, toAddress Ensure the following "
                    "details are provided:"
                    "- `amount`: The amount of zec tokens to withdraw. This should be a number. "
                    "- `toAddress`: The to address in Zcash network to receive ZEC tokens."
                    "Call this tool only when all parameters are correctly provided.",
    )

    # ✅ Bind tools to LLM
    llm_with_tools = llm.bind_tools([deposit_zec_tool, fetch_balance_tool, withdraw_zec_tool])

    # ✅ Define Assistant Node
    # sys_msg = SystemMessage(
    #     content="You are an AI-powered Trading Agent. You are capable of doing deposit, swap, investment and trading, withdraw on Zcash network. Also invest ZEC tokens in the top-picked momentum crypto tokens from the last 24 hours. If you found the user has the fund in their wallet or deposited funds, then you neeed to ask user to confirm to invest the zec tokens."
    # )
    sys_msg = SystemMessage(
        content="You are an AI-powered Bridging Assistant. You can assist with deposits, fetching ZEC balances, and withdrawals to the Zcash network."
    )

    def assistant(state: MessagesState):
        response = llm_with_tools.invoke([sys_msg] + state["messages"])
        return {"messages": state["messages"] + [response]}

    # ✅ Build Graph
    builder = StateGraph(MessagesState)
    builder.add_node("tools", ToolNode([deposit_zec_tool, fetch_balance_tool, withdraw_zec_tool]))
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
