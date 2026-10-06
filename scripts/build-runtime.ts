import { buildRuntime } from '../src/engine/runtime/build';

buildRuntime()
  .then((out) => console.log('✔ runtime compilado em', out))
  .catch((e) => {
    console.error('✖ falha ao compilar runtime', e);
    process.exit(1);
  });
