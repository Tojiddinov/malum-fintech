import logoUrl from '../../img/mizan_logo.svg'

export default function BrandLogo({
  width = 72,
  framed = false,
  className,
  style,
}) {
  return (
    <span
      className={className}
      style={{
        width,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: framed ? '4px 7px' : 0,
        borderRadius: framed ? 10 : 0,
        background: framed ? 'rgba(250, 248, 239, 0.96)' : 'transparent',
        border: framed ? '1px solid rgba(231, 162, 15, 0.35)' : 'none',
        boxShadow: framed ? '0 4px 14px rgba(0, 0, 0, 0.18)' : 'none',
        ...style,
      }}
    >
      <img
        src={logoUrl}
        alt="MIZAN"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </span>
  )
}
