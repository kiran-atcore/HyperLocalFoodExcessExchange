import os
import json
from groq import Groq

def evaluate_donation_value(title, description, quantity, quantity_unit, claimed_value, donor_business_type):
    """
    Calls Groq AI to evaluate if the claimed value is fraudulent or excessively high.
    Returns a dict: {"is_fraudulent": bool, "suggested_value_inr": float}
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        # If no API key is provided, fail open (allow the donation)
        return {"is_fraudulent": False, "suggested_value_inr": float(claimed_value)}

    try:
        client = Groq(api_key=api_key)
        
        prompt = f"""
        You are a fair market food appraiser in India evaluating an 80G tax receipt donation.
        A donor (Business Type: {donor_business_type}) is donating the following:
        - Title: {title}
        - Description: {description}
        - Quantity: {quantity} {quantity_unit}
        
        The donor claims the fair market value is ₹{claimed_value}.
        
        Analyze this based on standard Indian retail food prices. Is this value fraudulently or excessively inflated?
        Respond with ONLY a raw JSON object with no markdown and no other text:
        {{"is_fraudulent": true/false, "suggested_value_inr": <float_value>}}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="qwen-3.6-27b",
            temperature=0,
            response_format={"type": "json_object"}
        )

        result_str = chat_completion.choices[0].message.content
        result = json.loads(result_str)
        
        # Ensure fallback safety
        if "is_fraudulent" not in result or "suggested_value_inr" not in result:
            return {"is_fraudulent": False, "suggested_value_inr": float(claimed_value)}
            
        return result
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"is_fraudulent": False, "suggested_value_inr": float(claimed_value)}
