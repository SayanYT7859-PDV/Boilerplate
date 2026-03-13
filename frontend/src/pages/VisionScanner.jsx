import { useEffect, useState } from 'react'

import { ScanSearch } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePoints } from '@/context/PointsContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

function VisionScanner() {
  const { addPoints } = usePoints()
  const [selectedFile, setSelectedFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [awardMessage, setAwardMessage] = useState('')

  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return undefined
    }

    const localPreviewUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(localPreviewUrl)

    return () => {
      URL.revokeObjectURL(localPreviewUrl)
    }
  }, [selectedFile])

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setAnalysis(null)
    setErrorMessage('')
  }

  async function handleScanImage() {
    if (!selectedFile) {
      setErrorMessage('Select an image before scanning.')
      return
    }

    setIsScanning(true)
    setErrorMessage('')
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch(`${API_BASE_URL}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Image scan failed.')
      }

      setAnalysis({
        itemName: payload.itemName ?? 'Unknown item',
        category: payload.category ?? 'Unknown category',
        estimatedValue: payload.estimatedValue ?? 'Not provided',
      })

      // Background reward bridge: add points without blocking the main scan result rendering.
      const rewardResult = await addPoints(50)

      if (rewardResult.ok) {
        setAwardMessage('+50 Points Awarded!')
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <section className="grid gap-6">
      <Card className="border bg-card/95 shadow-sm">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            AI Vision Scanner
          </p>
          <CardTitle className="text-3xl">Gemini zero-shot image analyzer</CardTitle>
          <CardDescription>
            Upload a local image, preview it immediately, then send the raw file to the backend for
            Gemini analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="vision-image-upload">
              Select image
            </label>
            <input
              id="vision-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-3xl border border-dashed border-border/70 bg-secondary/20 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Preview</p>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="h-64 w-full rounded-2xl object-cover md:h-80"
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground md:h-72">
                No image selected.
              </div>
            )}
          </div>

          <Button onClick={handleScanImage} disabled={!selectedFile || isScanning} className="gap-2">
            <ScanSearch className="size-4" />
            {isScanning ? 'Scanning...' : 'Scan Image'}
          </Button>

          {awardMessage ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
              {awardMessage}
            </div>
          ) : null}

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      {analysis ? (
        <Card className="border bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Analysis Result</CardTitle>
            <CardDescription>Structured JSON response from Gemini.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <ResultTile label="Item Name" value={analysis.itemName} />
            <ResultTile label="Category" value={analysis.category} />
            <ResultTile label="Estimated Value" value={analysis.estimatedValue} />
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

function ResultTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{String(value)}</p>
    </div>
  )
}

export default VisionScanner