from fastapi import APIRouter, HTTPException
import near_api.account
import near_api.providers
import near_api.signer
from app.utils.agent_utils import AGENT_REGISTRY, load_agents_on_startup
from app.utils.mongodb_utils import create_capital, get_capital, fetch_capital, update_capital, update_capital_status, \
    delete_capital, sell_tokens
from pydantic import BaseModel
from typing import Literal
from bson import ObjectId
import os
import json
import near_api

router = APIRouter()


class UpdateStatusRequest(BaseModel):
    status: Literal["CREATED", "OPENED", "CLOSED"]


MAX_GAS = 300 * 10 ** 12


def account(account_path):
    RPC_NODE_URL = 'https://rpc.mainnet.near.org'
    content = json.load(open(os.path.expanduser(account_path), 'r'))
    near_provider = near_api.providers.JsonProvider(RPC_NODE_URL)
    key_pair = near_api.signer.KeyPair(content["private_key"])
    signer = near_api.signer.Signer(content["account_id"], key_pair)
    return near_api.account.Account(near_provider, signer, content["account_id"])


@router.post("/create-capital")
def create_capital_data(capital_data: dict):
    try:
        deposit_hash = capital_data["deposit_hash"]
        tokens_to_buy = capital_data["tokens_to_buy"]
        receiver_id = capital_data["receiver_id"]
        total_zec = capital_data["total_zec"]  # 100000000

        print("Body:", capital_data)

        # Perform swap operation
        # TODO: Implement SWAP logic

        capital_id = create_capital(tokens_to_buy, receiver_id, total_zec, deposit_hash=deposit_hash)

        return {"success": True, "message": f"Capital {capital_id} created successfully!"}

    except KeyError as e:
        return {"success": False, "message": f"Missing field: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}


@router.get("/capital/{capital_id}")
def get_capital_route(capital_id: str):
    capital = get_capital(capital_id)
    if capital:
        return capital
    return {"success": False, "message": f"Capital {capital_id} does not exist!"}


@router.get("/capital")
def fetch_capital_route(receiver_id: str = None):
    try:
        return fetch_capital(receiver_id=receiver_id)
    except ValueError as e:
        return {"success": False, "message": f"Capitals for {receiver_id} does not exist!"}


@router.patch("/capital/{capital_id}/status")
async def update_capital_status_route(
        capital_id: str,
        request: UpdateStatusRequest
):
    # Validate ObjectId
    if not ObjectId.is_valid(capital_id):
        raise HTTPException(status_code=400, detail="Invalid capital ID")

    # Call database utility
    modified_count = update_capital_status(capital_id, request.status)

    # Handle result
    if modified_count == 0:
        raise HTTPException(status_code=404, detail="Capital not found or no change made")

    return {"message": "Capital status updated successfully"}


@router.put("/capital/{capital_id}")
def update_capital_route(capital_id: str, data: dict):
    try:
        modified_count = update_capital(
            capital_id=capital_id,
            tokens_to_buy=data.get("tokens_to_buy"),
            receiver_id=data.get("receiver_id"),
            total_zec=data.get("total_zec"),
            status=data.get("status"),
            deposit_hash=data.get("deposit_hash")
        )
        return {"success": True, "modified_count": modified_count, "message": f"Capital updated ssuccessfully!"}
    except KeyError as e:
        return {"success": False, "message": f"Missing field: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}


@router.delete("/capital/{capital_id}")
def delete_capital_route(capital_id: str):
    deleted_count = delete_capital(capital_id)
    if deleted_count:
        return {"success": True, "deleted_count": deleted_count}
    raise HTTPException(status_code=404, detail="Capital not found")


@router.post("/capital/close-position/{capital_id}")
def close_position(capital_id: str):
    close_pos = sell_tokens(capital_id)
    return {"success": True, "message": "Position Closed"}
