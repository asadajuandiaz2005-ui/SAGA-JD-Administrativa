import { Link } from '@tanstack/react-router'
import React from 'react'

interface ModuleCardProps {
  name: string
  icon: React.ReactNode
  path: string
  badge?: number
}

const ModuleCard: React.FC<ModuleCardProps> = ({ name, icon, path, badge }) => {
  return (
    <Link
      to={path}
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white shadow-sm p-2 min-w-[140px] min-h-[110px] transition-colors hover:border-blue-400 hover:bg-blue-50"
    >
      {badge != null && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="text-xl md:text-4xl">
        {typeof icon === 'function' ? React.createElement(icon) : icon}
      </div>
      <span className="text-center text-sm font-medium text-gray-800 overflow-wrap-anywhere">
        {name}
      </span>
    </Link>
  )
}

export default ModuleCard