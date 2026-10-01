import { Config } from '@remotion/cli/config'

// Renders use the Chromium headless shell when one is configured (CI or cloud containers);
// otherwise Remotion downloads its own.
if (process.env.FILM_BROWSER) Config.setBrowserExecutable(process.env.FILM_BROWSER)
Config.setVideoImageFormat('png')
Config.setPixelFormat('yuv420p')
Config.setCodec('h264')
Config.setConcurrency(4)
