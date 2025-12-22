import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def call_gemini_api(prompt: str) -> str:
    """
    Calls the Gemini API to generate text based on the given prompt.

    Args:
        prompt (str): The text prompt for the LLM.

    Returns:
        str: The generated text from the LLM, or an error message.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not found in .env file."

    chat_history = []
    chat_history.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {"contents": chat_history}
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    try:
        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        response.raise_for_status()  # Raise an exception for HTTP errors

        result = response.json()

        if result.get("candidates") and len(result["candidates"]) > 0 and \
           result["candidates"][0].get("content") and result["candidates"][0]["content"].get("parts") and \
           len(result["candidates"][0]["content"]["parts"]) > 0:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"LLM response structure unexpected: {result}")
            return "Failed to generate response: Unexpected LLM output."
    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        return f"Error calling Gemini API: {e}. Please ensure your API key is correct and check your network connection."
    except json.JSONDecodeError:
        print(f"Error decoding JSON from response: {response.text}")
        return "Failed to parse LLM response."
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return f"An unexpected error occurred: {e}"

