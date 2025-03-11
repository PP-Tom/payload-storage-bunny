import type { BunnyAdapterOptions } from './types.js'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import ky, { HTTPError } from 'ky'
import path from 'path'

import { getStorageUrl, getVideoId } from './utils.js'

type Args = { collection: CollectionConfig; prefix?: string } & BunnyAdapterOptions

export const getStaticHandler = ({
  collection,
  prefix = '',
  storage,
  stream,
}: Args): StaticHandler => {
  return async (req, { doc, params: { filename } }) => {
    try {
      let videoId = getVideoId(doc, filename)

      if (stream && videoId) {
        const url = `https://${stream.hostname}/${videoId}/playlist.m3u8`
        const response = await ky.get(url)

        if (!response.ok) {
          return new Response(null, { status: 404, statusText: 'Not Found' })
        }

        return new Response(response.body, {
          headers: new Headers({
            'content-length': response.headers.get('Content-Length') || '',
            'content-type': 'application/vnd',
          }),
          status: 200,
        })
      }

      const response = await ky.get(
        `https://${getStorageUrl(storage.region)}/${storage.zoneName}/${path.posix.join(prefix, filename)}`,
        {
          headers: {
            AccessKey: storage.apiKey,
          },
        },
      )

      if (!response.ok) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = response.headers.get('etag') as string

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers: new Headers({
            'content-length': response.headers.get('Content-Length') || '',
            'content-type': response.headers.get('Content-Type') || '',
            ETag: objectEtag,
          }),
          status: 304,
        })
      }

      return new Response(response.body, {
        headers: new Headers({
          'content-length': response.headers.get('Content-Length') || '',
          'content-type': response.headers.get('Content-Type') || '',
          ETag: objectEtag,
        }),
        status: 200,
      })
    } catch (err) {
      if (err instanceof HTTPError) {
        const errorResponse = await err.response.text()

        req.payload.logger.error({
          error: {
            response: errorResponse,
            status: err.response.status,
            statusText: err.response.statusText,
          },
          file: { name: filename },
          storage: storage.zoneName,
        })

        return new Response(null, {
          status: err.response.status === 404 ? 404 : 500,
          statusText: err.response.status === 404 ? 'Not Found' : 'Internal Server Error',
        })
      }

      req.payload.logger.error({
        error: err,
        file: { name: filename },
        storage: storage.zoneName,
      })

      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
