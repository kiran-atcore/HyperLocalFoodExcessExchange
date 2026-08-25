import os
import json
from groq import Groq

import hashlib

# Simple in-memory cache to prevent duplicate LLM calls during UI estimation + saving
_valuation_cache = {}

def evaluate_donation_value(title, description, quantity, quantity_unit, claimed_value, donor_business_type):
    """
    Calls Groq AI to evaluate if the claimed value is fraudulent or excessively high.
    Returns a dict: {"is_fraudulent": bool, "suggested_value_inr": float}
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return {"is_fraudulent": False, "suggested_value_inr": float(claimed_value)}
        
    cache_key = hashlib.md5(f"{title}|{description}|{quantity}|{quantity_unit}|{donor_business_type}".encode()).hexdigest()
    if cache_key in _valuation_cache:
        cached_result = _valuation_cache[cache_key].copy()
        # Ensure we recalculate the is_fraudulent flag based on the NEW claimed_value
        cached_val = cached_result.get("suggested_value_inr", 0)
        cached_result["is_fraudulent"] = float(claimed_value) > float(cached_val)
        return cached_result

    try:
        client = Groq(api_key=api_key)
        prompt = f"""
        You are a fair market food appraiser in India evaluating an 80G tax receipt donation.
        A donor (Business Type: {donor_business_type}) is donating the following:
        - Title: {title}
        - Description: {description}
        - Quantity: {quantity} {quantity_unit}
        
        Estimate the fair market value of this donation in INR based on standard Indian retail food prices.
        Respond in JSON format. The JSON object must exactly match the following schema:
        {{
            "is_fraudulent": false, 
            "suggested_value_inr": 0.0,
            "report": {{
                "reasoning": "A detailed explanation of why you arrived at this value",
                "breakdown": {{
                    "ingredients": 0.0,
                    "labour": 0.0,
                    "service": 0.0,
                    "misc": 0.0
                }}
            }}
        }}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="qwen/qwen3.6-27b",
            temperature=0
        )

        result_str = chat_completion.choices[0].message.content
        import re
        result_str = re.sub(r'<think>.*?</think>', '', result_str, flags=re.DOTALL)
        result_str = result_str.strip()

        # Clean up markdown if the LLM wraps the JSON
        if result_str.startswith("```json"):
            result_str = result_str[7:]
        elif result_str.startswith("```"):
            result_str = result_str[3:]
        if result_str.endswith("```"):
            result_str = result_str[:-3]
        result_str = result_str.strip()
        
        start_idx = result_str.find('{')
        if start_idx != -1:
            decoder = json.JSONDecoder()
            result, _ = decoder.raw_decode(result_str[start_idx:])
        else:
            result = json.loads(result_str)
        
        # Ensure fallback safety
        if "is_fraudulent" not in result or "suggested_value_inr" not in result:
            result = {"is_fraudulent": False, "suggested_value_inr": float(claimed_value), "report": None}
            
        with open("llm_debug_all.txt", "a", encoding="utf-8") as f:
            f.write(f"\n[SUCCESS] Title: {title} | Qty: {quantity} {quantity_unit}\nResult: {result}\n")
            
        _valuation_cache[cache_key] = result.copy()
            
        return result
    except Exception as e:
        with open("llm_debug_all.txt", "a", encoding="utf-8") as f:
            f.write(f"\n[ERROR] Title: {title} | Exception: {e}\nRaw result_str: {locals().get('result_str', 'None')}\n")
            
        print(f"Groq API Error: {e}")
        return {"is_fraudulent": False, "suggested_value_inr": float(claimed_value), "report": None}
