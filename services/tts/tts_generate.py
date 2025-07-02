import sys
from TTS.api import TTS

# Init TTS with your preferred model
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

# Get text and output path from CLI args
text = sys.argv[1]
out_path = sys.argv[2]

tts.tts_to_file(text=text, file_path=out_path)
