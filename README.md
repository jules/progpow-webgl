## ProgPOW implementation in WebGL

As I've come to understand it, ProgPOW is basically ETHash, but with some stuff changed in order to further reduce the appeal for ASICs.

TODO
- Keccak256 + Keccak512
- Make cache (1GB)
- Agg. data (FNV hash)
- Dataset calculation
- Hashimoto loop
- PoW setup

I think we can make the cache size constant, let's say, 1 GB, to make it accessible for all GPUs.
For example, I have an intel GPU with only 1536 MB of VRAM :)

https://github.com/ethereum/wiki/wiki/Ethash
