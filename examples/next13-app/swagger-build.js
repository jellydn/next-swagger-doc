const { File } = require("next/dist/compiled/undici")

globalThis.File = globalThis.File ?? File
