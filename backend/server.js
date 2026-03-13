import 'dotenv/config'

import express from 'express'
import multer from 'multer'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const app = express()
const port = Number(process.env.PORT || 5000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const supabaseUrl = readRequiredEnv('SUPABASE_URL')
const supabaseAnonKey = readRequiredEnv('SUPABASE_ANON_KEY')
const geminiApiKey = readRequiredEnv('GEMINI_API_KEY')
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_MULTIPART_CONTENT_LENGTH = MAX_IMAGE_BYTES + 32 * 1024
const GEMINI_TIMEOUT_MS = 12000
const GEMINI_MAX_RETRIES = 2
const GEMINI_SYSTEM_PROMPT =
  'Analyze this image and return a JSON object with three keys: itemName, category, and estimatedValue.'
const MAX_POINTS_PER_CALL = 500
const MAX_POINTS_PER_MINUTE = 1200

const emailUpdateLocks = new Map()
const emailAwardWindows = new Map()

// Lightweight client: one shared instance, no ORM, minimal runtime overhead.
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const gemini = new GoogleGenerativeAI(geminiApiKey)
const visionModel = gemini.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: GEMINI_SYSTEM_PROMPT,
})
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fields: 4,
    parts: 5,
    fileSize: MAX_IMAGE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype?.startsWith('image/')) {
      callback(new Error('Only image uploads are allowed.'))
      return
    }

    callback(null, true)
  },
})

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', frontendOrigin)
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

  if (request.method === 'OPTIONS') {
    response.sendStatus(204)
    return
  }

  next()
})

app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: false, limit: '8kb' }))

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'backend' })
})

app.post('/api/items', async (request, response) => {
  const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
  const description =
    typeof request.body.description === 'string' ? request.body.description.trim() : ''

  if (!title || !description) {
    response.status(400).json({ error: 'Title and description are required.' })
    return
  }

  if (title.length > 120 || description.length > 1000) {
    response
      .status(400)
      .json({ error: 'Title or description exceeds the allowed length.' })
    return
  }

  try {
    // Data flow: frontend JSON payload -> Supabase insert -> compact response for UI update.
    const { data, error } = await supabase
      .from('items')
      .insert([{ title, description }])
      .select('id, title, description, created_at')
      .single()

    if (error) {
      response.status(500).json({ error: error.message })
      return
    }

    response.status(201).json({
      message: 'Item created successfully.',
      item: data,
    })
  } catch {
    response.status(500).json({ error: 'Unexpected server error while inserting item.' })
  }
})

app.get('/api/points/:email', async (request, response) => {
  const email = normalizeEmail(request.params.email)

  if (!isValidEmail(email)) {
    response.status(400).json({ error: 'A valid email parameter is required.' })
    return
  }

  try {
    const profile = await runWithEmailLock(email, async () => getOrCreateProfile(email))

    response.status(200).json({ email, points: profile.points })
  } catch (error) {
    response.status(500).json({ error: error.message || 'Failed to fetch points.' })
  }
})

app.post('/api/points/add', async (request, response) => {
  const email = normalizeEmail(request.body.email)
  const pointsToAdd = Number(request.body.pointsToAdd)

  if (!isValidEmail(email)) {
    response.status(400).json({ error: 'A valid email is required.' })
    return
  }

  if (!Number.isInteger(pointsToAdd) || pointsToAdd <= 0 || pointsToAdd > MAX_POINTS_PER_CALL) {
    response
      .status(400)
      .json({ error: `pointsToAdd must be an integer from 1 to ${MAX_POINTS_PER_CALL}.` })
    return
  }

  if (!canAwardPoints(email, pointsToAdd)) {
    response.status(429).json({ error: 'Point updates are throttled. Please retry shortly.' })
    return
  }

  try {
    const nextTotal = await runWithEmailLock(email, async () => {
      const profile = await getOrCreateProfile(email)
      const newTotal = Number(profile.points || 0) + pointsToAdd

      const { data, error } = await supabase
        .from('profiles')
        .update({ points: newTotal })
        .eq('email', email)
        .select('points')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return Number(data?.points || newTotal)
    })

    response.status(200).json({
      message: 'Points updated successfully.',
      email,
      totalPoints: nextTotal,
    })
  } catch (error) {
    response.status(500).json({ error: error.message || 'Failed to add points.' })
  }
})

app.post(
  '/api/analyze-image',
  rejectOversizedMultipart,
  parseSingleImageUpload,
  async (request, response) => {
    if (!request.file) {
      response.status(400).json({ error: 'Image file is required in form field "image".' })
      return
    }

    const imagePart = {
      inlineData: {
        data: request.file.buffer.toString('base64'),
        mimeType: request.file.mimetype,
      },
    }

    try {
      const result = await runGeminiWithRetry(() =>
        callGeminiWithTimeout([
          'Return only valid JSON.',
          imagePart,
        ]),
      )

      const rawText = result.response.text()
      const parsedPayload = parseGeminiJson(rawText)

      if (!parsedPayload) {
        response.status(502).json({
          error: 'Gemini returned a non-JSON response.',
          raw: rawText,
        })
        return
      }

      response.status(200).json({
        itemName: parsedPayload.itemName ?? null,
        category: parsedPayload.category ?? null,
        estimatedValue: parsedPayload.estimatedValue ?? null,
      })
    } catch (error) {
      if (isRetryableGeminiError(error)) {
        response.status(504).json({
          error: 'Gemini service is busy or timed out. Please retry shortly.',
        })
        return
      }

      response.status(500).json({
        error: error.message || 'Unexpected Gemini analysis error.',
      })
    }
  },
)

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})

function rejectOversizedMultipart(request, response, next) {
  const contentLengthHeader = request.headers['content-length']
  const contentLength = Number(contentLengthHeader)

  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_CONTENT_LENGTH) {
    response.status(413).json({
      error: `Payload too large. Limit is ${MAX_IMAGE_BYTES} bytes for image uploads.`,
    })
    return
  }

  next()
}

function parseSingleImageUpload(request, response, next) {
  upload.single('image')(request, response, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        response.status(413).json({
          error: `Image is too large. Maximum allowed size is ${MAX_IMAGE_BYTES} bytes.`,
        })
        return
      }

      response.status(400).json({ error: error.message })
      return
    }

    response.status(400).json({ error: error.message || 'Invalid multipart upload.' })
  })
}

async function callGeminiWithTimeout(contents) {
  return promiseWithTimeout(
    visionModel.generateContent({
      contents: [{ role: 'user', parts: contents }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
    GEMINI_TIMEOUT_MS,
    'Gemini request timed out.',
  )
}

async function runGeminiWithRetry(task) {
  let attempt = 0
  let lastError = null

  while (attempt <= GEMINI_MAX_RETRIES) {
    try {
      return await task()
    } catch (error) {
      lastError = error

      if (!isRetryableGeminiError(error) || attempt === GEMINI_MAX_RETRIES) {
        throw error
      }

      const backoffMs = 350 * 2 ** attempt + Math.floor(Math.random() * 120)
      await sleep(backoffMs)
      attempt += 1
    }
  }

  throw lastError
}

function isRetryableGeminiError(error) {
  if (!error) {
    return false
  }

  const message = String(error.message || '').toLowerCase()
  const status = Number(error.status || error.code)

  return (
    status === 429 ||
    status === 408 ||
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('timeout') ||
    message.includes('timed out')
  )
}

function parseGeminiJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null
  }

  const normalized = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(normalized)
  } catch {
    return null
  }
}

function promiseWithTimeout(promise, timeoutMs, message) {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function runWithEmailLock(email, task) {
  const previous = emailUpdateLocks.get(email) || Promise.resolve()
  const nextTask = previous.catch(() => undefined).then(task)

  emailUpdateLocks.set(email, nextTask)

  try {
    return await nextTask
  } finally {
    if (emailUpdateLocks.get(email) === nextTask) {
      emailUpdateLocks.delete(email)
    }
  }
}

async function getOrCreateProfile(email) {
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('email, points')
    .eq('email', email)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existingProfile) {
    return {
      email,
      points: Number(existingProfile.points || 0),
    }
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([{ email, points: 0 }])
    .select('email, points')
    .single()

  if (insertError) {
    const duplicateKeyDetected = String(insertError.message || '').toLowerCase().includes('duplicate')

    if (duplicateKeyDetected) {
      const { data: refetchedProfile, error: refetchError } = await supabase
        .from('profiles')
        .select('email, points')
        .eq('email', email)
        .single()

      if (refetchError) {
        throw new Error(refetchError.message)
      }

      return {
        email,
        points: Number(refetchedProfile.points || 0),
      }
    }

    throw new Error(insertError.message)
  }

  return {
    email,
    points: Number(insertedProfile.points || 0),
  }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function canAwardPoints(email, pointsToAdd) {
  const now = Date.now()
  const currentWindow = emailAwardWindows.get(email)

  if (!currentWindow || now - currentWindow.windowStartedAt > 60_000) {
    emailAwardWindows.set(email, {
      windowStartedAt: now,
      awardedPoints: pointsToAdd,
    })
    return true
  }

  const projectedTotal = currentWindow.awardedPoints + pointsToAdd

  if (projectedTotal > MAX_POINTS_PER_MINUTE) {
    return false
  }

  currentWindow.awardedPoints = projectedTotal
  return true
}

function readRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}