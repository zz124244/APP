module.exports = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "inverse-on-surface": "#eaf1ff",
        "on-primary-container": "#f5fff7",
        "background": "#f8f9ff",
        "primary-fixed": "#85f8c4",
        "surface-container-low": "#eff4ff",
        "on-background": "#0b1c30",
        "primary": "#006948",
        "secondary": "#904d00",
        "primary-container": "#00855d",
        "on-error": "#ffffff",
        "on-tertiary-container": "#fefcff",
        "surface": "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "on-tertiary-fixed-variant": "#3f465c",
        "inverse-primary": "#68dba9",
        "on-secondary-fixed": "#2f1500",
        "inverse-surface": "#213145",
        "on-primary-fixed": "#002114",
        "error": "#ba1a1a",
        "surface-variant": "#d3e4fe",
        "secondary-fixed-dim": "#ffb77d",
        "on-secondary-fixed-variant": "#6e3900",
        "on-tertiary": "#ffffff",
        "surface-container": "#e5eeff",
        "outline-variant": "#bccac0",
        "tertiary-container": "#6c748b",
        "on-tertiary-fixed": "#131b2e",
        "outline": "#6d7a72",
        "on-error-container": "#93000a",
        "tertiary": "#545c72",
        "on-secondary-container": "#663500",
        "primary-fixed-dim": "#68dba9",
        "on-primary-fixed-variant": "#005137",
        "secondary-container": "#fe932c",
        "surface-container-highest": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "tertiary-fixed": "#dae2fd",
        "on-surface-variant": "#3d4a42",
        "surface-container-high": "#dce9ff",
        "on-surface": "#0b1c30",
        "secondary-fixed": "#ffdcc3",
        "tertiary-fixed-dim": "#bec6e0",
        "error-container": "#ffdad6",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "surface-dim": "#cbdbf5",
        "surface-tint": "#006c4a"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-xl": "2.5rem",
        "gutter": "1.5rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-lg": "1.5rem",
        "margin": "2rem",
        "margin-sm": "1rem",
        "space-md": "1rem",
        "gutter-sm": "1rem"
      },
      "fontFamily": {
        "label-numeric-md": [
          "JetBrains Mono"
        ],
        "display-mobile": [
          "Space Grotesk"
        ],
        "headline-lg": [
          "Space Grotesk"
        ],
        "headline-sm": [
          "Space Grotesk"
        ],
        "display": [
          "Space Grotesk"
        ],
        "headline-md": [
          "Space Grotesk"
        ],
        "body-md": [
          "Hanken Grotesk"
        ],
        "body-sm": [
          "Hanken Grotesk"
        ],
        "body-lg": [
          "Hanken Grotesk"
        ],
        "label-caps": [
          "Hanken Grotesk"
        ],
        "headline-lg-mobile": [
          "Space Grotesk"
        ],
        "label-numeric-sm": [
          "JetBrains Mono"
        ],
        "label-numeric-lg": [
          "JetBrains Mono"
        ]
      },
      "fontSize": {
        "label-numeric-md": [
          "14px",
          {
            "lineHeight": "20px",
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
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
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
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.03em",
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
        "body-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "400"
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
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
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
        "headline-lg-mobile": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
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
        "label-numeric-lg": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ]
      }
    }
  },
  "content": [
    "./src/DepositPage.vue",
    "./src/PaymentPin.vue"
  ],
  "important": ".reference-deposit",
  "corePlugins": {
    "preflight": false
  },
  "safelist": [
    "-translate-x-1/2",
    "-translate-y-2",
    "absolute",
    "active:scale-[0.99]",
    "animate-pulse",
    "backdrop-blur-xl",
    "bg-inverse-surface",
    "bg-primary",
    "bg-primary/10",
    "bg-surface",
    "bg-surface-container-low",
    "bg-surface-container-low/50",
    "bg-surface-container-lowest",
    "bg-surface-container-lowest/80",
    "border",
    "border-2",
    "border-b",
    "border-dashed",
    "border-outline-variant/60",
    "border-secondary/20",
    "border-surface-container-low",
    "check-icon",
    "cursor-pointer",
    "duration-300",
    "fixed",
    "flex",
    "flex-col",
    "focus:outline-none",
    "focus:ring-1",
    "focus:ring-primary",
    "font-body-md",
    "font-body-sm",
    "font-headline-sm",
    "font-label-caps",
    "font-label-numeric-md",
    "font-label-numeric-sm",
    "font-medium",
    "font-normal",
    "font-semibold",
    "gap-1",
    "gap-1.5",
    "gap-2",
    "gap-space-md",
    "gap-space-sm",
    "gap-space-xs",
    "grid",
    "grid-cols-2",
    "h-1.5",
    "h-10",
    "h-11",
    "h-14",
    "h-6",
    "hidden",
    "hover:bg-primary-container",
    "hover:bg-surface-container-low",
    "hover:border-primary/60",
    "items-center",
    "items-start",
    "justify-between",
    "justify-center",
    "leading-snug",
    "left-1/2",
    "material-symbols-outlined",
    "mb-space-sm",
    "min-h-screen",
    "mt-0.5",
    "mt-1",
    "mt-space-xs",
    "network-pill",
    "opacity-0",
    "overflow-hidden",
    "p-space-md",
    "p-space-sm",
    "pb-1",
    "pb-safe",
    "pb-space-lg",
    "pb-space-md",
    "placeholder:text-outline-variant",
    "pointer-events-none",
    "pr-16",
    "pt-14",
    "pt-safe",
    "pt-space-xs",
    "px-1.5",
    "px-3",
    "px-margin-sm",
    "px-space-md",
    "px-space-sm",
    "py-0.5",
    "py-1.5",
    "py-space-sm",
    "py-space-xs",
    "relative",
    "right-3",
    "rounded-full",
    "rounded-lg",
    "rounded-xl",
    "select-none",
    "shadow-[0_1px_8px_rgba(0,0,0,0.04)]",
    "shadow-lg",
    "shadow-sm",
    "shrink-0",
    "text-[11px]",
    "text-[12px]",
    "text-[16px]",
    "text-[18px]",
    "text-[22px]",
    "text-body-md",
    "text-body-sm",
    "text-center",
    "text-headline-sm",
    "text-inverse-on-surface",
    "text-label-caps",
    "text-label-numeric-md",
    "text-label-numeric-sm",
    "text-left",
    "text-on-primary",
    "text-on-surface",
    "text-on-surface-variant",
    "text-outline-variant",
    "text-primary",
    "text-primary-fixed",
    "text-right",
    "text-secondary",
    "top-0",
    "top-16",
    "tracking-tight",
    "transition-all",
    "transition-colors",
    "w-1.5",
    "w-10",
    "w-11",
    "w-6",
    "w-full",
    "z-50"
  ]
}
