from fastapi import APIRouter, HTTPException
from app.utils.mongodb_utils import create_swap_detail, get_all_swaps_by_wallet_address
from typing import List

router = APIRouter()


@router.post("/swap_details/")
def create_swap(swap_data: dict):
    return create_swap_detail(swap_data)


@router.get("/swap_details/{wallet_address}")
def read_swap(wallet_address: str):
    return get_all_swaps_by_wallet_address(wallet_address=wallet_address)

