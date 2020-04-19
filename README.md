## ProgPOW implementation in WebGL

This repo will contain a ProgPOW implementation in WebGL.

TODO
- [ ] Keccak256 + Keccak512
- [x] Make cache
- [x] Agg. data (FNV hash)
- [x] Dataset calculation
- [ ] Hashimoto loop
- [ ] PoW setup

I think we can make the cache size constant, let's say, 1 GB, to make it accessible for all GPUs.
For example, I have an intel GPU with only 1536 MB of VRAM :)

https://github.com/ethereum/wiki/wiki/Ethash
