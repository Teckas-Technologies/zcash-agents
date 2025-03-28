import requests
import json
import base64
from decimal import Decimal

def parse_balance(balance_str: str, decimals: int = 8) -> str:
    balance = Decimal(balance_str)
    human_readable = balance / (10 ** decimals)
    return format(human_readable, 'f')

def get_balance(account_id: str, token_address: str):
    rpc_url = "https://rpc.mainnet.near.org"
    args = {
        "account_id": account_id,
        "token_ids": [f"nep141:{token_address}"]
    }

    args_base64 = base64.b64encode(json.dumps(args).encode("utf-8")).decode("utf-8")

    payload = {
        "jsonrpc": "2.0",
        "id": "dontcare",
        "method": "query",
        "params": {
            "request_type": "call_function",
            "account_id": "intents.near",
            "method_name": "mt_batch_balance_of",
            "args_base64": args_base64,
            "finality": "optimistic"
        }
    }

    response = requests.post(rpc_url, json=payload)
    result = response.json()

    if 'error' in result:
        print("Error from NEAR RPC:", result['error'])
        return None

    # Decode and parse the result
    raw_result = result['result']['result']
    decoded_bytes = bytes(raw_result)
    decoded_str = decoded_bytes.decode('utf-8')
    return json.loads(decoded_str)

# Example usage
# raw_balance = get_balance("varatharaj.near", "zec.omft.near")
# zec_balance = parse_balance(raw_balance[0], decimals=8)
# print("ZEC Balance (formatted):", zec_balance)
