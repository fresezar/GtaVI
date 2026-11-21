# Word timings of a voiceover, for burned-in captions. Called by scripts/make-short.mjs.
#   py -3 shorts/tools/words.py <voice.wav> <out.json> [script text as a spelling hint]
# Local faster-whisper (large-v3-turbo, CPU), English. The model is never downloaded here: it must already be in the
# Hugging Face cache. Settings follow claude-shorts-editor (MIT, Furkan Cavlak): word timestamps, beam 5, no VAD.
import json, os, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
hint = sys.argv[3] if len(sys.argv) > 3 else None
# Decode with ffmpeg ourselves (16 kHz mono float): faster-whisper's own decoder (PyAV) breaks on newer av releases.
pcm = subprocess.run([os.environ.get("FFMPEG", "ffmpeg"), "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.float32)
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", local_files_only=True)
segs, _ = model.transcribe(audio, language="en", word_timestamps=True, vad_filter=False,
                           condition_on_previous_text=False, beam_size=5, initial_prompt=hint)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
with open(out, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False)
print(f"{len(words)} words")
