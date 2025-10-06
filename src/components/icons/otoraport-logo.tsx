import React from 'react'

export function OtoraportLogo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      <div className="font-bold text-xl text-gray-900">
        OTO<span className="text-blue-600">RAPORT</span>
      </div>
    </div>
  )
}