import os
import json
import requests
from groq import Groq
import hashlib
import re

# Simple in-memory cache to prevent duplicate LLM calls during UI estimation + saving
_valuation_cache = {}

def evaluate_donation_value(title, description, quantity, quantity_unit, claimed_value, donor_business_type):
    """
    Calls Gemini AI (primary) or Groq AI (fallback) to evaluate if the claimed value is fraudulent.
    Returns a dict: {"is_fraudulent": bool, "suggested_value_inr": float, "report": dict}
    """
    cache_key = hashlib.md5(f"{title}|{description}|{quantity}|{quantity_unit}|{donor_business_type}".encode()).hexdigest()
    if cache_key in _valuation_cache:
        cached_result = _valuation_cache[cache_key].copy()
        # Ensure we recalculate the is_fraudulent flag based on the NEW claimed_value
        cached_val = cached_result.get("suggested_value_inr", 0)
        cached_result["is_fraudulent"] = float(claimed_value) > float(cached_val)
        return cached_result

    prompt = f"""
    You are a fair market food appraiser in India evaluating an 80G tax receipt donation.
    A donor (Business Type: {donor_business_type}) is donating the following:
    - Title: {title}
    - Description: {description}
    - Quantity: {quantity} {quantity_unit}
    
    Estimate the fair market value of this donation in INR based on standard Indian retail food prices.
    CRITICAL PRICING RULES:
    1. Be highly conservative and realistic. Use everyday average Indian prices, not premium or luxury rates.
    2. Do NOT exaggerate prices. For example, a standard milkshake is typically ₹80-₹100, not ₹150+. A regular meal portion is usually ₹100-₹150.
    3. You are guarding against tax fraud. If a price seems slightly ambiguous, lean toward the lower, more standard market value.
    
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
    
    result = None

    # 1. Try Gemini first
    try:
        result = _call_gemini(prompt)
    except Exception as e_gemini:
        with open("llm_debug_all.txt", "a", encoding="utf-8") as f:
            f.write(f"\n[GEMINI ERROR] Title: {title} | Exception: {e_gemini}\n")
        print(f"Gemini API Error: {e_gemini}")
        
        # 2. Fallback to Groq
        try:
            result = _call_groq(prompt)
        except Exception as e_groq:
            with open("llm_debug_all.txt", "a", encoding="utf-8") as f:
                f.write(f"\n[GROQ ERROR] Title: {title} | Exception: {e_groq}\n")
            print(f"Groq API Error: {e_groq}")
            
    if not result:
        result = {"is_fraudulent": False, "suggested_value_inr": float(claimed_value), "report": None}
        
    with open("llm_debug_all.txt", "a", encoding="utf-8") as f:
        f.write(f"\n[SUCCESS] Title: {title} | Qty: {quantity} {quantity_unit}\nResult: {result}\n")
        
    _valuation_cache[cache_key] = result.copy()
    return result

def _call_gemini(prompt):
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={gemini_api_key}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json"
        }
    }
    
    response = requests.post(url, json=payload, timeout=15)
    response.raise_for_status()
    data = response.json()
    
    result_str = data['candidates'][0]['content']['parts'][0]['text']
    return _parse_json_result(result_str)

def _call_groq(prompt):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
        
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a JSON-only API. You must output strictly valid JSON, with no unescaped newlines or quotes inside string values."
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="openai/gpt-oss-20b",
        response_format={"type": "json_object"},
        temperature=0,
        max_tokens=500
    )
    result_str = chat_completion.choices[0].message.content
    return _parse_json_result(result_str)

def _parse_json_result(result_str):
    result_str = re.sub(r'<think>.*?</think>', '', result_str, flags=re.DOTALL)
    result_str = result_str.strip()

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
        
    if "is_fraudulent" not in result or "suggested_value_inr" not in result:
        raise ValueError("Missing required JSON fields")
        
    return result
