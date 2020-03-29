## ProgPOW implementation in WebGL2

This repo will contain a ProgPOW implementation in WebGL2. The rationale for choosing WebGL2 is simple - support has nearly come to all major browsers (with the exceptions WebKit based, but their implementation [is underway](https://webkit.org/status/#specification-webgl-2)), it offers performance improvements and more efficient use of the GPU in order to achieve a higher hashrate, and supports integer-based shaders, which makes the maths involved more reliable.

TODO
- [ ] Keccak256 + Keccak512
- [ ] Make cache (1GB)
- [x] Agg. data (FNV hash)
- [ ] Dataset calculation
- [ ] Hashimoto loop
- [ ] PoW setup

I think we can make the cache size constant, let's say, 1 GB, to make it accessible for all GPUs.
For example, I have an intel GPU with only 1536 MB of VRAM :)

https://github.com/ethereum/wiki/wiki/Ethash
