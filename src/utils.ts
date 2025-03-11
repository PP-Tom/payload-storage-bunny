export const getStorageUrl = (region: string | undefined) => {
  return region ? `${region}.storage.bunnycdn.com` : 'storage.bunnycdn.com'
}

export const getVideoId = (doc: unknown, filename: string) => {
  if (
    doc &&
    typeof doc === 'object' &&
    'filename' in doc &&
    doc.filename === filename &&
    'bunnyVideoId' in doc
  ) {
    return doc.bunnyVideoId as string
  }

  return undefined
}

export const isImage = (mimeType: string) => mimeType.startsWith('image/')
export const isVideo = (mimeType: string) => mimeType.startsWith('video/')
