"use client"

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const words = ['cat', 'dog', 'bird', 'fish', 'rabbit']
const initialProbabilities = [0.3, 0.25, 0.2, 0.18, 0.1]

function adjustProbabilities(probs: number[], temperature: number): number[] {
  const adjustedProbs = probs.map(p => Math.pow(p, 1 / temperature))
  const sum = adjustedProbs.reduce((a, b) => a + b, 0)
  return adjustedProbs.map(p => p / sum)
}

function normalizeTopPProbabilities(probs: number[], topP: number): number[] {
  let cumulativeSum = 0
  const selectedProbs = probs.map(p => {
    if (cumulativeSum < topP) {
      cumulativeSum += p
      return p
    }
    return 0
  })
  const selectedSum = selectedProbs.reduce((a, b) => a + b, 0)
  return selectedProbs.map(p => p / selectedSum)
}

export function LlmVisualization() {
  const [temperature, setTemperature] = useState(1)
  const [topP, setTopP] = useState(1)
  const [showFormula, setShowFormula] = useState(false)

  const adjustedProbs = useMemo(() => adjustProbabilities(initialProbabilities, temperature), [temperature])

  const { normalizedProbs, cumulativeProbs } = useMemo(() => {
    const cumulative = adjustedProbs.reduce((acc, prob, index) => {
      acc[index] = (acc[index - 1] || 0) + prob
      return acc
    }, [] as number[])
    const normalized = normalizeTopPProbabilities(adjustedProbs, topP)
    return { normalizedProbs: normalized, cumulativeProbs: cumulative }
  }, [adjustedProbs, topP])

  const data = words.map((word, index) => ({
    name: word,
    original: initialProbabilities[index],
    adjusted: adjustedProbs[index],
  }))

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">LLM Temperature and Top-P Visualization</h1>
      <h3 className="text-2xl font-bold text-center mb-6">Prompt: My favorite animal is _</h3>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Temperature Setting</h2>
        <div className="flex items-center space-x-4">
          <span className="w-24">Temperature:</span>
          <div className="flex-grow relative max-w-md">
            <Slider
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              max={1}
              min={0}
              step={0.1}              
              className="max-w-full"
            />
            <div className="absolute top-1/2 left-0 right-0 flex justify-between pointer-events-none">
              {Array.from({ length: 11 }, (_, i) => i / 10).map((tick) => (
                <div key={tick} className="h-2 w-0.5 bg-gray-300 -mt-1"></div>
              ))}
            </div>
          </div>
          <span className="w-12 text-right">{temperature.toFixed(1)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="original" fill="#8884d8" name="Original Probability">
            {data.map((entry, index) => (
              <text
                key={`original-${index}`}
                x={index * (800 / data.length) + 20}
                y={380 - entry.original * 300}
                fill="#000"
                textAnchor="middle"
                dy={-6}
              >
                {entry.original.toFixed(2)}
              </text>
            ))}
          </Bar>
          <Bar dataKey="adjusted" fill="#82ca9d" name="Adjusted Probability">
            {data.map((entry, index) => (
              <text
                key={`adjusted-${index}`}
                x={index * (800 / data.length) + 60}
                y={380 - entry.adjusted * 300}
                fill="#000"
                textAnchor="middle"
                dy={-6}
              >
                {entry.adjusted.toFixed(2)}
              </text>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Top-P Sampling</h2>
        <div className="flex items-center space-x-4">
          <span className="w-24">Top-p:</span>
          <div className="flex-grow relative  max-w-md">
            <Slider
              value={[topP]}
              onValueChange={(value) => setTopP(value[0])}
              max={1}
              min={0}
              step={0.1}
              className="max-w-full"
            />
            <div className="absolute top-1/2 left-0 right-0 flex justify-between pointer-events-none">
              {Array.from({ length: 11 }, (_, i) => i / 10).map((tick) => (
                <div key={tick} className="h-2 w-0.5 bg-gray-300 -mt-1"></div>
              ))}
            </div>
          </div>
          <span className="w-12 text-right">{topP.toFixed(1)}</span>
        </div>
      </div>

      <Table className="w-1/2">
        <TableBody>
          {words.map((word, index) => (
            <TableRow key={word} className={cumulativeProbs[index] <= topP ? "bg-green-100" : "bg-gray-100"}>
              <TableCell className="font-large font-bold">{word}</TableCell>
              <TableCell className="text-right">{adjustedProbs[index].toFixed(4)}</TableCell>
              {/* <TableCell className="text-right">{cumulativeProbs[index].toFixed(4)}</TableCell> */}
              <TableCell className="text-right">{normalizedProbs[index].toFixed(4)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-center">
        <Button onClick={() => setShowFormula(!showFormula)}>
          {showFormula ? "Hide Formula" : "Show Formula"}
        </Button>
      </div>

      {showFormula && (
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="text-center font-mono">
            P(x<sub>i</sub>) = softmax(log(p<sub>i</sub>) / t)
          </p>
          <p className="text-center mt-2">
            Where p<sub>i</sub> is the original probability, t is the temperature, and P(x<sub>i</sub>) is the adjusted probability.
          </p>
          <p className="text-center mt-2">
            For top-p sampling: P_norm(x<sub>i</sub>) = P(x<sub>i</sub>) / sum(P(x<sub>j</sub>)) for all j where cumulative_sum(P(x<sub>j</sub>)) ≤ top-p
          </p>
        </div>
      )}
    </div>
  )
}