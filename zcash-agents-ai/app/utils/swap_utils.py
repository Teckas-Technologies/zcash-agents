from typing import TypedDict, List, Dict, Union
import os
import json
import base64
import base58
import random
import requests
import near_api

from app.config import AGENT_PRIVATE_KEY, AGENT_WALLET_ADDRESS

MAX_GAS = 300 * 10 ** 12

SOLVER_BUS_URL = "https://solver-relay-v2.chaindefuser.com/rpc"

ASSET_MAP = {
    'USDC': {
        'token_id': '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        'omft': 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
        'decimals': 6,
    },
    'NEAR': {
        'token_id': 'wrap.near',
        'decimals': 24,
    }
}


class Intent(TypedDict):
    intent: str
    diff: Dict[str, str]


class Quote(TypedDict):
    nonce: str
    signer_id: str
    verifying_contract: str
    deadline: str
    intents: List[Intent]


class AcceptQuote(TypedDict):
    nonce: str
    recipient: str
    message: str


class Commitment(TypedDict):
    standard: str
    payload: Union[AcceptQuote, str]
    signature: str
    public_key: str


class SignedIntent(TypedDict):
    signed: List[Commitment]


class PublishIntent(TypedDict):
    signed_data: Commitment
    quote_hashes: List[str] = []


def account(account_path):
    RPC_NODE_URL = 'https://rpc.mainnet.near.org'
    content = json.load(open(os.path.expanduser(account_path), 'r'))
    near_provider = near_api.providers.JsonProvider(RPC_NODE_URL)
    key_pair = near_api.signer.KeyPair(content["private_key"])
    signer = near_api.signer.Signer(content["account_id"], key_pair)
    return near_api.account.Account(near_provider, signer, content["account_id"])


def to_decimals(amount, decimals):
    return str(int(amount * 10 ** decimals))


def register_token_storage(account, token, other_account=None):
    account_id = other_account if other_account else account.account_id
    balance = account.view_function(ASSET_MAP[token]['token_id'], 'storage_balance_of', {'account_id': account_id})[
        'result']
    if not balance:
        print('Register %s for %s storage' % (account_id, token))
        account.function_call(ASSET_MAP[token]['token_id'], 'storage_deposit',
                              {"account_id": account_id}, MAX_GAS, 1250000000000000000000)


def sign_quote(account, quote):
    quote_data = quote.encode('utf-8')
    signature = 'ed25519:' + base58.b58encode(account.signer.sign(quote_data)).decode('utf-8')
    public_key = 'ed25519:' + base58.b58encode(account.signer.public_key).decode('utf-8')
    return Commitment(standard="raw_ed25519", payload=quote, signature=signature, public_key=public_key)


def create_token_diff_quote(account, token_in, amount_in, token_out, amount_out):
    token_in_fmt = token_in
    token_out_fmt = token_out
    nonce = base64.b64encode(random.getrandbits(256).to_bytes(32, byteorder='big')).decode('utf-8')
    quote = json.dumps(Quote(
        signer_id=account.account_id,
        nonce=nonce,
        verifying_contract="intents.near",
        deadline="2025-12-31T11:59:59.000Z",
        intents=[
            Intent(intent='token_diff', diff={token_in_fmt: "-" + amount_in, token_out_fmt: amount_out})
        ]
    ))
    return sign_quote(account, quote)


def submit_signed_intent(account, signed_intent):
    account.function_call("intents.near", "execute_intents", signed_intent, MAX_GAS, 0)


def intent_deposit(account, token, amount):
    register_token_storage(account, token, other_account="intents.near")
    account.function_call(ASSET_MAP[token]['token_id'], 'ft_transfer_call', {
        "receiver_id": "intents.near",
        "amount": to_decimals(amount, ASSET_MAP[token]['decimals']),
        "msg": ""
    }, MAX_GAS, 1)

def transfer_to_user(account, receiver_id, amount):
    print("REQ: TRANSFER ->>", account, receiver_id, amount)
    account.function_call("intents.near", "mt_transfer", {
            "receiver_id": receiver_id,
            "token_id": "nep141:zec.omft.near",
            "amount": str(int(amount)),             
            "approval": None,
            "memo": None,
            "msg": "Deposit ZEC"           
        }, MAX_GAS, 1)


def register_intent_public_key(account):
    account.function_call("intents.near", "add_public_key", {
        "public_key": "ed25519:" + base58.b58encode(account.signer.public_key).decode('utf-8')
    }, MAX_GAS, 1)


class IntentRequest(object):
    """IntentRequest is a request to perform an action on behalf of the user."""

    def __init__(self, request=None, thread=None, min_deadline_ms=120000):
        self.request = request
        self.thread = thread
        self.min_deadline_ms = min_deadline_ms

    def asset_in(self, asset_name, amount, decimals):
        self.asset_in = {"asset": asset_name,
                         "amount": to_decimals(amount, decimals)}
        return self

    def asset_out(self, asset_name,decimals, amount=None):
        self.asset_out = {"asset": asset_name,
                          "amount": to_decimals(amount, decimals) if amount else None}
        return self

    def serialize(self):
        message = {
            "defuse_asset_identifier_in": self.asset_in["asset"],
            "defuse_asset_identifier_out": self.asset_out["asset"],
            "exact_amount_in": str(self.asset_in["amount"]),
            "exact_amount_out": str(self.asset_out["amount"]),
            "min_deadline_ms": self.min_deadline_ms,
        }
        if self.asset_in["amount"] is None:
            del message["exact_amount_in"]
        if self.asset_out["amount"] is None:
            del message["exact_amount_out"]
        return message


def fetch_options(request):
    """Fetches the trading options from the solver bus."""
    rpc_request = {
        "id": "dontcare",
        "jsonrpc": "2.0",
        "method": "quote",
        "params": [request.serialize()]
    }
    print("Fetch Quote Request: ", rpc_request)
    response = requests.post(SOLVER_BUS_URL, json=rpc_request)
    return response.json().get("result", [])


def publish_intent(signed_intent):
    """Publishes the signed intent to the solver bus."""
    rpc_request = {
        "id": "dontcare",
        "jsonrpc": "2.0",
        "method": "publish_intent",
        "params": [signed_intent]
    }
    response = requests.post(SOLVER_BUS_URL, json=rpc_request)
    return response.json()


def select_best_option(options):
    """Selects the best option from the list of options."""
    best_option = None
    for option in options:
        if not best_option or option["amount_out"] < best_option["amount_out"]:
            best_option = option
    return best_option


def intent_swap(account, token_in, amount_in, token_out, from_decimal, to_decimal):
    options = fetch_options(IntentRequest().asset_in(token_in, amount_in, from_decimal).asset_out(token_out, to_decimal))
    print("Options: ", options)
    best_option = select_best_option(options)
    print("Best Options: ", best_option)
    amount_in = to_decimals(amount_in, from_decimal)
    quote = create_token_diff_quote(account, token_in, amount_in, token_out, best_option['amount_out'])
    print("Quote: ", quote)
    signed_intent = PublishIntent(signed_data=quote, quote_hashes=[best_option['quote_hash']])
    print("Signed Intent: ", signed_intent)
    response = publish_intent(signed_intent)
    print("Publish Intent: ", response)
    payload_data = json.loads(quote["payload"])
    receiving_amount = payload_data["intents"][0]["diff"][token_out]
    response_data = {
        "intent_res": response,
        "token_amount": receiving_amount
    }
    return response_data


def intent_withdraw(account, destination_address, token, amount, network='near'):
    # {"deadline":"2025-01-05T21:08:23.453Z","intents":[{"intent":"ft_withdraw","token":"17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1","receiver_id":"root.near","amount":"1000000"}],"signer_id":"root.near"}
    nonce = base64.b64encode(random.getrandbits(256).to_bytes(32, byteorder='big')).decode('utf-8')
    quote = Quote(
        signer_id=account.account_id,
        nonce=nonce,
        verifying_contract="intents.near",
        deadline="2025-12-31T11:59:59.000Z",
        intents=[
            {
                "intent": "ft_withdraw",
                "token": ASSET_MAP[token]['token_id'],
                "receiver_id": destination_address,
                "amount": to_decimals(amount, ASSET_MAP[token]['decimals'])
            }
        ]
    )
    if network != 'near':
        quote["intents"][0]["token"] = ASSET_MAP[token]['omft']
        quote["intents"][0]["receiver_id"] = ASSET_MAP[token]['omft']
        quote["intents"][0]["memo"] = "WITHDRAW_TO:%s" % destination_address
    signed_quote = sign_quote(account, json.dumps(quote))
    signed_intent = PublishIntent(signed_data=signed_quote, quote_hashes=[])
    return publish_intent(signed_intent)


def agent_account():
    RPC_NODE_URL = 'https://rpc.mainnet.near.org'
    near_provider = near_api.providers.JsonProvider(RPC_NODE_URL)
    key_pair = near_api.signer.KeyPair(AGENT_PRIVATE_KEY)
    signer = near_api.signer.Signer(AGENT_WALLET_ADDRESS, key_pair)
    return near_api.account.Account(near_provider, signer, AGENT_WALLET_ADDRESS)
