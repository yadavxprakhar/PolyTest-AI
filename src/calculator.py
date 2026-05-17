class Calculator:
    """A standard business calculator with basic mathematical operations."""

    def add(self, a: float, b: float) -> float:
        """Add two numeric values together."""
        return a + b

    def divide(self, a: float, b: float) -> float:
        """Divide numerator by denominator. Raises ZeroDivisionError if b is 0."""
        if b == 0:
            raise ZeroDivisionError("Cannot divide by zero.")
        return a / b

async def process_batch_async(values: list[float]) -> float:
    """Simulate asynchronous batch math calculations."""
    import asyncio
    await asyncio.sleep(0.1)
    return sum(values)
