import { executeCode } from './lib/compiler';
async function run() {
    const res = await executeCode('#include <stdio.h>\\nint main() { printf("Hello from native GCC Code Undercover!\\\\n"); return 0; }');
    console.log(JSON.stringify(res, null, 2));
}
run();
