module.exports = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "secondary-fixed-dim": "#ffb77d",
        "primary-fixed": "#85f8c4",
        "inverse-on-surface": "#eaf1ff",
        "tertiary-fixed-dim": "#bec6e0",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#005137",
        "primary-fixed-dim": "#68dba9",
        "outline": "#6d7a72",
        "primary-container": "#00855d",
        "on-surface-variant": "#3d4a42",
        "outline-variant": "#bccac0",
        "inverse-surface": "#213145",
        "error": "#ba1a1a",
        "on-tertiary-fixed": "#131b2e",
        "surface-dim": "#cbdbf5",
        "on-primary-fixed": "#002114",
        "on-secondary": "#ffffff",
        "surface-tint": "#006c4a",
        "surface-container-highest": "#d3e4fe",
        "on-error-container": "#93000a",
        "surface-variant": "#d3e4fe",
        "surface": "#f8f9ff",
        "on-tertiary-fixed-variant": "#3f465c",
        "inverse-primary": "#68dba9",
        "surface-bright": "#f8f9ff",
        "secondary-fixed": "#ffdcc3",
        "tertiary-fixed": "#dae2fd",
        "background": "#f8f9ff",
        "surface-container-high": "#dce9ff",
        "surface-container-low": "#eff4ff",
        "on-primary": "#ffffff",
        "on-background": "#0b1c30",
        "on-tertiary-container": "#fefcff",
        "on-primary-container": "#f5fff7",
        "secondary-container": "#fe932c",
        "on-error": "#ffffff",
        "on-surface": "#0b1c30",
        "tertiary-container": "#6c748b",
        "surface-container-lowest": "#ffffff",
        "secondary": "#904d00",
        "on-tertiary": "#ffffff",
        "primary": "#006948",
        "on-secondary-container": "#663500",
        "on-secondary-fixed": "#2f1500",
        "on-secondary-fixed-variant": "#6e3900",
        "surface-container": "#e5eeff",
        "tertiary": "#545c72"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-md": "1rem",
        "gutter": "1.5rem",
        "margin-sm": "1rem",
        "gutter-sm": "1rem",
        "space-lg": "1.5rem",
        "margin": "2rem",
        "space-sm": "0.5rem",
        "space-xl": "2.5rem",
        "space-xs": "0.25rem"
      },
      "fontFamily": {
        "headline-md": [
          "Space Grotesk"
        ],
        "body-lg": [
          "Hanken Grotesk"
        ],
        "display": [
          "Space Grotesk"
        ],
        "headline-lg-mobile": [
          "Space Grotesk"
        ],
        "headline-sm": [
          "Space Grotesk"
        ],
        "display-mobile": [
          "Space Grotesk"
        ],
        "body-sm": [
          "Hanken Grotesk"
        ],
        "label-numeric-md": [
          "JetBrains Mono"
        ],
        "label-caps": [
          "Hanken Grotesk"
        ],
        "body-md": [
          "Hanken Grotesk"
        ],
        "label-numeric-lg": [
          "JetBrains Mono"
        ],
        "label-numeric-sm": [
          "JetBrains Mono"
        ],
        "headline-lg": [
          "Space Grotesk"
        ]
      },
      "fontSize": {
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
          }
        ],
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.03em",
            "fontWeight": "600"
          }
        ],
        "headline-lg-mobile": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-sm": [
          "18px",
          {
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": "500"
          }
        ],
        "display-mobile": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "body-sm": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "label-numeric-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "500"
          }
        ],
        "label-caps": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.06em",
            "fontWeight": "600"
          }
        ],
        "body-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "label-numeric-lg": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ],
        "label-numeric-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.02em",
            "fontWeight": "400"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ]
      }
    }
  },
  "content": [
    "./src/SupportPage.vue", "./src/RecoveryPage.vue",
    "./src/PaymentPin.vue"
  ],
  "important": ".reference-support",
  "corePlugins": {
    "preflight": false
  },
  "safelist": [
    "-translate-x-1/2",
    "absolute",
    "active:scale-95",
    "animate-ping",
    "antialiased",
    "backdrop-blur-md",
    "backdrop-blur-xl",
    "bg-primary",
    "bg-primary-fixed",
    "bg-surface",
    "bg-surface-container-high",
    "bg-surface-container-low",
    "bg-surface-container-lowest",
    "bg-surface-container-lowest/80",
    "bg-surface/90",
    "bg-transparent",
    "block",
    "bottom-0",
    "fixed",
    "flex",
    "flex-1",
    "flex-col",
    "flex-wrap",
    "font-body-md",
    "font-body-sm",
    "font-headline-sm",
    "font-label-numeric-md",
    "font-label-numeric-sm",
    "font-medium",
    "font-semibold",
    "gap-1",
    "gap-2",
    "gap-space-md",
    "gap-space-sm",
    "gap-space-xs",
    "h-10",
    "h-11",
    "h-12",
    "h-14",
    "h-2",
    "h-3",
    "h-9",
    "h-full",
    "hover:bg-surface-container-high",
    "hover:text-primary",
    "inline-flex",
    "items-center",
    "items-end",
    "items-start",
    "justify-between",
    "justify-center",
    "justify-end",
    "leading-relaxed",
    "left-1/2",
    "material-symbols-outlined",
    "max-h-24",
    "max-w-[200px]",
    "max-w-[80%]",
    "max-w-[82%]",
    "mb-1",
    "mb-space-md",
    "min-h-screen",
    "min-w-0",
    "mt-1",
    "mt-space-md",
    "mt-space-sm",
    "object-cover",
    "opacity-75",
    "outline-none",
    "overflow-hidden",
    "overflow-y-auto",
    "p-2",
    "p-space-md",
    "p-space-sm",
    "pb-2",
    "pb-6",
    "pb-safe",
    "pb-space-sm",
    "pl-space-xs",
    "placeholder:text-outline-variant",
    "pointer-events-none",
    "pt-14",
    "pt-2",
    "pt-safe",
    "pt-space-sm",
    "px-1",
    "px-2.5",
    "px-margin-sm",
    "py-1",
    "py-2",
    "py-space-sm",
    "py-space-xs",
    "relative",
    "resize-none",
    "right-0",
    "ring-2",
    "ring-surface-container-lowest",
    "rounded-2xl",
    "rounded-full",
    "rounded-lg",
    "rounded-tl-sm",
    "rounded-tr-sm",
    "rounded-xl",
    "shadow-[0_1px_8px_rgba(0,0,0,0.04)]",
    "shadow-md",
    "shadow-sm",
    "shrink-0",
    "space-y-2",
    "space-y-space-md",
    "sticky",
    "text-[11px]",
    "text-[14px]",
    "text-[20px]",
    "text-[22px]",
    "text-[24px]",
    "text-body-md",
    "text-body-sm",
    "text-center",
    "text-headline-sm",
    "text-label-numeric-sm",
    "text-left",
    "text-on-primary",
    "text-on-primary-fixed",
    "text-on-surface",
    "text-on-surface-variant",
    "text-primary",
    "text-secondary-container",
    "top-0",
    "tracking-tight",
    "transition-colors",
    "transition-transform",
    "truncate",
    "w-10",
    "w-11",
    "w-12",
    "w-2",
    "w-3",
    "w-9",
    "w-full",
    "z-50"
  ]
}
