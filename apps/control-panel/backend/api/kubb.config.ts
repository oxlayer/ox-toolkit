/** @type {import('kubb').UserConfig} */
export default {
  input: {
    '.': {
      output: 'api-spec',
      api: '@hono/zod-openapi',
    },
  },
  output: {
    'api-spec': {
      directory: '../frontend/dashboard/src/api-spec',
      spec: {
        directory: '.',
      },
    },
  },
  hooks: {
    onPreBuild: async (context) => {
      // Ensure the server is built or running
      const { spawn } = await import('child_process');

      // Build the API to ensure all routes are registered
      await new Promise((resolve, reject) => {
        const build = spawn('bun', ['run', 'build'], {
          cwd: process.cwd(),
          stdio: 'inherit',
          shell: true,
        });

        build.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build failed with code ${code}`));
          }
        });
      });
    },
  },
} satisfies import('kubb').UserConfig;
