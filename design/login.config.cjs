module.exports = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "outline-variant": "#bccac0",
        "on-secondary-fixed-variant": "#6e3900",
        "on-surface-variant": "#3d4a42",
        "tertiary": "#545c72",
        "on-surface": "#0b1c30",
        "on-secondary": "#ffffff",
        "on-error-container": "#93000a",
        "outline": "#6d7a72",
        "surface-container-low": "#eff4ff",
        "background": "#f8f9ff",
        "on-tertiary-fixed": "#131b2e",
        "surface": "#f8f9ff",
        "primary-container": "#00855d",
        "surface-tint": "#006c4a",
        "surface-container-lowest": "#ffffff",
        "inverse-on-surface": "#eaf1ff",
        "surface-container": "#e5eeff",
        "tertiary-container": "#6c748b",
        "on-primary-fixed": "#002114",
        "error-container": "#ffdad6",
        "inverse-primary": "#68dba9",
        "secondary-container": "#fe932c",
        "on-background": "#0b1c30",
        "surface-bright": "#f8f9ff",
        "error": "#ba1a1a",
        "on-secondary-container": "#663500",
        "on-tertiary": "#ffffff",
        "on-primary-container": "#f5fff7",
        "primary-fixed": "#85f8c4",
        "on-primary": "#ffffff",
        "primary": "#006948",
        "secondary-fixed": "#ffdcc3",
        "inverse-surface": "#213145",
        "on-primary-fixed-variant": "#005137",
        "primary-fixed-dim": "#68dba9",
        "on-tertiary-fixed-variant": "#3f465c",
        "on-secondary-fixed": "#2f1500",
        "on-tertiary-container": "#fefcff",
        "on-error": "#ffffff",
        "surface-container-high": "#dce9ff",
        "surface-variant": "#d3e4fe",
        "secondary": "#904d00",
        "surface-dim": "#cbdbf5",
        "tertiary-fixed-dim": "#bec6e0",
        "tertiary-fixed": "#dae2fd",
        "secondary-fixed-dim": "#ffb77d",
        "surface-container-highest": "#d3e4fe"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "margin-sm": "1rem",
        "space-lg": "1.5rem",
        "gutter": "1.5rem",
        "gutter-sm": "1rem",
        "space-xl": "2.5rem",
        "margin": "2rem"
      },
      "fontFamily": {
        "body-md": [
          "Hanken Grotesk"
        ],
        "label-numeric-lg": [
          "JetBrains Mono"
        ],
        "headline-lg": [
          "Space Grotesk"
        ],
        "label-caps": [
          "Hanken Grotesk"
        ],
        "body-lg": [
          "Hanken Grotesk"
        ],
        "label-numeric-sm": [
          "JetBrains Mono"
        ],
        "headline-lg-mobile": [
          "Space Grotesk"
        ],
        "headline-md": [
          "Space Grotesk"
        ],
        "body-sm": [
          "Hanken Grotesk"
        ],
        "label-numeric-md": [
          "JetBrains Mono"
        ],
        "display": [
          "Space Grotesk"
        ],
        "headline-sm": [
          "Space Grotesk"
        ],
        "display-mobile": [
          "Space Grotesk"
        ]
      },
      "fontSize": {
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
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
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
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
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
        "headline-lg-mobile": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
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
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.03em",
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
        ]
      }
    }
  },
  "content": [
    "./src/App.vue", "./src/RecoveryPage.vue",
    "./src/PaymentPin.vue"
  ],
  "important": ".reference-login",
  "corePlugins": {
    "preflight": false
  },
  "safelist": [
    "-top-12",
    "-translate-x-1/2",
    "absolute",
    "active:scale-[0.99]",
    "antialiased",
    "backdrop-blur-xl",
    "bg-[#fff1f0]",
    "bg-gradient-to-b",
    "bg-outline-variant",
    "bg-outline-variant/60",
    "bg-primary",
    "bg-surface",
    "bg-surface-container-highest",
    "bg-surface-container-low",
    "bg-surface-container-lowest",
    "bg-surface/80",
    "bg-transparent",
    "block",
    "blur-2xl",
    "border",
    "border-[#ffccc7]",
    "cursor-pointer",
    "duration-200",
    "fixed",
    "flex",
    "flex-col",
    "focus-within:bg-surface-container-lowest",
    "focus-within:ring-2",
    "focus-within:ring-primary/20",
    "font-body-md",
    "font-body-sm",
    "font-headline-lg-mobile",
    "font-headline-sm",
    "font-label-caps",
    "font-label-numeric-md",
    "font-label-numeric-sm",
    "font-medium",
    "font-semibold",
    "from-primary-fixed/20",
    "gap-0.5",
    "gap-2",
    "gap-space-sm",
    "gap-space-xs",
    "h-12",
    "h-14",
    "h-16",
    "h-36",
    "h-4",
    "h-8",
    "h-[1px]",
    "h-full",
    "hidden",
    "hover:bg-primary-container",
    "hover:bg-surface-container-high",
    "hover:text-on-surface",
    "items-center",
    "justify-between",
    "justify-center",
    "leading-snug",
    "left-1/2",
    "material-symbols-outlined",
    "mb-space-lg",
    "mb-space-sm",
    "min-h-screen",
    "mr-space-xs",
    "mt-0.5",
    "mt-space-md",
    "mt-space-xl",
    "mt-space-xs",
    "object-cover",
    "outline-none",
    "overflow-hidden",
    "p-0.5",
    "p-1",
    "p-2.5",
    "p-space-md",
    "pb-safe",
    "pb-space-xl",
    "placeholder:text-outline-variant",
    "pointer-events-none",
    "pr-space-xs",
    "pt-14",
    "pt-safe",
    "pt-space-xs",
    "px-margin-sm",
    "px-space-sm",
    "px-space-xs",
    "relative",
    "rounded-full",
    "rounded-lg",
    "rounded-md",
    "rounded-xl",
    "select-none",
    "shadow-[0_1px_8px_rgba(0,0,0,0.04)]",
    "shadow-md",
    "shadow-primary/25",
    "shadow-sm",
    "shake-error",
    "space-y-1.5",
    "space-y-space-md",
    "space-y-space-sm",
    "text-[#cf1322]",
    "text-[#ff4d4f]",
    "text-[12px]",
    "text-[13px]",
    "text-[15px]",
    "text-[16px]",
    "text-[18px]",
    "text-[19px]",
    "text-[20px]",
    "text-body-md",
    "text-body-sm",
    "text-center",
    "text-headline-lg-mobile",
    "text-headline-sm",
    "text-label-caps",
    "text-label-numeric-md",
    "text-label-numeric-sm",
    "text-on-primary",
    "text-on-surface",
    "text-outline",
    "text-primary",
    "to-transparent",
    "top-0",
    "tracking-tight",
    "tracking-wider",
    "tracking-widest",
    "transition-all",
    "transition-colors",
    "uppercase",
    "via-surface-container/30",
    "w-16",
    "w-6",
    "w-72",
    "w-[1px]",
    "w-full",
    "whitespace-nowrap",
    "z-10",
    "z-50"
  ]
}
