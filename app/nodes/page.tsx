'use client'

import React, { useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Network } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/ThemeContext'

interface Node {
  id: number
  x: number
  y: number
  word?: string
  color: string
}

const colors = [
  'bg-[#fd290a]', // Red
  'bg-[#fba63b]', // Orange
  'bg-[#f7da5f]', // Yellow
  'bg-[#6dc037]', // Green
  'bg-[#156fde]', // Blue
  'bg-[#941952]', // Dark Pink
  'bg-[#541b96]', // Purple
  'bg-[#ee5fa7]', // Pink
  'bg-[#56c1ff]', // Light Blue
]

export default function NodesPage() {
  const { isDarkMode } = useTheme()
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)

  const handleNodeClick = (node: Node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      const newNode: Node = {
        id: Date.now(),
        x,
        y,
        color: colors[nodes.length % colors.length],
      }
      
      setNodes([...nodes, newNode])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="relative aspect-square bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20"
              onClick={handleCanvasClick}>
          {/* Instructions */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2 text-gray-500 dark:text-gray-400">
                <Network className="h-8 w-8 mx-auto" />
                <p>Click anywhere to create nodes</p>
              </div>
            </div>
          )}

          {/* Nodes */}
          <div className="absolute inset-0">
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                className={`absolute w-3 h-3 rounded-full cursor-pointer ${node.color} dark:brightness-150`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: selectedNode?.id === node.id ? 20 : 10,
                }}
                onClick={() => handleNodeClick(node)}
                whileHover={{ scale: 1.5 }}
                animate={{
                  scale: selectedNode?.id === node.id ? 1.5 : 1,
                }}
              >
                {/* Hover area */}
                <div 
                  className="absolute inset-[-8px] rounded-full opacity-10 bg-blue-500 dark:bg-blue-400"
                  style={{
                    transform: 'scale(2)',
                    pointerEvents: 'none'
                  }}
                />
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
} 