import requests
import sys

def main():
    url = "http://localhost:8500/institute-gate-identify-video"
    print(f"Connecting to {url}...")
    try:
        # We need a valid dummy mp4 file to send
        with open("test_stream.py", "rb") as f:
            files = {'file': ('test_stream.py', f, 'video/mp4')}
            response = requests.post(url, files=files, stream=True)
            
            print(f"Status Code: {response.status_code}")
            
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if "frame_image" in decoded_line:
                        print("Received frame_image event (truncated for readability)")
                    else:
                        print("Received:", decoded_line)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
