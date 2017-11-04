# Decoders

Another attempt to create AAC-LC/MP3 decoders with javascript.
Based on jlayer-1.0.1 (LGPL) and jaad-0.8.4 (LGPL)

decoding raw PCM samples to stdout
  node ./bin/decoder [url|path]

playing with alsa (assuming input is 44100/16 bit/Stereo
  node ./bin/decoder [url|path] | aplay -c 2 -r 44100 -f S16
