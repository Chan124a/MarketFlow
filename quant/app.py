from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="MarketFlow Quant Service")


class IndexData(BaseModel):
    code: str
    name: str
    price: float
    change: float
    changePercent: float
    volume: float
    timestamp: str


class SignalRequest(BaseModel):
    indices: list[IndexData]


class QuantSignal(BaseModel):
    code: str
    name: str
    strategy: str
    signal: Literal["buy", "sell", "hold"]
    confidence: float
    reason: str
    timestamp: str


@app.get("/health")
def health():
    return {"success": True, "service": "quant"}


@app.get("/strategies")
def strategies():
    return {
        "success": True,
        "data": [
            {
                "name": "momentum",
                "description": "Generates a directional signal from intraday percentage change.",
            }
        ],
    }


@app.post("/signals")
def signals(payload: SignalRequest):
    data: list[QuantSignal] = []

    for item in payload.indices:
        if item.changePercent > 1:
            signal = "buy"
        elif item.changePercent < -1:
            signal = "sell"
        else:
            signal = "hold"

        data.append(
            QuantSignal(
                code=item.code,
                name=item.name,
                strategy="momentum",
                signal=signal,
                confidence=min(abs(item.changePercent) / 3, 1),
                reason=f"Change percent is {item.changePercent}%",
                timestamp=item.timestamp,
            )
        )

    return {"success": True, "data": data}
