import whisper
import sys

model = whisper.load_model("base")
result = model.transcribe(sys.argv[1])
print(result["text"])
