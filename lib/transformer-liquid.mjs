import { Transformer } from '@parcel/plugin';
import { Liquid } from 'liquidjs';
import fs from 'fs';
import path from 'path';

export default new Transformer({
  async loadConfig({ config }) {
    const configFiles = [
      "liquidrc.json",
      '.liquidrc',
      '.liquidrc.js',
      '.liquidrc.cjs',
      'liquid.config.js',
      'liquid.config.cjs',
    ];

    const { contents, filePath } =
      (await config.getConfig(configFiles)) || {};

    if (filePath) {
      if (filePath.endsWith('.js')) {
        config.invalidateOnStartup();
      }

      config.invalidateOnFileChange(filePath);
    }

    return contents;
  },
  async transform({ asset, config, options }) {
    const engine = new Liquid(config);
    const code = await asset.getCode();
    const template = await engine.parseAndRender(code);

    if (config.root?.length > 0) {
      let deps = [];

      for (const dir of config.root) {
        const files = fs
          .readdirSync(dir)
          .map(filePath => path.join(dir, filePath));

        deps = deps.concat(files);
      }

      for (const dep of deps) {
        asset.invalidateOnFileChange(
          path.resolve(options.projectRoot, dep)
        );
      }
    }

    asset.setCode(template);
    asset.type = 'html';

    return [asset];
  },
});
