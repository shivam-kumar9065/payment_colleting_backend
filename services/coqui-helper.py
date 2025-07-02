# services/coqui-helper.py

import sys
import torch
from TTS.api import TTS

text = sys.argv[1]
output_path = sys.argv[2]

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=torch.cuda.is_available())
tts.tts_to_file(text=text, file_path=output_path)
