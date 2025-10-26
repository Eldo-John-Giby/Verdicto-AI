import requests

#url = "https://hackrx-backend-production-b840.up.railway.app/api/v1/hackrx/run"
url = "http://localhost:8080/api/v1/hackrx/run"

headers = {
    "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
    "Content-Type": "application/json"
}

payload = {
    "documents": "https://hackrx.blob.core.windows.net/assets/policy.pdf?sv=2023-01-03&st=2025-07-04T09%3A11%3A24Z&se=2027-07-05T09%3A11%3A00Z&sr=b&sp=r&sig=N4a9OU0w0QXO6AOIBiu4bpl7AXvEZogeT%2FjUHNO7HzQ%3D",
    "questions": [
        "What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?",
        "What is the waiting period for pre-existing diseases (PED) to be covered?",
        "Does this policy cover maternity expenses, and what are the conditions?",
        "What is the waiting period for cataract surgery?",
        "Are the medical expenses for an organ donor covered under this policy?",
        "What is the No Claim Discount (NCD) offered in this policy?",
        "Is there a benefit for preventive health check-ups?",
        "How does the policy define a 'Hospital'?",
        "What is the extent of coverage for AYUSH treatments?",
        "Are there any sub-limits on room rent and ICU charges for Plan A?"
    ]
}

res = requests.post(url, headers=headers, json=payload)

print("Status Code:", res.status_code)
# Try to parse JSON safely
try:
    data = res.json()
    print("Parsed JSON:\n", data)
except Exception as e:
    print("❌ Error parsing JSON:", e)