import type { BunnyAdapterOptions } from './types.js'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

export const getGenerateURL = ({ storage, stream }: BunnyAdapterOptions): GenerateURL => {
  return ({ data, filename, prefix = '' }) => {
    if (stream && data.bunnyVideoId) {
      return `https://${stream.hostname}/${data.bunnyVideoId}/playlist.m3u8`
    }

    return `https://${storage.hostname}/${path.posix.join(prefix, filename)}`
  }
}
