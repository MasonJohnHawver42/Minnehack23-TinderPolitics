import requests

api_url = "https://api.congress.gov/v3/member?api_key=X6mOtxVCHmVszuOI1jVGXhLFhJjeI9Zm0EMHv8Px"
params = {"offset": 0, "limit": 250}
response = requests.get(api_url, params=params)
members = response.json()["members"]

data = [ (member['depiction']['imageUrl'], member['name']) for member in members if len(member['depiction']['imageUrl']) > 0]

print(len(data))
for d in data:
    print(d)
