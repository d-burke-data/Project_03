import requests
import pandas as pd
import matplotlib.pyplot as plt

# Fetch data from the API endpoint
response = requests.get('http://127.0.0.1:5000/api/v1.0/events?start_year=2020&duration=1')
data = response.json()

# Convert the JSON data to a Pandas DataFrame
df = pd.DataFrame(data)

# Assume the tornado severity is stored in a column named 'SEVERITY'
# Count the occurrences of each severity level
severity_counts = df['TOR_F_SCALE'].value_counts()

# Create a pie chart
plt.figure(figsize=(8, 8))
plt.pie(severity_counts, labels=severity_counts.index, autopct='%1.1f%%', startangle=140, pctdistance=1.1, labeldistance=1.18)
plt.title('Tornado Severity Distribution', pad=30)
plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle

# Show the plot
plt.show()