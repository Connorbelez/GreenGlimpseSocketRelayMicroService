import config
import openai
import random

# Read the OpenAI API key from the environment variable
api_key = config.OPENAI_API_KEY

# Check if the API key is set
if api_key is None:
    print("Please set the OPENAI_API_KEY environment variable.")
else:
    # Generate a dataset for two companies (rail and truck)
    def generate_freight_emissions_dataset():
        dataset = []
        for month in range(1, 13):
            distance = random.randint(200, 500)  # Distance in miles
            travel_time = random.randint(2, 5)   # Travel time in hours
            
            # Rail emissions (lower emissions compared to trucks)
            rail_emissions = random.randint(10, 50)  # Random values for rail emissions
            
            # Truck emissions (higher emissions compared to rail)
            truck_emissions = random.randint(50, 100)  # Random values for truck emissions
            
            # Calculate the difference in emissions (rail - truck)
            emissions_delta = rail_emissions - truck_emissions
            
            # Generate a dataset entry for each month
            dataset_entry = f"Month {month}: Distance (miles),{distance},Travel Time (hours),{travel_time},Rail Emissions (kg CO2),{rail_emissions},Truck Emissions (kg CO2),{truck_emissions},Emissions Delta (Rail - Truck),{emissions_delta}"
            
            dataset.append(dataset_entry)
        
        return dataset

    # Generate the dataset
    freight_dataset = generate_freight_emissions_dataset()

    # Initialize the OpenAI API client with the API key
    openai.api_key = api_key

    # Combine the dataset entries into a single string
    dataset_text = '\n'.join(freight_dataset)

    # Generate comments using the GPT-3 API
    response = openai.Completion.create(
        engine="text-davinci-002",
        prompt=f"Please analyze the following dataset and provide feedback on how to reduce carbon emissions:\n{dataset_text}\n\nComments:",
        max_tokens=150  # Adjust as needed
    )

    # Extract and print the generated comments
    comments = response.choices[0].text.strip()
    print(comments)
