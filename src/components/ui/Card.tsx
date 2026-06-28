import * as React from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: Padding
}

const paddingClasses: Record<Padding, string> = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={[
        'card',
        hover ? 'card-hover' : '',
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export { Card }
export type { CardProps, Padding as CardPadding }
