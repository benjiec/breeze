import os
from webassets import Bundle
from webassets import Environment

css = Bundle('src/css/app.css',
             output='dist/breeze.css')

js  = Bundle('src/js/*.js',
             output='dist/breeze.js')

jsm = Bundle('src/js/*.js', filters='jsmin',
             output='dist/breeze.min.js')

jst = Bundle('src/html/*.html', filters='jst',
             output='dist/breeze_jst.js')

assets_env = Environment('.')
try:
  os.mkdir('.webassets-cache')
except:
  pass
assets_env.cache = '.webassets-cache'
assets_env.register('css', css)
assets_env.register('js', js)
assets_env.register('jsmin', jsm)
assets_env.register('jst', jst)

if __name__ == "__main__":
  from webassets.script import CommandLineEnvironment
  import logging

  log = logging.getLogger('webassets')
  log.addHandler(logging.StreamHandler())
  log.setLevel(logging.DEBUG)
  cmdenv = CommandLineEnvironment(assets_env, log)
  cmdenv.build()
