# Use the official Python image from the Docker Hub
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app


# Install the dependencies
RUN pip install uv
RUN uv pip install gradio --system
RUN uv pip install watchdog web3 --system
# Copy the rest of the application code into the container
# COPY . .

# Command to run the Gradio app
# CMD ["python", "app.py"]