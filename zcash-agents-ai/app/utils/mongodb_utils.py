from fastapi import HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from app.config import MONGODB_URI
from langgraph.checkpoint.mongodb import MongoDBSaver
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from bson.objectid import ObjectId
from decimal import Decimal
from app.utils.swap_utils import intent_swap, agent_account, register_intent_public_key, transfer_to_user
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.start()

ZEC_ADDRESS = "nep141:zec.omft.near"
ZEC_DECIMALS = 8

# Connect to MongoDB
mongodb_client = MongoClient(MONGODB_URI)
db = mongodb_client.get_database("memory_db")  # Database name
messages_collection = db["messages"]  # Collection name
agents_collection = db["agents"]
capital_collection = db["capitals"]
swap_details_collection = db["swap_details"]


# CRUD Operations for Capital Collection

def swap_tokens(capital_data):
    account1 = agent_account()
    # register_intent_public_key(account1)
    total_zec = float(capital_data.get("total_zec"))  # Ensure total_zec is a float
    tokens_to_buy = []
    for token_to_buy in capital_data.get("tokens_to_buy"):
        percentage = token_to_buy.get("share")  # Already a float
        total_token = total_zec * (percentage / 100)  # Fix multiplication logic
        defuce_asset_id = token_to_buy.get("defuse_asset_id")
        decimals = token_to_buy.get("decimals")
        res = intent_swap(account1, ZEC_ADDRESS, total_token, defuce_asset_id, ZEC_DECIMALS, decimals)
        print(res)
        token_to_buy["amount"] = res["token_amount"]
        print("Bought Token:", token_to_buy)
        tokens_to_buy.append(token_to_buy)

    return tokens_to_buy


def sell_tokens(capital_id):
    account1 = agent_account()
    capital = get_capital(capital_id)
    if capital is None:
        return

    total_zec = 0  # Accumulate ZEC from selling tokens
    sold_tokens = []

    for token_to_sell in capital.get("tokens_to_buy", []):
        defuce_asset_id = token_to_sell.get("defuse_asset_id")
        decimals = token_to_sell.get("decimals")

        raw_amount = Decimal(token_to_sell.get("amount"))  # Use Decimal for precision
        parsed_amount = float(raw_amount / (10 ** decimals))

        # Swap tokens back to ZEC
        res = intent_swap(account1, defuce_asset_id, parsed_amount, ZEC_ADDRESS, decimals, ZEC_DECIMALS)
        print(res)

        # Accumulate total ZEC
        token_amount = float(res.get("token_amount", "0"))  # Ensure numeric type
        total_zec += token_amount

        sold_tokens.append(token_to_sell)

        print("Sold Token:", token_to_sell)

    capital["final_zec"] = str(total_zec / (10 ** ZEC_DECIMALS))

    transfer_to_user(account1, capital.get("receiver_id"), total_zec)

    update_capital(
        capital_id=capital_id,
        tokens_to_buy=capital.get("tokens_to_buy"),
        receiver_id=capital.get("receiver_id"),
        total_zec=capital.get("total_zec"),
        status="CLOSED",
        deposit_hash=capital.get("deposit_hash"),
        final_zec=capital.get("final_zec")
    )

    print("Updated Capital:", capital)


def create_capital(tokens_to_buy, receiver_id, total_zec, deposit_hash=None, status="CREATED"):
    if not isinstance(tokens_to_buy, list):
        raise ValueError("tokens_to_buy must be a list of objects")
    created_at = datetime.now()
    capital_data = {
        "tokens_to_buy": tokens_to_buy,
        "receiver_id": receiver_id,
        "total_zec": total_zec,
        "status": status,
        "deposit_hash": deposit_hash,
        "created_at": created_at
    }
    result = capital_collection.insert_one(capital_data)
    updated_tokens_to_buy = swap_tokens(capital_data)

    capital_collection.update_one(
        {"_id": result.inserted_id},  # Filter by document ID
        {"$set": {"tokens_to_buy": updated_tokens_to_buy, "status": "OPENED"}}  # Update field
    )

    # Schedule exit_capital 24 hours later
    # exit_time = created_at + timedelta(days=1)
    exit_time = created_at + timedelta(minutes=5)
    scheduler.add_job(sell_tokens, 'date', run_date=exit_time, args=[str(result.inserted_id)])

    return str(result.inserted_id)


def get_capital(capital_id):
    capital = capital_collection.find_one({"_id": ObjectId(capital_id), "status": {"$ne": "closed"}})
    if capital:
        capital["_id"] = str(capital["_id"])  # Convert ObjectId to string
    return capital


def fetch_capital(capital_id=None, receiver_id=None):
    if capital_id:
        capital = capital_collection.find_one({"_id": ObjectId(capital_id)})
        if capital:
            capital["_id"] = str(capital["_id"])
        return capital
    elif receiver_id:
        capitals = list(capital_collection.find({"receiver_id": receiver_id}))
        for capital in capitals:
            capital["_id"] = str(capital["_id"])  # Convert ObjectId to string
        return capitals
    else:
        raise ValueError("Provide either capital_id or receiver_id")


def update_capital(capital_id, tokens_to_buy=None, receiver_id=None, total_zec=None, status=None, deposit_hash=None,
                   final_zec=None):
    if tokens_to_buy and not isinstance(tokens_to_buy, list):
        raise ValueError("tokens_to_buy must be a list of objects")

    update_data = {key: value for key, value in locals().items() if key != "capital_id" and value is not None}
    result = capital_collection.update_one({"_id": ObjectId(capital_id)}, {"$set": update_data})
    return result.modified_count


def update_capital_status(capital_id, status):
    result = capital_collection.update_one({"_id": ObjectId(capital_id)}, {"$set": {"status": status}})
    return result.modified_count


def delete_capital(capital_id):
    result = capital_collection.delete_one({"_id": ObjectId(capital_id)})
    return result.deleted_count


# =============== AGENTS CRUD =================

# ✅ Store Agent in DB
def save_agent_to_db(agent_id, agent_name, blockchain, abi_details, function_mappings):
    """
    Stores agent details in MongoDB.
    """
    agent_data = {
        "agentName": agent_name,
        "blockchain": blockchain,
        "abiDetails": abi_details,
        "functionMappings": function_mappings,
        "agentId": agent_id

    }
    agents_collection.update_one({"agentName": agent_name}, {"$set": agent_data}, upsert=True)


def update_agent_to_db(agent_id: str, agent_name: str, blockchain: str, abi_details: dict, function_mappings: str):
    """
    Stores agent details in MongoDB.
    """
    agent_data = {
        "agentName": agent_name,
        "blockchain": blockchain,
        "abiDetails": abi_details,
        "functionMappings": function_mappings,
        "agentId": agent_id
    }
    agents_collection.update_one({"agentId": agent_id}, {"$set": agent_data}, upsert=True)


# ✅ Load All Agents from DB
def load_agents_from_db():
    """
    Loads all agents from MongoDB.
    """
    agents = list(agents_collection.find({}, {"_id": 0}))  # ✅ Fetch all agents, exclude MongoDB `_id`

    if not agents:
        print("⚠️ No agents found in MongoDB.")

    return agents


# ✅ Get a Specific Agent
def get_agent_from_db(agent_name):
    """
    Retrieves a specific agent from MongoDB.
    """
    return agents_collection.find_one({"agentName": agent_name}, {"_id": 0})


def fetch_user_history(user_id, thread_id):
    config = {"configurable": {"thread_id": f"{user_id}-{thread_id}"}}

    checkpointer = MongoDBSaver(
        mongodb_client,
        db_name="new_memory_1",
        checkpoint_ns="AGY"
    )

    history = checkpointer.get_tuple(config)

    if history is None:
        print("🚨 ERROR: Checkpoint tuple is None!")
        return []

    print("CHECKPOINT TUPLE TYPE:", type(history))

    if hasattr(history, 'checkpoint'):
        checkpoint_data = history.checkpoint  # Access the dictionary part
    elif isinstance(history, tuple):
        print("CHECKPOINT TUPLE LENGTH:", len(history))
        checkpoint_data = history[1]  # Assuming second element is the dictionary
    else:
        checkpoint_data = history  # Use it directly if it's already a dictionary

    if checkpoint_data is None:
        print("🚨 ERROR: Checkpoint data is None!")
        return []

    print("CHECKPOINT DATA KEYS:", checkpoint_data.keys())

    messages = checkpoint_data.get('channel_values', {}).get('messages', [])

    print("EXTRACTED MESSAGES:", messages)

    parsed_messages = []
    for message in messages:
        if isinstance(message, HumanMessage):
            role = "human"
        elif isinstance(message, AIMessage):
            role = "ai"
        # elif isinstance(message, ToolMessage):
        #     role = "tool"
        else:
            print("UNKNOWN MESSAGE TYPE:", type(message))
            continue

        parsed_messages.append({"role": role, "message": message.content, "message_id": message.id})

    return parsed_messages


def delete_messages_by_thread_id(user_id, thread_id):
    try:
        db = mongodb_client.get_database("new_memory_1")
        collection = db["checkpoints"]  # Assuming "AGY" is the collection name

        result = collection.delete_many({"thread_id": f"{user_id}-{thread_id}"})

        print("RES:", result)

        if result.deleted_count > 0:
            print(f"✅ Successfully deleted {result.deleted_count} messages for thread_id: {thread_id}")
            return True
        else:
            print("🚨 No messages found for the given thread_id!")
            return False
    except Exception as e:
        print(f"🚨 ERROR: Failed to delete messages - {e}")
        return False


# Create a new swap detail record
def create_swap_detail(swap_data: dict):
    data = {
        "from_token": swap_data.get("from_token"),
        "to_token": swap_data.get("to_token"),
        "from_amount": swap_data.get("from_amount"),
        "to_amount": swap_data.get("to_amount"),
        "wallet_address": swap_data.get("wallet_address"),
        "tx_hash": swap_data.get("tx_hash"),
        "time": datetime.now()
    }
    result = swap_details_collection.insert_one(data)
    return {"success": True, "message": "Swap created Successfully!"}


def get_all_swaps_by_wallet_address(wallet_address: str, skip: int = 0, limit: int = 10):
    swaps = swap_details_collection.find({"wallet_address": wallet_address}).skip(skip).limit(limit)
    # Convert the result to a list of dictionaries and return
    return [swap_details_to_dict(swap) for swap in swaps]


def swap_details_to_dict(swap):
    swap_dict = dict(swap)  # Convert the BSON document to a dictionary
    swap_dict["_id"] = str(swap["_id"])  # Convert ObjectId to string
    return swap_dict
