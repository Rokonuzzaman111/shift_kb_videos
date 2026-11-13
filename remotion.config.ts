/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

Config.setChromiumOpenGlRenderer("angle");
// Heavy 3D on an 8 GB laptop: one tab at a time, and give each frame time to load.
Config.setConcurrency(1);
Config.setDelayRenderTimeoutInMilliseconds(120000);
