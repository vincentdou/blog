module.exports = function (locals) {
  const manifest = this.theme.config.pwa.manifest;

  console.log('manifest', manifest)

  if (!manifest) return;

  return [{
    path: 'manifest.json',
    data: JSON.stringify(manifest)
  }];
};
