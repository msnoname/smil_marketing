/** 顶部栏与左侧栏用到的图标，与参考图一致 */

interface IconProps {
  className?: string
  size?: number
}

const sizeClass = (s: number = 20) => ({ width: s, height: s })

export function LogoIcon({ className = '', size = 32 }: IconProps & { size?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      SAIC
    </div>
  )
}

/** 地球图标：外圆 + 赤道线 + 经线弧，小尺寸下也清晰可辨 */
export function GlobeIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c5 5 5 15 0 20-5-5-5-15 0-20z" />
    </svg>
  )
}

export function LanguageIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  )
}

export function UserIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export function SearchIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function ChevronRightIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

/** 铅笔图标：编辑 */
export function PencilIcon({ className = '', size = 20 }: IconProps) {
  const s = sizeClass(size)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={s}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
