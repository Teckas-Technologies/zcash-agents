import requests
import numpy as np
from app.utils.tokens import tokens

TOKENS_URL = "https://api-mng-console.chaindefuser.com/api/tokens"
TOKEN_DATA_URL = "https://min-api.cryptocompare.com/data/v2/histohour" # ?fsym=ZEC&tsym=USD&limit=24&toTs=1742904000

def fetch_tokens():
    response = requests.get(TOKENS_URL)
    json_data = response.json()
    
    if response.status_code != 200:
        raise Exception(
            f"Request failed {response.status_code} {response.reason} - {json_data}"
        )
    
    # If there are tokens in the response, return them; otherwise, return None
    return json_data.get("items")

def fetch_24h_token_data(symbol):
    response = requests.get(f"{TOKEN_DATA_URL}?fsym={symbol}&tsym=USD&limit=24")
    json_data = response.json()
    
    if response.status_code != 200:
        raise Exception(
            f"Request failed {response.status_code} {response.reason} - {json_data}"
        )
    
    data = json_data.get("Data", {}).get("Data", [])
    close_prices = [item["close"] for item in data]
    volumes = [item["volumeto"] for item in data]
    return {"prices": close_prices, "volumes": volumes}

def calculate_short_term_score(data):
    weights = {
        'momentum_24h': 0.4,
        'volume_spike': 0.25,
        'volatility': 0.1,
        'recent_4h': 0.25
    }

    prices = np.array(data['prices'])
    volumes = np.array(data['volumes'])

    if len(prices) == 0 or len(volumes) == 0:
        return None

    momentum_24h = ((prices[-1] - prices[0]) / prices[0]) * 100 if len(prices) >= 24 else 0
    recent_volume = volumes[-4:].mean()
    avg_volume_20h = volumes[:-4].mean() if len(volumes) > 4 else recent_volume
    volume_spike = (recent_volume - avg_volume_20h) / avg_volume_20h if avg_volume_20h != 0 else 0
    volatility = np.std(prices) / np.mean(prices) if len(prices) >= 2 else 0
    recent_4h = ((prices[-1] - prices[-5]) / prices[-5]) * 100 if len(prices) >= 5 else 0

    scores = {
        'momentum_24h': np.tanh(momentum_24h / 10),
        'volume_spike': np.tanh(volume_spike),
        'volatility': volatility * 20,
        'recent_4h': np.tanh(recent_4h / 5)
    }

    total_score = sum(scores[key] * weights[key] for key in weights)

    return total_score if not np.isnan(total_score) else None

# Convert NumPy float64 to Python float
def to_float(value):
    return float(value) if isinstance(value, np.float64) else value

def allocate_top_tokens(sorted_tokens):
    top_tokens = sorted_tokens[:2]  # Pick the top 2 tokens

    if not top_tokens:
        return []

    # Calculate total score, using abs only for negative scores
    total_score = sum(to_float(t["score"]) if t["score"] > 0 else abs(to_float(t["score"])) for t in top_tokens)

    # Handle zero total score edge case
    if total_score == 0:
        equal_share = 100 / len(top_tokens)
        for t in top_tokens:
            t["share"] = float(round(equal_share, 2))
    else:
        for t in top_tokens:
            weight = to_float(t["score"]) if t["score"] > 0 else abs(to_float(t["score"]))  # Use abs for negatives
            t["share"] = float(round((weight / total_score) * 100, 2))

    # Normalize shares to 100% (fix rounding errors)
    total_shares = sum(t["share"] for t in top_tokens)
    if total_shares != 100:
        correction = 100 - total_shares
        top_tokens[-1]["share"] = float(round(top_tokens[-1]["share"] + correction, 2))

    return top_tokens


def trend_tokens():
    fetched_tokens = fetch_tokens()
    allowed_defuse_ids = set(token["defuse_asset_id"] for token in tokens["items"])
    filtered_tokens = []
    seen_defuse_ids = set()
    
    if fetched_tokens:
        selected_tokens = [token for token in fetched_tokens if token.get("defuse_asset_id") in allowed_defuse_ids]

        for token in selected_tokens:
            defuse_id = token.get("defuse_asset_id")
            if defuse_id and defuse_id not in seen_defuse_ids:
                token_data = fetch_24h_token_data(token["symbol"])
                score = calculate_short_term_score(token_data)
                if score is not None:  # Ignore tokens with NaN scores
                    token["score"] = to_float(score)
                    filtered_tokens.append(token)
                    seen_defuse_ids.add(defuse_id)

        sorted_tokens = sorted(filtered_tokens, key=lambda x: x["score"], reverse=True)

        allocated_tokens = allocate_top_tokens(sorted_tokens)

        cleaned_allocated_tokens = [
            {k: v for k, v in token.items() if k not in {"price", "price_updated_at"}} 
            for token in allocated_tokens
        ]

        print(f"Allocated Tokens:", cleaned_allocated_tokens)

        return cleaned_allocated_tokens

        # print("\nSorted Tokens (High to Low Score):")
        # for token in sorted_tokens:
        #     print(f"{token['symbol']} - Score: {token['score']:.4f}")
